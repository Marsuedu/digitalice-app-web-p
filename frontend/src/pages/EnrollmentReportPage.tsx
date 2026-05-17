import { useMemo, useState } from 'react';
import { reportsApi } from '../api/domainApi';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { Icon } from '../components/ui/Icon';
import { useAsyncData } from '../hooks/useAsyncData';
import type { EnrollmentReportStudent, EnrollmentReportSummary } from '../types';

export function EnrollmentReportPage() {
  const { data, loading, error } = useAsyncData(() => reportsApi.enrolledStudents(), []);
  const [query, setQuery] = useState('');

  const filteredSummary = useMemo(() => {
    return filterRows(data?.resumen ?? [], query, ['codigo', 'nombre', 'institucion']);
  }, [data?.resumen, query]);

  const filteredStudents = useMemo(() => {
    return filterRows(data?.alumnos ?? [], query, ['producto_codigo', 'producto', 'institucion', 'nombres', 'apellidos', 'ci']);
  }, [data?.alumnos, query]);

  const totals = useMemo(() => ({
    matriculados: filteredSummary.reduce((sum, row) => sum + Number(row.matriculados ?? 0), 0),
    ingresos: filteredSummary.reduce((sum, row) => sum + Number(row.total_ingresos ?? 0), 0),
    pagado: filteredSummary.reduce((sum, row) => sum + Number(row.total_pagado ?? 0), 0),
    recaudar: filteredSummary.reduce((sum, row) => sum + Number(row.total_por_recaudar ?? 0), 0),
  }), [filteredSummary]);

  return (
    <section className="report-page">
      <div className="panel full">
        <div className="section-heading report-heading">
          <div>
            <h2>Matriculados por curso</h2>
            <p>Resumen académico y financiero por curso e institución.</p>
          </div>
          <Button type="button" variant="ghost" onClick={() => window.print()}>
            <Icon name="file" /> PDF
          </Button>
        </div>

        <div className="toolbar report-toolbar no-print">
          <Field
            label="Buscar"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Curso, institución, alumno o documento..."
          />
        </div>

        {loading ? <p className="muted">Cargando reporte...</p> : null}
        {error ? <p className="alert error">{error}</p> : null}
      </div>

      <section className="metrics-grid analytics-kpis">
        <article className="metric-card">
          <span className="metric-icon"><Icon name="students" /></span>
          <small>Matriculados</small>
          <strong>{totals.matriculados}</strong>
        </article>
        <article className="metric-card">
          <span className="metric-icon"><Icon name="chart" /></span>
          <small>Total ingresos</small>
          <strong>{formatMoney(totals.ingresos)}</strong>
        </article>
        <article className="metric-card">
          <span className="metric-icon"><Icon name="payments" /></span>
          <small>Total pagado</small>
          <strong>{formatMoney(totals.pagado)}</strong>
        </article>
        <article className="metric-card">
          <span className="metric-icon"><Icon name="enrollments" /></span>
          <small>Por recaudar</small>
          <strong>{formatMoney(totals.recaudar)}</strong>
        </article>
      </section>

      <section className="analytics-grid secondary">
        <article className="chart-panel">
          <div className="chart-title">
            <Icon name="chart" />
            <h2>Ingresos por curso</h2>
          </div>
          <MiniBars items={filteredSummary.map((row) => ({
            label: row.codigo,
            sublabel: shortLabel(row.nombre, 28),
            value: Number(row.total_ingresos ?? 0),
          }))} />
        </article>
        <article className="chart-panel">
          <div className="chart-title">
            <Icon name="payments" />
            <h2>Recaudación</h2>
          </div>
          <div className="report-balance">
            <span style={{ width: `${percentage(totals.pagado, totals.ingresos)}%` }}>Pagado</span>
            <span style={{ width: `${percentage(totals.recaudar, totals.ingresos)}%` }}>Por recaudar</span>
          </div>
          <div className="report-balance-labels">
            <strong>{formatMoney(totals.pagado)}</strong>
            <strong>{formatMoney(totals.recaudar)}</strong>
          </div>
        </article>
      </section>

      <section className="panel full">
        <div className="section-heading">
          <h2>Resumen por curso</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Curso</th>
                <th>Institución</th>
                <th>Matriculados</th>
                <th>Total</th>
                <th>Pagado</th>
                <th>Por recaudar</th>
              </tr>
            </thead>
            <tbody>
              {filteredSummary.map((row) => (
                <tr key={row.producto_id}>
                  <td>
                    <strong>{row.codigo}</strong>
                    <small className="table-subtitle">{row.nombre}</small>
                  </td>
                  <td>{row.institucion}</td>
                  <td>{row.matriculados}</td>
                  <td>{formatMoney(row.total_ingresos)}</td>
                  <td>{formatMoney(row.total_pagado)}</td>
                  <td>{formatMoney(row.total_por_recaudar)}</td>
                </tr>
              ))}
              {!loading && filteredSummary.length === 0 ? (
                <tr>
                  <td colSpan={6}>No se encontraron cursos con ese criterio.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel full">
        <div className="section-heading">
          <h2>Alumnos matriculados</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Alumno</th>
                <th>Curso</th>
                <th>Institución</th>
                <th>Estado</th>
                <th>Total</th>
                <th>Pagado</th>
                <th>Deuda</th>
                <th>Cuotas</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((row) => (
                <tr key={row.inscripcion_id}>
                  <td>
                    <strong>{row.apellidos}, {row.nombres}</strong>
                    <small className="table-subtitle">CI {row.ci} {row.extension_ci} · {row.celular || row.correo || 'Sin contacto'}</small>
                  </td>
                  <td>
                    {row.producto_codigo}
                    <small className="table-subtitle">{row.producto}</small>
                  </td>
                  <td>{row.institucion}</td>
                  <td><span className="status">{normalizeStatus(row.estado_inscripcion)}</span></td>
                  <td>{formatMoney(row.monto_total)}</td>
                  <td>{formatMoney(row.total_pagado)}</td>
                  <td>{formatMoney(row.deuda)}</td>
                  <td>{row.cuotas_pendientes} pendientes</td>
                </tr>
              ))}
              {!loading && filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8}>No se encontraron alumnos matriculados con ese criterio.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

function filterRows<T extends Record<string, string>>(rows: T[], query: string, keys: Array<keyof T>) {
  const value = query.trim().toLowerCase();
  if (!value) return rows;
  return rows.filter((row) => keys.some((key) => String(row[key] ?? '').toLowerCase().includes(value)));
}

function MiniBars({ items }: { items: Array<{ label: string; sublabel: string; value: number }> }) {
  const max = Math.max(...items.map((item) => item.value), 1);
  if (items.length === 0) return <p className="muted">Sin datos para graficar.</p>;

  return (
    <div className="bar-list compact">
      {items.slice(0, 8).map((item) => (
        <div className="bar-row compact" key={item.label}>
          <div className="bar-label">
            <strong>{item.label}</strong>
            <small title={item.sublabel}>{item.sublabel}</small>
          </div>
          <div className="bar-track">
            <span style={{ width: `${Math.max(6, (item.value / max) * 100)}%` }} />
          </div>
          <strong className="bar-value">{formatMoney(item.value)}</strong>
        </div>
      ))}
    </div>
  );
}

function percentage(value: number, total: number) {
  if (total <= 0) return 50;
  return Math.max(8, Math.round((value / total) * 100));
}

function formatMoney(value: string | number) {
  return Number(value ?? 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function shortLabel(value: string, length: number) {
  return value.length > length ? `${value.slice(0, length - 1)}...` : value;
}

function normalizeStatus(value: string) {
  return value.toLowerCase().replace(/_/g, ' ');
}
