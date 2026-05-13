import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen bg-panel flex flex-col overflow-hidden relative">

      {/* Decorative orbs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-0 h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-3xl" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Image src="/logo.jpg" alt="UTP" width={48} height={48} className="rounded-full object-contain shadow-lg shadow-blue-900/40" />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-400/70 leading-none">UTP</p>
            <p className="text-sm font-semibold text-white leading-tight">Evaluación de Monitores</p>
          </div>
        </div>
        <p className="hidden sm:block text-xs text-blue-400/50 font-medium tracking-wide">
          Proceso de selección 2026
        </p>
      </nav>

      {/* Hero */}
      <div className="relative z-10 flex flex-1 items-center">

        {/* Left: content */}
        <div className="flex-1 px-8 sm:px-16 py-12 max-w-2xl">
          <span className="inline-block mb-5 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-300">
            Ingeniería Industrial · 2026
          </span>

          <h1 className="text-5xl sm:text-6xl font-black text-white leading-tight tracking-tight mb-5">
            Evaluación<br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              de Monitores
            </span>
          </h1>

          <p className="text-blue-200/70 text-lg leading-relaxed mb-10 max-w-md">
            Proceso estructurado de selección para monitores del programa, asistido por inteligencia artificial.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 max-w-lg">

            <a href="/panel/login" className="group flex-1">
              <div className="glass-dark rounded-2xl p-6 transition-all duration-300 hover:bg-white/10 hover:scale-[1.02] glow-blue">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/20 ring-1 ring-blue-400/30 text-xl">🎯</div>
                <h2 className="text-base font-bold text-white mb-1">Soy entrevistador</h2>
                <p className="text-xs text-blue-200/60 leading-relaxed mb-4">
                  Busca candidatos, crea sesiones y evalúa en tiempo real.
                </p>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-300 group-hover:text-white transition-colors">
                  Ingresar al panel <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </div>
            </a>

            <a href="/candidate" className="group flex-1">
              <div className="glass-dark rounded-2xl p-6 transition-all duration-300 hover:bg-white/10 hover:scale-[1.02]">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/20 ring-1 ring-indigo-400/30 text-xl">📝</div>
                <h2 className="text-base font-bold text-white mb-1">Soy candidato</h2>
                <p className="text-xs text-blue-200/60 leading-relaxed mb-4">
                  Ingresa el código de sesión que te dio el entrevistador.
                </p>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-300 group-hover:text-white transition-colors">
                  Ingresar código <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </div>
            </a>

          </div>
        </div>

        {/* Right: mascota */}
        <div className="hidden lg:flex flex-shrink-0 items-end justify-center pr-8 pb-0 self-end">
          <Image
            src="/mascota.png"
            alt="Mascota UTP"
            width={480}
            height={540}
            className="object-contain"
            style={{ filter: 'drop-shadow(0 0 60px rgba(59,130,246,0.35))' }}
            priority
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 px-8 py-4 border-t border-white/5">
        <p className="text-xs text-blue-300/30 text-center">
          Facultad de Ingeniería Industrial · UTP · Sistema de evaluación asistido por IA
        </p>
      </footer>

    </div>
  );
}
