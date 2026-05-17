import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { enrollmentsApi, paymentsApi } from '../api/domainApi';
import { Button } from '../components/ui/Button';
import { Field, SelectField } from '../components/ui/Field';
import { Modal } from '../components/ui/Modal';
import { useAsyncData } from '../hooks/useAsyncData';
import type { Enrollment, PaymentAccount, User } from '../types';
import { firstMissing } from '../utils/validation';

type Props = {
  initialEnrollmentId?: string;
  user: User;
};

type PaymentRow = Record<string, string>;

const today = new Date().toISOString().slice(0, 10);

export function PaymentsPage({ initialEnrollmentId = '', user }: Props) {
  const enrollments = useAsyncData(() => enrollmentsApi.list(), []);
  const [id, setId] = useState(initialEnrollmentId);
  const [studentQuery, setStudentQuery] = useState('');
  const [data, setData] = useState<PaymentAccount | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRow | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    fecha_pago: today,
    monto_pagado: '',
    entidad_facturadora: 'DIGITALICE',
    estado_factura: 'PENDIENTE',
    codigo_comprobante: '',
    fecha_comprobante: today,
    comprobante_url: '',
    comprobante_nombre: '',
    notas: '',
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const accountEmail = data?.inscripcion?.correo ?? '';
  const nextPendingPayment = data?.pagos.find((payment) => payment.estado !== 'PAGADO') ?? null;
  const matchingEnrollments = useMemo(() => {
    const value = studentQuery.trim().toLowerCase();
    if (!value) return [];
    return (enrollments.data ?? []).filter((enrollment) =>
      [
        enrollment.estudiante,
        enrollment.ci,
        enrollment.extension_ci,
        enrollment.correo,
        enrollment.celular,
        enrollment.producto,
        enrollment.producto_codigo,
        enrollment.institucion,
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(value)),
    );
  }, [enrollments.data, studentQuery]);

  const mailtoHref = useMemo(() => {
    if (!data?.inscripcion) return '#';
    const subject = encodeURIComponent(`Estado de cuenta DIGITALICE - ${data.inscripcion.producto_codigo}`);
    const body = encodeURIComponent(
      `Hola ${data.inscripcion.estudiante},\n\n` +
      `Tu estado de cuenta es:\n` +
      `Producto: ${data.inscripcion.producto}\n` +
      `Total: ${data.resumen.total.toFixed(2)}\n` +
      `Pagado: ${data.resumen.pagado.toFixed(2)}\n` +
      `Saldo: ${data.resumen.saldo.toFixed(2)}\n` +
      `Cuotas pendientes: ${data.resumen.cuotas_pendientes}\n\n` +
      `Saludos,\nDIGITALICE`,
    );
    return `mailto:${accountEmail}?subject=${subject}&body=${body}`;
  }, [accountEmail, data]);

  useEffect(() => {
    setId(initialEnrollmentId);
    if (initialEnrollmentId) {
      void loadPayments(initialEnrollmentId);
    }
  }, [initialEnrollmentId]);

  async function loadPayments(enrollmentId: string) {
    setError('');
    setMessage('');
    setData(null);
    const missing = firstMissing({ id_inscripcion: enrollmentId }, ['id_inscripcion']);
    if (missing) {
      setError(missing);
      return;
    }
    try {
      setData(await paymentsApi.byEnrollment(enrollmentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo consultar pagos');
    }
  }

  async function search(event: FormEvent) {
    event.preventDefault();
    await loadPayments(id);
  }

  async function selectEnrollment(enrollment: Enrollment) {
    setId(enrollment.id);
    await loadPayments(enrollment.id);
  }

  function openRegister(payment: PaymentRow) {
    setSelectedPayment(payment);
    setPaymentForm({
      fecha_pago: payment.fecha_pago || today,
      monto_pagado: payment.monto_pagado || payment.monto,
      entidad_facturadora: payment.entidad_facturadora || 'DIGITALICE',
      estado_factura: payment.estado_factura || 'PENDIENTE',
      codigo_comprobante: payment.codigo_comprobante || '',
      fecha_comprobante: payment.fecha_comprobante || today,
      comprobante_url: payment.comprobante_url || '',
      comprobante_nombre: payment.comprobante_nombre || '',
      notas: payment.notas || '',
    });
    setMessage('');
  }

  async function registerPayment(event: FormEvent) {
    event.preventDefault();
    if (!selectedPayment) return;
    setMessage('');
    const missing = firstMissing(paymentForm, ['fecha_pago', 'monto_pagado', 'codigo_comprobante', 'fecha_comprobante']);
    if (missing) {
      setMessage(missing);
      return;
    }
    try {
      await paymentsApi.register(selectedPayment.id, paymentForm);
      setSelectedPayment(null);
      setMessage('Pago registrado');
      await loadPayments(id);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No se pudo registrar el pago');
    }
  }

  async function deletePayment(payment: PaymentRow) {
    if (user.rol !== 'Admin') return;
    const confirmed = window.confirm(`¿Eliminar la cuota ${payment.numero_cuota}? El registro quedará oculto, pero se conservará para auditoría.`);
    if (!confirmed) return;
    setMessage('');
    try {
      await paymentsApi.delete(payment.id);
      setMessage('Pago eliminado');
      await loadPayments(id);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No se pudo eliminar el pago');
    }
  }

  function printAccount() {
    window.print();
  }

  return (
    <section className="panel full account-page">
      <div className="section-heading">
        <div>
          <h2>Estado financiero</h2>
          {initialEnrollmentId ? <p className="muted">Inscripción seleccionada: <code>{initialEnrollmentId.slice(0, 8)}</code></p> : null}
        </div>
        <div className="row-actions">
          {nextPendingPayment ? <Button type="button" onClick={() => openRegister(nextPendingPayment)}>Registrar próxima cuota</Button> : null}
          <Button type="button" variant="ghost" onClick={printAccount}>PDF</Button>
          <a className="button button-ghost" href={mailtoHref}>Correo</a>
        </div>
      </div>

      <div className="payment-search no-print">
        <Field
          label="Buscar estudiante"
          value={studentQuery}
          onChange={(event) => setStudentQuery(event.target.value)}
          placeholder="Nombre, apellido, CI, correo o WhatsApp..."
        />
        <form className="inline-form" onSubmit={search}>
          <Field label="ID de inscripción" value={id} onChange={(event) => setId(event.target.value)} />
          <Button>Consultar</Button>
        </form>
      </div>

      {enrollments.error ? <p className="alert error">{enrollments.error}</p> : null}
      {enrollments.loading ? <p className="muted no-print">Cargando inscripciones...</p> : null}
      {studentQuery.trim() ? (
        <div className="table-wrap no-print">
          <table>
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Documento</th>
                <th>Curso</th>
                <th>Institución</th>
                <th>Saldo</th>
                <th>Cuotas</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {matchingEnrollments.map((enrollment) => (
                <tr key={enrollment.id}>
                  <td>{enrollment.estudiante}</td>
                  <td>{enrollment.ci ? `${enrollment.ci} ${enrollment.extension_ci ?? ''}` : '-'}</td>
                  <td>{enrollment.producto_codigo} · {enrollment.producto}</td>
                  <td>{enrollment.institucion}</td>
                  <td>{Number(enrollment.saldo_pendiente).toFixed(2)}</td>
                  <td>{enrollment.cuotas_pendientes}/{enrollment.cuotas_total}</td>
                  <td>
                    <Button type="button" variant="ghost" onClick={() => void selectEnrollment(enrollment)}>
                      Ver pagos
                    </Button>
                  </td>
                </tr>
              ))}
              {!enrollments.loading && matchingEnrollments.length === 0 ? (
                <tr>
                  <td colSpan={7}>No se encontraron inscripciones para ese estudiante o documento.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}

      {error ? <p className="alert error">{error}</p> : null}
      {message ? <p className={message.includes('registrado') || message.includes('eliminado') ? 'alert success' : 'alert error'}>{message}</p> : null}

      {data ? (
        <>
          <div className="account-summary">
            <article>
              <small>Estudiante</small>
              <strong>{data.inscripcion?.estudiante}</strong>
              <span>{data.inscripcion?.correo} · {data.inscripcion?.celular}</span>
              <span>CI {data.inscripcion?.ci} {data.inscripcion?.extension_ci}</span>
            </article>
            <article>
              <small>Producto</small>
              <strong>{data.inscripcion?.producto}</strong>
              <span>{data.inscripcion?.producto_codigo} · {data.inscripcion?.institucion}</span>
              <span>Paralelo {data.inscripcion?.paralelo}</span>
            </article>
          </div>

          <div className="metrics-grid compact">
            <article className="metric-card"><small>Total</small><strong>{data.resumen.total.toFixed(2)}</strong></article>
            <article className="metric-card"><small>Pagado</small><strong>{data.resumen.pagado.toFixed(2)}</strong></article>
            <article className="metric-card"><small>Saldo</small><strong>{data.resumen.saldo.toFixed(2)}</strong></article>
            <article className="metric-card"><small>Cuotas pendientes</small><strong>{data.resumen.cuotas_pendientes}/{data.resumen.cuotas_total}</strong></article>
          </div>

          {data.pagos.length === 0 ? <p className="alert error">Esta inscripción no tiene cuotas generadas.</p> : null}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cuota</th>
                  <th>Monto</th>
                  <th>Vence</th>
                  <th>Estado</th>
                  <th>Código comprobante</th>
                  <th>Fecha comprobante</th>
                  <th>Registrado por</th>
                  <th className="no-print">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.pagos.map((payment) => (
                  <tr key={payment.id}>
                    <td>{payment.numero_cuota}</td>
                    <td>
                      <strong>{Number(payment.monto).toFixed(2)}</strong>
                      {payment.estado === 'PAGADO' && payment.monto_pagado ? <small className="table-subtitle">Pagado: {Number(payment.monto_pagado).toFixed(2)}</small> : null}
                      {payment.notas ? <small className="table-subtitle">{payment.notas}</small> : null}
                    </td>
                    <td>{payment.fecha_vencimiento}</td>
                    <td><span className="status">{payment.estado}</span></td>
                    <td>{payment.codigo_comprobante || '-'}</td>
                    <td>{payment.fecha_comprobante || '-'}</td>
                    <td>{payment.registrado_por_nombre || '-'}</td>
                    <td className="no-print">
                      <div className="row-actions">
                        {payment.estado !== 'PAGADO' ? (
                          <Button onClick={() => openRegister(payment)}>Registrar pago</Button>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            disabled={user.rol !== 'Admin'}
                            title={user.rol === 'Admin' ? 'Editar pago registrado' : 'Solo Admin puede editar pagos registrados'}
                            onClick={() => openRegister(payment)}
                          >
                            Editar
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant={user.rol === 'Admin' ? 'danger' : 'ghost'}
                          disabled={user.rol !== 'Admin'}
                          title={user.rol === 'Admin' ? 'Eliminar pago' : 'Solo Admin puede eliminar pagos'}
                          onClick={() => void deletePayment(payment)}
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
        </>
      ) : null}

      <Modal title={selectedPayment?.estado === 'PAGADO' ? 'Editar pago registrado' : 'Registrar pago'} open={Boolean(selectedPayment)} onClose={() => setSelectedPayment(null)} size="lg">
        <form className="form-grid two-columns" onSubmit={registerPayment}>
          <Field label="Fecha de pago" type="date" value={paymentForm.fecha_pago} onChange={(event) => setPaymentForm({ ...paymentForm, fecha_pago: event.target.value })} />
          <Field label="Monto pagado" type="number" min="1" value={paymentForm.monto_pagado} onChange={(event) => setPaymentForm({ ...paymentForm, monto_pagado: event.target.value })} />
          {selectedPayment ? (
            <p className="muted payment-balance-hint">
              Cuota pendiente: {Number(selectedPayment.monto).toFixed(2)}. Si registras un monto menor, el sistema generará una nueva cuota con el saldo.
            </p>
          ) : null}
          <SelectField
            label="Entidad facturadora"
            value={paymentForm.entidad_facturadora}
            onChange={(event) => setPaymentForm({ ...paymentForm, entidad_facturadora: event.target.value })}
            options={[
              { value: 'DIGITALICE', label: 'DIGITALICE' },
              { value: 'USFA', label: 'USFA' },
            ]}
          />
          <SelectField
            label="Estado factura"
            value={paymentForm.estado_factura}
            onChange={(event) => setPaymentForm({ ...paymentForm, estado_factura: event.target.value })}
            options={[
              { value: 'PENDIENTE', label: 'Pendiente' },
              { value: 'FACTURADO', label: 'Facturado' },
            ]}
          />
          <Field label="Código comprobante" value={paymentForm.codigo_comprobante} onChange={(event) => setPaymentForm({ ...paymentForm, codigo_comprobante: event.target.value })} />
          <Field label="Fecha comprobante" type="date" value={paymentForm.fecha_comprobante} onChange={(event) => setPaymentForm({ ...paymentForm, fecha_comprobante: event.target.value })} />
          <Field label="URL comprobante" value={paymentForm.comprobante_url} onChange={(event) => setPaymentForm({ ...paymentForm, comprobante_url: event.target.value })} />
          <Field label="Nombre archivo" value={paymentForm.comprobante_nombre} onChange={(event) => setPaymentForm({ ...paymentForm, comprobante_nombre: event.target.value })} />
          <Field label="Observaciones" value={paymentForm.notas} onChange={(event) => setPaymentForm({ ...paymentForm, notas: event.target.value })} />
          {message && !message.includes('registrado') ? <p className="alert error">{message}</p> : null}
          <div className="modal-actions">
            <Button>{selectedPayment?.estado === 'PAGADO' ? 'Guardar cambios' : 'Guardar pago'}</Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
