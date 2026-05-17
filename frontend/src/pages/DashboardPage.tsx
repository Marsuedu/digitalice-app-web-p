import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { dashboardApi } from '../api/domainApi';
import { Icon } from '../components/ui/Icon';
import { useAsyncData } from '../hooks/useAsyncData';
import type { DashboardData, User } from '../types';

type ChartItem = {
  label: string;
  sublabel?: string;
  value: number;
};

const kpiConfig: Array<{ key: string; label: string; icon: Parameters<typeof Icon>[0]['name']; format?: 'money' | 'int' }> = [
  { key: 'matriculas_mes', label: 'Matrículas mes', icon: 'enrollments', format: 'int' },
  { key: 'recaudacion_mes', label: 'Recaudación mes', icon: 'payments', format: 'money' },
  { key: 'saldo_pendiente', label: 'Saldo pendiente', icon: 'chart', format: 'money' },
  { key: 'pagos_vencidos', label: 'Cuotas vencidas', icon: 'payments', format: 'int' },
  { key: 'estudiantes_activos', label: 'Estudiantes', icon: 'students', format: 'int' },
  { key: 'docentes_activos', label: 'Docentes', icon: 'teachers', format: 'int' },
];

const palette = ['#1d6f6f', '#8f4f9f', '#c48a2c', '#476aaf', '#6f6b43', '#b34838'];

export function DashboardPage({ user }: { user: User }) {
  const { data, loading, error } = useAsyncData(() => dashboardApi.metrics(), []);
  const [enrollmentView, setEnrollmentView] = useState<'day' | 'month'>('day');

  const enrollmentSeries = enrollmentView === 'day' ? data?.matriculas_por_dia ?? [] : data?.matriculas_por_mes ?? [];
  const paid = Number(data?.metricas.recaudacion_mes ?? 0);
  const pending = Number(data?.metricas.saldo_pendiente ?? 0);
  const collectionMix = [
    { label: 'Cobrado', value: paid },
    { label: 'Pendiente', value: pending },
  ].filter((item) => item.value > 0);

  const courseRevenue = useMemo(() => (data?.recaudacion_por_curso ?? []).map((item) => ({
    label: item.codigo,
    sublabel: shortLabel(item.nombre, 34),
    value: Number(item.total),
  })), [data]);

  if (loading) return <p className="muted">Cargando panel...</p>;
  if (error) return <p className="alert error">{error}</p>;
  if (user.rol === 'Estudiante') return <StudentDashboard data={data} />;
  if (user.rol === 'Docente') return <TeacherDashboard data={data} />;

  return (
    <div className="dashboard-stack analytics-dashboard">
      <section className="metrics-grid analytics-kpis">
        {kpiConfig.map((item) => (
          <article className="metric-card" key={item.key}>
            <span className="metric-icon"><Icon name={item.icon} /></span>
            <small>{item.label}</small>
            <strong>{formatValue(Number(data?.metricas[item.key] ?? 0), item.format)}</strong>
          </article>
        ))}
      </section>

      <section className="analytics-grid primary">
        <VerticalBarChart
          title={enrollmentView === 'day' ? 'Matrículas por día' : 'Matrículas por mes'}
          items={enrollmentSeries.map((item) => ({ label: shortPeriod(item.label), value: Number(item.total) }))}
          actions={(
            <div className="segmented-control">
              <button className={enrollmentView === 'day' ? 'active' : ''} type="button" onClick={() => setEnrollmentView('day')}>Día</button>
              <button className={enrollmentView === 'month' ? 'active' : ''} type="button" onClick={() => setEnrollmentView('month')}>Mes</button>
            </div>
          )}
        />
        <DonutChart
          title="Cobranza"
          items={collectionMix}
          emptyText="Aún no hay cobranza registrada."
        />
      </section>

      <section className="analytics-grid secondary">
        <BarChart title="Top cursos" items={courseRevenue} valueFormat="money" />
        <DonutChart
          title="Pagos por estado"
          items={(data?.pagos_por_estado ?? []).map((item) => ({ label: normalizeStatus(item.label), value: Number(item.total) }))}
          emptyText="Aún no hay cuotas generadas."
        />
      </section>

      <section className="analytics-grid tertiary">
        <BarChart
          title="Recaudación por institución"
          items={(data?.recaudacion_por_institucion ?? []).map((item) => ({
            label: shortLabel(item.institucion, 22),
            value: Number(item.total),
          }))}
          valueFormat="money"
        />
        <BarChart
          title="Deuda por institución"
          items={(data?.deuda_por_institucion ?? []).map((item) => ({
            label: shortLabel(item.institucion, 22),
            value: Number(item.total),
          }))}
          valueFormat="money"
        />
        <DonutChart
          title="Tipo de producto"
          items={(data?.inscripciones_por_tipo_producto ?? []).map((item) => ({ label: normalizeStatus(item.label), value: Number(item.total) }))}
          emptyText="Sin inscripciones."
        />
      </section>
    </div>
  );
}

