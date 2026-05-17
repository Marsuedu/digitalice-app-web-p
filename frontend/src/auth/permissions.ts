import type { UserRole } from '../types';
import type { PageKey } from '../components/layout/AppLayout';

const rolePages: Record<UserRole, PageKey[]> = {
  Admin: ['dashboard', 'productos', 'estudiantes', 'docentes', 'inscripciones', 'pagos', 'notas', 'matriculados', 'configuracion'],
  Coordinador: ['dashboard', 'productos', 'estudiantes', 'docentes', 'inscripciones', 'pagos', 'notas', 'matriculados', 'configuracion'],
  Docente: ['dashboard', 'notas', 'configuracion'],
  Estudiante: ['dashboard', 'configuracion'],
};

export function pagesForRole(role: UserRole): PageKey[] {
  return rolePages[role] ?? ['dashboard', 'configuracion'];
}

export function canAccessPage(role: UserRole, page: PageKey): boolean {
  return pagesForRole(role).includes(page);
}
