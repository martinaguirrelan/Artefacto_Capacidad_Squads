/**
 * Capacidad.gs
 * Motor de cálculo de capacidad y agregaciones para el dashboard.
 *
 * Modelo por miembro y sprint (en horas):
 *   bruto      = díasHábiles(sprint) × horas/día × factorFocus
 *   ceremonias = Σ(duración × ocurrencias) del squad × factorFocus
 *   ausencias  = Σ horas de ausencias que caen en el sprint
 *   neto       = max(0, bruto − ceremonias − ausencias)
 *   disponibilidad % = neto / bruto
 */

/**
 * Capacidad detallada de un squad en un sprint.
 * @return {Object} { squad, sprint, diasHabiles, totales, miembros[] }
 */
function capacidadSprint(squadId, sprintId) {
  const squad = getSquad(squadId);
  const sprint = getSprint(sprintId);
  if (!squad) throw new Error('Squad no encontrado.');
  if (!sprint) throw new Error('Sprint no encontrado.');

  const feriados = feriadosSet_();
  const diasHabiles = diasHabiles_(sprint.fechaInicio, sprint.fechaFin, feriados);
  const horasCeremoniasBase = horasCeremoniasSquad_(squadId);

  const miembros = listMiembros(squadId).filter(function (m) { return String(m.activo) !== 'NO'; });
  const ausenciasSquad = listAusencias({ squadId: squadId });

  const detalle = miembros.map(function (m) {
    const hd = horasDiaMiembro_(m, squad);
    const ff = factorFocusMiembro_(m);
    const bruto = diasHabiles * hd * ff;
    const ceremonias = horasCeremoniasBase * ff;

    // Desglose de ausencias por tipo.
    const porTipo = { vacaciones: 0, curso: 0, evento: 0, chapter: 0 };
    ausenciasSquad
      .filter(function (a) { return String(a.miembroId) === String(m.id); })
      .forEach(function (a) {
        const h = horasAusenciaEnSprint_(a, sprint, hd, feriados);
        if (h > 0 && porTipo.hasOwnProperty(a.tipo)) porTipo[a.tipo] += h;
      });
    const ausencias = porTipo.vacaciones + porTipo.curso + porTipo.evento + porTipo.chapter;

    const neto = Math.max(0, bruto - ceremonias - ausencias);
    return {
      id: m.id,
      nombre: m.nombre,
      rol: m.rol,
      horasDia: hd,
      factorFocus: Math.round(ff * 100),
      bruto: round1_(bruto),
      ceremonias: round1_(ceremonias),
      ausencias: round1_(ausencias),
      ausenciasPorTipo: {
        vacaciones: round1_(porTipo.vacaciones),
        curso: round1_(porTipo.curso),
        evento: round1_(porTipo.evento),
        chapter: round1_(porTipo.chapter)
      },
      neto: round1_(neto),
      disponibilidad: bruto > 0 ? Math.round((neto / bruto) * 100) : 0
    };
  });

  const totales = detalle.reduce(function (acc, d) {
    acc.bruto += d.bruto; acc.ceremonias += d.ceremonias;
    acc.ausencias += d.ausencias; acc.neto += d.neto;
    acc.vacaciones += d.ausenciasPorTipo.vacaciones;
    acc.curso += d.ausenciasPorTipo.curso;
    acc.evento += d.ausenciasPorTipo.evento;
    acc.chapter += d.ausenciasPorTipo.chapter;
    return acc;
  }, { bruto: 0, ceremonias: 0, ausencias: 0, neto: 0, vacaciones: 0, curso: 0, evento: 0, chapter: 0 });

  Object.keys(totales).forEach(function (k) { totales[k] = round1_(totales[k]); });
  totales.disponibilidad = totales.bruto > 0 ? Math.round((totales.neto / totales.bruto) * 100) : 0;
  totales.miembros = detalle.length;

  return {
    squad: squad,
    sprint: sprint,
    diasHabiles: diasHabiles,
    horasCeremonias: round1_(horasCeremoniasBase),
    totales: totales,
    miembros: detalle
  };
}

/** Redondeo a 1 decimal. */
function round1_(n) {
  return Math.round((Number(n) || 0) * 10) / 10;
}

/**
 * Payload inicial para el cliente: todo lo necesario para arrancar la app.
 */
function getBootstrap() {
  const squads = listSquads();
  return {
    usuario: getUsuarioActual(),
    squads: squads,
    tiposAusencia: listTiposAusencia(),
    feriados: listFeriados()
  };
}

/**
 * Datos de un squad para las pestañas de configuración y dashboard.
 */
function getDatosSquad(squadId) {
  return {
    squad: getSquad(squadId),
    miembros: listMiembros(squadId),
    ceremonias: listCeremonias(squadId),
    sprints: listSprints(squadId),
    ausencias: listAusencias({ squadId: squadId })
  };
}

/**
 * Vista de vacaciones/ausencias de un squad en un trimestre, agrupada por miembro.
 * Útil para el timeline del dashboard.
 */
function getAusenciasTrimestre(squadId, trimestre) {
  const miembros = listMiembros(squadId);
  const nombreDe = {};
  miembros.forEach(function (m) { nombreDe[String(m.id)] = m.nombre; });

  let ausencias = listAusencias({ squadId: squadId });
  if (trimestre) {
    ausencias = ausencias.filter(function (a) {
      return trimestreDeFecha_(a.fechaInicio) === trimestre || trimestreDeFecha_(a.fechaFin) === trimestre;
    });
  }
  return ausencias.map(function (a) {
    return {
      id: a.id,
      miembroId: a.miembroId,
      miembro: nombreDe[String(a.miembroId)] || '(desconocido)',
      tipo: a.tipo,
      tipoLabel: TIPOS_AUSENCIA[a.tipo] || a.tipo,
      fechaInicio: normalizarFecha_(a.fechaInicio),
      fechaFin: normalizarFecha_(a.fechaFin),
      dias: diasEntre_(a.fechaInicio, a.fechaFin),
      diaCompleto: a.diaCompleto,
      horas: a.horas,
      descripcion: a.descripcion
    };
  });
}
