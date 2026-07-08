/**
 * Miembros.gs
 * Team Members de cada squad. Pueden sobreescribir horas/día y definir un
 * factor de dedicación (factorFocus, 0–100 %) para personas compartidas.
 */

function listMiembros(squadId) {
  let items = readAll_(SHEETS.MIEMBROS);
  if (squadId) items = items.filter(function (m) { return String(m.squadId) === String(squadId); });
  return items.sort(function (a, b) { return String(a.nombre).localeCompare(String(b.nombre)); });
}

function getMiembro(id) {
  return readAll_(SHEETS.MIEMBROS).filter(function (m) { return String(m.id) === String(id); })[0] || null;
}

function saveMiembro(data) {
  const obj = {
    id: data.id || newId_('mb'),
    squadId: data.squadId || '',
    nombre: (data.nombre || '').trim(),
    email: (data.email || '').trim().toLowerCase(),
    rol: (data.rol || '').trim(),
    horasDia: data.horasDia === '' || data.horasDia == null ? '' : Number(data.horasDia),
    factorFocus: data.factorFocus === '' || data.factorFocus == null ? 100 : Number(data.factorFocus),
    activo: data.activo === false || data.activo === 'NO' ? 'NO' : 'SI',
    creadoEn: data.creadoEn || hoyIso_()
  };
  if (!obj.squadId) throw new Error('El miembro debe pertenecer a un squad.');
  if (!obj.nombre) throw new Error('El nombre del miembro es obligatorio.');
  return upsert_(SHEETS.MIEMBROS, obj);
}

function deleteMiembro(id) {
  // Elimina también las ausencias asociadas.
  readAll_(SHEETS.AUSENCIAS)
    .filter(function (a) { return String(a.miembroId) === String(id); })
    .forEach(function (a) { remove_(SHEETS.AUSENCIAS, a.id); });
  return remove_(SHEETS.MIEMBROS, id);
}

/** Horas/día efectivas de un miembro (override propio o default del squad). */
function horasDiaMiembro_(miembro, squad) {
  const propio = Number(miembro.horasDia);
  if (propio > 0) return propio;
  const s = Number(squad && squad.horasDia);
  return s > 0 ? s : HORAS_DIA_DEFAULT;
}

/** Factor de dedicación en fracción 0–1. */
function factorFocusMiembro_(miembro) {
  const f = Number(miembro.factorFocus);
  if (!isFinite(f) || f <= 0) return 1;
  return Math.min(f, 100) / 100;
}
