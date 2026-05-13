import { NextRequest, NextResponse } from 'next/server';
import { groqChat } from '@/lib/groq';
import { buildFullEvalPrompt, buildFormContext } from '@/lib/prompts/evaluator';
import { weightedScore, deriveRecommendation, scoreLabel, scaleToScore } from '@/lib/scoring';
import { RUBRICS, computeQuestionScore } from '@/lib/rubrics';
import { scriptWrite } from '@/lib/eval-script-write';
import { kvGet, kvSet } from '@/lib/kv';
import type { CandidateProfile } from '@/lib/types';

interface AnswerInput {
  questionId: string;
  section: number;
  question: string;
  answer: string;
  questionType?: string;
}

interface DimScores { [dimId: string]: number }

interface QuestionResult {
  questionId: string;
  question: string;
  answer: string;
  dimensions: DimScores;
  score: number;
}

interface EvalResult {
  sections: Record<string, {
    score: number;
    summary: string;
    questions: QuestionResult[];
  }>;
  strengths: string[];
  weaknesses: string[];
  red_flags: string[];
  recommendation: string;
  recommendation_reason: string;
  ai_probability: number;
  total_score: number;
  score_label: string;
  evaluated_at: string;
}

const SECTION_WEIGHTS: Record<number, number> = {
  1: 0.20, 2: 0.30, 3: 0.25, 4: 0.25,
};
void SECTION_WEIGHTS;

function enforceLengthPenalty(answer: string, dims: DimScores): DimScores {
  const trimmed = answer.trim();
  const wordCount = trimmed.split(/\s+/).filter(w => w.length > 0).length;
  const charCount = trimmed.length;

  if (charCount === 0 || charCount <= 3 || wordCount <= 2) {
    return Object.fromEntries(Object.keys(dims).map(k => [k, 0]));
  }
  if (wordCount < 20) {
    return Object.fromEntries(Object.entries(dims).map(([k, v]) => [k, Math.min(v, 0.08)]));
  }
  if (wordCount < 40) {
    return Object.fromEntries(Object.entries(dims).map(([k, v]) => [k, Math.min(v, 0.25)]));
  }
  return dims;
}

function overrideGroqOutput(result: EvalResult): EvalResult {
  if (result.total_score >= 15) return result;

  return {
    ...result,
    strengths: [],
    weaknesses: [
      'Respuestas insuficientes para ser evaluadas — la mayoría son de una letra o pocas palabras',
      'No es posible determinar competencias ni actitud con el contenido proporcionado',
    ],
    red_flags: [
      'Respuestas mínimas o vacías en todas las secciones — evaluación no válida',
      ...(result.red_flags ?? []),
    ],
    recommendation: 'no_seleccionar',
    recommendation_reason:
      'El candidato no aportó contenido suficiente en ninguna sección. ' +
      'Las respuestas fueron mínimas (una letra, una palabra o espacios en blanco), ' +
      'lo que hace imposible evaluar motivación, actitud, responsabilidad o competencias. ' +
      'No existe ninguna base para una recomendación positiva.',
  };
}

