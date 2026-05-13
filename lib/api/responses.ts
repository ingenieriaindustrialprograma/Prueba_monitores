import { supabase } from '../supabase';
import type { SectionResponse } from '../types';

export async function upsertResponse(
  sessionId: string,
  section: number,
  questionId: string,
  answer: string,
  timeSpentSeconds: number,
  pasteEvents: number,
  tabSwitches: number
): Promise<void> {
  await supabase.from('responses').upsert(
    {
      session_id: sessionId,
      section,
      question_id: questionId,
      answer,
      time_spent_seconds: timeSpentSeconds,
      paste_events: pasteEvents,
      tab_switches: tabSwitches,
    },
    { onConflict: 'session_id,question_id' }
  );
}

export async function getResponsesForSession(sessionId: string): Promise<SectionResponse[]> {
  const { data } = await supabase
    .from('responses')
    .select('*')
    .eq('session_id', sessionId)
    .order('section', { ascending: true });

  return (data ?? []) as SectionResponse[];
}

export async function getResponsesForSection(
  sessionId: string,
  section: number
): Promise<SectionResponse[]> {
  const { data } = await supabase
    .from('responses')
    .select('*')
    .eq('session_id', sessionId)
    .eq('section', section);

  return (data ?? []) as SectionResponse[];
}
