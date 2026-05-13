'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface CandidateData {
  nombres: string; primerApellido: string; segundoApellido: string;
  documento: string; programa: string; semestre: string; promedio: string;
  correoInstitucional: string; telefono: string; areasInteres: string;
  motivoSolicitud: string; monAnterior: string; detalleMonAnterior: string;
  disponibilidad: string; tecnologias: string; idiomas: string;
  tipoMonitoria: string; horasDisponibles: string; expLaboral: string;
  semilleros: string; proyectos: string;
}

interface LiveResponse {
  section: number; questionId: string; question: string; answer: string; savedAt: string;
}

interface QuestionResult {
  questionId: string; question: string; answer: string;
  dimensions: Record<string, number>; score: number;
}

interface EvalResult {
  sections: Record<string, { score: number; summary: string; questions: QuestionResult[] }>;
  strengths: string[]; weaknesses: string[]; red_flags: string[];
  recommendation: string; recommendation_reason: string;
  ai_probability: number; total_score: number; score_label: string;
}

interface PuzzleState {
  status:          'idle' | 'ready' | 'round_active' | 'between_rounds' | 'completed' | 'timeout';
  currentRound:    number;
  difficulty:      number;
  roundLabel:      string;
  elapsedSec:      number;
  timeLimitSec:    number;
  completedRounds: number;
  totalRounds:     number;
  betweenCountdown: number | null;
  progressPct:     number;
  roundTimings:    number[];
}

const SECTION_LABELS: Record<number, string> = {
  1: 'Motivación y rol', 2: 'Actitud', 3: 'Responsabilidad', 4: 'Competencias del rol',
};
const REC = {
  seleccionar:    { grad: 'from-emerald-600 to-green-700',   badge: 'bg-emerald-600',  label: 'Seleccionar' },
  lista_espera:   { grad: 'from-amber-500 to-yellow-600',    badge: 'bg-amber-500',    label: 'Lista de espera' },
  no_seleccionar: { grad: 'from-red-600 to-rose-700',        badge: 'bg-red-600',      label: 'No seleccionar' },
};

const STATUS_BADGE: Record<string, { color: string; label: string }> = {
  idle:           { color: 'bg-gray-200 text-gray-600',       label: 'Sin configurar' },
  ready:          { color: 'bg-blue-100 text-blue-700',        label: 'Listo para iniciar' },
  round_active:   { color: 'bg-amber-100 text-amber-700',      label: 'Ronda en progreso' },
  between_rounds: { color: 'bg-purple-100 text-purple-700',    label: 'Pausa entre rondas' },
  completed:      { color: 'bg-emerald-100 text-emerald-700',  label: 'Completado' },
  timeout:        { color: 'bg-red-100 text-red-700',          label: 'Tiempo agotado' },
};

const ROUND_META = [
  { label: 'Ronda 1 — Fácil',   sub: '3×3 · 9 piezas',   key: 'easy',   icon: '🟢' },
  { label: 'Ronda 2 — Normal',  sub: '6×6 · 36 piezas',  key: 'normal', icon: '🟡' },
  { label: 'Ronda 3 — Difícil', sub: '12×12 · 144 piezas',key:'hard',   icon: '🔴' },
] as const;
type RoundKey = 'easy' | 'normal' | 'hard';

type Tab = 'responses' | 'evaluation' | 'puzzle';

