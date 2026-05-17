import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { enrollmentsApi, productsApi, studentsApi } from '../api/domainApi';
import { Button } from '../components/ui/Button';
import { Field, SelectField } from '../components/ui/Field';
import { Modal } from '../components/ui/Modal';
import { useAsyncData } from '../hooks/useAsyncData';
import type { Enrollment, Product, Student, User } from '../types';
import { firstMissing } from '../utils/validation';

type Props = {
  onOpenPayments: (enrollmentId: string) => void;
  user: User;
};

type InstallmentDraft = {
  numero_cuota: number;
  monto: string;
  fecha_vencimiento: string;
};

const today = new Date().toISOString().slice(0, 10);
const initialForm = {
  estudiante_id: '',
  producto_id: '',
  paralelo: 'A',
  metodo_pago: 'AL_CONTADO',
  monto_base: '',
  descuento: '0',
  monto_total: '',
  cantidad_cuotas: '3',
  comprometido_pago: false,
  fecha_vencimiento: today,
};

export function EnrollmentsPage({ onOpenPayments, user }: Props) {
  const enrollments = useAsyncData(() => enrollmentsApi.list(), []);
  const students = useAsyncData(() => studentsApi.list(), []);
  const products = useAsyncData(() => productsApi.list(), []);
  const [modalOpen, setModalOpen] = useState(false);
  const [installmentsOpen, setInstallmentsOpen] = useState(false);
  const [editing, setEditing] = useState<Enrollment | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(initialForm);
  const [installments, setInstallments] = useState<InstallmentDraft[]>([]);
  const [message, setMessage] = useState('');

  const filteredEnrollments = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return enrollments.data ?? [];
    return (enrollments.data ?? []).filter((item) =>
      [item.id, item.estudiante, item.producto, item.producto_codigo, item.institucion, item.estado]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(value)),
    );
  }, [enrollments.data, search]);

  function openCreate() {
    setForm(initialForm);
    setInstallments([]);
    setEditing(null);
    setMessage('');
    setModalOpen(true);
  }

  function openEdit(enrollment: Enrollment) {
    setEditing(enrollment);
    setInstallments([]);
    setForm({
      estudiante_id: enrollment.estudiante_id,
      producto_id: enrollment.producto_id,
      paralelo: enrollment.paralelo || 'A',
      metodo_pago: enrollment.metodo_pago,
      monto_base: String(enrollment.monto_base ?? enrollment.monto_total),
      descuento: String(enrollment.descuento ?? '0'),
      monto_total: String(enrollment.monto_total),
      cantidad_cuotas: String(enrollment.cuotas_total || '1'),
      comprometido_pago: Boolean(Number(enrollment.comprometido_pago)),
      fecha_vencimiento: today,
    });
    setMessage('');
    setModalOpen(true);
  }

  function buildInstallments(): InstallmentDraft[] {
    const count = Math.max(1, Number(form.cantidad_cuotas || 1));
    const total = Number(form.monto_total || 0);
    const baseAmount = Math.floor((total / count) * 100) / 100;
    const start = new Date(`${form.fecha_vencimiento}T00:00:00`);

    return Array.from({ length: count }, (_, index) => {
      const dueDate = new Date(start);
      dueDate.setMonth(start.getMonth() + index);
      const amount = index === count - 1 ? (total - baseAmount * (count - 1)).toFixed(2) : baseAmount.toFixed(2);

      return {
        numero_cuota: index + 1,
        monto: amount,
        fecha_vencimiento: dueDate.toISOString().slice(0, 10),
      };
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage('');

    const missing = firstMissing(form, ['estudiante_id', 'producto_id', 'monto_total']);
    if (missing) {
      setMessage(missing);
      return;
    }

    if (editing) {
      await updateEnrollment();
      return;
    }

    if (form.metodo_pago === 'CUOTAS') {
      if (!form.comprometido_pago) {
        setMessage('Debe aceptar el compromiso de pago');
        return;
      }
      const installmentMissing = firstMissing(form, ['cantidad_cuotas', 'fecha_vencimiento']);
      if (installmentMissing) {
        setMessage(installmentMissing);
        return;
      }
      setInstallments(buildInstallments());
      setModalOpen(false);
      setInstallmentsOpen(true);
      return;
    }

    await createEnrollment();
  }

  async function createEnrollment(customInstallments: InstallmentDraft[] = []) {
    setMessage('');
    try {
      await enrollmentsApi.create({
        ...form,
        monto_base: Number(form.monto_base),
        descuento: Number(form.descuento || 0),
        monto_total: Number(form.monto_total),
        cantidad_cuotas: form.metodo_pago === 'CUOTAS' ? customInstallments.length : 1,
        comprometido_pago: form.metodo_pago === 'CUOTAS' ? form.comprometido_pago : false,
        pagos: customInstallments.map((item) => ({
          numero_cuota: item.numero_cuota,
          monto: Number(item.monto),
          fecha_vencimiento: item.fecha_vencimiento,
        })),
      });
      setMessage('Inscripción creada');
      setModalOpen(false);
      setInstallmentsOpen(false);
      setForm(initialForm);
      setInstallments([]);
      await enrollments.reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No se pudo crear la inscripción');
    }
  }

  async function updateEnrollment() {
    if (!editing) return;
    try {
      await enrollmentsApi.update(editing.id, {
        estudiante_id: form.estudiante_id,
        producto_id: form.producto_id,
        paralelo: form.paralelo,
        metodo_pago: form.metodo_pago,
        monto_base: Number(form.monto_base),
        descuento: Number(form.descuento || 0),
        monto_total: Number(form.monto_total),
        comprometido_pago: form.metodo_pago === 'CUOTAS' ? form.comprometido_pago : false,
      });
      setMessage('Inscripción actualizada');
      setModalOpen(false);
      setEditing(null);
      await enrollments.reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No se pudo actualizar la inscripción');
    }
  }

  async function deleteEnrollment(enrollment: Enrollment) {
    if (user.rol !== 'Admin') return;
    const confirmed = window.confirm(`¿Eliminar la inscripción ${enrollment.id.slice(0, 8)}? Se ocultará de la web y quedará auditada.`);
    if (!confirmed) return;
    setMessage('');
    try {
      await enrollmentsApi.delete(enrollment.id);
      setMessage('Inscripción eliminada');
      await enrollments.reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No se pudo eliminar la inscripción');
    }
  }

  function updateInstallment(index: number, patch: Partial<InstallmentDraft>) {
    setInstallments((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  function selectProduct(productId: string) {
    const product = (products.data ?? []).find((item) => item.id === productId);
    const amount = Number(product?.monto_referencial ?? 0);
    setForm((current) => withCalculatedTotal({
      ...current,
      producto_id: productId,
      monto_base: amount > 0 ? amount.toFixed(2) : current.monto_base,
      descuento: '0',
    }));
  }

  function updateFinancial(patch: Partial<typeof form>) {
    setForm((current) => withCalculatedTotal({ ...current, ...patch }));
  }

  return (
    <section className="panel full">
      <div className="section-heading">
        <div>
          <h2>Inscripciones</h2>
          <p>Controla el alta académica y financiera de estudiantes.</p>
        </div>
        <Button onClick={openCreate}>Nueva inscripción</Button>
      </div>

      <div className="toolbar">
        <Field label="Buscar inscripción" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Código, estudiante, producto, institución..." />
      </div>

      {enrollments.loading ? <p className="muted">Cargando...</p> : null}
      {enrollments.error ? <p className="alert error">{enrollments.error}</p> : null}
      {message && !modalOpen && !installmentsOpen ? <p className={message.includes('eliminada') ? 'alert success' : 'alert error'}>{message}</p> : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Estudiante</th>
              <th>Producto</th>
              <th>Institución</th>
              <th>Estado</th>
              <th>Cuotas</th>
              <th>Saldo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredEnrollments.map((item) => (
              <tr key={item.id}>
                <td><code>{item.id.slice(0, 8)}</code></td>
                <td>{item.estudiante}</td>
                <td>{item.producto}</td>
                <td>{item.institucion}</td>
                <td><span className="status">{item.estado}</span></td>
                <td>{item.cuotas_pendientes}/{item.cuotas_total}</td>
                <td>{Number(item.saldo_pendiente).toFixed(2)}</td>
                <td>
                  <div className="row-actions">
                    <Button variant="ghost" onClick={() => openEdit(item)}>Editar</Button>
                    <Button variant="ghost" onClick={() => onOpenPayments(item.id)}>Ver pagos</Button>
                    <Button
                      type="button"
                      variant={user.rol === 'Admin' ? 'danger' : 'ghost'}
                      disabled={user.rol !== 'Admin'}
                      title={user.rol === 'Admin' ? 'Eliminar inscripción' : 'Solo Admin puede eliminar inscripciones'}
                      onClick={() => void deleteEnrollment(item)}
                    >
                      Eliminar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal title={editing ? 'Editar inscripción' : 'Nueva inscripción'} open={modalOpen} onClose={() => setModalOpen(false)} size="lg">
        <form className="form-grid two-columns" onSubmit={submit}>
          <StudentPicker
            label="Estudiante"
            value={form.estudiante_id}
            students={students.data ?? []}
            onChange={(estudiante_id) => setForm({ ...form, estudiante_id })}
          />
          <ProductPicker
            label="Producto"
            value={form.producto_id}
            products={products.data ?? []}
            onChange={selectProduct}
          />
          <Field label="Paralelo" value={form.paralelo} onChange={(event) => setForm({ ...form, paralelo: event.target.value })} />
          <SelectField
            label="Método de pago"
            value={form.metodo_pago}
            onChange={(event) => setForm({ ...form, metodo_pago: event.target.value })}
            options={[
              { value: 'AL_CONTADO', label: 'Al contado' },
              { value: 'CUOTAS', label: 'Cuotas' },
            ]}
          />
          <Field label="Monto curso" type="number" min="0" value={form.monto_base} onChange={(event) => updateFinancial({ monto_base: event.target.value })} />
          <Field label="Descuento" type="number" min="0" value={form.descuento} onChange={(event) => updateFinancial({ descuento: event.target.value })} />
          <Field label="Total a pagar" type="number" min="1" value={form.monto_total} readOnly onChange={() => undefined} />
          {form.metodo_pago === 'CUOTAS' && !editing ? (
            <Field label="Cantidad de cuotas" type="number" min="1" value={form.cantidad_cuotas} onChange={(event) => setForm({ ...form, cantidad_cuotas: event.target.value })} />
          ) : null}
          {!editing ? (
            <Field label={form.metodo_pago === 'CUOTAS' ? 'Fecha primera cuota' : 'Fecha vencimiento'} type="date" value={form.fecha_vencimiento} onChange={(event) => setForm({ ...form, fecha_vencimiento: event.target.value })} />
          ) : null}
          {form.metodo_pago === 'CUOTAS' ? (
            <label className="check-row">
              <input type="checkbox" checked={form.comprometido_pago} onChange={(event) => setForm({ ...form, comprometido_pago: event.target.checked })} />
              <span>Compromiso de pago aceptado</span>
            </label>
          ) : null}
          {message ? <p className={message.includes('creada') || message.includes('actualizada') ? 'alert success' : 'alert error'}>{message}</p> : null}
          {editing ? <p className="muted">La edición no reprograma cuotas existentes. Para cambiar fechas o montos de cuotas, usa la vista de pagos.</p> : null}
          <div className="modal-actions">
            <Button>{editing ? 'Guardar cambios' : form.metodo_pago === 'CUOTAS' ? 'Continuar a cuotas' : 'Crear inscripción'}</Button>
          </div>
        </form>
      </Modal>

      <Modal title="Configurar cuotas" open={installmentsOpen} onClose={() => setInstallmentsOpen(false)} size="lg">
        <div className="installments-review">
          <p className="muted">Revisa o ajusta monto y fecha de vencimiento antes de registrar la inscripción.</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cuota</th>
                  <th>Monto</th>
                  <th>Fecha vencimiento</th>
                </tr>
              </thead>
              <tbody>
                {installments.map((item, index) => (
                  <tr key={item.numero_cuota}>
                    <td>{item.numero_cuota}</td>
                    <td>
                      <input className="table-input" type="number" min="1" value={item.monto} onChange={(event) => updateInstallment(index, { monto: event.target.value })} />
                    </td>
                    <td>
                      <input className="table-input" type="date" value={item.fecha_vencimiento} onChange={(event) => updateInstallment(index, { fecha_vencimiento: event.target.value })} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {message ? <p className={message.includes('creada') ? 'alert success' : 'alert error'}>{message}</p> : null}
          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={() => { setInstallmentsOpen(false); setModalOpen(true); }}>Volver</Button>
            <Button type="button" onClick={() => void createEnrollment(installments)}>Crear inscripción y cuotas</Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}

type StudentPickerProps = {
  label: string;
  value: string;
  students: Student[];
  onChange: (value: string) => void;
};

function StudentPicker({ label, value, students, onChange }: StudentPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selectedStudent = students.find((student) => student.id === value);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredStudents = normalizedQuery
    ? students.filter((student) =>
      [student.nombres, student.apellidos, student.ci, student.extension_ci, student.correo, student.celular]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(normalizedQuery)),
    )
    : students;

  function selectStudent(studentId: string) {
    onChange(studentId);
    setQuery('');
    setOpen(false);
  }

  return (
    <div className="field searchable-select">
      <span>{label}</span>
      <button type="button" className="searchable-select-trigger" onClick={() => setOpen((current) => !current)}>
        <span>{selectedStudent ? `${selectedStudent.nombres} ${selectedStudent.apellidos} · ${selectedStudent.ci} ${selectedStudent.extension_ci}` : 'Seleccionar estudiante'}</span>
        <small>v</small>
      </button>
      {open ? (
        <div className="searchable-select-panel">
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar estudiante..."
          />
          <button type="button" onClick={() => selectStudent('')}>
            Seleccionar estudiante
          </button>
          {filteredStudents.map((student) => (
            <button type="button" key={student.id} onClick={() => selectStudent(student.id)}>
              <strong>{student.nombres} {student.apellidos}</strong>
              <small>{student.ci} {student.extension_ci} · {student.correo}</small>
            </button>
          ))}
          {filteredStudents.length === 0 ? <p className="muted">No se encontraron estudiantes.</p> : null}
        </div>
      ) : null}
    </div>
  );
}

type ProductPickerProps = {
  label: string;
  value: string;
  products: Product[];
  onChange: (value: string) => void;
};

function ProductPicker({ label, value, products, onChange }: ProductPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selectedProduct = products.find((product) => product.id === value);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredProducts = normalizedQuery
    ? products.filter((product) =>
      [product.codigo, product.nombre, product.tipo, product.institucion]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(normalizedQuery)),
    )
    : products;

  function selectProduct(productId: string) {
    onChange(productId);
    setQuery('');
    setOpen(false);
  }

  return (
    <div className="field searchable-select">
      <span>{label}</span>
      <button type="button" className="searchable-select-trigger" onClick={() => setOpen((current) => !current)}>
        <span>{selectedProduct ? `${selectedProduct.codigo} · ${selectedProduct.nombre}` : 'Seleccionar producto'}</span>
        <small>v</small>
      </button>
      {open ? (
        <div className="searchable-select-panel">
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar producto..."
          />
          <button type="button" onClick={() => selectProduct('')}>
            Seleccionar producto
          </button>
          {filteredProducts.map((product) => (
            <button type="button" key={product.id} onClick={() => selectProduct(product.id)}>
              <strong>{product.codigo} · {product.nombre}</strong>
              <small>{product.tipo} · {product.institucion} · {formatMoney(product.monto_referencial)}</small>
            </button>
          ))}
          {filteredProducts.length === 0 ? <p className="muted">No se encontraron productos.</p> : null}
        </div>
      ) : null}
    </div>
  );
}

function withCalculatedTotal<T extends { monto_base: string; descuento: string; monto_total: string }>(form: T): T {
  const base = Number(form.monto_base || 0);
  const discount = Math.max(0, Number(form.descuento || 0));
  const total = Math.max(0, base - discount);
  return {
    ...form,
    descuento: discount.toString(),
    monto_total: total > 0 ? total.toFixed(2) : '',
  };
}

function formatMoney(value?: string | number | null) {
  const amount = Number(value ?? 0);
  return amount > 0 ? amount.toFixed(2) : 'Sin monto';
}
