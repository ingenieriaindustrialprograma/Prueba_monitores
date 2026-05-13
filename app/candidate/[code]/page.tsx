'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { getQuestionsForSection } from '@/lib/questions';
import type { CandidateProfile, Question } from '@/lib/types';
import { AnalogClock, SectionTimer } from '@/components/AnalogClock';
import { PuzzleBoard } from '@/components/PuzzleBoard';

const SECTION_META = [
  { id: 1, title: 'Motivación y rol',     emoji: '💡', description: 'Cuéntenos sobre sus razones para aplicar y cómo entiende el rol de monitor de programa.' },
  { id: 2, title: 'Actitud',              emoji: '🤝', description: 'Describa cómo enfrenta situaciones desafiantes dentro del contexto de la monitoria.' },
  { id: 3, title: 'Responsabilidad',      emoji: '📌', description: 'Cuéntenos cómo gestiona sus compromisos y su tiempo.' },
  { id: 4, title: 'Competencias del rol', emoji: '🛠️', description: 'Demuestre con hechos y propuestas concretas su capacidad para generar valor desde el rol de monitor.' },
];

type Answers = Record<string, string>;

interface SessionInfo {
  profile: CandidateProfile;
  candidateName: string;
  documento: string;
}

interface PuzzlePoll {
  status:               string;
  currentRound:         number;   // 0-2
  difficulty:           number;   // 3, 6, 12
  roundLabel:           string;
  elapsedSec:           number;
  previousRoundsElapsed: number;  // stable: only previous rounds, no live current-round time
  timeLimitSec:         number;
  completedRounds:      number;
  totalRounds:          number;
  betweenCountdown:     number | null;
  imageData?:           string;
}

