import { apiRequest } from './httpClient';
import type { DashboardData, Enrollment, EnrollmentReport, NotesCourse, NotesStudent, PaymentAccount, Product, Student, Teacher, User } from '../types';

export const authApi = {
  login: (correo: string, password: string) =>
    apiRequest<User>('/auth/login', { method: 'POST', body: JSON.stringify({ correo, password }) }),
  me: () => apiRequest<User | null>('/auth/me'),
  updateMe: (payload: unknown) => apiRequest<User>('/auth/me', { method: 'PATCH', body: JSON.stringify(payload) }),
  logout: () => apiRequest<null>('/auth/logout', { method: 'POST' }),
};

export const dashboardApi = {
  metrics: () => apiRequest<DashboardData>('/dashboard'),
};

export const productsApi = {
  list: () => apiRequest<Product[]>('/productos-academicos'),
  get: (id: string) => apiRequest<Product>(`/productos-academicos/${id}`),
  create: (payload: unknown) => apiRequest<Product>('/productos-academicos', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: string, payload: unknown) => apiRequest<Product>(`/productos-academicos/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deactivate: (id: string) => apiRequest<Product>(`/productos-academicos/${id}`, { method: 'DELETE' }),
  addModule: (id: string, payload: unknown) => apiRequest<Product>(`/productos-academicos/${id}/modulos`, { method: 'POST', body: JSON.stringify(payload) }),
  updateModule: (id: string, moduleId: string, payload: unknown) =>
    apiRequest<Product>(`/productos-academicos/${id}/modulos/${moduleId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteModule: (id: string, moduleId: string) => apiRequest<Product>(`/productos-academicos/${id}/modulos/${moduleId}`, { method: 'DELETE' }),
};

export const studentsApi = {
  list: () => apiRequest<Student[]>('/estudiantes'),
  create: (payload: unknown) => apiRequest<Student>('/estudiantes', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: string, payload: unknown) => apiRequest<Student>(`/estudiantes/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deactivate: (id: string) => apiRequest<Student>(`/estudiantes/${id}`, { method: 'DELETE' }),
};

export const teachersApi = {
  list: () => apiRequest<Teacher[]>('/docentes'),
  create: (payload: unknown) => apiRequest<Teacher>('/docentes', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: string, payload: unknown) => apiRequest<Teacher>(`/docentes/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deactivate: (id: string) => apiRequest<Teacher>(`/docentes/${id}`, { method: 'DELETE' }),
};

export const enrollmentsApi = {
  list: () => apiRequest<Enrollment[]>('/inscripciones'),
  create: (payload: unknown) => apiRequest<Enrollment>('/inscripciones', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: string, payload: unknown) => apiRequest<Enrollment>(`/inscripciones/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  delete: (id: string) => apiRequest<Enrollment>(`/inscripciones/${id}`, { method: 'DELETE' }),
};

export const paymentsApi = {
  byEnrollment: (id: string) => apiRequest<PaymentAccount>(`/pagos/inscripcion/${id}`),
  register: (id: string, payload: unknown) => apiRequest<Record<string, string>>(`/pagos/${id}/registrar`, { method: 'POST', body: JSON.stringify(payload) }),
  delete: (id: string) => apiRequest<Record<string, string>>(`/pagos/${id}`, { method: 'DELETE' }),
};

export const notesApi = {
  courses: () => apiRequest<NotesCourse[]>('/notas/cursos'),
  students: (productModuleId: string) => apiRequest<NotesStudent[]>(`/notas/cursos/${productModuleId}/alumnos`),
  save: (inscriptionModuleId: string, nota: number) =>
    apiRequest<Record<string, string>>('/notas', { method: 'POST', body: JSON.stringify({ inscripcion_modulo_id: inscriptionModuleId, nota }) }),
};

export const reportsApi = {
  enrolledStudents: () => apiRequest<EnrollmentReport>('/reportes/matriculados'),
};
