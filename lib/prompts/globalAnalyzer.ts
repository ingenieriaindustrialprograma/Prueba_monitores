import type { ApplicantData, SectionEvaluation, CoherenceAnalysis } from '../types';

export function buildGlobalAnalysisPrompt(
  applicant: ApplicantData,
  sectionEvals: SectionEvaluation[],
  coherence: CoherenceAnalysis
): string {
  const nombre = `${applicant.nombres} ${applicant.primerApellido}`.trim();

  const evalSummary = sectionEvals
    .map(e => `Sección ${e.section}: score=${e.score}, AI prob=${e.ai_probability.toFixed(2)}
  Fortalezas: ${e.strengths.join('; ')}
  Debilidades: ${e.weaknesses.join('; ')}`)
    .join('\n\n');

  const contradictionText = coherence.contradictions.length > 0
    ? coherence.contradictions.map(c => `- [${c.severity}] ${c.field}: ${c.explanation}`).join('\n')
    : 'Sin contradicciones significativas.';

  return `Eres el evaluador principal en el proceso de selección de monitores para FACIEM, UTP.

## Candidato: ${nombre}
Programa: ${applicant.programa} | Semestre: ${applicant.semestre} | Promedio: ${applicant.promedio}
Tipo de monitoria: ${applicant.tipoMonitoria}

## Evaluaciones por sección
${evalSummary}

## Coherencia formulario vs. entrevista en vivo
Score de coherencia: ${coherence.overall_coherence}/100
Contradicciones identificadas:
${contradictionText}
Insights: ${coherence.insights.join('; ')}

## Tarea

Produce el análisis global del candidato. Considera todas las secciones y la coherencia.
Un candidato con buen score pero baja coherencia es una señal de alerta.
La probabilidad de IA alta en múltiples secciones también es preocupante.

Responde ÚNICAMENTE con un JSON válido:
{
  "strengths": [<3-5 fortalezas globales del candidato>],
  "weaknesses": [<1-3 debilidades o riesgos>],
  "recommendation_reason": "<párrafo de 2-4 oraciones justificando la recomendación, con evidencia específica>",
  "ai_probability_overall": <0.0-1.0, promedio ponderado de la probabilidad de uso de IA>
}`;
}
