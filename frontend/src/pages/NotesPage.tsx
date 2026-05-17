import { useMemo, useState } from 'react';
import { notesApi } from '../api/domainApi';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { Icon } from '../components/ui/Icon';
import { useAsyncData } from '../hooks/useAsyncData';
import type { NotesCourse, NotesStudent } from '../types';

type GradesState = Record<string, string>;

export function NotesPage() {
  const courses = useAsyncData(() => notesApi.courses(), []);
  const [query, setQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<NotesCourse | null>(null);
  const [students, setStudents] = useState<NotesStudent[]>([]);
  const [grades, setGrades] = useState<GradesState>({});
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [message, setMessage] = useState('');

  const filteredCourses = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return courses.data ?? [];
    return (courses.data ?? []).filter((course) =>
      [course.producto_codigo, course.producto, course.institucion, course.modulo, course.docente]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(value)),
    );
  }, [courses.data, query]);

  async function openCourse(course: NotesCourse) {
    setSelectedCourse(course);
    setLoadingStudents(true);
    setMessage('');
    try {
      const rows = await notesApi.students(course.producto_modulo_id);
      setStudents(rows);
      setGrades(Object.fromEntries(rows.map((row) => [row.inscripcion_modulo_id, row.nota ? String(row.nota) : ''])));
    } catch (err) {
      setStudents([]);
      setMessage(err instanceof Error ? err.message : 'No se pudo cargar la lista de alumnos');
    } finally {
      setLoadingStudents(false);
    }
  }

  async function saveGrade(student: NotesStudent) {
    const value = Number(grades[student.inscripcion_modulo_id]);
    setMessage('');
    if (!Number.isFinite(value) || value < 1 || value > 100) {
      setMessage('La nota debe ser un número entre 1 y 100.');
      return;
    }
    try {
      await notesApi.save(student.inscripcion_modulo_id, value);
      setMessage(`Nota registrada para ${student.nombres} ${student.apellidos}.`);
      if (selectedCourse) {
        const rows = await notesApi.students(selectedCourse.producto_modulo_id);
        setStudents(rows);
        setGrades(Object.fromEntries(rows.map((row) => [row.inscripcion_modulo_id, row.nota ? String(row.nota) : ''])));
      }
      await courses.reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No se pudo registrar la nota');
    }
  }

  if (selectedCourse) {
    return (
      <section className="panel full notes-page">
        <div className="section-heading">
          <div>
            <h2>{selectedCourse.producto_codigo} · Módulo {selectedCourse.numero_modulo}</h2>
            <p>{selectedCourse.modulo} · {selectedCourse.institucion}</p>
          </div>
          <Button type="button" variant="ghost" onClick={() => setSelectedCourse(null)}>
            Volver
          </Button>
        </div>

        {message ? <p className={message.includes('registrada') ? 'alert success' : 'alert error'}>{message}</p> : null}
        {loadingStudents ? <p className="muted">Cargando alumnos matriculados...</p> : null}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Alumno</th>
                <th>Documento</th>
                <th>Contacto</th>
                <th>Estado</th>
                <th>Nota</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.inscripcion_modulo_id}>
                  <td>
                    <strong>{student.apellidos}, {student.nombres}</strong>
                    <small className="table-subtitle">{student.inscripcion_id.slice(0, 8)}</small>
                  </td>
                  <td>{student.ci} {student.extension_ci}</td>
                  <td>
                    {student.correo || '-'}
                    <small className="table-subtitle">{student.celular || 'Sin celular'}</small>
                  </td>
                  <td><span className="status">{normalizeStatus(student.estado)}</span></td>
                  <td>
                    <input
                      className="table-input grade-input"
                      min="1"
                      max="100"
                      type="number"
                      value={grades[student.inscripcion_modulo_id] ?? ''}
                      onChange={(event) => setGrades((current) => ({ ...current, [student.inscripcion_modulo_id]: event.target.value }))}
                      placeholder="0-100"
                    />
                  </td>
                  <td>
                    <Button type="button" onClick={() => void saveGrade(student)}>
                      Guardar
                    </Button>
                  </td>
                </tr>
              ))}
              {!loadingStudents && students.length === 0 ? (
                <tr>
                  <td colSpan={6}>No hay alumnos matriculados para este módulo.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  return (
    <section className="panel full notes-page">
      <div className="section-heading">
        <div>
          <h2>Registro de notas</h2>
          <p>Selecciona un curso asignado y registra las notas por alumno.</p>
        </div>
      </div>

      <div className="toolbar notes-toolbar">
        <Field
          label="Buscar curso"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Curso, módulo, institución o docente..."
        />
      </div>

      {courses.loading ? <p className="muted">Cargando cursos...</p> : null}
      {courses.error ? <p className="alert error">{courses.error}</p> : null}
      {message ? <p className="alert error">{message}</p> : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Curso</th>
              <th>Módulo</th>
              <th>Institución</th>
              <th>Docente</th>
              <th>Avance</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {filteredCourses.map((course) => (
              <tr key={course.producto_modulo_id}>
                <td>
                  <strong>{course.producto_codigo}</strong>
                  <small className="table-subtitle">{course.producto}</small>
                </td>
                <td>
                  Módulo {course.numero_modulo}
                  <small className="table-subtitle">{course.modulo}</small>
                </td>
                <td>{course.institucion}</td>
                <td>{course.docente || 'Sin docente asignado'}</td>
                <td>
                  <span className="status">{course.calificados}/{course.estudiantes} notas</span>
                  <small className="table-subtitle">{course.pendientes} pendientes</small>
                </td>
                <td>
                  <Button type="button" onClick={() => void openCourse(course)}>
                    <Icon name="edit" /> Registrar notas
                  </Button>
                </td>
              </tr>
            ))}
            {!courses.loading && filteredCourses.length === 0 ? (
              <tr>
                <td colSpan={6}>No se encontraron cursos para registrar notas.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function normalizeStatus(value: string) {
  return value.toLowerCase().replace(/_/g, ' ');
}
