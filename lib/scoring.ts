import type { SectionEvaluation, GlobalAnalysis, Recommendation } from './types';

const SECTION_WEIGHTS: Record<number, number> = {
  1: 0.20, // motivación y comprensión del rol
  2: 0.30, // actitud
  3: 0.25, // responsabilidad
  4: 0.25, // competencias específicas del perfil
};

export function weightedScore(evaluations: SectionEvaluation[]): number {
  let total = 0;
  let totalWeight = 0;
  for (const ev of evaluations) {
    const weight = SECTION_WEIGHTS[ev.section] ?? 0;
    total += ev.score * weight;
    totalWeight += weight;
  }
  return totalWeight > 0 ? Math.round(total / totalWeight) : 0;
}

export function deriveRecommendation(
  totalScore: number,
  aiProbability: number,
  coherence: number
): Recommendation {
  // Flag automática si hay alta probabilidad de trampa
  if (aiProbability > 0.75) return 'no_seleccionar';
  // Baja coherencia entre formulario y respuestas en vivo
  if (coherence < 40) return 'no_seleccionar';

  if (totalScore >= 75) return 'seleccionar';
  if (totalScore >= 55) return 'lista_espera';
  return 'no_seleccionar';
}

export function scoreLabel(score: number): string {
  if (score >= 80) return 'Excelente';
  if (score >= 65) return 'Bueno';
  if (score >= 50) return 'Regular';
  return 'Insuficiente';
}

// Converts a 1-5 scale answer to a 0-100 score
export function scaleToScore(answer: string): number {
  const n = parseInt(answer, 10);
  if (isNaN(n) || n < 1 || n > 5) return 0;
  return Math.round(((n - 1) / 4) * 100);
}

export function coherenceLabel(coherence: number): string {
  if (coherence >= 80) return 'Alta';
  if (coherence >= 55) return 'Media';
  return 'Baja';
}

export function buildGlobalPayload(
  sessionId: string,
  evaluations: SectionEvaluation[],
  coherence: number,
  groqResult: Pick<GlobalAnalysis, 'strengths' | 'weaknesses' | 'recommendation_reason' | 'ai_probability_overall'>
): Omit<GlobalAnalysis, 'id' | 'created_at' | 'interviewer_notes'> {
  const sectionScores = Object.fromEntries(evaluations.map(e => [e.section, e.score]));
  const totalScore = weightedScore(evaluations);
  const recommendation = deriveRecommendation(
    totalScore,
    groqResult.ai_probability_overall,
    coherence
  );

  return {
    session_id: sessionId,
    total_score: totalScore,
    section_scores: sectionScores,
    strengths: groqResult.strengths,
    weaknesses: groqResult.weaknesses,
    recommendation,
    recommendation_reason: groqResult.recommendation_reason,
    ai_probability_overall: groqResult.ai_probability_overall,
  };
}
