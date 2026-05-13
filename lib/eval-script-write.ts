// Utilidad compartida para escribir en el Apps Script de evaluación.
// Usa GET+payload porque POST con redirect:follow convierte el método a GET
// (comportamiento estándar HTTP 302), y POST con redirect:manual en Node.js
// nativo devuelve un opaque response (status 0) sin Location accesible.
// GET+payload es el único mecanismo confiable desde Next.js server-side.

const EVAL_URL = process.env.GOOGLE_EVAL_SCRIPT_URL;
const EVAL_KEY = process.env.GOOGLE_EVAL_SCRIPT_KEY || 'EVALUTP2026';

export interface WriteResult {
  ok: boolean;
  error?: string;
}

export async function scriptWrite(
  body: Record<string, unknown>
): Promise<WriteResult> {
  if (!EVAL_URL) {
    console.error('[scriptWrite] GOOGLE_EVAL_SCRIPT_URL no está configurada');
    return { ok: false, error: 'URL del script no configurada' };
  }

  const payload = encodeURIComponent(JSON.stringify({ ...body, key: EVAL_KEY }));
  const url = `${EVAL_URL}?action=${body.action}&key=${EVAL_KEY}&payload=${payload}`;

  try {
    const res = await fetch(url, { redirect: 'follow', cache: 'no-store' });
    const text = await res.text();

    if (!res.ok) {
      const msg = `HTTP ${res.status} — ${text.slice(0, 300)}`;
      console.error(`[scriptWrite] ${body.action}:`, msg);
      return { ok: false, error: msg };
    }

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(text);
    } catch {
      // El script devolvió HTML (probable error de despliegue o permisos)
      const msg = `Respuesta no-JSON del script: ${text.slice(0, 300)}`;
      console.error(`[scriptWrite] ${body.action}:`, msg);
      return { ok: false, error: msg };
    }

    if (!data.ok) {
      const msg = String(data.error ?? 'El script devolvió error sin detalle');
      console.error(`[scriptWrite] ${body.action}:`, msg);
      return { ok: false, error: msg };
    }

    return { ok: true };
  } catch (err) {
    const msg = String(err);
    console.error(`[scriptWrite] ${body.action} — excepción:`, msg);
    return { ok: false, error: msg };
  }
}

// Lee el URL base para diagnóstico
export function getEvalScriptUrl(): string | undefined {
  return EVAL_URL;
}
