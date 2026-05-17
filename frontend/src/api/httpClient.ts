import type { ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api';

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
      ...options,
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Verifica que Docker esté levantado y que la API esté disponible.');
  }

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;
  if (!payload) {
    throw new Error('El servidor respondió con un formato inesperado. Intenta nuevamente.');
  }
  if (!response.ok || !payload.success) {
    const details = hasErrors(payload.errors) ? formatValidationErrors(payload.errors) : payload.message;
    throw new Error(details || 'No se pudo completar la operación');
  }

  return payload.data;
}

function hasErrors(errors: ApiResponse<unknown>['errors']): errors is Record<string, string> {
  return Boolean(errors && Object.keys(errors).length > 0);
}

function formatValidationErrors(errors: Record<string, string>) {
  return Object.entries(errors)
    .map(([field, message]) => {
      const label = fieldLabels[field] ?? field.replace(/_/g, ' ');
      if (message.toLowerCase().includes('obligatorio')) {
        return `Falta completar el campo ${label}.`;
      }
      return `${label}: ${message}`;
    })
    .join(' ');
}

const fieldLabels: Record<string, string> = {
  id: 'ID',
  inscripcion_id: 'ID de inscripción',
  estudiante_id: 'estudiante',
  producto_id: 'producto académico',
  metodo_pago: 'método de pago',
  monto_total: 'monto total',
  monto_base: 'monto del curso',
  descuento: 'descuento',
  cantidad_cuotas: 'cantidad de cuotas',
  comprometido_pago: 'compromiso de pago',
  fecha_pago: 'fecha de pago',
  monto_pagado: 'monto pagado',
  entidad_facturadora: 'entidad facturadora',
  estado_factura: 'estado de factura',
  codigo_comprobante: 'código de comprobante',
  fecha_comprobante: 'fecha de comprobante',
  correo_personal: 'correo personal',
  correo: 'correo',
  password: 'contraseña',
  nombres: 'nombres',
  apellidos: 'apellidos',
  ci: 'CI',
  extension_ci: 'extensión de CI',
  celular: 'celular',
};
