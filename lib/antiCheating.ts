import type { CheatEvent, SectionResponse } from './types';

// Velocidad mínima razonable en caracteres por segundo para redactar
const MIN_CHARS_PER_SECOND = 0.5;

export interface CheatSummary {
  totalPastes: number;
  totalTabSwitches: number;
  unusualSpeedQuestions: string[];
  riskLevel: 'low' | 'medium' | 'high';
  flags: string[];
}

export function analyzeResponses(responses: SectionResponse[]): CheatSummary {
  const flags: string[] = [];
  let totalPastes = 0;
  let totalTabSwitches = 0;
  const unusualSpeedQuestions: string[] = [];

  for (const r of responses) {
    totalPastes += r.paste_events;
    totalTabSwitches += r.tab_switches;

    if (r.paste_events > 0) {
      flags.push(`Pegó texto en pregunta ${r.question_id} (${r.paste_events} vez${r.paste_events > 1 ? 'ces' : ''})`);
    }

    if (r.tab_switches > 2) {
      flags.push(`Cambió de pestaña ${r.tab_switches} veces en pregunta ${r.question_id}`);
    }

    // Velocidad sospechosa: muchos caracteres en muy poco tiempo
    if (r.time_spent_seconds > 0 && r.answer.length > 0) {
      const charsPerSecond = r.answer.length / r.time_spent_seconds;
      if (charsPerSecond > 15 && r.answer.length > 100) {
        unusualSpeedQuestions.push(r.question_id);
        flags.push(`Velocidad inusual en ${r.question_id}: ${charsPerSecond.toFixed(1)} chars/s`);
      }
    }

    // Respuesta muy corta para una pregunta que requiere elaboración
    if (r.time_spent_seconds > 60 && r.answer.length < 30) {
      flags.push(`Respuesta muy breve en ${r.question_id} después de ${r.time_spent_seconds}s`);
    }
  }

  let riskLevel: CheatSummary['riskLevel'] = 'low';
  if (totalPastes > 2 || unusualSpeedQuestions.length > 1) riskLevel = 'high';
  else if (totalPastes > 0 || totalTabSwitches > 4 || unusualSpeedQuestions.length > 0) riskLevel = 'medium';

  return { totalPastes, totalTabSwitches, unusualSpeedQuestions, riskLevel, flags };
}

// Eventos que el navegador debe capturar y enviar al backend
export function buildCheatEvent(
  type: CheatEvent['type'],
  section: number,
  questionId: string,
  detail?: string
): CheatEvent {
  return { type, section, question_id: questionId, timestamp: Date.now(), detail };
}
