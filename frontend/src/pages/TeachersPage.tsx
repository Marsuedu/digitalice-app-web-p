import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { teachersApi } from '../api/domainApi';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { Modal } from '../components/ui/Modal';
import { useAsyncData } from '../hooks/useAsyncData';
import type { Teacher } from '../types';
import { firstMissing } from '../utils/validation';

const emptyForm = { nombre: '', correo_personal: '', celular: '', carrera: '', pais: 'Bolivia', activo: true };

export function TeachersPage() {
  const { data, loading, error, reload } = useAsyncData(() => teachersApi.list(), []);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Teacher | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');

  const filteredTeachers = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return data ?? [];
    return (data ?? []).filter((teacher) =>
      [teacher.nombre, teacher.correo_personal, teacher.celular, teacher.carrera, teacher.pais, teacher.activo ? 'activo' : 'inactivo']
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(value)),
    );
  }, [data, search]);

  function openCreate() {
    setSelected(null);
    setForm(emptyForm);
    setMessage('');
    setModalOpen(true);
  }

  function openEdit(teacher: Teacher) {
    setSelected(teacher);
    setForm({
      nombre: teacher.nombre,
      correo_personal: teacher.correo_personal,
      celular: teacher.celular,
      carrera: teacher.carrera,
      pais: teacher.pais,
      activo: Boolean(teacher.activo),
    });
    setMessage('');
    setModalOpen(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage('');
    const missing = firstMissing(form, ['nombre', 'correo_personal', 'celular', 'carrera', 'pais']);
    if (missing) {
      setMessage(missing);
      return;
    }
    try {
      if (selected) {
        await teachersApi.update(selected.id, form);
        setMessage('Docente actualizado');
      } else {
        await teachersApi.create(form);
        setMessage('Docente registrado');
      }
      await reload();
      setTimeout(() => setModalOpen(false), 350);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No se pudo guardar');
    }
  }

  async function deactivate(teacher: Teacher) {
    const confirmed = window.confirm(`¿Desactivar a ${teacher.nombre}?`);
    if (!confirmed) return;
    await teachersApi.deactivate(teacher.id);
    await reload();
  }

  return (
    <section className="panel full">
      <div className="section-heading">
        <div>
          <h2>Docentes</h2>
          <p>Administra docentes activos y sus datos de contacto.</p>
        </div>
        <Button onClick={openCreate}>Nuevo docente</Button>
      </div>

      <div className="toolbar">
        <Field
          label="Buscar docente"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Nombre, correo, especialidad, país o celular..."
        />
      </div>

      {loading ? <p className="muted">Cargando...</p> : null}
      {error ? <p className="alert error">{error}</p> : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Especialidad</th>
              <th>País</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeachers.map((teacher) => (
              <tr key={teacher.id}>
                <td>{teacher.nombre}</td>
                <td>{teacher.correo_personal}</td>
                <td>{teacher.carrera}</td>
                <td>{teacher.pais}</td>
                <td><span className="status">{teacher.activo ? 'ACTIVO' : 'INACTIVO'}</span></td>
                <td>
                  <div className="row-actions">
                    <Button variant="ghost" onClick={() => openEdit(teacher)}>Editar</Button>
                    <Button variant="danger" onClick={() => deactivate(teacher)}>Desactivar</Button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filteredTeachers.length === 0 ? (
              <tr>
                <td colSpan={6}>No se encontraron docentes con ese criterio.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Modal title={selected ? 'Editar docente' : 'Nuevo docente'} open={modalOpen} onClose={() => setModalOpen(false)} size="lg">
        <form className="form-grid two-columns" onSubmit={submit}>
          <Field label="Nombre completo" value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} />
          <Field label="Correo personal" type="email" value={form.correo_personal} onChange={(event) => setForm({ ...form, correo_personal: event.target.value })} />
          <Field label="Celular" value={form.celular} onChange={(event) => setForm({ ...form, celular: event.target.value })} />
          <Field label="Especialidad" value={form.carrera} onChange={(event) => setForm({ ...form, carrera: event.target.value })} />
          <Field label="País" value={form.pais} onChange={(event) => setForm({ ...form, pais: event.target.value })} />
          <label className="check-row">
            <input type="checkbox" checked={form.activo} onChange={(event) => setForm({ ...form, activo: event.target.checked })} />
            <span>Docente activo</span>
          </label>
          {message ? <p className={message.includes('No se') ? 'alert error' : 'alert success'}>{message}</p> : null}
          <div className="modal-actions">
            <Button>{selected ? 'Guardar cambios' : 'Registrar docente'}</Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
