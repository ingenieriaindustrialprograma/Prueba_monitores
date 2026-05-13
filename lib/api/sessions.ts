import { supabase } from '../supabase';
import type { Session, ApplicantData, PreEvalData, CandidateProfile } from '../types';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin I, O, 0, 1 para evitar confusión
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function createSession(
  documentId: string,
  applicantData: ApplicantData,
  profile: CandidateProfile
): Promise<Session> {
  const candidateName = `${applicantData.nombres} ${applicantData.primerApellido} ${applicantData.segundoApellido}`.trim();

  // Intentar con hasta 5 códigos en caso de colisión
  for (let i = 0; i < 5; i++) {
    const code = generateCode();
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        code,
        document_id: documentId,
        applicant_data: applicantData,
        candidate_name: candidateName,
        candidate_email: applicantData.correoInstitucional || applicantData.correoPersonal,
        profile,
        status: 'created',
        current_section: 0,
      })
      .select()
      .single();

    if (!error && data) return data as Session;
    // Si el error no es de código duplicado, lanzar inmediatamente
    if (error?.code !== '23505') throw error;
  }
  throw new Error('No se pudo generar un código único después de 5 intentos');
}

export async function getSessionByCode(code: string): Promise<Session | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (error || !data) return null;
  return data as Session;
}

export async function getSessionById(id: string): Promise<Session | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as Session;
}

export async function updateSessionStatus(
  id: string,
  status: Session['status'],
  currentSection?: number
): Promise<void> {
  const updates: Partial<Session> = { status };
  if (currentSection !== undefined) updates.current_section = currentSection;
  if (status === 'in_progress') updates.started_at = new Date().toISOString();
  if (status === 'completed') updates.completed_at = new Date().toISOString();

  await supabase.from('sessions').update(updates).eq('id', id);
}

export async function savePreEval(
  id: string,
  score: number,
  preEvalData: PreEvalData
): Promise<void> {
  await supabase
    .from('sessions')
    .update({ pre_eval_score: score, pre_eval_data: preEvalData })
    .eq('id', id);
}

export async function listRecentSessions(limit = 20): Promise<Session[]> {
  const { data } = await supabase
    .from('sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data ?? []) as Session[];
}

export async function sessionExistsForDocument(documentId: string): Promise<boolean> {
  const { count } = await supabase
    .from('sessions')
    .select('id', { count: 'exact', head: true })
    .eq('document_id', documentId);

  return (count ?? 0) > 0;
}