export default function CandidateLivePage() {
  const { code }  = useParams<{ code: string }>();
  const router    = useRouter();

  const [session,   setSession]   = useState<SessionInfo | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [notFound,  setNotFound]  = useState(false);
  const [section,   setSection]   = useState(0);
  const [answers,   setAnswers]   = useState<Answers>({});
  const [saving,    setSaving]    = useState(false);
  const [finished,  setFinished]  = useState(false);

  // Puzzle
  const [puzzlePoll,       setPuzzlePoll]       = useState<PuzzlePoll | null>(null);
  const [activeImageData,  setActiveImageData]  = useState<string | null>(null); // cached when round goes active

  const sectionStartRef   = useRef<number>(Date.now());
  const lastProgressRef   = useRef<number>(0);

  // ── Session fetch ────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/sessions?code=${code}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setNotFound(true);
        else setSession({ profile: data.profile, candidateName: data.candidateName, documento: data.documento });
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [code]);

  // ── Puzzle polling (only after quiz is done) ─────────────────────────────
  useEffect(() => {
    if (!finished) return;
    const isDone = (s?: string) => s === 'completed' || s === 'timeout';
    if (isDone(puzzlePoll?.status)) return;

    async function check() {
      try {
        const res  = await fetch(`/api/puzzle?code=${code}`);
        const data: PuzzlePoll = await res.json();
        setPuzzlePoll(data);
        // Cache imageData the moment the round goes active so we don't lose it on next poll
        if (data.status === 'round_active' && data.imageData) {
          setActiveImageData(data.imageData);
        }
        // Clear cached image when a new between_rounds phase starts (next round image not yet delivered)
        if (data.status === 'between_rounds') {
          setActiveImageData(null);
        }
      } catch { /* ignore */ }
    }

    check();
    const id = setInterval(check, 3000);
    return () => clearInterval(id);
  }, [finished, code, puzzlePoll?.status]);

  // ── Quiz helpers ─────────────────────────────────────────────────────────
  function questionsFor(sec: number): Question[] {
    return getQuestionsForSection(sec, session?.profile ?? undefined);
  }

  function sectionComplete(sec: number): boolean {
    return questionsFor(sec).every(q => (answers[q.id] ?? '').trim().length > 0);
  }

  function handleAnswer(qId: string, value: string) {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  }

  async function saveSection(sec: number) {
    if (!session) return;
    const qs       = questionsFor(sec);
    const timeSecs = Math.round((Date.now() - sectionStartRef.current) / 1000);
    await Promise.all(qs.map(q =>
      fetch('/api/responses', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          code, documento: session.documento, candidateName: session.candidateName,
          profile: session.profile, section: sec, questionId: q.id,
          question: q.text, answer: answers[q.id] ?? '', timeSecs,
        }),
      }).catch(() => {}),
    ));
  }

  async function nextSection() {
    setSaving(true);
    await saveSection(section);
    setSaving(false);
    sectionStartRef.current = Date.now();

    if (section < SECTION_META.length) {
      setSection(s => s + 1);
    } else {
      const { getQuestionById } = await import('@/lib/questions');
      const enriched = Object.entries(answers).map(([qId, answer]) => {
        const q   = getQuestionById(qId);
        const sec = parseInt(qId.split('_')[0].replace('s', ''));
        return { questionId: qId, section: q?.section ?? sec, question: q?.text ?? qId, questionType: q?.type ?? 'text', answer };
      });
      if (session) {
        fetch('/api/evaluate', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ code, candidateName: session.candidateName, profile: session.profile, answers: enriched, applicantData: {} }),
        }).catch(() => {});
      }
      setFinished(true);
    }
  }

  // ── Puzzle callbacks ─────────────────────────────────────────────────────
  async function handlePuzzleComplete(_roundTimeSec: number) {
    lastProgressRef.current = 0;
    await fetch('/api/puzzle', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ code, action: 'complete_round' }),
    }).catch(() => {});
  }

  function handlePuzzleProgress(pct: number) {
    // Throttle: only send when progress jumps ≥10% or nearly done
    if (pct - lastProgressRef.current < 10 && pct < 95) return;
    lastProgressRef.current = pct;
    fetch('/api/puzzle', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ code, action: 'update_progress', pct }),
    }).catch(() => {});
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-candidate">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="text-sm text-blue-400">Verificando código…</p>
        </div>
      </main>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (notFound) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-candidate p-6">
        <div className="w-full max-w-sm glass-light rounded-2xl p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-2xl">❌</div>
          <h1 className="mb-2 text-xl font-bold text-red-700">Código no válido</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            El código <span className="font-mono font-bold text-blue-800">{code}</span> no corresponde a ninguna sesión activa.
          </p>
          <button onClick={() => router.push('/candidate')} className="btn-primary mt-6 w-full">
            Ingresar otro código
          </button>
        </div>
      </main>
    );
  }

  // ── PUZZLE: active round ───────────────────────────────────────────────────
  if (finished && puzzlePoll?.status === 'round_active' && activeImageData) {
    return (
      <div className="h-screen flex flex-col">
        <div className="flex items-center justify-between px-6 py-3 shrink-0"
          style={{ background: 'linear-gradient(90deg,#0f172a,#1e3a5f)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="text-white font-bold text-sm">🧩 Módulo Puzzle · {puzzlePoll.roundLabel}</span>
          <span className="text-blue-300/50 text-xs">Arrastra o haz clic en una pieza para llevarla al tablero</span>
        </div>
        <div className="flex-1 min-h-0">
          <PuzzleBoard
            imageData={activeImageData}
            difficulty={puzzlePoll.difficulty}
            roundNumber={puzzlePoll.currentRound + 1}
            totalRounds={puzzlePoll.totalRounds}
            initialElapsedSec={puzzlePoll.previousRoundsElapsed ?? 0}
            totalTimeLimitSec={puzzlePoll.timeLimitSec}
            onComplete={handlePuzzleComplete}
            onProgress={handlePuzzleProgress}
          />
        </div>
      </div>
    );
  }

  // ── PUZZLE: 40-second pause between rounds ────────────────────────────────
  if (finished && puzzlePoll?.status === 'between_rounds') {
    const countdown   = puzzlePoll.betweenCountdown ?? 40;
    const nextRound   = puzzlePoll.completedRounds + 1;
    const nextLabels  = ['', 'Fácil 3×3', 'Normal 6×6', 'Difícil 12×12'];
    const progress    = (1 - countdown / 40) * 100;

    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-candidate p-6">
        <div className="w-full max-w-md glass-light rounded-2xl overflow-hidden">
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 ring-4 ring-green-100 text-4xl">🎉</div>
            <h1 className="mb-1 text-2xl font-extrabold text-gray-900">
              ¡Ronda {puzzlePoll.completedRounds} completada!
            </h1>
            <p className="text-gray-500 text-sm mb-6">Excelente trabajo. La siguiente ronda comenzará automáticamente.</p>

            {/* Countdown */}
            <div className="relative mb-5">
              <div className="text-7xl font-black tabular-nums text-blue-700 leading-none">{countdown}</div>
              <p className="text-sm text-gray-400 mt-1">segundos</p>
            </div>

            {/* Progress bar */}
            <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden mb-5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
              <p className="text-xs text-blue-500 font-medium mb-0.5">Siguiente ronda</p>
              <p className="text-base font-bold text-blue-800">{nextLabels[nextRound] ?? 'Última ronda'}</p>
            </div>

            {/* Round indicators */}
            <div className="flex items-center justify-center gap-2 mt-5">
              {Array.from({ length: puzzlePoll.totalRounds }, (_, i) => (
                <div key={i} className={`h-2.5 w-2.5 rounded-full ${i < puzzlePoll.completedRounds ? 'bg-green-500' : i === puzzlePoll.completedRounds ? 'bg-blue-300' : 'bg-gray-200'}`} />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── PUZZLE: all rounds completed ──────────────────────────────────────────
  if (finished && (puzzlePoll?.status === 'completed' || puzzlePoll?.status === 'timeout')) {
    const elapsed  = puzzlePoll.elapsedSec;
    const em       = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const es       = (elapsed % 60).toString().padStart(2, '0');
    const timedOut = puzzlePoll.status === 'timeout';

    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-candidate p-6">
        <div className="w-full max-w-md glass-light rounded-2xl p-10 text-center">
          <div className={`mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full text-4xl ring-4 ${timedOut ? 'bg-orange-50 ring-orange-100' : 'bg-green-50 ring-green-100'}`}>
            {timedOut ? '⏱' : '✓'}
          </div>
          <h1 className="mb-2 text-2xl font-extrabold text-gray-900">¡Proceso completo!</h1>
          <p className="text-gray-500 leading-relaxed mb-4">
            {timedOut
              ? 'Se agotó el tiempo, pero tu desempeño ha sido registrado.'
              : `Completaste las ${puzzlePoll.completedRounds} rondas del puzzle.`}
          </p>
          {elapsed > 0 && (
            <p className="text-sm text-blue-600 font-semibold">
              Tiempo total de juego: {em}:{es}
            </p>
          )}
          <div className="mt-6 border-t border-gray-100 pt-5">
            <p className="text-xs text-gray-300">Universidad Tecnológica de Pereira · Ingeniería Industrial</p>
          </div>
        </div>
      </main>
    );
  }

  // ── Waiting for puzzle (quiz done, interviewer hasn't started yet) ────────
  if (finished) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-candidate p-6">
        <div className="w-full max-w-md glass-light rounded-2xl p-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 ring-4 ring-blue-100 text-3xl">
            🧩
          </div>
          <h1 className="mb-2 text-xl font-extrabold text-gray-900">Evaluación completada</h1>
          <p className="text-gray-500 leading-relaxed mb-5">
            Respondiste todas las secciones. El entrevistador preparará el módulo de puzzle en breve.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-blue-500">
            <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500" />
            <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500" style={{ animationDelay: '0.1s' }} />
            <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500" style={{ animationDelay: '0.2s' }} />
            <span className="text-xs text-gray-400 ml-1">Esperando al entrevistador…</span>
          </div>
        </div>
      </main>
    );
  }

  // ── Welcome (section 0) ───────────────────────────────────────────────────
  if (section === 0) {
    const firstName = session?.candidateName?.split(' ')[0] ?? '';
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-candidate p-6">
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-96 w-full max-w-lg rounded-full bg-blue-400/10 blur-3xl" />
        <div className="relative w-full max-w-md">
          <div className="glass-light rounded-2xl p-10 text-center">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-blue-500">Evaluación de Monitores · UTP</p>
            <h1 className="mt-2 mb-5 text-2xl font-extrabold text-gray-900">
              Bienvenido/a{firstName ? `, ${firstName}` : ''}
            </h1>
            <div className="mb-6 rounded-xl bg-blue-50 border border-blue-100 p-4">
              <p className="text-xs text-blue-500 font-medium mb-1">Tu código de sesión</p>
              <p className="font-mono text-4xl font-bold tracking-[0.25em] text-blue-800">{code}</p>
            </div>
            <p className="mb-6 text-sm text-gray-500 leading-relaxed">
              Responderás <strong className="text-gray-700">4 secciones</strong> y luego resolverás un puzzle de <strong className="text-gray-700">3 rondas</strong> (Fácil → Normal → Difícil). Lee cada pregunta con calma.
            </p>
            <div className="mb-8 grid grid-cols-4 gap-2">
              {SECTION_META.map(s => (
                <div key={s.id} className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-center">
                  <span className="text-lg">{s.emoji}</span>
                  <p className="mt-1 text-xs text-gray-400 leading-tight">{s.title}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => { sectionStartRef.current = Date.now(); setSection(1); }}
              className="btn-primary w-full text-base"
            >
              Comenzar →
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── Sections 1–4 ─────────────────────────────────────────────────────────
  const meta             = SECTION_META[section - 1];
  const sectionQuestions = questionsFor(section);
  const completedCount   = sectionQuestions.filter(q => (answers[q.id] ?? '').trim().length > 0).length;
  const isLast           = section === SECTION_META.length;

  return (
    <main className="min-h-screen bg-candidate">

      {/* Sticky progress header with clock */}
      <div className="sticky top-0 z-10 border-b border-blue-100/80 bg-white/85 backdrop-blur-md px-4 py-2.5">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AnalogClock size={52} />
            <div>
              <p className="text-sm font-bold text-blue-700">{meta.emoji} {meta.title}</p>
              <p className="text-xs text-gray-400">
                Tiempo en sección: <SectionTimer startMs={sectionStartRef.current} className="font-mono font-semibold text-blue-600" />
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-400 tabular-nums shrink-0">
            {completedCount}/{sectionQuestions.length} respondidas
          </p>
        </div>
        <div className="mx-auto mt-2 max-w-xl flex gap-1.5">
          {SECTION_META.map(s => (
            <div key={s.id} className={`h-1 flex-1 rounded-full transition-all duration-500 ${
              s.id < section ? 'bg-blue-600' : s.id === section ? 'bg-blue-400' : 'bg-gray-200'
            }`} />
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-xl px-6 py-8">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500 mb-1">
            Sección {section} de {SECTION_META.length}
          </p>
          <h2 className="text-xl font-extrabold text-gray-900">{meta.title}</h2>
          <p className="mt-1 text-sm text-gray-500">{meta.description}</p>
        </div>

        <div className="flex flex-col gap-5">
          {sectionQuestions.map((q, i) => {
            const answered = (answers[q.id] ?? '').trim().length > 0;
            return (
              <div key={q.id} className={`glass-light rounded-2xl p-6 transition-all duration-200 ${answered ? 'ring-2 ring-blue-200 shadow-sm shadow-blue-100' : ''}`}>
                <p className="mb-3 text-sm font-semibold text-gray-800 leading-snug">
                  <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">{i + 1}</span>
                  {q.text}
                </p>
                {q.type === 'scale' ? (
                  <div className="flex gap-2">
                    {(q.options ?? ['1','2','3','4','5']).map(opt => (
                      <button key={opt} onClick={() => handleAnswer(q.id, opt)}
                        className={`flex h-11 w-11 items-center justify-center rounded-xl border-2 text-sm font-bold transition-all ${
                          answers[q.id] === opt
                            ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-200'
                            : 'border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600'
                        }`}
                      >{opt}</button>
                    ))}
                  </div>
                ) : (
                  <textarea rows={4} value={answers[q.id] ?? ''} onChange={e => handleAnswer(q.id, e.target.value)}
                    placeholder="Escribe tu respuesta aquí…"
                    className="w-full resize-none rounded-xl border-2 border-gray-100 bg-white/60 p-3 text-sm text-gray-800 placeholder-gray-300 transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/50"
                  />
                )}
                {answered && <p className="mt-2 text-right text-xs font-medium text-green-500">✓ Respondida</p>}
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex items-center justify-between">
          {section > 1 ? (
            <button onClick={() => setSection(s => s - 1)} className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors">
              ← Anterior
            </button>
          ) : <span />}
          <button onClick={nextSection} disabled={!sectionComplete(section) || saving} className="btn-primary px-8">
            {saving ? 'Guardando…' : isLast ? 'Finalizar y continuar →' : 'Siguiente sección →'}
          </button>
        </div>
      </div>
    </main>
  );
}
