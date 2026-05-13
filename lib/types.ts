// Datos cargados desde Google Sheets (34 columnas, A:AH)
export interface ApplicantData {
  fecha: string;
  fotoUrl: string;
  nombres: string;
  primerApellido: string;
  segundoApellido: string;
  tipoDocumento: string;
  documento: string;
  fechaNacimiento: string;
  codigoEstudiantil: string;
  correoInstitucional: string;
  correoPersonal: string;
  telefono: string;
  direccion: string;
  programa: string;
  programaOtro: string;
  semestre: string;
  promedio: string;
  horasDisponibles: string;
  areasInteres: string;
  motivoSolicitud: string;
  monAnterior: string;
  detalleMonAnterior: string;
  disponibilidad: string;
  semilleros: string;
  proyectos: string;
  eventos: string;
  becas: string;
  tecnologias: string;
  idiomas: string;
  expLaboral: string;
  motivacionGeneral: string;
  habilidadesRol: string;
  expectativas: string;
  tipoMonitoria: string;
}

export type SessionStatus = 'created' | 'in_progress' | 'completed';
export type CandidateProfile = 'académico' | 'redes';
export type Recommendation = 'seleccionar' | 'lista_espera' | 'no_seleccionar';
export type PreRecommendation = 'proceder' | 'revisar' | 'descartar';
export type ContradictionSeverity = 'low' | 'medium' | 'high';

export interface Session {
  id: string;
  code: string;
  document_id: string;
  applicant_data: ApplicantData;
  candidate_name: string;
  candidate_email: string;
  profile: CandidateProfile;
  status: SessionStatus;
  current_section: number;
  pre_eval_score: number | null;
  pre_eval_data: PreEvalData | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface PreEvalData {
  score: number;
  highlights: string[];
  concerns: string[];
  custom_questions: string[];
  recommendation: PreRecommendation;
  summary: string;
}

export interface SectionResponse {
  id: string;
  session_id: string;
  section: number;
  question_id: string;
  answer: string;
  time_spent_seconds: number;
  paste_events: number;
  tab_switches: number;
  created_at: string;
}

export interface SectionEvaluation {
  id: string;
  session_id: string;
  section: number;
  score: number;
  strengths: string[];
  weaknesses: string[];
  ai_probability: number;
  notes: string;
  confirmed_by_interviewer: boolean;
  interviewer_score: number | null;
  created_at: string;
}

export interface Contradiction {
  field: string;
  form_value: string;
  live_value: string;
  severity: ContradictionSeverity;
  explanation: string;
}

export interface CoherenceAnalysis {
  id: string;
  session_id: string;
  overall_coherence: number;
  contradictions: Contradiction[];
  insights: string[];
  created_at: string;
}

export interface GlobalAnalysis {
  id: string;
  session_id: string;
  total_score: number;
  section_scores: Record<number, number>;
  strengths: string[];
  weaknesses: string[];
  recommendation: Recommendation;
  recommendation_reason: string;
  ai_probability_overall: number;
  interviewer_notes: string;
  created_at: string;
}

export interface Question {
  id: string;
  section: number;
  profile?: CandidateProfile; // undefined = aplica a ambos perfiles
  text: string;
  type: 'text' | 'scale' | 'choice';
  required: boolean;
  time_limit_seconds?: number;
  options?: string[];
}

export interface CheatEvent {
  type: 'paste' | 'tab_switch' | 'visibility_change' | 'unusual_speed';
  section: number;
  question_id: string;
  timestamp: number;
  detail?: string;
}

export interface LiveUpdate {
  type: 'response' | 'section_complete' | 'evaluation_ready' | 'cheat_alert';
  session_id: string;
  payload: unknown;
}

// API response shapes
export interface SearchResult {
  found: boolean;
  applicant: ApplicantData | null;
  error?: string;
}

export interface EvaluationResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  ai_probability: number;
  notes: string;
}

export interface CoherenceResult {
  overall_coherence: number;
  contradictions: Contradiction[];
  insights: string[];
}

export interface GlobalResult {
  total_score: number;
  section_scores: Record<number, number>;
  strengths: string[];
  weaknesses: string[];
  recommendation: Recommendation;
  recommendation_reason: string;
  ai_probability_overall: number;
}
