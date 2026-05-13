import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Evaluación de Monitores — Ingeniería Industrial UTP',
  description: 'Sistema de evaluación de candidatos a monitor universitario',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
