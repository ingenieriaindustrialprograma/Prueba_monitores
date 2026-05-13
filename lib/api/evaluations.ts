import { supabase } from '../supabase';
import type {
  SectionEvaluation,
  CoherenceAnalysis,
  GlobalAnalysis,
  EvaluationResult,
  CoherenceResult,
  GlobalResult,
} from '../types';

// ── Evaluaciones por sección ─────────────────────────────────────────────────

export async function saveEvaluation(
  sessionId: string,
  section: number,
  result: EvaluationResult
): Promise<SectionEvaluation> {
  const { data, error } = await supabase
    .from('evaluations')
    .upsert(
      {
        session_id: sessionId,
        section,
        score: result.score,
        strengths: result.strengths,
        weaknesses: result.weaknesses,
        ai_probability: result.ai_probability,
        notes: result.notes,
        confirmed_by_interviewer: false,
      },
      { onConflict: 'session_id,section' }
    )
    .select()
    .single();

  if (error) throw error;
  return data as SectionEvaluation;
}

export async function confirmEvaluation(
  sessionId: string,
  section: number,
  interviewerScore?: number
): Promise<void> {
  const updates: Partial<SectionEvaluation> = { confirmed_by_interviewer: true };
  if (interviewerScore !== undefined) updates.interviewer_score = interviewerScore;

  await supabase
    .from('evaluations')
    .update(updates)
    .eq('session_id', sessionId)
    .eq('section', section);
}

export async function getEvaluationsForSession(sessionId: string): Promise<SectionEvaluation[]> {
  const { data } = await supabase
    .from('evaluations')
    .select('*')
    .eq('session_id', sessionId)
    .order('section', { ascending: true });

  return (data ?? []) as SectionEvaluation[];
}

// ── Análisis de coherencia ───────────────────────────────────────────────────

export async function saveCoherence(
  sessionId: string,
  result: CoherenceResult
): Promise<CoherenceAnalysis> {
  const { data, error } = await supabase
    .from('coherence_analysis')
    .upsert(
      {
        session_id: sessionId,
        overall_coherence: result.overall_coherence,
        contradictions: result.contradictions,
        insights: result.insights,
      },
      { onConflict: 'session_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data as CoherenceAnalysis;
}

export async function getCoherence(sessionId: string): Promise<CoherenceAnalysis | null> {
  const { data } = await supabase
    .from('coherence_analysis')
    .select('*')
    .eq('session_id', sessionId)
    .single();

  return data as CoherenceAnalysis | null;
}

// ── Análisis global ──────────────────────────────────────────────────────────

export async function saveGlobalAnalysis(
  sessionId: string,
  result: GlobalResult,
  interviewerNotes: string
): Promise<GlobalAnalysis> {
  const { data, error } = await supabase
    .from('global_analysis')
    .upsert(
      {
        session_id: sessionId,
        total_score: result.total_score,
        section_scores: result.section_scores,
        strengths: result.strengths,
        weaknesses: result.weaknesses,
        recommendation: result.recommendation,
        recommendation_reason: result.recommendation_reason,
        ai_probability_overall: result.ai_probability_overall,
        interviewer_notes: interviewerNotes,
      },
      { onConflict: 'session_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data as GlobalAnalysis;
}

export async function getGlobalAnalysis(sessionId: string): Promise<GlobalAnalysis | null> {
  const { data } = await supabase
    .from('global_analysis')
    .select('*')
    .eq('session_id', sessionId)
    .single();

  return data as GlobalAnalysis | null;
}
