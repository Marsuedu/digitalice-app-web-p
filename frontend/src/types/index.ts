export type UserRole = 'Admin' | 'Coordinador' | 'Docente' | 'Estudiante';

export type User = {
  id: string;
  nombre: string;
  correo: string;
  rol: UserRole;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string>;
};

export type ProductType = 'CURSO' | 'CURSO_EXPERTO' | 'DIPLOMADO';
export type ProductStatus = 'POR_INICIAR' | 'ACTIVO' | 'FINALIZADO';

export type Product = {
  id: string;
  codigo: string;
  nombre: string;
  tipo: ProductType;
  num_modulos: number;
  institucion: string;
  activo: boolean;
  estado?: ProductStatus;
  monto_referencial?: string | null;
  modulos?: Array<{
    producto_modulo_id: string;
    numero_modulo: number;
    codigo_slot: string;
    modulo_id: string;
    nombre_oficial: string;
    docente_id?: string | null;
    docente?: string | null;
    inscripciones_count?: string | number;
  }>;
};

export type Student = {
  id: string;
  nombres: string;
  apellidos: string;
  ci: string;
  extension_ci: string;
  celular: string;
  correo: string;
  activo: boolean;
};

export type Teacher = {
  id: string;
  nombre: string;
  correo_personal: string;
  celular: string;
  carrera: string;
  pais: string;
  activo: boolean;
};

export type Enrollment = {
  id: string;
  estudiante_id: string;
  producto_id: string;
  estudiante: string;
  ci?: string;
  extension_ci?: string;
  celular?: string;
  correo?: string;
  producto: string;
  producto_codigo?: string;
  institucion: string;
  paralelo: string;
  estado: string;
  metodo_pago: string;
  monto_base?: string;
  descuento?: string;
  monto_total: string;
  comprometido_pago: string;
  saldo_pendiente: string;
  total_pagado: string;
  cuotas_total: string;
  cuotas_pagadas: string;
  cuotas_pendientes: string;
  fecha_inscripcion: string;
};

export type PaymentAccount = {
  inscripcion: {
    id: string;
    estudiante: string;
    ci: string;
    extension_ci: string;
    celular: string;
    correo: string;
    producto: string;
    producto_codigo: string;
    institucion: string;
    metodo_pago: string;
    paralelo: string;
  } | null;
  resumen: {
    total: number;
    pagado: number;
    saldo: number;
    cuotas_total: number;
    cuotas_pagadas: number;
    cuotas_pendientes: number;
  };
  pagos: Array<Record<string, string>>;
};

export type DashboardData = {
  perfil?: UserRole;
  metricas: Record<string, number>;
  recaudacion_por_curso: Array<{
    codigo: string;
    nombre: string;
    institucion: string;
    total: string;
  }>;
  recaudacion_por_institucion: Array<{
    institucion: string;
    total: string;
  }>;
  deuda_por_institucion: Array<{
    institucion: string;
    total: string;
  }>;
  inscripciones_por_estado: Array<{
    label: string;
    total: string;
  }>;
  pagos_por_estado: Array<{
    label: string;
    total: string;
  }>;
  inscripciones_por_tipo_producto: Array<{
    label: string;
    total: string;
  }>;
  matriculas_por_dia: Array<{
    periodo: string;
    label: string;
    total: number;
  }>;
  matriculas_por_mes: Array<{
    periodo: string;
    label: string;
    total: number;
  }>;
  cursos_estudiante?: Array<Record<string, string>>;
  proximos_pagos?: Array<Record<string, string>>;
  modulos_por_estado?: Array<{
    label: string;
    total: string;
  }>;
  cursos_docente?: Array<Record<string, string>>;
};

export type NotesCourse = {
  producto_modulo_id: string;
  numero_modulo: string;
  codigo_slot: string;
  producto_codigo: string;
  producto: string;
  institucion: string;
  modulo: string;
  docente?: string | null;
  estudiantes: string;
  pendientes: string;
  calificados: string;
};

export type NotesStudent = {
  inscripcion_modulo_id: string;
  nota?: string | null;
  estado: string;
  inscripcion_id: string;
  nombres: string;
  apellidos: string;
  ci: string;
  extension_ci: string;
  correo: string;
  celular: string;
  producto_codigo: string;
  producto: string;
  institucion: string;
  numero_modulo: string;
  modulo: string;
};

export type EnrollmentReportSummary = {
  producto_id: string;
  codigo: string;
  nombre: string;
  institucion: string;
  matriculados: string;
  total_ingresos: string;
  total_pagado: string;
  total_por_recaudar: string;
};

export type EnrollmentReportStudent = {
  inscripcion_id: string;
  estado_inscripcion: string;
  monto_total: string;
  fecha_inscripcion: string;
  nombres: string;
  apellidos: string;
  ci: string;
  extension_ci: string;
  correo: string;
  celular: string;
  producto_codigo: string;
  producto: string;
  institucion: string;
  total_pagado: string;
  deuda: string;
  cuotas_pendientes: string;
};

export type EnrollmentReport = {
  resumen: EnrollmentReportSummary[];
  alumnos: EnrollmentReportStudent[];
};
