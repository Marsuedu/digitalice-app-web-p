import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { studentsApi } from '../api/domainApi';
import { Button } from '../components/ui/Button';
import { Field, SelectField } from '../components/ui/Field';
import { Modal } from '../components/ui/Modal';
import { useAsyncData } from '../hooks/useAsyncData';
import type { Student } from '../types';
import { firstMissing } from '../utils/validation';

const emptyForm = { nombres: '', apellidos: '', ci: '', extension_ci: 'LP', celular: '', correo: '', activo: true };

export function StudentsPage() {
  const { data, loading, error, reload } = useAsyncData(() => studentsApi.list(), []);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Student | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');

  const filteredStudents = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return data ?? [];
    return (data ?? []).filter((student) =>
      [student.nombres, student.apellidos, student.ci, student.extension_ci, student.correo, student.celular, student.activo ? 'activo' : 'inactivo']
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

  function openEdit(student: Student) {
    setSelected(student);
    setForm({
      nombres: student.nombres,
      apellidos: student.apellidos,
      ci: student.ci,
      extension_ci: student.extension_ci,
      celular: student.celular,
      correo: student.correo,
      activo: Boolean(student.activo),
    });
    setMessage('');
    setModalOpen(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage('');
    const missing = firstMissing(form, ['nombres', 'apellidos', 'ci', 'extension_ci', 'celular', 'correo']);
    if (missing) {
      setMessage(missing);
      return;
    }
    try {
      if (selected) {
        await studentsApi.update(selected.id, form);
        setMessage('Estudiante actualizado');
      } else {
        await studentsApi.create(form);
        setMessage('Estudiante registrado');
      }
      await reload();
      setTimeout(() => setModalOpen(false), 350);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No se pudo guardar');
    }
  }

  async function deactivate(student: Student) {
    const confirmed = window.confirm(`¿Desactivar a ${student.nombres} ${student.apellidos}?`);
    if (!confirmed) return;
    await studentsApi.deactivate(student.id);
    await reload();
  }

  return (
    <section className="panel full">
      <div className="section-heading">
        <div>
          <h2>Estudiantes</h2>
          <p>Registra y mantiene la ficha principal del estudiante.</p>
        </div>
        <Button onClick={openCreate}>Nuevo estudiante</Button>
      </div>

      <div className="toolbar">
        <Field
          label="Buscar estudiante"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Nombre, apellido, CI, correo o WhatsApp..."
        />
      </div>

      {loading ? <p className="muted">Cargando...</p> : null}
      {error ? <p className="alert error">{error}</p> : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>CI</th>
              <th>Correo</th>
              <th>WhatsApp</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student.id}>
                <td>{student.nombres} {student.apellidos}</td>
                <td>{student.ci} {student.extension_ci}</td>
                <td>{student.correo}</td>
                <td>{student.celular}</td>
                <td><span className="status">{student.activo ? 'ACTIVO' : 'INACTIVO'}</span></td>
                <td>
                  <div className="row-actions">
                    <Button variant="ghost" onClick={() => openEdit(student)}>Editar</Button>
                    <Button variant="danger" onClick={() => deactivate(student)}>Desactivar</Button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={6}>No se encontraron estudiantes con ese criterio.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Modal title={selected ? 'Editar estudiante' : 'Nuevo estudiante'} open={modalOpen} onClose={() => setModalOpen(false)} size="lg">
        <form className="form-grid two-columns" onSubmit={submit}>
          <Field label="Nombres" value={form.nombres} onChange={(event) => setForm({ ...form, nombres: event.target.value })} />
          <Field label="Apellidos" value={form.apellidos} onChange={(event) => setForm({ ...form, apellidos: event.target.value })} />
          <Field label="CI" value={form.ci} onChange={(event) => setForm({ ...form, ci: event.target.value })} />
          <SelectField
            label="Extensión"
            value={form.extension_ci}
            onChange={(event) => setForm({ ...form, extension_ci: event.target.value })}
            options={[
              { value: 'LP', label: 'LP' },
              { value: 'CB', label: 'CB' },
              { value: 'SC', label: 'SC' },
            ]}
          />
          <Field label="WhatsApp" value={form.celular} onChange={(event) => setForm({ ...form, celular: event.target.value })} />
          <Field label="Correo" type="email" value={form.correo} onChange={(event) => setForm({ ...form, correo: event.target.value })} />
          <label className="check-row">
            <input type="checkbox" checked={form.activo} onChange={(event) => setForm({ ...form, activo: event.target.checked })} />
            <span>Estudiante activo</span>
          </label>
          {message ? <p className={message.includes('No se') ? 'alert error' : 'alert success'}>{message}</p> : null}
          <div className="modal-actions">
            <Button>{selected ? 'Guardar cambios' : 'Registrar estudiante'}</Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
