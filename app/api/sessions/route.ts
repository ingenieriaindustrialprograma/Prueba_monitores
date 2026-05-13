import { NextRequest, NextResponse } from 'next/server';
import { scriptWrite } from '@/lib/eval-script-write';
import type { CandidateProfile } from '@/lib/types';

interface SessionEntry {
  code: string;
  profile: CandidateProfile;
  candidateName: string;
  documento: string;
  createdAt: number;
}

declare global { var _sessions: Map<string, SessionEntry> | undefined }
const sessions: Map<string, SessionEntry> = global._sessions ?? (global._sessions = new Map());

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { profile, candidateName, documento } = body as {
    profile: CandidateProfile;
    candidateName: string;
    documento: string;
  };

  if (!profile || !candidateName || !documento) {
    return NextResponse.json({ error: 'Faltan campos requeridos.' }, { status: 400 });
  }

  let code = generateCode();
  let attempts = 0;
  while (sessions.has(code) && attempts < 20) {
    code = generateCode();
    attempts++;
  }

  const entry: SessionEntry = { code, profile, candidateName, documento, createdAt: Date.now() };
  sessions.set(code, entry);

  // Persistir en Sheets en background (GET+payload)
  scriptWrite({ action: 'createSession', code, profile, candidateName, documento })
    .then(r => { if (!r.ok) console.warn('[sessions POST] Sheets write falló:', r.error); })
    .catch(() => {});

  return NextResponse.json({ code });
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.toUpperCase().trim() ?? '';
  if (!code) return NextResponse.json({ error: 'Código requerido.' }, { status: 400 });

  const session = sessions.get(code);
  if (!session) return NextResponse.json({ error: 'Código inválido o sesión no encontrada.' }, { status: 404 });

  return NextResponse.json({
    code: session.code,
    profile: session.profile,
    candidateName: session.candidateName,
    documento: session.documento,
  });
}
