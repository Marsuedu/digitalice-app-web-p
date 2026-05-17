import type { PropsWithChildren } from 'react';
import { pagesForRole } from '../../auth/permissions';
import type { User } from '../../types';
import { Icon } from '../ui/Icon';

export type PageKey = 'dashboard' | 'productos' | 'estudiantes' | 'docentes' | 'inscripciones' | 'pagos' | 'notas' | 'matriculados' | 'configuracion';

const pages: Array<{ key: PageKey; label: string; icon: Parameters<typeof Icon>[0]['name'] }> = [
  { key: 'dashboard', label: 'Panel', icon: 'dashboard' },
  { key: 'productos', label: 'Productos', icon: 'products' },
  { key: 'estudiantes', label: 'Estudiantes', icon: 'students' },
  { key: 'docentes', label: 'Docentes', icon: 'teachers' },
  { key: 'inscripciones', label: 'Inscripciones', icon: 'enrollments' },
  { key: 'pagos', label: 'Pagos', icon: 'payments' },
  { key: 'notas', label: 'Notas', icon: 'chart' },
  { key: 'matriculados', label: 'Matriculados', icon: 'students' },
];

type Props = PropsWithChildren<{
  user: User;
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
  onLogout: () => void;
}>;

export function AppLayout({ user, activePage, onNavigate, onLogout, children }: Props) {
  const availablePages = pages.filter((page) => pagesForRole(user.rol).includes(page.key));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">DI</span>
          <strong>DIGITALICE</strong>
        </div>

        <nav className="nav">
          {availablePages.map((page) => (
            <button className={activePage === page.key ? 'active' : ''} key={page.key} onClick={() => onNavigate(page.key)}>
              <Icon name={page.icon} />
              {page.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <small>{user.rol}</small>
            <h1>{pageTitle(activePage)}</h1>
          </div>
          <details className="user-menu">
            <summary>{user.nombre}</summary>
            <div className="user-menu-panel">
              <button type="button" onClick={() => onNavigate('configuracion')}>
                <Icon name="settings" />
                Configuración
              </button>
              <button type="button" onClick={onLogout}>Salir</button>
            </div>
          </details>
        </header>
        {children}
      </main>
    </div>
  );
}

function pageTitle(page: PageKey) {
  const titles: Record<PageKey, string> = {
    dashboard: 'Panel operativo',
    productos: 'Productos académicos',
    estudiantes: 'Estudiantes',
    docentes: 'Docentes',
    inscripciones: 'Inscripciones',
    pagos: 'Pagos',
    notas: 'Registro de notas',
    matriculados: 'Matriculados por curso',
    configuracion: 'Configuración',
  };

  return titles[page];
}
