export interface Dimension {
  id: string;
  label: string;
  description: string;
  weight: number;
}

export const RUBRICS: Record<string, Dimension[]> = {
  // ── Sección 1: Motivación y comprensión del rol ──────────────────────────
  s1_q1: [
    { id: 'diferenciación_conceptual',   label: 'Diferenciación conceptual',   description: 'Distingue claramente monitor de tutor/auxiliar de cátedra — sin ambigüedad', weight: 0.40 },
    { id: 'comprensión_apoyo_programa',  label: 'Comprensión del rol',         description: 'Entiende que es apoyo profesional al programa, no apoyo a materias individuales', weight: 0.40 },
    { id: 'especificidad_y_ejemplos',    label: 'Especificidad',               description: 'Da ejemplos concretos de qué hace un monitor de programa', weight: 0.20 },
  ],
  s1_q2: [
    { id: 'motivación_genuina',          label: 'Motivación genuina',          description: 'Más allá del estímulo económico — conexión real con el programa', weight: 0.35 },
    { id: 'diferenciación_personal',     label: 'Diferenciación personal',     description: 'Articula qué lo distingue específicamente de otros candidatos', weight: 0.35 },
    { id: 'madurez_de_carrera',          label: 'Madurez de carrera',          description: 'Explica por qué este momento de su carrera tiene sentido para asumir la monitoria', weight: 0.30 },
  ],
  s1_q3: [
    { id: 'concreción_del_aporte',       label: 'Concreción del aporte',       description: 'Propone algo específico, no "ayudar en todo" ni generalidades', weight: 0.45 },
    { id: 'diferenciación',              label: 'Diferenciación',              description: 'Lo que propone es algo que otros no podrían aportar igual', weight: 0.35 },
    { id: 'viabilidad_realista',         label: 'Viabilidad',                  description: 'Es realista sobre lo que puede entregar en el tiempo de la monitoria', weight: 0.20 },
  ],

  // ── Sección 2 Académico: Actitud ─────────────────────────────────────────
  s2_ac_q1: [
    { id: 'diagnóstico_inicial',         label: 'Diagnóstico previo',          description: 'Antes de actuar, mapea la situación real del proyecto', weight: 0.25 },
    { id: 'iniciativa_sin_mandato',      label: 'Iniciativa',                  description: 'Toma ownership sin esperar a que alguien se lo asigne formalmente', weight: 0.30 },
    { id: 'metodología_de_acción',       label: 'Metodología',                 description: 'Describe pasos concretos, no solo "hablaría con los involucrados"', weight: 0.30 },
    { id: 'tolerancia_ambigüedad',       label: 'Tolerancia a la ambigüedad',  description: 'Muestra comodidad trabajando sin objetivos ni responsables definidos', weight: 0.15 },
  ],
  s2_ac_q2: [
    { id: 'detección_activa',            label: 'Detección activa',            description: 'Describe cómo identifica necesidades que nadie ha nombrado', weight: 0.30 },
    { id: 'escalamiento_apropiado',      label: 'Escalamiento',                description: 'Sabe cuándo actuar solo vs cuándo llevar el hallazgo a la dirección', weight: 0.30 },
    { id: 'propuesta_con_solución',      label: 'Propuesta con solución',      description: 'Lleva una solución propuesta, no solo el problema identificado', weight: 0.40 },
  ],
  s2_ac_q3: [
    { id: 'resiliencia_profesional',     label: 'Resiliencia',                 description: 'No se derrumba ni se resiente ante el rechazo — lo trata como información', weight: 0.35 },
    { id: 'búsqueda_de_retroalimentación', label: 'Búsqueda de retroalimentación', description: 'Busca entender el motivo del rechazo para aprender', weight: 0.35 },
    { id: 'persistencia_adaptativa',     label: 'Persistencia adaptativa',     description: 'Encuentra otro momento, canal o forma de llevar la propuesta', weight: 0.30 },
  ],

  // ── Sección 2 Redes: Actitud ─────────────────────────────────────────────
  s2_re_q1: [
    { id: 'calma_y_profesionalismo',     label: 'Calma y profesionalismo',     description: 'Responde con ecuanimidad, sin ponerse a la defensiva', weight: 0.30 },
    { id: 'criterio_institucional',      label: 'Criterio institucional',      description: 'Distingue crítica válida de ruido — sabe cuándo la crítica es procedente', weight: 0.35 },
    { id: 'acción_correctiva_concreta',  label: 'Acción correctiva',           description: 'Toma pasos reales para remediar la situación, con o sin indicación', weight: 0.35 },
  ],
  s2_re_q2: [
    { id: 'diagnóstico_previo',          label: 'Diagnóstico previo',          description: 'Entiende el por qué de la baja participación antes de proponer soluciones', weight: 0.30 },
    { id: 'estrategia_concreta',         label: 'Estrategia concreta',         description: 'Propone tácticas específicas, no solo "haría contenido más atractivo"', weight: 0.45 },
    { id: 'métricas_de_éxito',           label: 'Métricas de éxito',           description: 'Define cómo sabría si la estrategia funcionó', weight: 0.25 },
  ],
  s2_re_q3: [
    { id: 'iniciativa_relacional',       label: 'Iniciativa relacional',       description: 'Actúa sin que nadie se lo pida — detecta y resuelve proactivamente', weight: 0.35 },
    { id: 'protocolo_institucional',     label: 'Protocolo institucional',     description: 'Informa a la dirección antes de actuar por cuenta propia', weight: 0.35 },
    { id: 'empatía_y_diplomacia',        label: 'Empatía y diplomacia',        description: 'Maneja la situación con tacto hacia ambas partes', weight: 0.30 },
  ],

  // ── Sección 3: Responsabilidad ───────────────────────────────────────────
  s3_q1: [
    { id: 'sistema_de_gestión_real',     label: 'Sistema de gestión',          description: 'Tiene un sistema real (herramientas, métodos) — no "me organizaré bien"', weight: 0.40 },
    { id: 'priorización',               label: 'Priorización',                description: 'Sabe qué cede y qué no cuando hay conflicto de demandas', weight: 0.35 },
    { id: 'especificidad_temporal',      label: 'Especificidad temporal',      description: 'Da asignaciones concretas de tiempo — no solo intenciones', weight: 0.25 },
  ],
  s3_q2: [
    { id: 'honestidad_narrativa',        label: 'Honestidad narrativa',        description: 'Comparte una historia real y específica, no la evade ni la minimiza', weight: 0.35 },
    { id: 'responsabilidad_sin_excusas', label: 'Responsabilidad sin excusas', description: 'Asume la falla sin culpar a factores externos ni a terceros', weight: 0.35 },
    { id: 'aprendizaje_demostrable',     label: 'Aprendizaje demostrable',     description: 'Muestra un cambio real de comportamiento posterior — no solo dice "aprendí"', weight: 0.30 },
  ],
  s3_q3: [
    { id: 'decisión_clara',              label: 'Decisión clara',              description: 'Toma una decisión definida, no una respuesta "depende" que evita comprometerse', weight: 0.35 },
    { id: 'comunicación_proactiva',      label: 'Comunicación proactiva',      description: 'Informa a los involucrados correctos, antes de que el plazo llegue', weight: 0.35 },
    { id: 'criterio_de_priorización',   label: 'Criterio de priorización',    description: 'Justifica la decisión con razonamiento claro, no intuición vaga', weight: 0.30 },
  ],
  s3_q4: [
    { id: 'anticipación_al_plazo',       label: 'Anticipación',                description: 'Comunica el problema antes del vencimiento, no cuando ya falló', weight: 0.40 },
    { id: 'claridad_del_protocolo',      label: 'Claridad del protocolo',      description: 'Sabe exactamente a quién avisar y cómo — no es vago sobre el proceso', weight: 0.30 },
    { id: 'ownership_de_la_solución',   label: 'Ownership de la solución',    description: 'No solo informa: tiene un plan para resolver el pendiente', weight: 0.30 },
  ],

  // ── Sección 4 Académico: Competencias ────────────────────────────────────
  s4_ac_q1: [
    { id: 'dominio_específico_y_real',   label: 'Dominio específico',          description: 'Cita áreas concretas reales — no "tengo habilidades en todo"', weight: 0.45 },
    { id: 'relevancia_para_el_programa', label: 'Relevancia para el programa', description: 'La experiencia es aplicable directamente a Ingeniería Industrial UTP', weight: 0.35 },
    { id: 'profundidad_técnica',         label: 'Profundidad técnica',         description: 'Va más allá de mencionar el área — da detalles de qué puede hacer', weight: 0.20 },
  ],
  s4_ac_q2: [
    { id: 'diagnóstico_antes_de_solución', label: 'Diagnóstico previo',        description: 'No salta a la solución sin entender el problema primero', weight: 0.25 },
    { id: 'rigor_metodológico',          label: 'Rigor metodológico',          description: 'Tiene un proceso estructurado, no pasos al azar', weight: 0.35 },
    { id: 'validación_y_ajuste',         label: 'Validación y ajuste',         description: 'Incluye ciclo de retroalimentación / iteración en el proceso', weight: 0.25 },
    { id: 'comunicación_del_resultado',  label: 'Comunicación del resultado',  description: 'Contempla cómo presentar el resultado a la dirección del programa', weight: 0.15 },
  ],
  s4_ac_q3: [
    { id: 'herramientas_específicas',    label: 'Herramientas específicas',    description: 'Nombra herramientas/metodologías reales y aplicables', weight: 0.40 },
    { id: 'diagnóstico_de_brechas',      label: 'Diagnóstico de brechas',      description: 'Entiende qué falta o qué no se aprovecha bien en el programa', weight: 0.35 },
    { id: 'plan_de_implementación',      label: 'Plan de implementación',      description: 'Describe cómo las introduciría — no solo las menciona', weight: 0.25 },
  ],
  s4_ac_q4: [
    { id: 'métricas_definidas',          label: 'Métricas definidas',          description: 'Propone indicadores concretos y medibles, no "sabré si funciona"', weight: 0.40 },
    { id: 'línea_base_y_comparación',    label: 'Línea base',                  description: 'Entiende que se necesita comparar contra algo para medir impacto', weight: 0.30 },
    { id: 'reporte_a_la_dirección',      label: 'Rendición de cuentas',        description: 'Contempla comunicar resultados formalmente a quien corresponde', weight: 0.30 },
  ],

  // ── Sección 1 nuevas ─────────────────────────────────────────────────────
  s1_q4: [
    { id: 'madurez_ante_frustración',    label: 'Madurez ante frustración',    description: 'Reconoce el problema sin paralizarse — responde con acción, no con queja', weight: 0.40 },
    { id: 'comunicación_con_dirección',  label: 'Comunicación proactiva',      description: 'Sabe que lo correcto es comunicar el problema a quien corresponde, no cargarlo solo', weight: 0.35 },
    { id: 'adaptabilidad',              label: 'Adaptabilidad',               description: 'Puede pivotar o redefinir su aporte cuando la situación lo exige', weight: 0.25 },
  ],
  s1_q5: [
    { id: 'visión_de_impacto_concreto',  label: 'Visión de impacto',           description: 'Define un impacto específico y verificable, no vago como "haber ayudado"', weight: 0.45 },
    { id: 'indicadores_de_éxito',        label: 'Indicadores de éxito',        description: 'Propone métricas reales para medir si lo logró', weight: 0.35 },
    { id: 'realismo_del_impacto',        label: 'Realismo',                    description: 'Lo que propone es alcanzable dentro del período de monitoria', weight: 0.20 },
  ],

  // ── Sección 2 Académico nuevas ───────────────────────────────────────────
  s2_ac_q4: [
    { id: 'metodología_de_recolección',  label: 'Metodología de recolección',  description: 'Tiene un proceso sistemático para recopilar información dispersa — no improvisa', weight: 0.35 },
    { id: 'organización_y_síntesis',     label: 'Organización y síntesis',     description: 'Sabe organizar, clasificar y sintetizar información en algo utilizable', weight: 0.35 },
    { id: 'utilidad_del_producto_final', label: 'Utilidad del producto',       description: 'Sabe qué hacer con la información consolidada: presentarla, documentarla, proponer acciones', weight: 0.30 },
  ],
  s2_ac_q5: [
    { id: 'identificación_y_validación', label: 'Identificación y validación', description: 'No asume — valida que el problema es real antes de actuar', weight: 0.35 },
    { id: 'estrategia_sin_conflicto',    label: 'Estrategia sin conflicto',    description: 'Sabe cómo plantear la problemática sin que parezca una crítica a la gestión actual', weight: 0.35 },
    { id: 'propuesta_de_solución',       label: 'Propuesta de solución',       description: 'Llega con alternativas, no solo con el problema identificado', weight: 0.30 },
  ],

  // ── Sección 2 Redes nuevas ───────────────────────────────────────────────
  s2_re_q4: [
    { id: 'posicionamiento_claro',       label: 'Posicionamiento claro',       description: 'Tiene una posición definida sobre lo que es o no es apropiado publicar', weight: 0.40 },
    { id: 'comunicación_asertiva',       label: 'Comunicación asertiva',       description: 'Expresa el desacuerdo profesionalmente sin generar conflicto', weight: 0.35 },
    { id: 'respeto_a_la_autoridad',      label: 'Respeto a la autoridad',      description: 'Finalmente acata si la dirección insiste, haciendo constar su posición', weight: 0.25 },
  ],
  s2_re_q5: [
    { id: 'proceso_estructurado',        label: 'Proceso estructurado',        description: 'Tiene un flujo real de trabajo: recolección → decisión → producción → programación', weight: 0.35 },
    { id: 'criterio_editorial',          label: 'Criterio editorial',          description: 'Toma decisiones conscientes sobre qué publicar y qué no — no es aleatorio', weight: 0.35 },
    { id: 'ejecución_y_programación',   label: 'Ejecución y programación',    description: 'Sabe cómo producir y programar contenido con herramientas reales', weight: 0.30 },
  ],

  // ── Sección 3 nuevas ─────────────────────────────────────────────────────
  s3_q5: [
    { id: 'honestidad_real',             label: 'Honestidad real',             description: 'Comparte una debilidad genuina, no una fortaleza disfrazada de debilidad', weight: 0.45 },
    { id: 'autoconciencia',             label: 'Autoconciencia',              description: 'Entiende cómo esa debilidad afecta su desempeño concreto', weight: 0.30 },
    { id: 'trabajo_sobre_la_debilidad', label: 'Trabajo activo',              description: 'Ha tomado pasos concretos para mejorar, no solo la ha identificado', weight: 0.25 },
  ],
  s3_q6: [
    { id: 'transparencia_proactiva',     label: 'Transparencia proactiva',     description: 'Revela el error antes de que sea descubierto — no espera', weight: 0.45 },
    { id: 'responsabilidad_sin_excusas', label: 'Responsabilidad sin excusas', description: 'Asume el error sin minimizarlo ni buscar culpables externos', weight: 0.30 },
    { id: 'corrección_con_plan',         label: 'Plan de corrección',          description: 'Tiene un plan concreto para corregir y evitar que se repita', weight: 0.25 },
  ],

  // ── Sección 4 Académico nuevas ───────────────────────────────────────────
  s4_ac_q5: [
    { id: 'documentación_sistemática',   label: 'Documentación sistemática',   description: 'Tiene un enfoque real de documentación — herramientas, estructura, lugar de almacenamiento', weight: 0.40 },
    { id: 'utilidad_para_el_sucesor',    label: 'Utilidad para el sucesor',    description: 'Piensa en la experiencia de quien continúe, no solo en dejar algo registrado', weight: 0.35 },
    { id: 'formalidad_y_accesibilidad', label: 'Formalidad y acceso',         description: 'El material es accesible y organizado, no notas dispersas o difíciles de encontrar', weight: 0.25 },
  ],
  s4_ac_q6: [
    { id: 'problemática_real_específica', label: 'Problemática real',          description: 'Nombra un problema específico y real del programa, no una generalidad', weight: 0.40 },
    { id: 'investigación_y_evidencia',   label: 'Investigación y evidencia',   description: 'Sabe cómo validar la problemática con datos o evidencia observable', weight: 0.30 },
    { id: 'presentación_constructiva',   label: 'Presentación constructiva',   description: 'La enmarca como oportunidad de mejora, no como crítica — con propuesta de acción', weight: 0.30 },
  ],

  // ── Sección 4 Redes nuevas ───────────────────────────────────────────────
  s4_re_q5: [
    { id: 'concepto_creativo_específico', label: 'Concepto creativo',          description: 'Tiene un concepto concreto para la campaña, no solo "haría contenido sobre eso"', weight: 0.35 },
    { id: 'formatos_y_plataformas',       label: 'Formatos y plataformas',     description: 'Especifica formatos apropiados para Instagram/Facebook: reels, carruseles, stories, etc.', weight: 0.35 },
    { id: 'mensaje_clave_articulado',    label: 'Mensaje clave',               description: 'Puede articular el mensaje central de la campaña con claridad', weight: 0.30 },
  ],
  s4_re_q6: [
    { id: 'estrategia_de_crowdsourcing', label: 'Estrategia de crowdsourcing', description: 'Tiene mecanismos reales para que otros le provean contenido sin carga excesiva', weight: 0.40 },
    { id: 'facilidad_para_el_contribuidor', label: 'Facilidad de contribución', description: 'El proceso es simple para quien contribuye — bajo esfuerzo, alta recompensa', weight: 0.35 },
    { id: 'sostenibilidad_del_flujo',    label: 'Sostenibilidad',              description: 'El mecanismo funciona de forma continua, no solo al inicio de la monitoria', weight: 0.25 },
  ],

  // ── Sección 4 Redes: Competencias ────────────────────────────────────────
  s4_re_q1: [
    { id: 'auditoría_inicial_sistemática', label: 'Auditoría inicial',         description: 'Diagnostica antes de proponer — revisa el estado real de las cuentas', weight: 0.30 },
    { id: 'plan_30_días_concreto',       label: 'Plan 30 días concreto',       description: 'Propone acciones específicas y priorizadas para el primer mes', weight: 0.35 },
    { id: 'contenido_propio_vs_replicado', label: 'Contenido propio',          description: 'Entiende el problema raíz (sin contenido original) y propone resolverlo', weight: 0.35 },
  ],
  s4_re_q2: [
    { id: 'narrativa_institucional',     label: 'Narrativa institucional',     description: 'Entiende la historia única del programa y cómo convertirla en contenido', weight: 0.25 },
    { id: 'formatos_específicos',        label: 'Formatos específicos',        description: 'Nombra formatos concretos: reels, carruseles, stories, posts, etc.', weight: 0.30 },
    { id: 'tono_e_identidad_editorial', label: 'Tono e identidad',            description: 'Define el tono y la identidad visual/editorial del programa', weight: 0.25 },
    { id: 'frecuencia_y_consistencia',   label: 'Frecuencia y consistencia',   description: 'Propone una cadencia de publicación realista y sostenible', weight: 0.20 },
  ],
  s4_re_q3: [
    { id: 'criterio_institucional_articulado', label: 'Criterio institucional', description: 'Articula claramente qué es y qué no es aceptable desde las cuentas del programa', weight: 0.40 },
    { id: 'ejemplos_concretos',          label: 'Ejemplos concretos',          description: 'Da ejemplos reales de lo aceptable y lo inaceptable — no solo principios abstractos', weight: 0.35 },
    { id: 'comprensión_de_consecuencias', label: 'Consecuencias del mal uso', description: 'Entiende por qué esto importa: reputación, confianza, impacto institucional', weight: 0.25 },
  ],
  s4_re_q4: [
    { id: 'métricas_específicas_redes',  label: 'Métricas de redes',           description: 'Nombra métricas reales: alcance, engagement, seguidores, impresiones, etc.', weight: 0.35 },
    { id: 'formato_de_informe',          label: 'Formato de informe',          description: 'Tiene en mente una estructura de reporte clara para la dirección', weight: 0.30 },
    { id: 'frecuencia_de_rendición',     label: 'Frecuencia de rendición',     description: 'Propone una cadencia realista de rendición de cuentas', weight: 0.20 },
    { id: 'análisis_cualitativo',        label: 'Análisis cualitativo',        description: 'Va más allá de números — incluye evaluación de calidad del contenido', weight: 0.15 },
  ],
};

