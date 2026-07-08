/**
 * Sprints.gs
 * Sprints por squad. La capacidad se calcula por sprint a partir de su rango de fechas.
 */

function listSprints(squadId) {
  let items = readAll_(SHEETS.SPRINTS);
  if (squadId) items = items.filter(function (s) { return String(s.squadId) === String(squadId); });
  return items.sort(function (a, b) {
    return String(a.fechaInicio).localeCompare(String(b.fechaInicio));
  });
}

function getSprint(id) {
  return readAll_(SHEETS.SPRINTS).filter(function (s) { return String(s.id) === String(id); })[0] || null;
}

function saveSprint(data) {
  const obj = {
    id: data.id || newId_('sp'),
    squadId: data.squadId || '',
    nombre: (data.nombre || '').trim(),
    trimestre: (data.trimestre || '').trim(),
    fechaInicio: normalizarFecha_(data.fechaInicio),
    fechaFin: normalizarFecha_(data.fechaFin),
    estado: (data.estado || 'planificado').trim()
  };
  if (!obj.squadId) throw new Error('El sprint debe pertenecer a un squad.');
  if (!obj.nombre) throw new Error('El nombre del sprint es obligatorio.');
  if (!obj.fechaInicio || !obj.fechaFin) throw new Error('Debes indicar fecha de inicio y fin.');
  if (obj.fechaFin < obj.fechaInicio) throw new Error('La fecha fin no puede ser anterior a la de inicio.');
  return upsert_(SHEETS.SPRINTS, obj);
}

function deleteSprint(id) {
  return remove_(SHEETS.SPRINTS, id);
}

/** Deriva "2025-Q3" a partir de una fecha ISO. */
function trimestreDeFecha_(iso) {
  const d = parseIso_(iso);
  if (!d) return '';
  const q = Math.floor(d.getMonth() / 3) + 1;
  return d.getFullYear() + '-Q' + q;
}
