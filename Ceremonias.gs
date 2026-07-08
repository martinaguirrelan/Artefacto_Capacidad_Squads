/**
 * Ceremonias.gs
 * Eventos ágiles por squad que consumen capacidad de cada miembro por sprint.
 * Horas totales por sprint = duracionHoras * ocurrencias.
 */

/** Ceremonias por defecto de un sprint de 2 semanas (duración en horas). */
const CEREMONIAS_DEFAULT = [
  { nombre: 'Daily',            duracionHoras: 0.25, ocurrencias: 10 },
  { nombre: 'Sprint Planning',  duracionHoras: 4,    ocurrencias: 1 },
  { nombre: 'Refinement',       duracionHoras: 1.5,  ocurrencias: 2 },
  { nombre: 'Sprint Review',    duracionHoras: 2,    ocurrencias: 1 },
  { nombre: 'Retrospectiva',    duracionHoras: 1.5,  ocurrencias: 1 }
];

function listCeremonias(squadId) {
  let items = readAll_(SHEETS.CEREMONIAS);
  if (squadId) items = items.filter(function (c) { return String(c.squadId) === String(squadId); });
  return items;
}

function saveCeremonia(data) {
  const obj = {
    id: data.id || newId_('ce'),
    squadId: data.squadId || '',
    nombre: (data.nombre || '').trim(),
    duracionHoras: Number(data.duracionHoras) || 0,
    ocurrencias: Number(data.ocurrencias) || 0,
    activo: data.activo === false || data.activo === 'NO' ? 'NO' : 'SI'
  };
  if (!obj.squadId) throw new Error('La ceremonia debe pertenecer a un squad.');
  if (!obj.nombre) throw new Error('El nombre de la ceremonia es obligatorio.');
  return upsert_(SHEETS.CEREMONIAS, obj);
}

function deleteCeremonia(id) {
  return remove_(SHEETS.CEREMONIAS, id);
}

/** Crea el set de ceremonias por defecto para un squad (si no tiene ninguna). */
function crearCeremoniasDefault(squadId) {
  if (listCeremonias(squadId).length > 0) return 0;
  CEREMONIAS_DEFAULT.forEach(function (c) {
    saveCeremonia({ squadId: squadId, nombre: c.nombre, duracionHoras: c.duracionHoras, ocurrencias: c.ocurrencias });
  });
  return CEREMONIAS_DEFAULT.length;
}

/** Total de horas de ceremonias activas por miembro y por sprint en un squad. */
function horasCeremoniasSquad_(squadId) {
  return listCeremonias(squadId)
    .filter(function (c) { return String(c.activo) !== 'NO'; })
    .reduce(function (acc, c) {
      return acc + (Number(c.duracionHoras) || 0) * (Number(c.ocurrencias) || 0);
    }, 0);
}
