/**
 * Ausencias.gs
 * Registro de reducciones de capacidad por miembro: vacaciones, cursos,
 * eventos trimestrales y sesiones de chapter.
 *
 * - diaCompleto = 'SI': consume días hábiles completos del rango (× horas/día del miembro).
 * - diaCompleto = 'NO': consume 'horas' fijas, atribuidas al sprint que contiene la fecha de inicio.
 */

const TIPOS_AUSENCIA = {
  vacaciones: 'Vacaciones',
  curso:      'Curso / Capacitación',
  evento:     'Evento trimestral',
  chapter:    'Sesión de Chapter'
};

function listTiposAusencia() {
  return Object.keys(TIPOS_AUSENCIA).map(function (k) {
    return { id: k, nombre: TIPOS_AUSENCIA[k] };
  });
}

function listAusencias(filtros) {
  filtros = filtros || {};
  let items = readAll_(SHEETS.AUSENCIAS);
  if (filtros.miembroId) {
    items = items.filter(function (a) { return String(a.miembroId) === String(filtros.miembroId); });
  }
  if (filtros.squadId) {
    const ids = listMiembros(filtros.squadId).map(function (m) { return String(m.id); });
    items = items.filter(function (a) { return ids.indexOf(String(a.miembroId)) !== -1; });
  }
  return items.sort(function (a, b) {
    return normalizarFecha_(a.fechaInicio).localeCompare(normalizarFecha_(b.fechaInicio));
  });
}

function saveAusencia(data) {
  const diaCompleto = data.diaCompleto === false || String(data.diaCompleto) === 'NO' ? 'NO' : 'SI';
  const obj = {
    id: data.id || newId_('au'),
    miembroId: data.miembroId || '',
    tipo: (data.tipo || 'vacaciones').trim(),
    fechaInicio: normalizarFecha_(data.fechaInicio),
    fechaFin: normalizarFecha_(data.fechaFin) || normalizarFecha_(data.fechaInicio),
    diaCompleto: diaCompleto,
    horas: diaCompleto === 'NO' ? (Number(data.horas) || 0) : '',
    descripcion: (data.descripcion || '').trim(),
    creadoEn: data.creadoEn || hoyIso_()
  };
  if (!obj.miembroId) throw new Error('La ausencia debe asociarse a un miembro.');
  if (!TIPOS_AUSENCIA[obj.tipo]) throw new Error('Tipo de ausencia inválido.');
  if (!obj.fechaInicio) throw new Error('Debes indicar la fecha de inicio.');
  if (obj.fechaFin < obj.fechaInicio) throw new Error('La fecha fin no puede ser anterior a la de inicio.');
  if (diaCompleto === 'NO' && obj.horas <= 0) throw new Error('Indica las horas de la ausencia.');
  return upsert_(SHEETS.AUSENCIAS, obj);
}

function deleteAusencia(id) {
  return remove_(SHEETS.AUSENCIAS, id);
}

/**
 * Horas consumidas por una ausencia dentro de un sprint concreto.
 * @param {Object} ausencia  Registro de ausencia.
 * @param {Object} sprint    Registro de sprint.
 * @param {number} horasDiaMiembro  Horas/día efectivas del miembro.
 * @param {string[]} feriados  Fechas ISO de feriados.
 */
function horasAusenciaEnSprint_(ausencia, sprint, horasDiaMiembro, feriados) {
  if (String(ausencia.diaCompleto) === 'NO') {
    // Horas fijas: se atribuyen al sprint que contiene la fecha de inicio.
    const ini = normalizarFecha_(ausencia.fechaInicio);
    if (ini >= normalizarFecha_(sprint.fechaInicio) && ini <= normalizarFecha_(sprint.fechaFin)) {
      return Number(ausencia.horas) || 0;
    }
    return 0;
  }
  const inter = interseccionRango_(ausencia.fechaInicio, ausencia.fechaFin, sprint.fechaInicio, sprint.fechaFin);
  if (!inter) return 0;
  const dias = diasHabiles_(inter.inicio, inter.fin, feriados);
  return dias * horasDiaMiembro;
}