function StudentDashboard({ data }: { data: DashboardData | null | undefined }) {
  const metrics = data?.metricas ?? {};

  return (
    <div className="dashboard-stack analytics-dashboard">
      <section className="metrics-grid analytics-kpis">
        <Kpi icon="enrollments" label="Cursos" value={metrics.cursos_matriculados} />
        <Kpi icon="payments" label="Debo" value={metrics.saldo_pendiente} format="money" />
        <Kpi icon="payments" label="Cuotas pendientes" value={metrics.cuotas_pendientes} />
        <Kpi icon="chart" label="Módulos pendientes" value={metrics.modulos_pendientes} />
      </section>

      <section className="analytics-grid secondary">
        <article className="chart-panel">
          <ChartHeading title="Próximos pagos" />
          <SimpleTable
            emptyText="No tienes pagos pendientes."
            rows={(data?.proximos_pagos ?? []).map((payment) => ({
              title: `${payment.codigo} · Cuota ${payment.numero_cuota}`,
              detail: `${shortLabel(payment.nombre ?? '', 32)} · vence ${payment.fecha_vencimiento}`,
              value: formatValue(Number(payment.monto ?? 0), 'money'),
            }))}
          />
        </article>
        <DonutChart
          title="Mis pagos"
          items={(data?.pagos_por_estado ?? []).map((item) => ({ label: normalizeStatus(item.label), value: Number(item.total) }))}
          emptyText="Aún no tienes cuotas generadas."
        />
      </section>

      <section className="analytics-grid secondary">
        <article className="chart-panel">
          <ChartHeading title="Mis cursos" />
          <SimpleTable
            emptyText="No tienes cursos matriculados."
            rows={(data?.cursos_estudiante ?? []).map((course) => ({
              title: `${course.codigo} · ${shortLabel(course.nombre ?? '', 30)}`,
              detail: `${course.institucion} · ${normalizeStatus(course.estado ?? '')}`,
              value: formatValue(Number(course.saldo_pendiente ?? 0), 'money'),
            }))}
          />
        </article>
        <DonutChart
          title="Mis módulos"
          items={(data?.modulos_por_estado ?? []).map((item) => ({ label: normalizeStatus(item.label), value: Number(item.total) }))}
          emptyText="Aún no tienes módulos registrados."
        />
      </section>
    </div>
  );
}

function TeacherDashboard({ data }: { data: DashboardData | null | undefined }) {
  const metrics = data?.metricas ?? {};

  return (
    <div className="dashboard-stack analytics-dashboard">
      <section className="metrics-grid analytics-kpis">
        <Kpi icon="chart" label="Módulos" value={metrics.modulos_asignados} />
        <Kpi icon="products" label="Cursos" value={metrics.cursos_asignados} />
        <Kpi icon="students" label="Estudiantes" value={metrics.estudiantes_asignados} />
        <Kpi icon="enrollments" label="Pendientes" value={metrics.modulos_pendientes} />
      </section>

      <section className="analytics-grid secondary">
        <BarChart
          title="Cursos asignados"
          items={(data?.cursos_docente ?? []).map((course) => ({
            label: String(course.codigo ?? ''),
            sublabel: shortLabel(String(course.nombre ?? ''), 34),
            value: Number(course.estudiantes ?? 0),
          }))}
        />
        <DonutChart
          title="Módulos por estado"
          items={(data?.modulos_por_estado ?? []).map((item) => ({ label: normalizeStatus(item.label), value: Number(item.total) }))}
          emptyText="Aún no tienes módulos asignados."
        />
      </section>
    </div>
  );
}

