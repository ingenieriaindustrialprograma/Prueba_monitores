'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewSessionPage() {
  const router = useRouter();
  const [document, setDocument] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const doc = document.trim();
    if (!doc) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/sheets/search?document=${encodeURIComponent(doc)}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Candidato no encontrado.');
        return;
      }
      const data = await res.json();
      sessionStorage.setItem('candidateData', JSON.stringify(data));
      router.push(`/panel/new/confirm`);
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-panel p-6">

      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-indigo-500/15 blur-3xl" />

      <div className="relative w-full max-w-sm">

        <div className="mb-8 text-center">
          <a href="/panel" className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-200 transition-colors mb-6">
            ← Panel
          </a>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/20 ring-1 ring-blue-400/30 text-2xl shadow-lg shadow-blue-900/20">
            🔍
          </div>
          <h1 className="text-2xl font-extrabold text-white">Buscar candidato</h1>
          <p className="mt-2 text-sm text-blue-200/70 leading-relaxed">
            Ingresa el número de documento del aspirante a monitor.
          </p>
        </div>

        <div className="glass-dark rounded-2xl p-7">
          <form onSubmit={handleSearch} className="flex flex-col gap-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-blue-300/70">
                Número de documento
              </label>
              <input
                type="text"
                value={document}
                onChange={(e) => { setDocument(e.target.value); setError(''); }}
                placeholder="Ej. 1234567890"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-blue-300/30 transition-all focus:border-blue-400/60 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
                autoFocus
                disabled={loading}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                <span>⚠</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !document.trim()}
              className="btn-primary w-full text-base"
            >
              {loading ? 'Buscando…' : 'Buscar →'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
