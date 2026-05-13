import type { ApplicantData } from '../types';

export function buildPreEvalPrompt(applicant: ApplicantData): string {
  const nombre = `${applicant.nombres} ${applicant.primerApellido} ${applicant.segundoApellido}`.trim();

  return `Eres un evaluador experto en selección de monitores universitarios para la Facultad de Ingeniería Industrial (FACIEM) de la UTP.

Analiza el siguiente formulario de inscripción y produce una evaluación previa antes de la entrevista.

## Datos del candidato: ${nombre}
- Programa: ${applicant.programa || applicant.programaOtro}
- Semestre: ${applicant.semestre} | Promedio: ${applicant.promedio}
- Tipo de monitoria solicitada: ${applicant.tipoMonitoria}
- Horas disponibles/semana: ${applicant.horasDisponibles}
- Disponibilidad horaria: ${applicant.disponibilidad}
- ¿Monitor anterior?: ${applicant.monAnterior} — ${applicant.detalleMonAnterior}

## Respuestas del formulario
**¿Por qué quiere ser monitor?**
${applicant.motivoSolicitud}

**Motivación general:**
${applicant.motivacionGeneral}

**Habilidades para el rol:**
${applicant.habilidadesRol}

**Expectativas:**
${applicant.expectativas}

**Áreas de interés:**
${applicant.areasInteres}

**Tecnologías:**
${applicant.tecnologias}

**Semilleros/proyectos/eventos:**
Semilleros: ${applicant.semilleros}
Proyectos: ${applicant.proyectos}
Eventos: ${applicant.eventos}

**Experiencia laboral:**
${applicant.expLaboral}

**Idiomas:**
${applicant.idiomas}

## Tarea

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta:
{
  "score": <número 0-100>,
  "highlights": [<array de 2-4 fortalezas específicas del formulario>],
  "concerns": [<array de 1-3 preocupaciones o vacíos del formulario>],
  "custom_questions": [<array de 2-3 preguntas personalizadas para hacerle durante la entrevista, basadas en lo que escribió>],
  "recommendation": <"proceder" | "revisar" | "descartar">,
  "summary": "<resumen de 2-3 oraciones del perfil>"
}

El score debe reflejar qué tan completo, coherente y convincente es el formulario. No evalúes al candidato como persona, evalúa la calidad y sustancia de lo que escribió.`;
}
