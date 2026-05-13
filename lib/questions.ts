import type { Question, CandidateProfile } from './types';

// ── Sección 1: Motivación y comprensión del rol (igual para ambos perfiles) ──
// Evalúa si el candidato entiende que la monitoria es apoyo profesional al
// programa: recolectar información, detectar problemas, proponer mejoras,
// apoyar procesos internos. Detecta motivación genuina vs oportunista.

// ── Sección 2: Actitud — diferente por perfil ────────────────────────────────
// Académico: iniciativa, autonomía, documentación, resolución de problemas reales.
// Redes: comunicación institucional, criterio editorial, manejo de relaciones.

// ── Sección 3: Responsabilidad (igual para ambos perfiles) ───────────────────
// Gestión de tiempo real, manejo del incumplimiento, priorización bajo presión,
// honestidad sobre debilidades propias.

// ── Sección 4: Competencias específicas del perfil ───────────────────────────
// Académico: diagnóstico, documentación, propuesta de mejora, impacto medible.
// Redes: estrategia, producción de contenido, rendición de cuentas, comunidad.

export const questions: Question[] = [

  // ════════════════════════════════════════════════════════════════
  //  SECCIÓN 1 — Motivación y comprensión del rol
  // ════════════════════════════════════════════════════════════════
  {
    id: 's1_q1',
    section: 1,
    text: '¿Qué entiende usted por ser monitor de programa? Explique en qué considera que se diferencia de ser auxiliar de cátedra o tutor de materias.',
    type: 'text',
    required: true,
    time_limit_seconds: 300,
  },
  {
    id: 's1_q2',
    section: 1,
    text: '¿Por qué quiere ser monitor en este momento de su carrera? Describa qué lo llevó a aplicar y qué lo distingue de otros candidatos.',
    type: 'text',
    required: true,
    time_limit_seconds: 300,
  },
  {
    id: 's1_q3',
    section: 1,
    text: '¿Cuál cree que sería su aporte más concreto y diferencial al programa de Ingeniería Industrial durante su monitoria?',
    type: 'text',
    required: true,
    time_limit_seconds: 300,
  },
  {
    id: 's1_q4',
    section: 1,
    text: 'Si a mitad de la monitoria siente que no está aportando lo que esperaba o que su rol no es tan claro como pensaba, ¿qué haría?',
    type: 'text',
    required: true,
    time_limit_seconds: 240,
  },
  {
    id: 's1_q5',
    section: 1,
    text: '¿Cómo describiría el impacto concreto que quiere dejar al finalizar su monitoria? ¿Cómo sabría, de forma objetiva, si lo logró?',
    type: 'text',
    required: true,
    time_limit_seconds: 240,
  },

  // ════════════════════════════════════════════════════════════════
  //  SECCIÓN 2 — Actitud · Perfil ACADÉMICO
  // ════════════════════════════════════════════════════════════════
  {
    id: 's2_ac_q1',
    section: 2,
    profile: 'académico',
    text: 'Le asignan apoyar un proyecto del programa que lleva meses estancado sin resultados claros ni responsables definidos. ¿Cómo lo aborda desde el primer día?',
    type: 'text',
    required: true,
    time_limit_seconds: 300,
  },
  {
    id: 's2_ac_q2',
    section: 2,
    profile: 'académico',
    text: 'Durante su monitoria identifica una necesidad real del programa que nadie ha atendido ni siquiera ha nombrado. ¿Qué hace con eso?',
    type: 'text',
    required: true,
    time_limit_seconds: 240,
  },
  {
    id: 's2_ac_q3',
    section: 2,
    profile: 'académico',
    text: 'Propone una mejora a un proceso académico del programa y la dirección la rechaza sin mayor justificación. ¿Cómo responde?',
    type: 'text',
    required: true,
    time_limit_seconds: 240,
  },
  {
    id: 's2_ac_q4',
    section: 2,
    profile: 'académico',
    text: 'Le piden consolidar información dispersa de distintas áreas del programa que no ha sido documentada antes. ¿Cómo recopila esa información, cómo la organiza y qué hace con ella una vez consolidada?',
    type: 'text',
    required: true,
    time_limit_seconds: 300,
  },
  {
    id: 's2_ac_q5',
    section: 2,
    profile: 'académico',
    text: 'Identifica una problemática recurrente en el programa que todos conocen pero que nadie ha atendido formalmente. ¿Cómo la abordaría sin generar conflictos innecesarios ni parecer que está criticando la gestión actual?',
    type: 'text',
    required: true,
    time_limit_seconds: 300,
  },
  {
    id: 's2_ac_q6',
    section: 2,
    profile: 'académico',
    text: 'Del 1 al 5, ¿qué tan cómodo se siente trabajando de forma autónoma con objetivos amplios y poco definidos?',
    type: 'scale',
    required: true,
    options: ['1', '2', '3', '4', '5'],
  },

  // ════════════════════════════════════════════════════════════════
  //  SECCIÓN 2 — Actitud · Perfil REDES
  // ════════════════════════════════════════════════════════════════
  {
    id: 's2_re_q1',
    section: 2,
    profile: 'redes',
    text: 'Publica un contenido en las redes del programa y recibe comentarios negativos de estudiantes o docentes diciendo que no es apropiado para la imagen institucional. ¿Cómo reacciona y qué hace?',
    type: 'text',
    required: true,
    time_limit_seconds: 300,
  },
  {
    id: 's2_re_q2',
    section: 2,
    profile: 'redes',
    text: 'La participación de los estudiantes en actividades del programa es muy baja y nadie ha logrado revertirlo. ¿Qué estrategia propone?',
    type: 'text',
    required: true,
    time_limit_seconds: 240,
  },
  {
    id: 's2_re_q3',
    section: 2,
    profile: 'redes',
    text: 'Hay un malentendido entre el programa y un aliado externo que está deteriorando la relación. Nadie le ha pedido que lo resuelva, pero usted lo detecta. ¿Qué hace?',
    type: 'text',
    required: true,
    time_limit_seconds: 240,
  },
  {
    id: 's2_re_q4',
    section: 2,
    profile: 'redes',
    text: 'La dirección del programa le pide publicar un contenido con el que usted no está de acuerdo desde el punto de vista de la comunicación institucional. ¿Qué hace?',
    type: 'text',
    required: true,
    time_limit_seconds: 240,
  },
  {
    id: 's2_re_q5',
    section: 2,
    profile: 'redes',
    text: '¿Cómo construiría un calendario de contenidos para un mes? Explique paso a paso cómo recopila la información, cómo decide qué publicar, cómo lo produce y cómo lo programa.',
    type: 'text',
    required: true,
    time_limit_seconds: 300,
  },
  {
    id: 's2_re_q6',
    section: 2,
    profile: 'redes',
    text: 'Del 1 al 5, ¿qué tan cómodo se siente representando al programa ante personas externas a la universidad?',
    type: 'scale',
    required: true,
    options: ['1', '2', '3', '4', '5'],
  },

  // ════════════════════════════════════════════════════════════════
  //  SECCIÓN 3 — Responsabilidad (igual para ambos perfiles)
  // ════════════════════════════════════════════════════════════════
  {
    id: 's3_q1',
    section: 3,
    text: '¿Cómo organizaría su agenda siendo monitor, considerando que también tiene materias, trabajos grupales y vida personal? Sea específico.',
    type: 'text',
    required: true,
    time_limit_seconds: 300,
  },
  {
    id: 's3_q2',
    section: 3,
    text: 'Cuénteme de una vez que asumió un compromiso importante y no pudo cumplirlo. ¿Qué pasó exactamente, qué hizo al respecto y qué aprendió?',
    type: 'text',
    required: true,
    time_limit_seconds: 300,
  },
  {
    id: 's3_q3',
    section: 3,
    text: 'En la semana más exigente del semestre surge una tarea urgente de la monitoria que no estaba planeada y que requiere tiempo inmediato. ¿Qué decide?',
    type: 'text',
    required: true,
    time_limit_seconds: 240,
  },
  {
    id: 's3_q4',
    section: 3,
    text: 'Si en algún momento no puede cumplir con una tarea o entrega de la monitoria, ¿cómo lo gestiona? ¿A quién le avisa, con cuánta anticipación y qué hace para no dejar el pendiente sin resolver?',
    type: 'text',
    required: true,
    time_limit_seconds: 240,
  },
  {
    id: 's3_q5',
    section: 3,
    text: '¿Cuál es su mayor debilidad en términos de responsabilidad o cumplimiento? Sea honesto. ¿Qué ha hecho concretamente para trabajarla?',
    type: 'text',
    required: true,
    time_limit_seconds: 240,
  },
  {
    id: 's3_q6',
    section: 3,
    text: 'A mitad del semestre se da cuenta de que una de sus entregas de monitoria tiene errores importantes que nadie ha detectado todavía. ¿Qué hace?',
    type: 'text',
    required: true,
    time_limit_seconds: 240,
  },

  // ════════════════════════════════════════════════════════════════
  //  SECCIÓN 4 — Competencias específicas · Perfil ACADÉMICO
  // ════════════════════════════════════════════════════════════════
  {
    id: 's4_ac_q1',
    section: 4,
    profile: 'académico',
    text: '¿En qué proyectos, procesos o áreas del programa tiene mayor dominio o experiencia que le permitan aportar de forma directa e inmediata?',
    type: 'text',
    required: true,
    time_limit_seconds: 300,
  },
  {
    id: 's4_ac_q2',
    section: 4,
    profile: 'académico',
    text: 'Si tuviera que diseñar una solución a una necesidad concreta del programa, describa paso a paso cómo sería su proceso de trabajo.',
    type: 'text',
    required: true,
    time_limit_seconds: 300,
  },
  {
    id: 's4_ac_q3',
    section: 4,
    profile: 'académico',
    text: '¿Qué herramientas, metodologías o recursos traería a la monitoria que actualmente el programa no tiene o no está aprovechando bien?',
    type: 'text',
    required: true,
    time_limit_seconds: 240,
  },
  {
    id: 's4_ac_q4',
    section: 4,
    profile: 'académico',
    text: '¿Cómo mediría usted mismo, de forma objetiva, si su trabajo como monitor está generando un impacto real en el programa?',
    type: 'text',
    required: true,
    time_limit_seconds: 240,
  },
  {
    id: 's4_ac_q5',
    section: 4,
    profile: 'académico',
    text: '¿Cómo documentaría sus hallazgos, procesos y avances durante la monitoria para que el próximo monitor pueda continuar el trabajo sin empezar desde cero?',
    type: 'text',
    required: true,
    time_limit_seconds: 240,
  },
  {
    id: 's4_ac_q6',
    section: 4,
    profile: 'académico',
    text: 'Si pudiera identificar una problemática no atendida en el programa y presentarla como una oportunidad de mejora, ¿cuál sería y cómo la sustentaría ante la dirección?',
    type: 'text',
    required: true,
    time_limit_seconds: 300,
  },

  // ════════════════════════════════════════════════════════════════
  //  SECCIÓN 4 — Competencias específicas · Perfil REDES
  // ════════════════════════════════════════════════════════════════
  {
    id: 's4_re_q1',
    section: 4,
    profile: 'redes',
    text: 'Las redes sociales del programa (Instagram y Facebook) llevan tiempo sin publicar contenido propio — lo único que se ha publicado es material replicado de otras dependencias. ¿Qué haría durante su primera semana para diagnosticar el estado real de esas cuentas, y cuál sería su propuesta concreta para los primeros 30 días?',
    type: 'text',
    required: true,
    time_limit_seconds: 360,
  },
  {
    id: 's4_re_q2',
    section: 4,
    profile: 'redes',
    text: 'Ingeniería Industrial UTP es el programa con más practicantes colocados de la universidad y ha enviado estudiantes en doble titulación a Francia, entre otros logros que nunca han tenido visibilidad en redes. ¿Cómo convertiría ese tipo de información en contenido que genere identidad, orgullo y reconocimiento real del programa? Sea específico en formatos, tono y frecuencia.',
    type: 'text',
    required: true,
    time_limit_seconds: 360,
  },
  {
    id: 's4_re_q3',
    section: 4,
    profile: 'redes',
    text: '¿Qué entiende usted por el manejo profesional e institucional de las redes sociales de un programa académico? ¿Dónde está la línea entre lo que sí y lo que no es aceptable hacer desde esas cuentas, y por qué esa línea importa?',
    type: 'text',
    required: true,
    time_limit_seconds: 300,
  },
  {
    id: 's4_re_q4',
    section: 4,
    profile: 'redes',
    text: '¿Cómo le demostraría a la dirección del programa, mes a mes, que su trabajo en redes está generando valor real y no es solo actividad por cumplir? ¿Qué le mostraría exactamente y con qué frecuencia rendiría cuentas?',
    type: 'text',
    required: true,
    time_limit_seconds: 300,
  },
  {
    id: 's4_re_q5',
    section: 4,
    profile: 'redes',
    text: 'Proponga una campaña de contenido específica para uno de los logros del programa (doble titulación con Francia, practicantes, investigación). Detalle el concepto, los formatos que usaría y los mensajes clave.',
    type: 'text',
    required: true,
    time_limit_seconds: 360,
  },
  {
    id: 's4_re_q6',
    section: 4,
    profile: 'redes',
    text: '¿Cómo involucraría a estudiantes, docentes y directivos en la generación de contenido sin que se convierta en una carga para ellos? ¿Qué mecanismos usaría para que el contenido llegue a usted de manera constante?',
    type: 'text',
    required: true,
    time_limit_seconds: 300,
  },
];

export function getQuestionsForSection(section: number, profile?: CandidateProfile): Question[] {
  return questions.filter(q => {
    if (q.section !== section) return false;
    if (!q.profile) return true;
    return q.profile === profile;
  });
}

export function getQuestionById(id: string): Question | undefined {
  return questions.find(q => q.id === id);
}
