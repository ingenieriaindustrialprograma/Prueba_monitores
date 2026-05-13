import Link from 'next/link';

export default function PanelPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-panel p-6">

      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-indigo-500/15 blur-3xl" />

      <div className="relative w-full max-w-2xl">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400/70 mb-1">
              Universidad Tecnológica de Pereira
            </p>
            <h1 className="text-3xl font-extrabold text-white">Panel del entrevistador</h1>
            <p className="mt-1 text-sm text-blue-200/60">Ingeniería Industrial · Proceso de selección 2026</p>
          </div>
          <Link href="/panel/new" className="btn-primary shrink-0 text-sm">
            + Nueva sesión
          </Link>
        </div>

        {/* Empty state */}
        <div className="glass-dark rounded-2xl p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 ring-1 ring-blue-400/20 text-2xl">
            📋
          </div>
          <p className="text-white/60 font-medium">No hay sesiones registradas aún.</p>
          <p className="mt-1 text-sm text-white/30">
            Crea una nueva sesión para buscar un candidato.
          </p>
          <Link
            href="/panel/new"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-400 hover:text-blue-200 transition-colors"
          >
            Buscar candidato →
          </Link>
        </div>

        <div className="mt-5 text-center">
          <Link href="/" className="text-sm text-blue-400/40 hover:text-blue-300 transition-colors">
            ← Volver al inicio
          </Link>
        </div>

      </div>
    </main>
  );
}
