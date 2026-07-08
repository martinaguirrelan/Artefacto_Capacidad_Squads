/**
 * Feriados.gs
 * Catálogo de feriados (no laborables). Se excluyen del conteo de días hábiles.
 */

function listFeriados() {
  return readAll_(SHEETS.FERIADOS).sort(function (a, b) {
    return normalizarFecha_(a.fecha).localeCompare(normalizarFecha_(b.fecha));
  });
}

/** Array simple de fechas ISO de feriados, para el motor de capacidad. */
function feriadosSet_() {
  return listFeriados().map(function (f) { return normalizarFecha_(f.fecha); });
}

function saveFeriado(data) {
  const obj = {
    id: data.id || newId_('fe'),
    fecha: normalizarFecha_(data.fecha),
    descripcion: (data.descripcion || '').trim()
  };
  if (!obj.fecha) throw new Error('La fecha del feriado es obligatoria.');
  return upsert_(SHEETS.FERIADOS, obj);
}

function deleteFeriado(id) {
  return remove_(SHEETS.FERIADOS, id);
}

/** Feriados nacionales de Perú (mes-día fijos). No incluye los movibles. */
const FERIADOS_PERU = [
  ['01-01', 'Año Nuevo'],
  ['05-01', 'Día del Trabajo'],
  ['06-29', 'San Pedro y San Pablo'],
  ['07-23', 'Día de la Fuerza Aérea'],
  ['07-28', 'Fiestas Patrias'],
  ['07-29', 'Fiestas Patrias'],
  ['08-06', 'Batalla de Junín'],
  ['08-30', 'Santa Rosa de Lima'],
  ['10-08', 'Combate de Angamos'],
  ['11-01', 'Día de Todos los Santos'],
  ['12-08', 'Inmaculada Concepción'],
  ['12-09', 'Batalla de Ayacucho'],
  ['12-25', 'Navidad']
];

/** Carga los feriados fijos de Perú del año en curso (idempotente por fecha). */
function sembrarFeriadosPeru() {
  const anio = new Date().getFullYear();
  const existentes = feriadosSet_();
  let agregados = 0, omitidos = 0;
  FERIADOS_PERU.forEach(function (f) {
    const iso = anio + '-' + f[0];
    if (existentes.indexOf(iso) !== -1) { omitidos++; return; }
    saveFeriado({ fecha: iso, descripcion: f[1] });
    agregados++;
  });
  return { anio: anio, agregados: agregados, omitidos: omitidos };
}
