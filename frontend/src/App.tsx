import { useEffect, useState } from 'react';
import { authApi } from './api/domainApi';
import { canAccessPage } from './auth/permissions';
import { AppLayout, type PageKey } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { EnrollmentReportPage } from './pages/EnrollmentReportPage';
import { EnrollmentsPage } from './pages/EnrollmentsPage';
import { LoginPage } from './pages/LoginPage';
import { NotesPage } from './pages/NotesPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { ProductsPage } from './pages/ProductsPage';
import { SettingsPage } from './pages/SettingsPage';
import { StudentsPage } from './pages/StudentsPage';
import { TeachersPage } from './pages/TeachersPage';
import type { User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState<PageKey>('dashboard');
  const [paymentEnrollmentId, setPaymentEnrollmentId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi
      .me()
      .then((currentUser) => setUser(currentUser))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user && !canAccessPage(user.rol, page)) {
      setPage('dashboard');
      setPaymentEnrollmentId('');
    }
  }, [page, user]);

  async function logout() {
    await authApi.logout();
    setUser(null);
  }

  function openPayments(enrollmentId: string) {
    if (!user || !canAccessPage(user.rol, 'pagos')) return;
    setPaymentEnrollmentId(enrollmentId);
    setPage('pagos');
  }

  if (loading) {
    return <main className="loading-screen">Cargando DIGITALICE...</main>;
  }

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  return (
    <AppLayout user={user} activePage={page} onNavigate={setPage} onLogout={logout}>
      {page === 'dashboard' ? <DashboardPage user={user} /> : null}
      {page === 'productos' && canAccessPage(user.rol, 'productos') ? <ProductsPage /> : null}
      {page === 'estudiantes' && canAccessPage(user.rol, 'estudiantes') ? <StudentsPage /> : null}
      {page === 'docentes' && canAccessPage(user.rol, 'docentes') ? <TeachersPage /> : null}
      {page === 'inscripciones' && canAccessPage(user.rol, 'inscripciones') ? <EnrollmentsPage onOpenPayments={openPayments} user={user} /> : null}
      {page === 'pagos' && canAccessPage(user.rol, 'pagos') ? <PaymentsPage initialEnrollmentId={paymentEnrollmentId} user={user} /> : null}
      {page === 'notas' && canAccessPage(user.rol, 'notas') ? <NotesPage /> : null}
      {page === 'matriculados' && canAccessPage(user.rol, 'matriculados') ? <EnrollmentReportPage /> : null}
      {page === 'configuracion' ? <SettingsPage user={user} onUpdate={setUser} /> : null}
    </AppLayout>
  );
}