async function saveEvaluationToSheets(
  code: string, candidateName: string, profile: string, result: EvalResult
) {
  const sectionScores = Object.fromEntries(
    Object.entries(result.sections).map(([s, v]) => [s, v.score])
  );

  await scriptWrite({
    action: 'saveEvaluation',
    code,
    candidateName,
    profile,
    totalScore: result.total_score,
    s1Score: sectionScores['1'] ?? 0,
    s2Score: sectionScores['2'] ?? 0,
    s3Score: sectionScores['3'] ?? 0,
    s4Score: sectionScores['4'] ?? 0,
    recommendation: result.recommendation,
    aiProbability: result.ai_probability,
    redFlags: (result.red_flags ?? []).join(' | '),
    recommendationReason: (result.recommendation_reason ?? '').slice(0, 500),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { code, candidateName, profile, answers, applicantData } = body as {
    code: string;
    candidateName: string;
    profile: CandidateProfile;
    answers: AnswerInput[];
    applicantData: Record<string, string>;
  };

  if (!code || !profile || !answers?.length) {
    return NextResponse.json({ error: 'Faltan datos para evaluar.' }, { status: 400 });
  }

  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'gsk_xxx') {
    return NextResponse.json({ error: 'GROQ_API_KEY no configurado.' }, { status: 503 });
  }

  try {
    const formContext = buildFormContext(applicantData ?? {});
    const prompt = buildFullEvalPrompt(candidateName, profile, answers, formContext);

    const raw = await groqChat([
      { role: 'system', content: 'Eres un evaluador experto. Responde ÚNICAMENTE con JSON válido, sin texto antes ni después, sin bloques de código markdown.' },
      { role: 'user', content: prompt },
    ]);

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Groq no devolvió JSON válido.');

    const parsed = JSON.parse(jsonMatch[0]);
    const groqQuestions: Record<string, DimScores> = parsed.questions ?? {};
    const sectionSummaries: Record<string, string> = parsed.section_summaries ?? {};

    const sectionMap: Record<number, QuestionResult[]> = { 1: [], 2: [], 3: [], 4: [] };

    for (const ans of answers) {
      const { questionId, question, answer, section, questionType } = ans;
      let score: number;
      let dimensions: DimScores;

      if (questionType === 'scale') {
        score = scaleToScore(answer);
        dimensions = { escala: score / 100 };
      } else {
        const groqDims = groqQuestions[questionId] ?? {};
        const rawDims = Object.fromEntries(
          Object.entries(groqDims).filter(([k]) => !k.startsWith('_'))
        );
        dimensions = enforceLengthPenalty(answer, rawDims);
        score = RUBRICS[questionId]
          ? computeQuestionScore(questionId, dimensions)
          : Math.round(
              Object.values(dimensions).reduce((a, b) => a + b, 0) /
              Math.max(Object.values(dimensions).length, 1) * 100
            );
      }

      sectionMap[section]?.push({ questionId, question, answer, dimensions, score });
    }

    const sectionEvals: { section: number; score: number }[] = [];
    const sectionsOutput: EvalResult['sections'] = {};

    for (const [secStr, qResults] of Object.entries(sectionMap)) {
      const s = parseInt(secStr);
      if (!qResults.length) continue;
      const sectionScore = Math.round(
        qResults.reduce((a, q) => a + q.score, 0) / qResults.length
      );
      sectionEvals.push({ section: s, score: sectionScore });
      sectionsOutput[secStr] = {
        score: sectionScore,
        summary: sectionSummaries[secStr] ?? '',
        questions: qResults,
      };
    }

    const totalScore = weightedScore(
      sectionEvals.map(e => ({
        ...e,
        strengths: [], weaknesses: [], ai_probability: 0, notes: '',
        confirmed_by_interviewer: false, interviewer_score: null,
        id: '', session_id: code, created_at: '',
      }))
    );

    const recommendation = deriveRecommendation(totalScore, parsed.ai_probability ?? 0, 100);

    let result: EvalResult = {
      sections: sectionsOutput,
      strengths: parsed.strengths ?? [],
      weaknesses: parsed.weaknesses ?? [],
      red_flags: parsed.red_flags ?? [],
      recommendation: parsed.recommendation ?? recommendation,
      recommendation_reason: parsed.recommendation_reason ?? '',
      ai_probability: parsed.ai_probability ?? 0,
      total_score: totalScore,
      score_label: scoreLabel(totalScore),
      evaluated_at: new Date().toISOString(),
    };

    result = overrideGroqOutput(result);

    await kvSet(`eval:${code.toUpperCase()}`, result, 7 * 86400);

    saveEvaluationToSheets(code, candidateName, profile, result).catch(err =>
      console.error('[evaluate] Error guardando en Sheets:', err)
    );

    return NextResponse.json({ ok: true, result });

  } catch (err) {
    console.error('[evaluate]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.toUpperCase().trim() ?? '';
  if (!code) return NextResponse.json({ error: 'Código requerido.' }, { status: 400 });

  const result = await kvGet<EvalResult>(`eval:${code}`);
  if (!result) return NextResponse.json({ ready: false });

  return NextResponse.json({ ready: true, result });
}
