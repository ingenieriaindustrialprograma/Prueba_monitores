export function buildAiDetectorPrompt(answers: string[]): string {
  const answersText = answers
    .map((a, i) => `Respuesta ${i + 1}:\n${a}`)
    .join('\n\n---\n\n');

  return `Eres un detector de contenido generado por IA especializado en respuestas de entrevistas en español.

## Respuestas a analizar

${answersText}

## Tarea

Analiza si estas respuestas parecen generadas por IA (ChatGPT, Claude, Gemini, etc.) o escritas por una persona real.

Señales de IA: vocabulario excesivamente formal para el contexto, estructura muy perfecta, ausencia de errores o vacilaciones, ausencia de experiencias personales concretas, frases genéricas que aplican a cualquier persona, longitud artificialmente uniforme entre respuestas.

Señales de persona real: errores tipográficos menores, experiencias específicas y únicas, referencias a contextos concretos (nombres de materias, profesores, situaciones reales), variación natural en la longitud y estilo, algunas respuestas más elaboradas que otras.

Responde ÚNICAMENTE con un JSON válido:
{
  "probability": <0.0-1.0, probabilidad de contenido generado por IA>,
  "signals": [<2-4 señales específicas que observaste en el texto, positivas o negativas>],
  "verdict": "<una oración sobre si crees que fue escrito por humano o generado por IA>"
}`;
}
