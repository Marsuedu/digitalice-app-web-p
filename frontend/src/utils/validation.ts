const labels: Record<string, string> = {
  id: 'ID',
  id_inscripcion: 'ID de inscripción',
  estudiante_id: 'estudiante',
  producto_id: 'producto académico',
  codigo: 'código',
  nombre: 'nombre',
  tipo: 'tipo',
  nombres: 'nombres',
  apellidos: 'apellidos',
  ci: 'CI',
  extension_ci: 'extensión de CI',
  celular: 'celular',
  correo: 'correo',
  correo_personal: 'correo personal',
  carrera: 'especialidad',
  pais: 'país',
  monto_total: 'monto total',
  cantidad_cuotas: 'cantidad de cuotas',
  fecha_vencimiento: 'fecha de vencimiento',
  fecha_pago: 'fecha de pago',
  monto_pagado: 'monto pagado',
  codigo_comprobante: 'código de comprobante',
  fecha_comprobante: 'fecha de comprobante',
};

export function firstMissing(data: Record<string, unknown>, fields: string[]) {
  const missing = fields.find((field) => {
    const value = data[field];
    return value === null || value === undefined || String(value).trim() === '';
  });

  return missing ? `Falta completar el campo ${labels[missing] ?? missing.replace(/_/g, ' ')}.` : '';
}
