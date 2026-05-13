import type { ApplicantData, SectionResponse } from '../types';

export function buildCoherencePrompt(
  applicant: ApplicantData,
  liveResponses: SectionResponse[]
): string {
  const formSummary = `
- Semestre: ${applicant.semestre} | Promedio: ${applicant.promedio}
- Horas disponibles: ${applicant.horasDisponibles}
- ¿Monitor anterior?: ${applicant.monAnterior}
- Motivación (formulario): ${applicant.motivoSolicitud}
- Habilidades declaradas: ${applicant.habilidadesRol}
- Expectativas: ${applicant.expectativas}
- Áreas de interés: ${applicant.areasInteres}
- Experiencia laboral: ${applicant.expLaboral}
  `.trim();

  const liveText = liveResponses
    .map(r => `[S${r.section}/${r.question_id}]: ${r.answer}`)
    .join('\n');

  return `Eres un analista de coherencia para evaluación de monitores universitarios.

## Lo que el candidato escribió en el formulario (antes de la entrevista):
${formSummary}

## Lo que el candidato respondió en vivo durante la entrevista:
${liveText}

## Tarea

Identifica contradicciones, inconsistencias o confirmaciones entre el formulario y las respuestas en vivo.
Una contradicción puede ser explícita (afirmó X en el formulario y dijo lo contrario en vivo) o implícita
(el tono, nivel de detalle o conocimiento demostrado no coincide con lo que declaró).

Responde ÚNICAMENTE con un JSON válido:
{
  "overall_coherence": <0-100, donde 100 = perfectamente coherente>,
  "contradictions": [
    {
      "field": "<campo o área del formulario>",
      "form_value": "<lo que escribió en el formulario>",
      "live_value": "<lo que dijo en vivo>",
      "severity": <"low" | "medium" | "high">,
      "explanation": "<por qué es una contradicción y qué implica>"
    }
  ],
  "insights": [<2-3 observaciones positivas o preocupantes sobre la coherencia general>]
}

Si no hay contradicciones reales, devuelve "contradictions": [].`;
}
