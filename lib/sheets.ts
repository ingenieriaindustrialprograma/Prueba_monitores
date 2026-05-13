import { normalizeDocument } from './normalize';
import type { ApplicantData } from './types';

const APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL!;
const ADMIN_KEY = process.env.GOOGLE_APPS_SCRIPT_KEY || 'IIUTP2026';

let cache: { data: ApplicantData[]; ts: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 min

async function fetchAllApplicants(): Promise<ApplicantData[]> {
  if (cache && Date.now() - cache.ts < CACHE_TTL) return cache.data;

  const url = `${APPS_SCRIPT_URL}?action=getData&key=${ADMIN_KEY}`;
  const res = await fetch(url, { redirect: 'follow', cache: 'no-store' });
  if (!res.ok) throw new Error(`Apps Script error: ${res.status}`);

  const json = await res.json();
  if (!json.data) throw new Error(json.error ?? 'Respuesta inválida del Apps Script');

  const data: ApplicantData[] = json.data.map((r: Record<string, string>) => ({
    fecha:               r.fecha               ?? '',
    fotoUrl:             r.fotoUrl             ?? '',
    nombres:             r.nombres             ?? '',
    primerApellido:      r.primerApellido      ?? '',
    segundoApellido:     r.segundoApellido     ?? '',
    tipoDocumento:       r.tipoDocumento       ?? '',
    documento:           r.documento           ?? '',
    fechaNacimiento:     r.fechaNacimiento     ?? '',
    codigoEstudiantil:   r.codigoEstudiantil   ?? '',
    correoInstitucional: r.correoInstitucional ?? '',
    correoPersonal:      r.correoPersonal      ?? '',
    telefono:            r.telefono            ?? '',
    direccion:           r.direccion           ?? '',
    programa:            r.programa            ?? '',
    programaOtro:        r.programaOtro        ?? '',
    semestre:            r.semestre            ?? '',
    promedio:            r.promedio            ?? '',
    horasDisponibles:    r.horasDisponibles    ?? '',
    areasInteres:        r.areasInteres        ?? '',
    motivoSolicitud:     r.motivoSolicitud     ?? '',
    monAnterior:         r.monAnterior         ?? '',
    detalleMonAnterior:  r.detalleMonAnterior  ?? '',
    disponibilidad:      r.disponibilidad      ?? '',
    semilleros:          r.semilleros          ?? '',
    proyectos:           r.proyectos           ?? '',
    eventos:             r.eventos             ?? '',
    becas:               r.becas               ?? '',
    tecnologias:         r.tecnologias         ?? '',
    idiomas:             r.idiomas             ?? '',
    expLaboral:          r.expLaboral          ?? '',
    motivacionGeneral:   r.motivacionGeneral   ?? '',
    habilidadesRol:      r.habilidadesRol      ?? '',
    expectativas:        r.expectativas        ?? '',
    tipoMonitoria:       r.tipoMonitoria       ?? '',
  }));

  cache = { data, ts: Date.now() };
  return data;
}

export async function searchByDocument(rawDocument: string): Promise<ApplicantData | null> {
  const normalized = normalizeDocument(rawDocument);
  const all = await fetchAllApplicants();
  return all.find(a => normalizeDocument(a.documento) === normalized) ?? null;
}

export async function getAllApplicants(): Promise<ApplicantData[]> {
  return fetchAllApplicants();
}