// Computa el score 0-100 de una pregunta a partir de los puntajes de sus dimensiones.
// Usa similitud coseno entre el vector de dimensiones y el vector ideal [1,1,...,1],
// multiplicada por la media de las dimensiones para capturar la magnitud.
export function computeQuestionScore(
  questionId: string,
  dimScores: Record<string, number>
): number {
  const dims = RUBRICS[questionId];
  if (!dims?.length) return 0;

  // Weighted scores using predefined weights
  let weightedSum = 0;
  let totalWeight = 0;
  const scores: number[] = [];

  for (const dim of dims) {
    const score = Math.max(0, Math.min(1, dimScores[dim.id] ?? 0));
    weightedSum += dim.weight * score;
    totalWeight += dim.weight;
    scores.push(score);
  }

  if (totalWeight === 0 || scores.length === 0) return 0;

  const mean = weightedSum / totalWeight; // weighted mean (0-1)

  // Cosine similarity between score vector and ideal [1,...,1]
  const n = scores.length;
  const sumD = scores.reduce((a, b) => a + b, 0);
  const sumD2 = scores.reduce((a, b) => a + b * b, 0);
  const cosine = sumD2 === 0 ? 0 : sumD / (Math.sqrt(sumD2) * Math.sqrt(n));

  // Final score: magnitude × balance factor (cosine penalizes coverage gaps)
  return Math.round(mean * cosine * 100);
}
