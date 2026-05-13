import { NextRequest, NextResponse } from 'next/server';
import { scriptWrite } from '@/lib/eval-script-write';

const EVAL_URL = process.env.GOOGLE_EVAL_SCRIPT_URL;
const EVAL_KEY = process.env.GOOGLE_EVAL_SCRIPT_KEY || 'EVALUTP2026';

// POST /api/responses — guardar respuesta individual
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { code, documento, candidateName, profile, section, questionId, question, answer, timeSecs } = body;

  if (!code || answer === undefined) {
    return NextResponse.json({ error: 'Faltan campos.' }, { status: 400 });
  }

  const result = await scriptWrite({
    action: 'saveResponse',
    code, documento, candidateName, profile, section, questionId, question, answer,
    timeSecs: timeSecs ?? 0,
  });

  if (!result.ok) {
    console.error('[responses POST] Error al guardar en Sheets:', result.error);
  }

  // Siempre respondemos ok al candidato para no bloquear su flujo
  return NextResponse.json({ ok: true });
}

// GET /api/responses?code=XXXX — leer respuestas por código de sesión
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.toUpperCase().trim() ?? '';
  if (!code) return NextResponse.json({ error: 'Código requerido.' }, { status: 400 });

  if (!EVAL_URL) return NextResponse.json({ responses: [] });

  try {
    const res = await fetch(
      `${EVAL_URL}?action=getResponses&code=${code}&key=${EVAL_KEY}`,
      { redirect: 'follow', cache: 'no-store' }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
