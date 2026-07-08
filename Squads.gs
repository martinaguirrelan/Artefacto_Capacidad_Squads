/**
 * Squads.gs
 * Catálogo de Squads. Cada squad define sus horas/día y días de sprint por defecto.
 */

const HORAS_DIA_DEFAULT = 8;
const DIAS_SPRINT_DEFAULT = 10;

function listSquads() {
  return readAll_(SHEETS.SQUADS).sort(function (a, b) {
    return String(a.nombre).localeCompare(String(b.nombre));
  });
}

function getSquad(id) {
  return listSquads().filter(function (s) { return String(s.id) === String(id); })[0] || null;
}

function saveSquad(data) {
  const obj = {
    id: data.id || newId_('sq'),
    nombre: (data.nombre || '').trim(),
    gerencia: (data.gerencia || '').trim(),
    horasDia: Number(data.horasDia) > 0 ? Number(data.horasDia) : HORAS_DIA_DEFAULT,
    diasSprint: Number(data.diasSprint) > 0 ? Number(data.diasSprint) : DIAS_SPRINT_DEFAULT,
    descripcion: (data.descripcion || '').trim(),
    creadoEn: data.creadoEn || hoyIso_()
  };
  if (!obj.nombre) throw new Error('El nombre del squad es obligatorio.');
  return upsert_(SHEETS.SQUADS, obj);
}

function deleteSquad(id) {
  // Limpieza en cascada: miembros, ceremonias y sprints del squad.
  const miembros = readAll_(SHEETS.MIEMBROS).filter(function (m) { return String(m.squadId) === String(id); });
  miembros.forEach(function (m) { deleteMiembro(m.id); });
  readAll_(SHEETS.CEREMONIAS)
    .filter(function (c) { return String(c.squadId) === String(id); })
    .forEach(function (c) { remove_(SHEETS.CEREMONIAS, c.id); });
  readAll_(SHEETS.SPRINTS)
    .filter(function (s) { return String(s.squadId) === String(id); })
    .forEach(function (s) { remove_(SHEETS.SPRINTS, s.id); });
  return remove_(SHEETS.SQUADS, id);
}
