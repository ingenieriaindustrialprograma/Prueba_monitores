import { NextRequest, NextResponse } from 'next/server';
import { searchByDocument } from '@/lib/sheets';

const MOCK_CANDIDATE = {
  documento: '',
  nombres: 'María Camila',
  primerApellido: 'Gómez',
  segundoApellido: 'Ríos',
  tipoDocumento: 'CC',
  fechaNacimiento: '2002-03-15',
  codigoEstudiantil: '1222033456',
  correoInstitucional: 'mcgomez@utp.edu.co',
  correoPersonal: 'mcamila@gmail.com',
  telefono: '3104567890',
  direccion: 'Pereira, Risaralda',
  programa: 'Ingeniería Industrial',
  programaOtro: '',
  semestre: '6',
  promedio: '4.1',
  horasDisponibles: '10',
  areasInteres: 'Simulación, Estadística',
  motivoSolicitud: 'Quiero reforzar mi aprendizaje enseñando a otros estudiantes.',
  monAnterior: 'No',
  detalleMonAnterior: '',
  disponibilidad: 'Lunes y miércoles 2pm-5pm',
  semilleros: '',
  proyectos: '',
  eventos: '',
  becas: '',
  tecnologias: 'Excel, Python, Arena Simulation',
  idiomas: 'Español, Inglés B1',
  expLaboral: '',
  motivacionGeneral: '',
  habilidadesRol: '',
  expectativas: '',
  tipoMonitoria: 'académico',
  fecha: '',
  fotoUrl: '',
  _mock: true,
};

const sheetsConfigured = !!process.env.GOOGLE_APPS_SCRIPT_URL?.startsWith('https://script.google.com');

export async function GET(req: NextRequest) {
  const document = req.nextUrl.searchParams.get('document')?.trim() ?? '';

  if (!document) {
    return NextResponse.json({ error: 'Documento requerido.' }, { status: 400 });
  }

  if (!sheetsConfigured) {
    return NextResponse.json({ ...MOCK_CANDIDATE, documento: document });
  }

  try {
    const applicant = await searchByDocument(document);
    if (!applicant) {
      return NextResponse.json({ error: 'Candidato no encontrado en el formulario.' }, { status: 404 });
    }
    return NextResponse.json(applicant);
  } catch (err) {
    console.error('[sheets/search]', err);
    return NextResponse.json({ error: 'Error al consultar Google Sheets.' }, { status: 500 });
  }
}
