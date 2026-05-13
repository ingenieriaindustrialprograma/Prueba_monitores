'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CandidatePage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (clean.length !== 4) {
      setError('El código debe tener exactamente 4 caracteres.');
      return;
    }
    router.push(`/candidate/${clean}`);
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-candidate p-6">

      {/* Orbe decorativo */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-96 w-full max-w-lg rounded-full bg-blue-400/10 blur-3xl" />

      <div className="relative w-full max-w-sm">

        {/* Header */}
        <div className="mb-8 text-center">
          <a href="/" className="inline-flex items-center gap-2 text-sm text-blue-500 hover:text-blue-700 transition-colors mb-6">
            ← Inicio
          </a>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-700 shadow-lg shadow-blue-700/30 text-2xl">
            📋
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Ingresa tu código</h1>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">
            El entrevistador te proporcionó un código de 4 caracteres para iniciar tu evaluación.
          </p>
        </div>

        {/* Card principal */}
        <div className="glass-light rounded-2xl p-7">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Código de sesión
              </label>
              <input
                type="text"
                maxLength={4}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError('');
                }}
                placeholder="Ej. MK7P"
                className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-4 text-center text-3xl font-mono font-bold tracking-[0.4em] text-blue-900 uppercase transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15"
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                <span>⚠</span> {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full text-base">
              Continuar →
            </button>
          </form>
        </div>

        {/* Indicadores de paso */}
        <div className="mt-6 flex items-center justify-center gap-3 text-xs text-gray-400">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-700 text-white text-xs font-bold">1</span>
          <span className="h-px w-6 bg-gray-300" />
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-gray-500 text-xs">2</span>
          <span className="h-px w-6 bg-gray-300" />
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-gray-500 text-xs">3</span>
          <span className="ml-1 text-gray-400">Verificación · Evaluación · Cierre</span>
        </div>

      </div>
    </main>
  );
}
