import { useState } from 'react';
import type { FormEvent } from 'react';
import { authApi } from '../api/domainApi';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import type { User } from '../types';
import { firstMissing } from '../utils/validation';

type Props = {
  user: User;
  onUpdate: (user: User) => void;
};

export function SettingsPage({ user, onUpdate }: Props) {
  const [form, setForm] = useState({
    nombre: user.nombre,
    correo: user.correo,
    current_password: '',
    new_password: '',
  });
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage('');
    const missing = firstMissing(form, ['nombre', 'correo']);
    if (missing) {
      setMessage(missing);
      return;
    }
    try {
      const updated = await authApi.updateMe(form);
      onUpdate(updated);
      setForm({ nombre: updated.nombre, correo: updated.correo, current_password: '', new_password: '' });
      setMessage('Perfil actualizado');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No se pudo actualizar el perfil');
    }
  }

  return (
    <section className="panel full">
      <div className="section-heading">
        <div>
          <h2>Configuración de usuario</h2>
          <p>Actualiza tus datos de acceso y contacto.</p>
        </div>
      </div>

      <form className="form-grid two-columns profile-form" onSubmit={submit}>
        <Field label="Nombre" value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} />
        <Field label="Correo" type="email" value={form.correo} onChange={(event) => setForm({ ...form, correo: event.target.value })} />
        <Field label="Rol" value={user.rol} disabled />
        <span />
        <Field label="Contraseña actual" type="password" value={form.current_password} onChange={(event) => setForm({ ...form, current_password: event.target.value })} />
        <Field label="Nueva contraseña" type="password" value={form.new_password} onChange={(event) => setForm({ ...form, new_password: event.target.value })} />
        {message ? <p className={message.includes('No se') || message.includes('contraseña') ? 'alert error' : 'alert success'}>{message}</p> : null}
        <div className="modal-actions">
          <Button>Guardar perfil</Button>
        </div>
      </form>
    </section>
  );
}
