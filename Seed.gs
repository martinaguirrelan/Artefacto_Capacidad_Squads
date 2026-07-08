/**
 * Seed.gs
 * Datos de ejemplo para probar la herramienta rápidamente.
 */

function sembrarEjemplo() {
  setupSpreadsheet();
  const res = { squads: 0, miembros: 0, ceremonias: 0, sprints: 0, ausencias: 0 };

  // Squad de ejemplo (idempotente por nombre).
  let squad = listSquads().filter(function (s) { return s.nombre === 'Squad Pagos'; })[0];
  if (!squad) {
    squad = saveSquad({ nombre: 'Squad Pagos', gerencia: 'Tecnología', horasDia: 8, diasSprint: 10,
      descripcion: 'Squad de ejemplo' });
    res.squads++;
  }

  // Ceremonias por defecto.
  res.ceremonias += crearCeremoniasDefault(squad.id);

  // Miembros.
  const miembrosEjemplo = [
    { nombre: 'Ana Torres',   rol: 'Product Owner',    factorFocus: 100 },
    { nombre: 'Luis Ramírez', rol: 'Scrum Master',     factorFocus: 100 },
    { nombre: 'María Díaz',   rol: 'Dev Backend',      factorFocus: 100 },
    { nombre: 'Jorge Pérez',  rol: 'Dev Frontend',     factorFocus: 100 },
    { nombre: 'Carla Ruiz',   rol: 'QA',               factorFocus: 50 }
  ];
  const existentes = listMiembros(squad.id).map(function (m) { return m.nombre; });
  const creados = [];
  miembrosEjemplo.forEach(function (m) {
    if (existentes.indexOf(m.nombre) !== -1) return;
    const guardado = saveMiembro({ squadId: squad.id, nombre: m.nombre, rol: m.rol, factorFocus: m.factorFocus });
    creados.push(guardado);
    res.miembros++;
  });

  // Sprints del trimestre en curso (2 sprints de 2 semanas).
  if (listSprints(squad.id).length === 0) {
    const s1 = saveSprint({ squadId: squad.id, nombre: 'Sprint 1', fechaInicio: '2026-07-07', fechaFin: '2026-07-18',
      trimestre: '2026-Q3', estado: 'activo' });
    const s2 = saveSprint({ squadId: squad.id, nombre: 'Sprint 2', fechaInicio: '2026-07-21', fechaFin: '2026-08-01',
      trimestre: '2026-Q3', estado: 'planificado' });
    res.sprints += 2;

    // Ausencias de ejemplo sobre los miembros recién creados.
    const ana = creados.filter(function (m) { return m.nombre === 'Ana Torres'; })[0];
    const luis = creados.filter(function (m) { return m.nombre === 'Luis Ramírez'; })[0];
    if (ana) {
      saveAusencia({ miembroId: ana.id, tipo: 'vacaciones', fechaInicio: '2026-07-14', fechaFin: '2026-07-16',
        diaCompleto: 'SI', descripcion: 'Vacaciones' });
      res.ausencias++;
    }
    if (luis) {
      saveAusencia({ miembroId: luis.id, tipo: 'curso', fechaInicio: '2026-07-09', fechaFin: '2026-07-09',
        diaCompleto: 'NO', horas: 4, descripcion: 'Certificación' });
      res.ausencias++;
    }
  }

  return res;
}
