import { useState } from 'react';
import type { FormEvent } from 'react';
import { authApi } from '../api/domainApi';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import type { User } from '../types';
import { firstMissing } from '../utils/validation';

type Props = {
  onLogin: (user: User) => void;
};

export function LoginPage({ onLogin }: Props) {
  const [correo, setCorreo] = useState('admin@digitalice.local');
  const [password, setPassword] = useState('Admin123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const missing = firstMissing({ correo, password }, ['correo', 'password']);
    if (missing) {
      setError(missing);
      setLoading(false);
      return;
    }
    try {
      onLogin(await authApi.login(correo, password));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-copy">
          <span className="brand-mark">DI</span>
          <h1>DIGITALICE</h1>
          <p>Gestión académica, inscripciones, notas y pagos en una sola plataforma.</p>
        </div>
        <form className="login-form" onSubmit={submit}>
          <h2>Ingreso</h2>
          <Field label="Correo" value={correo} onChange={(event) => setCorreo(event.target.value)} />
          <Field label="Contraseña" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          {error ? <p className="alert error">{error}</p> : null}
          <Button disabled={loading}>{loading ? 'Ingresando...' : 'Entrar'}</Button>
        </form>
      </section>
    </main>
  );
}
