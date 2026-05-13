'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const PASSWORD = '1004717192';

export default function PanelLoginPage() {
  const router = useRouter();
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pass.trim()) return;
    setLoading(true);
    setTimeout(() => {
      if (pass === PASSWORD) {
        sessionStorage.setItem('panel_auth', 'true');
        router.push('/panel');
      } else {
        setError('Contraseña incorrecta. Intenta de nuevo.');
        setLoading(false);
      }
    }, 400);
  }

  return (
    <div className="flex min-h-screen bg-panel">

      {/* Left: branding + mascota */}
      <div className="hidden lg:flex w-1/2 flex-col items-center justify-center relative overflow-hidden px-12">
        <div className="pointer-events-none absolute -top-20 -left-20 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative z-10 text-center">
          <Image
            src="/mascota.png"
            alt="Mascota UTP"
            width={260}
            height={260}
            className="mx-auto mb-6 drop-shadow-2xl object-contain"
            style={{ filter: 'drop-shadow(0 0 40px rgba(59,130,246,0.3))' }}
          />
          <p className="text-blue-300/80 text-sm leading-relaxed max-w-xs">
            Sistema de evaluación asistido por IA<br />
            <span className="text-blue-400 font-semibold">Ingeniería Industrial · UTP</span>
          </p>
        </div>
      </div>

      {/* Right: login form */}
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm">

          {/* Logo */}
          <div className="mb-8 text-center">
            <Image
              src="/logo.jpg"
              alt="Logo UTP"
              width={80}
              height={80}
              className="mx-auto mb-4 rounded-full shadow-lg shadow-blue-900/40 object-contain"
            />
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400/70 mb-1">
              Universidad Tecnológica de Pereira
            </p>
            <h1 className="text-2xl font-extrabold text-white">Acceso al panel</h1>
            <p className="mt-1 text-sm text-blue-200/60">Solo para entrevistadores autorizados.</p>
          </div>

          {/* Form */}
          <div className="glass-dark rounded-2xl p-7">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-blue-300/70">
                  Contraseña del entrevistador
                </label>
                <input
                  type="password"
                  value={pass}
                  onChange={e => { setPass(e.target.value); setError(''); }}
                  placeholder="••••••••••"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-blue-300/25 transition-all focus:border-blue-400/60 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
                  autoFocus
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  <span>⚠</span> {error}
                </div>
              )}

              <button type="submit" disabled={loading || !pass.trim()} className="btn-primary w-full text-base">
                {loading ? 'Verificando…' : 'Ingresar al panel →'}
              </button>
            </form>
          </div>

          <div className="mt-5 text-center">
            <a href="/" className="text-sm text-blue-400/40 hover:text-blue-300 transition-colors">
              ← Volver al inicio
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
