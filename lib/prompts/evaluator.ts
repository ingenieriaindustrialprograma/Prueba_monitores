import type { CandidateProfile } from '../types';
import { RUBRICS } from '../rubrics';

interface SectionAnswer {
  questionId: string;
  section: number;
  question: string;
  answer: string;
}

const PROFILE_CONTEXT: Record<CandidateProfile, string> = {
  académico: `El candidato aplica al perfil ACADÉMICO. Este monitor NO enseña materias ni hace tutorías.
Su función es apoyo profesional interno al programa de Ingeniería Industrial UTP:
- Apoyar procesos internos del programa (acreditación, seguimiento, documentación)
- Recolectar y organizar información dispersa que el programa no ha sistematizado
- Generar insights y análisis sobre el estado del programa
- Identificar problemáticas no atendidas y proponer alternativas de mejora concretas
- Apoyar proyectos del programa que necesiten seguimiento o ejecución
- Detectar brechas, oportunidades y temas que nadie ha abordado aún
Se busca un perfil con alta autonomía, pensamiento crítico, capacidad de diagnóstico,
iniciativa propia y habilidad para trabajar con objetivos amplios sin supervisión constante.
Penalizar severamente a quien confunda el rol con tutorías o apoyo académico a estudiantes.`,

  redes: `El candidato aplica al perfil REDES SOCIALES. Gestiona Instagram y Facebook del
programa de Ingeniería Industrial UTP — cuentas que estaban inactivas, solo replicaban
contenido ajeno y fueron usadas inapropiadamente en el pasado.
Se busca alguien con criterio institucional estricto: capaz de crear contenido propio
que refleje los logros reales del programa (practicantes, doble titulación con Francia,
investigación), con visión de comunicación estratégica y manejo 100% profesional
e institucional de las cuentas. NUNCA uso personal. NUNCA replicar sin criterio.`,
};

const SECTION_NAMES: Record<number, string> = {
  1: 'Motivación y comprensión del rol',
  2: 'Actitud',
  3: 'Responsabilidad',
  4: 'Competencias específicas del perfil',
};

function buildDimensionGuide(questionIds: string[]): string {
  return questionIds
    .filter(id => RUBRICS[id])
    .map(id => {
      const dims = RUBRICS[id];
      const dimLines = dims
        .map(d => `      "${d.id}": <0.0-1.0>  // ${d.description}`)
        .join('\n');
      return `  "${id}": {\n${dimLines}\n  }`;
    })
    .join(',\n');
}

export function buildFullEvalPrompt(
  candidateName: string,
  profile: CandidateProfile,
  answers: SectionAnswer[],
  formContext: string
): string {
  const bySection: Record<number, SectionAnswer[]> = {};
  for (const a of answers) {
    if (!bySection[a.section]) bySection[a.section] = [];
    bySection[a.section].push(a);
  }

  const sectionsText = [1, 2, 3, 4]
    .filter(s => bySection[s]?.length)
    .map(s => {
      const qa = bySection[s]
        .map(a => `  [${a.questionId}] ${a.question}\n  RESPUESTA: ${a.answer || '(sin respuesta)'}`)
        .join('\n\n');
      return `### Sección ${s} — ${SECTION_NAMES[s]}\n${qa}`;
    })
    .join('\n\n---\n\n');

  // Only include dimension guides for question IDs that appear in the answers
  const answeredIds = answers.map(a => a.questionId);
  const dimensionGuide = buildDimensionGuide(answeredIds);

  return `Eres el evaluador oficial del proceso de selección de monitores del programa de
Ingeniería Industrial de la Universidad Tecnológica de Pereira (UTP).

## Perfil evaluado
${PROFILE_CONTEXT[profile]}

## Datos del formulario de inscripción (referencia)
${formContext}

## Candidato: ${candidateName}

## Respuestas de la entrevista
${sectionsText}

---

## Instrucciones de evaluación vectorial

Debes calificar CADA DIMENSIÓN de CADA PREGUNTA con un valor entre 0.0 y 1.0:
- 0.00-0.20 → dimensión ausente o completamente ignorada en la respuesta
- 0.21-0.40 → mención muy superficial, sin sustancia ni evidencia
- 0.41-0.60 → presente pero incompleta o genérica
- 0.61-0.80 → bien cubierta, con evidencia o ejemplo concreto
- 0.81-1.00 → excelente cobertura, muestra criterio propio y pensamiento real

Reglas críticas que DEBES aplicar:
- Si la respuesta tiene menos de 30 palabras o es una letra/número aislado → todas las dimensiones de esa pregunta valen 0.00
- Frases genéricas sin ejemplo ("lo haría bien", "me organizaría") → máximo 0.30 por dimensión
- Alta probabilidad de texto generado por IA → resta 0.20 a todas las dimensiones de todas las secciones
- Para perfil REDES: cualquier indicio de confundir uso personal con institucional → 0.00 en dimensiones de criterio institucional

## Formato de respuesta — JSON ESTRICTO

Responde ÚNICAMENTE con este JSON válido. NO escribas texto antes ni después.
Incluye solo los questionIds que aparecen en las respuestas de arriba.

\`\`\`
{
  "questions": {
${dimensionGuide}
  },
  "section_summaries": {
    "1": "<2 oraciones evaluando sección 1, citando lo que dijo el candidato>",
    "2": "<2 oraciones evaluando sección 2, citando lo que dijo el candidato>",
    "3": "<2 oraciones evaluando sección 3, citando lo que dijo el candidato>",
    "4": "<2 oraciones evaluando sección 4, citando lo que dijo el candidato>"
  },
  "strengths": [<2-4 fortalezas CONCRETAS con cita textual de la respuesta, o [] si no hay ninguna>],
  "weaknesses": [<2-4 debilidades específicas con evidencia textual>],
  "red_flags": [<alertas serias: respuesta mínima, IA, evasión — vacío si no hay>],
  "recommendation": <"seleccionar" | "lista_espera" | "no_seleccionar">,
  "recommendation_reason": "<párrafo de 3-5 oraciones justificando con evidencia específica>",
  "ai_probability": <0.0-1.0>
}
\`\`\``;
}

export function buildFormContext(applicant: Record<string, string>): string {
  return [
    `Programa: ${applicant.programa || applicant.programaOtro}`,
    `Semestre: ${applicant.semestre} | Promedio: ${applicant.promedio}`,
    `Horas disponibles/semana: ${applicant.horasDisponibles}`,
    `Monitor anterior: ${applicant.monAnterior}${applicant.detalleMonAnterior ? ' — ' + applicant.detalleMonAnterior : ''}`,
    `Áreas de interés: ${applicant.areasInteres}`,
    `Motivación declarada: ${applicant.motivoSolicitud}`,
    applicant.expLaboral ? `Experiencia laboral: ${applicant.expLaboral}` : '',
    applicant.semilleros ? `Semilleros: ${applicant.semilleros}` : '',
    applicant.proyectos ? `Proyectos: ${applicant.proyectos}` : '',
  ].filter(Boolean).join('\n');
}