async function compressImage(file: File): Promise<string> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new window.Image();
      img.onload = () => {
        const maxW = 900, maxH = 700;
        const sc   = Math.min(maxW / img.width, maxH / img.height, 1);
        const cv   = document.createElement('canvas');
        cv.width   = img.width * sc; cv.height = img.height * sc;
        cv.getContext('2d')!.drawImage(img, 0, 0, cv.width, cv.height);
        resolve(cv.toDataURL('image/jpeg', 0.82));
      };
      img.src = ev.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function PanelLivePage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const code    = id.toUpperCase();

  const [candidate,     setCandidate]     = useState<CandidateData | null>(null);
  const [profile,       setProfile]       = useState('académico');
  const [copied,        setCopied]        = useState(false);
  const [candidateUrl,  setCandidateUrl]  = useState('');
  const [responses,     setResponses]     = useState<LiveResponse[]>([]);
  const [activeSection, setActiveSection] = useState(1);
  const [evaluation,    setEvaluation]    = useState<EvalResult | null>(null);
  const [tab,           setTab]           = useState<Tab>('responses');

  // Puzzle — 3 image slots
  const defaultPuzzleState: PuzzleState = { status: 'idle', currentRound: 0, difficulty: 3, roundLabel: 'Fácil 3×3', elapsedSec: 0, timeLimitSec: 600, completedRounds: 0, totalRounds: 3, betweenCountdown: null, progressPct: 0, roundTimings: [] };
  const [puzzleState,  setPuzzleState]  = useState<PuzzleState>(defaultPuzzleState);
  const [roundImages,  setRoundImages]  = useState<Record<RoundKey, string | null>>({ easy: null, normal: null, hard: null });
  const [roundPreviews,setRoundPreviews]= useState<Record<RoundKey, string | null>>({ easy: null, normal: null, hard: null });
  const [loadingSlot,  setLoadingSlot]  = useState<RoundKey | null>(null);
  const [puzzleLoading,setPuzzleLoading]= useState(false);
  const [uploadingFor, setUploadingFor] = useState<RoundKey | null>(null);

  // Three separate file inputs to avoid React hooks-in-loop restriction
  const fileRefEasy   = useRef<HTMLInputElement>(null);
  const fileRefNormal = useRef<HTMLInputElement>(null);
  const fileRefHard   = useRef<HTMLInputElement>(null);
  const fileRefs: Record<RoundKey, React.RefObject<HTMLInputElement | null>> = {
    easy: fileRefEasy, normal: fileRefNormal, hard: fileRefHard,
  };

  useEffect(() => { setCandidateUrl(`${window.location.origin}/candidate/${code}`); }, [code]);

  useEffect(() => {
    const raw  = sessionStorage.getItem('candidateData');
    const prof = sessionStorage.getItem('sessionProfile') ?? 'académico';
    if (!raw) { router.replace('/panel/new'); return; }
    setCandidate(JSON.parse(raw));
    setProfile(prof);
  }, [router]);

  useEffect(() => {
    async function pollResponses() {
      try {
        const res  = await fetch(`/api/responses?code=${code}`);
        const data = await res.json();
        if (data.responses?.length) {
          setResponses(data.responses);
          setActiveSection(Math.max(...data.responses.map((r: LiveResponse) => r.section)));
        }
      } catch { /* ignore */ }
    }
    pollResponses();
    const id = setInterval(pollResponses, 4000);
    return () => clearInterval(id);
  }, [code]);

  useEffect(() => {
    if (evaluation) return;
    async function pollEval() {
      try {
        const res  = await fetch(`/api/evaluate?code=${code}`);
        const data = await res.json();
        if (data.ready && data.result) setEvaluation(data.result);
      } catch { /* ignore */ }
    }
    pollEval();
    const id = setInterval(pollEval, 5000);
    return () => clearInterval(id);
  }, [code, evaluation]);

  useEffect(() => {
    async function pollPuzzle() {
      try {
        const res  = await fetch(`/api/puzzle?code=${code}`);
        const data = await res.json();
        setPuzzleState(data);
      } catch { /* ignore */ }
    }
    pollPuzzle();
    const id = setInterval(pollPuzzle, 4000);
    return () => clearInterval(id);
  }, [code]);

  function copyLink() {
    const ta = document.createElement('textarea');
    ta.value = candidateUrl || `${window.location.origin}/candidate/${code}`;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    setCopied(true); setTimeout(() => setCopied(false), 2500);
  }

  async function handleSlotUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !uploadingFor) return;
    const slot = uploadingFor;
    setLoadingSlot(slot);
    const data = await compressImage(file);
    setRoundImages(prev  => ({ ...prev,  [slot]: data }));
    setRoundPreviews(prev => ({ ...prev, [slot]: data }));
    setLoadingSlot(null);
    e.target.value = '';
  }

  function triggerUpload(key: RoundKey) {
    setUploadingFor(key);
    setTimeout(() => fileRefs[key].current?.click(), 50);
  }

  const allImagesReady = roundImages.easy && roundImages.normal && roundImages.hard;

  async function setupPuzzle() {
    if (!allImagesReady) return;
    setPuzzleLoading(true);
    await fetch('/api/puzzle', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ code, action: 'setup', easyImage: roundImages.easy, normalImage: roundImages.normal, hardImage: roundImages.hard }),
    });
    setPuzzleLoading(false);
  }

  async function startPuzzle() {
    setPuzzleLoading(true);
    await fetch('/api/puzzle', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ code, action: 'start' }),
    });
    setPuzzleLoading(false);
  }

  async function resetPuzzle() {
    await fetch('/api/puzzle', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ code, action: 'reset' }),
    });
  }

  if (!candidate) return null;
  const fullName       = `${candidate.nombres} ${candidate.primerApellido} ${candidate.segundoApellido}`;
  const hasResponses   = responses.length > 0;
  const sectionResponses = responses.filter(r => r.section === activeSection);
  const rec            = evaluation ? (REC[evaluation.recommendation as keyof typeof REC] ?? REC.no_seleccionar) : null;
  const puzzleBadge    = STATUS_BADGE[puzzleState.status] ?? STATUS_BADGE.idle;
  const puzzleActive   = puzzleState.status === 'round_active' || puzzleState.status === 'between_rounds';

  const em = Math.floor(puzzleState.elapsedSec / 60).toString().padStart(2, '0');
  const es = (puzzleState.elapsedSec % 60).toString().padStart(2, '0');

  return (
    <div className="flex h-screen flex-col" style={{ background: '#f1f5f9' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #1e40af 100%)' }}
        className="flex items-center justify-between px-5 py-3 shadow-xl shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Image src="/logo.jpg" alt="UTP" width={36} height={36} className="rounded-full object-contain shrink-0 shadow-md" />
          <div className="min-w-0">
            <h1 className="font-extrabold text-white truncate">{fullName}</h1>
            <p className="text-xs text-blue-300/70 flex items-center gap-1.5 flex-wrap">
              <span>{candidate.programa}</span>
              <span>·</span><span>Sem. {candidate.semestre}</span>
              <span>·</span><span>Promedio {candidate.promedio}</span>
              <span className="rounded-full bg-blue-500/30 border border-blue-400/30 px-2 py-0.5 font-semibold text-blue-200 capitalize">{profile}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-3 rounded-xl border border-blue-400/30 bg-blue-500/15 px-4 py-2">
            <div>
              <p className="text-xs text-blue-300/60 font-medium leading-none mb-0.5">Código</p>
              <p className="font-mono text-2xl font-black tracking-widest text-white leading-none">{code}</p>
            </div>
            <button onClick={copyLink} className="rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors">
              {copied ? '✓ Copiado' : 'Copiar enlace'}
            </button>
          </div>

          {evaluation && rec && (
            <div className={`rounded-full px-4 py-1.5 text-xs font-bold text-white ${rec.badge}`}>
              {rec.label} · {evaluation.total_score}/100
            </div>
          )}

          <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
            evaluation ? 'bg-emerald-100 text-emerald-700' : hasResponses ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {evaluation ? '✓ Evaluado' : hasResponses ? `${responses.length} resp.` : 'Esperando…'}
          </span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Left sidebar ────────────────────────────────────────────────── */}
        <aside style={{ width: 260, background: '#0d1426', borderRight: '1px solid rgba(255,255,255,0.06)' }} className="overflow-y-auto shrink-0 text-sm">
          <div className="p-4 border-b border-white/5">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-500/60 mb-0.5">Formulario</p>
            <p className="text-xs text-blue-300/40">Datos de inscripción</p>
          </div>
          <div className="p-4 space-y-5">
            <SideGroup title="Perfil">
              <SideField label="Documento"        value={candidate.documento} />
              <SideField label="Correo"           value={candidate.correoInstitucional} />
              <SideField label="Teléfono"         value={candidate.telefono} />
              <SideField label="Horas disp."      value={candidate.horasDisponibles} />
              <SideField label="Disponibilidad"   value={candidate.disponibilidad} />
            </SideGroup>
            <SideGroup title="Motivación">
              <SideField label="Por qué quiere ser monitor" value={candidate.motivoSolicitud} multi />
              <SideField label="Áreas de interés"           value={candidate.areasInteres}    multi />
            </SideGroup>
            <SideGroup title="Experiencia">
              <SideField label="Monitor anterior" value={candidate.monAnterior} />
              {candidate.detalleMonAnterior && <SideField label="Detalle" value={candidate.detalleMonAnterior} multi />}
              <SideField label="Tecnologías"     value={candidate.tecnologias} multi />
              <SideField label="Idiomas"         value={candidate.idiomas} />
              {candidate.expLaboral  && <SideField label="Exp. laboral" value={candidate.expLaboral}  multi />}
              {candidate.semilleros  && <SideField label="Semilleros"   value={candidate.semilleros}  multi />}
              {candidate.proyectos   && <SideField label="Proyectos"    value={candidate.proyectos}   multi />}
            </SideGroup>
          </div>
        </aside>

        {/* ── Main content ────────────────────────────────────────────────── */}
        <main className="flex flex-1 flex-col overflow-hidden">

          {/* Tab bar */}
          <div className="flex border-b border-gray-200 bg-white px-4 shrink-0">
            {([
              { id: 'responses',   label: 'Respuestas',    icon: '💬' },
              { id: 'evaluation',  label: 'Evaluación IA', icon: '🤖', disabled: !evaluation },
              { id: 'puzzle',      label: 'Puzzle 🧩',     icon: '', badge: puzzleState.status !== 'idle' },
            ] as const).map(t => (
              <button key={t.id} onClick={() => !('disabled' in t && t.disabled) && setTab(t.id as Tab)}
                disabled={'disabled' in t && !!t.disabled}
                className={`relative px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  tab === t.id
                    ? 'border-blue-600 text-blue-700'
                    : 'disabled' in t && t.disabled
                    ? 'border-transparent text-gray-300 cursor-not-allowed'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}>
                {t.icon && <span className="mr-1.5">{t.icon}</span>}{t.label}
                {'badge' in t && t.badge && (
                  <span className="absolute top-2 right-1 h-2 w-2 rounded-full bg-blue-500" />
                )}
              </button>
            ))}
          </div>

          {/* ── Tab: Responses ─────────────────────────────────────────────── */}
          {tab === 'responses' && (
            !hasResponses ? (
              <div className="flex flex-1 flex-col items-center justify-center p-10 text-center">
                <div className="w-full max-w-sm rounded-2xl border-2 border-dashed border-gray-200 bg-white p-10">
                  <p className="font-mono text-5xl font-black text-gray-200 tracking-[0.2em] mb-3">{code}</p>
                  <p className="text-sm text-gray-400 mb-5">Comparte este código con el candidato</p>
                  <div className="flex gap-2">
                    <input readOnly value={candidateUrl} onClick={e => (e.target as HTMLInputElement).select()}
                      className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500 font-mono focus:outline-none" />
                    <button onClick={copyLink} className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700">
                      {copied ? '✓' : 'Copiar'}
                    </button>
                  </div>
                  <p className="mt-4 text-xs text-gray-300">Las respuestas aparecerán aquí automáticamente</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 overflow-hidden flex-col">
                <div className="flex border-b border-gray-100 bg-white px-3 pt-2 gap-1 shrink-0">
                  {[1,2,3,4].map(s => {
                    const cnt = responses.filter(r => r.section === s).length;
                    return (
                      <button key={s} onClick={() => setActiveSection(s)}
                        className={`px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors ${
                          activeSection === s ? 'border-blue-600 text-blue-700 bg-blue-50' : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}>
                        {SECTION_LABELS[s]}
                        {cnt > 0 && (
                          <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${activeSection === s ? 'bg-blue-200 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>
                            {cnt}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {sectionResponses.length === 0 ? (
                    <div className="flex items-center justify-center h-32">
                      <p className="text-sm text-gray-400">Aún sin respuestas en esta sección.</p>
                    </div>
                  ) : sectionResponses.map((r, i) => (
                    <div key={r.questionId} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">{i+1}</span>
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-400">Pregunta {i+1}</p>
                      </div>
                      <p className="mb-3 text-sm font-semibold text-gray-700">{r.question}</p>
                      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{r.answer}</p>
                      <p className="mt-2 text-right text-xs text-gray-300">{r.savedAt}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

          {/* ── Tab: Evaluation ────────────────────────────────────────────── */}
          {tab === 'evaluation' && evaluation && rec && (
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className={`rounded-2xl bg-gradient-to-br ${rec.grad} p-6 text-white shadow-lg`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">Puntaje total</p>
                    <p className="text-7xl font-black leading-none">
                      {evaluation.total_score}<span className="text-3xl opacity-50">/100</span>
                    </p>
                    <p className="mt-2 text-sm font-medium opacity-90">{evaluation.score_label}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-2">Recomendación</p>
                    <span className="rounded-full bg-white/20 border border-white/30 px-4 py-2 text-lg font-extrabold">{rec.label}</span>
                    <p className="mt-2 text-xs opacity-60">IA prob.: {Math.round((evaluation.ai_probability ?? 0) * 100)}%</p>
                  </div>
                </div>
                <p className="mt-5 text-sm leading-relaxed opacity-90 border-t border-white/20 pt-4">{evaluation.recommendation_reason}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[1,2,3,4].map(s => {
                  const sec   = evaluation.sections?.[s.toString()];
                  if (!sec) return null;
                  const color = sec.score >= 75 ? '#16a34a' : sec.score >= 55 ? '#d97706' : '#dc2626';
                  return (
                    <div key={s} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                      <p className="text-xs font-bold text-gray-500 mb-2">{SECTION_LABELS[s]}</p>
                      <div className="flex items-end gap-3">
                        <span className="text-4xl font-black tabular-nums" style={{ color }}>{sec.score}</span>
                        <div className="flex-1 mb-1">
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${sec.score}%`, backgroundColor: color }} />
                          </div>
                        </div>
                      </div>
                      {sec.summary && <p className="text-xs text-gray-400 italic mt-2 leading-snug">{sec.summary}</p>}
                    </div>
                  );
                })}
              </div>
              {[1,2,3,4].map(s => {
                const sec = evaluation.sections?.[s.toString()];
                if (!sec?.questions?.length) return null;
                return (
                  <div key={s} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                      <p className="text-sm font-bold text-gray-700">{SECTION_LABELS[s]}</p>
                      <span className={`text-base font-black tabular-nums ${sec.score >= 75 ? 'text-green-600' : sec.score >= 55 ? 'text-yellow-600' : 'text-red-600'}`}>{sec.score}</span>
                    </div>
                    {sec.questions.map((q, qi) => {
                      const qc = q.score >= 75 ? '#16a34a' : q.score >= 55 ? '#d97706' : '#dc2626';
                      return (
                        <div key={q.questionId} className="px-5 py-4 border-b border-gray-50 last:border-0">
                          <div className="flex justify-between gap-4 mb-1.5">
                            <p className="text-xs font-semibold text-gray-600 flex-1">P{qi+1}: {q.question}</p>
                            <span className="text-sm font-black tabular-nums shrink-0" style={{ color: qc }}>{q.score}</span>
                          </div>
                          <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-2 leading-relaxed">{q.answer || '(sin respuesta)'}</p>
                          {Object.entries(q.dimensions).filter(([k]) => k !== 'escala').length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {Object.entries(q.dimensions).filter(([k]) => k !== 'escala').map(([dim, val]) => {
                                const pct = Math.round(val * 100);
                                const bg  = pct >= 70 ? '#f0fdf4' : pct >= 45 ? '#fffbeb' : '#fff1f2';
                                const bd  = pct >= 70 ? '#86efac' : pct >= 45 ? '#fde68a' : '#fca5a5';
                                const tc  = pct >= 70 ? '#15803d' : pct >= 45 ? '#92400e' : '#b91c1c';
                                return (
                                  <div key={dim} className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
                                    style={{ backgroundColor: bg, borderColor: bd }}>
                                    <span className="max-w-[110px] truncate text-gray-500">{dim.replace(/_/g,' ')}</span>
                                    <span className="font-bold" style={{ color: tc }}>{pct}%</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-green-200 bg-green-50 p-5">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-green-700">Fortalezas</p>
                  <ul className="space-y-1.5">{evaluation.strengths?.map((s, i) => (<li key={i} className="text-sm text-green-900 flex gap-1.5"><span className="text-green-400 shrink-0">·</span>{s}</li>))}</ul>
                </div>
                <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-red-700">Debilidades</p>
                  <ul className="space-y-1.5">{evaluation.weaknesses?.map((w, i) => (<li key={i} className="text-sm text-red-900 flex gap-1.5"><span className="text-red-400 shrink-0">·</span>{w}</li>))}</ul>
                </div>
              </div>
              {evaluation.red_flags?.length > 0 && (
                <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-orange-700">Alertas</p>
                  <ul className="space-y-1.5">{evaluation.red_flags.map((f, i) => (<li key={i} className="text-sm text-orange-900 flex gap-1.5"><span>⚠</span>{f}</li>))}</ul>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Puzzle ────────────────────────────────────────────────── */}
          {tab === 'puzzle' && (
            <div className="flex-1 overflow-y-auto p-5 space-y-4">

              {/* Status banner */}
              <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 mb-0.5">Módulo de Puzzle — 3 Rondas · 10 minutos totales</p>
                  <p className="text-xs text-gray-400">
                    {puzzleActive
                      ? `Ronda ${puzzleState.currentRound + 1}/3 · ${puzzleState.roundLabel} · Tiempo jugado: ${em}:${es}`
                      : puzzleState.status === 'completed'
                        ? `Completado en ${em}:${es} de juego activo`
                        : puzzleState.status === 'timeout'
                          ? 'Tiempo agotado'
                          : 'Sube las 3 imágenes y pulsa Iniciar cuando el candidato esté listo.'}
                  </p>
                </div>
                <span className={`ml-4 shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${puzzleBadge.color}`}>
                  {puzzleBadge.label}
                </span>
              </div>

              {/* Round progress (when running) */}
              {(puzzleActive || puzzleState.status === 'completed' || puzzleState.status === 'timeout') && (
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">Progreso de rondas</p>
                  <div className="flex gap-3">
                    {ROUND_META.map((rm, i) => {
                      const done    = puzzleState.completedRounds > i;
                      const current = puzzleState.currentRound === i && puzzleState.status === 'round_active';
                      const paused  = puzzleState.currentRound === i && puzzleState.status === 'between_rounds';
                      const timing  = puzzleState.roundTimings?.[i];
                      const tm = timing !== undefined ? Math.floor(timing / 60).toString().padStart(2, '0') : null;
                      const ts = timing !== undefined ? (timing % 60).toString().padStart(2, '0') : null;
                      return (
                        <div key={rm.key} className={`flex-1 rounded-lg p-3 text-center border ${
                          done    ? 'border-green-200 bg-green-50' :
                          current ? 'border-amber-300 bg-amber-50' :
                          paused  ? 'border-purple-200 bg-purple-50' :
                                    'border-gray-100 bg-gray-50'
                        }`}>
                          <div className="text-lg mb-1">{done ? '✅' : current ? '⚡' : paused ? '⏸' : rm.icon}</div>
                          <p className={`text-xs font-bold ${done ? 'text-green-700' : current ? 'text-amber-700' : 'text-gray-500'}`}>{rm.label.split('—')[1]?.trim()}</p>
                          <p className="text-xs text-gray-400">{rm.sub}</p>
                          {done && tm !== null && (
                            <p className="mt-1 text-xs font-bold text-green-600 tabular-nums">{tm}:{ts}</p>
                          )}
                          {(current || paused) && puzzleState.progressPct > 0 && (
                            <div className="mt-1.5">
                              <div className="h-1.5 w-full rounded-full bg-amber-100 overflow-hidden">
                                <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${puzzleState.progressPct}%` }} />
                              </div>
                              <p className="text-xs text-amber-600 font-semibold mt-0.5">{puzzleState.progressPct}%</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {puzzleState.status === 'between_rounds' && puzzleState.betweenCountdown !== null && (
                    <div className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-purple-50 border border-purple-100 p-2">
                      <span className="text-2xl font-black text-purple-700 tabular-nums">{puzzleState.betweenCountdown}</span>
                      <span className="text-xs text-purple-500">seg. hasta la siguiente ronda</span>
                    </div>
                  )}
                  {/* Summary row when terminal */}
                  {(puzzleState.status === 'completed' || puzzleState.status === 'timeout') && (
                    <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-2 flex items-center justify-between">
                      <span className="text-xs text-gray-500">Rondas completadas</span>
                      <span className="text-sm font-bold text-gray-700">{puzzleState.completedRounds}/{puzzleState.totalRounds}</span>
                      <span className="text-xs text-gray-400 mx-2">·</span>
                      <span className="text-xs text-gray-500">Tiempo activo</span>
                      <span className="text-sm font-bold tabular-nums text-blue-700">{em}:{es}</span>
                      {puzzleState.status === 'timeout' && puzzleState.progressPct > 0 && (
                        <>
                          <span className="text-xs text-gray-400 mx-2">·</span>
                          <span className="text-xs text-gray-500">Última ronda</span>
                          <span className="text-sm font-bold text-amber-600">{puzzleState.progressPct}%</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 3 Image upload slots (only shown when not running/done) */}
              {!puzzleActive && puzzleState.status !== 'completed' && puzzleState.status !== 'timeout' && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide px-1">Imágenes por ronda</p>
                  {ROUND_META.map(rm => (
                    <div key={rm.key} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
                        <span className="text-lg">{rm.icon}</span>
                        <div>
                          <p className="text-sm font-bold text-gray-700">{rm.label}</p>
                          <p className="text-xs text-gray-400">{rm.sub}</p>
                        </div>
                        {roundPreviews[rm.key] && (
                          <span className="ml-auto text-xs font-semibold text-green-600">✓ Lista</span>
                        )}
                      </div>
                      <div className="p-4">
                        {roundPreviews[rm.key] ? (
                          <div className="flex items-center gap-4">
                            <img src={roundPreviews[rm.key]!} alt={rm.label} className="h-20 w-28 rounded-lg object-cover shadow-sm flex-shrink-0" />
                            <button
                              onClick={() => {
                                setRoundImages(prev  => ({ ...prev,  [rm.key]: null }));
                                setRoundPreviews(prev => ({ ...prev, [rm.key]: null }));
                              }}
                              className="text-xs text-red-400 hover:text-red-600 transition-colors"
                            >
                              Cambiar imagen
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => triggerUpload(rm.key)}
                            className="cursor-pointer rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all p-5 text-center"
                          >
                            {loadingSlot === rm.key ? (
                              <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-blue-500" />
                                Procesando…
                              </div>
                            ) : (
                              <>
                                <p className="text-xl mb-1">🖼️</p>
                                <p className="text-sm font-medium text-gray-600">Haz clic para subir imagen</p>
                                <p className="text-xs text-gray-400 mt-0.5">JPG, PNG · se comprime auto</p>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Hidden file inputs */}
                  <input ref={fileRefEasy}   type="file" accept="image/*" className="hidden" onChange={handleSlotUpload} />
                  <input ref={fileRefNormal} type="file" accept="image/*" className="hidden" onChange={handleSlotUpload} />
                  <input ref={fileRefHard}   type="file" accept="image/*" className="hidden" onChange={handleSlotUpload} />

                  {/* Setup + Start */}
                  <div className="flex gap-3 pt-1">
                    <button onClick={setupPuzzle} disabled={!allImagesReady || !!loadingSlot || puzzleLoading}
                      className="btn-secondary flex-1 text-sm">
                      {puzzleLoading ? 'Guardando…' : puzzleState.status === 'ready' ? '✓ Actualizar rondas' : 'Guardar configuración'}
                    </button>
                    <button onClick={startPuzzle} disabled={puzzleState.status !== 'ready' || puzzleLoading}
                      className="btn-primary flex-1 text-sm">
                      🧩 Iniciar puzzle
                    </button>
                  </div>

                  {!allImagesReady && (
                    <p className="text-xs text-amber-600 text-center">
                      Sube las 3 imágenes para habilitar la configuración.
                    </p>
                  )}
                  {puzzleState.status === 'ready' && (
                    <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-xs text-blue-700">
                      <span>ℹ</span> El candidato verá el puzzle en cuanto pulses "Iniciar puzzle".
                    </div>
                  )}
                </div>
              )}

              {/* Reset */}
              {(puzzleState.status === 'completed' || puzzleState.status === 'timeout') && (
                <button onClick={resetPuzzle} className="btn-secondary w-full text-sm">
                  Reiniciar puzzle (volver a ronda 1)
                </button>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

function SideGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: '#3b82f6' }}>{title}</p>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function SideField({ label, value, multi }: { label: string; value: string; multi?: boolean }) {
  if (!value) return null;
  return (
    <div>
      <span className="block text-xs mb-0.5" style={{ color: '#475569' }}>{label}</span>
      <span className={`text-xs ${multi ? 'block leading-snug' : 'font-semibold'}`} style={{ color: '#cbd5e1' }}>{value}</span>
    </div>
  );
}
