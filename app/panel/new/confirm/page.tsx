'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface CandidateData {
  documento: string;
  nombres: string;
  primerApellido: string;
  segundoApellido: string;
  programa: string;
  semestre: string;
  promedio: string;
  correoInstitucional: string;
  tipoMonitoria: string;
  _mock?: boolean;
}

const PROFILE_INFO = {
  académico: {
    emoji: '🎯',
    label: 'Monitor Académico',
    desc: 'Apoya procesos internos, recolecta información y genera insights del programa.',
  },
  redes: {
    emoji: '📱',
    label: 'Monitor de Redes',
    desc: 'Gestiona Instagram y Facebook del programa con contenido institucional.',
  },
};

export default function ConfirmPage() {
  const router = useRouter();
  const [candidate, setCandidate] = useState<CandidateData | null>(null);
  const [profile, setProfile] = useState<'académico' | 'redes'>('académico');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const raw = sessionStorage.getItem('candidateData');
    if (!raw) { router.replace('/panel/new'); return; }
    setCandidate(JSON.parse(raw));
  }, [router]);

  async function handleCreate() {
    if (!candidate) return;
    setCreating(true);

    const fullName = `${candidate.nombres} ${candidate.primerApellido} ${candidate.segundoApellido}`.trim();

    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, candidateName: fullName, documento: candidate.documento }),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error ?? 'Error al crear la sesión.'); setCreating(false); return; }

    sessionStorage.setItem('sessionProfile', profile);
    sessionStorage.setItem('sessionCode', data.code);
    router.push(`/panel/${data.code}`);
  }

  if (!candidate) return null;
  const fullName = `${candidate.nombres} ${candidate.primerApellido} ${candidate.segundoApellido}`;

  const fields = [
    { label: 'Documento', value: candidate.documento },
    { label: 'Programa', value: candidate.programa },
    { label: 'Semestre', value: candidate.semestre },
    { label: 'Promedio', value: candidate.promedio },
    { label: 'Correo', value: candidate.correoInstitucional },
  ];

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-panel p-6">

      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-indigo-500/15 blur-3xl" />

      <div className="relative w-full max-w-lg">

        {candidate._mock && (
          <div className="mb-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-300 text-center">
            Modo demo — datos de prueba (Sheets no configurado)
          </div>
        )}

        <div className="mb-6 text-center">
          <a href="/panel/new" className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-200 transition-colors">
            ← Buscar otro
          </a>
          <h1 className="mt-4 text-2xl font-extrabold text-white">Candidato encontrado</h1>
          <p className="mt-1 text-sm text-blue-200/70">Confirma los datos y selecciona el perfil de monitoria.</p>
        </div>

        <div className="glass-dark rounded-2xl p-7 mb-4">

          {/* Nombre */}
          <div className="mb-5 pb-5 border-b border-white/10">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-400/70 mb-1">Candidato</p>
            <p className="text-xl font-bold text-white">{fullName}</p>
          </div>

          {/* Datos */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm mb-6">
            {fields.map(f => (
              <div key={f.label}>
                <span className="block text-xs text-blue-300/50 mb-0.5">{f.label}</span>
                <span className="text-white/90 font-medium">{f.value || '—'}</span>
              </div>
            ))}
          </div>

          {/* Perfil */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-blue-300/70">Perfil de monitoria</p>
            <div className="grid grid-cols-2 gap-3">
              {(['académico', 'redes'] as const).map((p) => {
                const info = PROFILE_INFO[p];
                const active = profile === p;
                return (
                  <button
                    key={p}
                    onClick={() => setProfile(p)}
                    className={`rounded-xl border p-4 text-left transition-all ${
                      active
                        ? 'border-blue-400/60 bg-blue-500/20 ring-1 ring-blue-400/30'
                        : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <span className="text-xl">{info.emoji}</span>
                    <p className={`mt-2 text-sm font-semibold ${active ? 'text-blue-200' : 'text-white/70'}`}>
                      {info.label}
                    </p>
                    <p className={`mt-1 text-xs leading-relaxed ${active ? 'text-blue-300/80' : 'text-white/40'}`}>
                      {info.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              <span>⚠</span> {error}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={() => router.back()} className="btn-secondary flex-1">
            Volver
          </button>
          <button onClick={handleCreate} disabled={creating} className="btn-primary flex-1">
            {creating ? 'Creando sesión…' : 'Crear sesión →'}
          </button>
        </div>

      </div>
    </main>
  );
}
