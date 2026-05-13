import { NextRequest, NextResponse } from 'next/server';
import { scriptWrite } from '@/lib/eval-script-write';
import { kvGet, kvSet } from '@/lib/kv';
import type { CandidateProfile } from '@/lib/types';

interface SessionEntry {
  code: string;
  profile: CandidateProfile;
  candidateName: string;
  documento: string;
  createdAt: number;
}

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
  for (let i = 0; i < 20; i++) {
    const existing = await kvGet(`session:${code}`);
    if (!existing) break;
    code = generateCode();
  }

  const entry: SessionEntry = { code, profile, candidateName, documento, createdAt: Date.now() };
  await kvSet(`session:${code}`, entry, 86400);

  scriptWrite({ action: 'createSession', code, profile, candidateName, documento })
    .then(r => { if (!r.ok) console.warn('[sessions POST] Sheets write falló:', r.error); })
    .catch(() => {});

  return NextResponse.json({ code });
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.toUpperCase().trim() ?? '';
  if (!code) return NextResponse.json({ error: 'Código requerido.' }, { status: 400 });

  const session = await kvGet<SessionEntry>(`session:${code}`);
  if (!session) return NextResponse.json({ error: 'Código inválido o sesión no encontrada.' }, { status: 404 });

  return NextResponse.json({
    code: session.code,
    profile: session.profile,
    candidateName: session.candidateName,
    documento: session.documento,
  });
}