function Kpi({ icon, label, value = 0, format = 'int' }: { icon: Parameters<typeof Icon>[0]['name']; label: string; value?: number; format?: 'money' | 'int' }) {
  return (
    <article className="metric-card">
      <span className="metric-icon"><Icon name={icon} /></span>
      <small>{label}</small>
      <strong>{formatValue(Number(value ?? 0), format)}</strong>
    </article>
  );
}

function SimpleTable({ rows, emptyText }: { rows: Array<{ title: string; detail: string; value: string }>; emptyText: string }) {
  if (rows.length === 0) return <p className="muted">{emptyText}</p>;

  return (
    <div className="simple-list">
      {rows.map((row) => (
        <div key={`${row.title}-${row.detail}`}>
          <span>
            <strong title={row.title}>{row.title}</strong>
            <small title={row.detail}>{row.detail}</small>
          </span>
          <b>{row.value}</b>
        </div>
      ))}
    </div>
  );
}

function BarChart({ title, items, valueFormat = 'int' }: { title: string; items: ChartItem[]; valueFormat?: 'money' | 'int' }) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <article className="chart-panel">
      <ChartHeading title={title} />
      {items.length === 0 ? <p className="muted">Sin datos para graficar.</p> : null}
      <div className="bar-list compact">
        {items.map((item) => (
          <div className="bar-row compact" key={`${item.label}-${item.value}`}>
            <div className="bar-label">
              <strong title={item.sublabel ? `${item.label} · ${item.sublabel}` : item.label}>{item.label}</strong>
              {item.sublabel ? <small title={item.sublabel}>{item.sublabel}</small> : null}
            </div>
            <div className="bar-track">
              <span style={{ width: `${Math.max(5, (item.value / max) * 100)}%` }} />
            </div>
            <strong className="bar-value">{formatValue(item.value, valueFormat)}</strong>
          </div>
        ))}
      </div>
    </article>
  );
}

function VerticalBarChart({ title, items, actions }: { title: string; items: ChartItem[]; actions?: ReactNode }) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <article className="chart-panel">
      <ChartHeading title={title} actions={actions} />
      <div className="vertical-bars">
        {items.map((item) => (
          <div className="vertical-bar" key={item.label}>
            <strong>{item.value}</strong>
            <span style={{ height: `${Math.max(4, (item.value / max) * 100)}%` }} />
            <small title={item.label}>{item.label}</small>
          </div>
        ))}
      </div>
    </article>
  );
}

function DonutChart({ title, items, emptyText }: { title: string; items: ChartItem[]; emptyText: string }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const stops = buildConicGradient(items, total);

  return (
    <article className="chart-panel">
      <ChartHeading title={title} />
      {total === 0 ? <p className="muted">{emptyText}</p> : (
        <div className="donut-layout">
          <div className="donut-chart" style={{ background: stops }}>
            <span>{formatValue(total, 'int')}</span>
          </div>
          <div className="donut-legend">
            {items.map((item, index) => (
              <div key={item.label}>
                <i style={{ background: palette[index % palette.length] }} />
                <span title={item.label}>{shortLabel(item.label, 18)}</span>
                <strong>{Math.round((item.value / total) * 100)}%</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

function ChartHeading({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <div className="chart-title split">
      <div>
        <Icon name="chart" />
        <h2>{title}</h2>
      </div>
      {actions}
    </div>
  );
}

function buildConicGradient(items: ChartItem[], total: number) {
  if (total === 0) return '#e8eeeb';
  let current = 0;
  const parts = items.map((item, index) => {
    const start = current;
    current += (item.value / total) * 100;
    return `${palette[index % palette.length]} ${start}% ${current}%`;
  });

  return `conic-gradient(${parts.join(', ')})`;
}

function formatValue(value: number, format: 'money' | 'int' = 'int') {
  if (format === 'money') {
    return `Bs ${new Intl.NumberFormat('es-BO', { maximumFractionDigits: 0 }).format(value)}`;
  }

  return new Intl.NumberFormat('es-BO', { maximumFractionDigits: 0 }).format(value);
}

function shortLabel(value: string, max = 24) {
  return value.length > max ? `${value.slice(0, max - 1)}...` : value;
}

function shortPeriod(value: string) {
  return value.replace(' 202', ' 2');
}

function normalizeStatus(value: string) {
  return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}
