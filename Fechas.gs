/**
 * Fechas.gs
 * Utilidades de fechas. Trabajamos siempre con cadenas ISO 'YYYY-MM-DD' para
 * evitar problemas de zona horaria al leer/escribir en Sheets.
 */

/** Convierte un valor (Date o string) a ISO 'YYYY-MM-DD'. Devuelve '' si no es válido. */
function normalizarFecha_(valor) {
  if (valor === null || valor === undefined || valor === '') return '';
  if (Object.prototype.toString.call(valor) === '[object Date]') {
    return Utilities.formatDate(valor, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  const s = String(valor).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return m[1] + '-' + m[2] + '-' + m[3];
  // Formato dd/mm/yyyy.
  const m2 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m2) {
    const dd = ('0' + m2[1]).slice(-2), mm = ('0' + m2[2]).slice(-2);
    return m2[3] + '-' + mm + '-' + dd;
  }
  return '';
}

/** Parsea un ISO 'YYYY-MM-DD' a un objeto Date (mediodía UTC, sin desfases). */
function parseIso_(iso) {
  const s = normalizarFecha_(iso);
  if (!s) return null;
  const p = s.split('-');
  return new Date(Date.UTC(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 12, 0, 0));
}

/** Días entre dos ISO (inclusive). */
function diasEntre_(isoA, isoB) {
  const a = parseIso_(isoA), b = parseIso_(isoB);
  if (!a || !b) return 0;
  return Math.round((b - a) / 86400000) + 1;
}

/**
 * Cuenta días hábiles (lun–vie) entre dos ISO inclusive, excluyendo feriados.
 * @param {string[]} feriadosSet  Array de ISO de feriados a excluir.
 */
function diasHabiles_(isoInicio, isoFin, feriadosSet) {
  const ini = parseIso_(isoInicio), fin = parseIso_(isoFin);
  if (!ini || !fin || fin < ini) return 0;
  const feriados = feriadosSet || [];
  let count = 0;
  const cur = new Date(ini.getTime());
  while (cur <= fin) {
    const dow = cur.getUTCDay(); // 0 dom, 6 sáb
    const iso = Utilities.formatDate(cur, 'UTC', 'yyyy-MM-dd');
    if (dow !== 0 && dow !== 6 && feriados.indexOf(iso) === -1) count++;
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return count;
}

/** Intersección de dos rangos ISO. Devuelve {inicio, fin} o null si no se solapan. */
function interseccionRango_(aIni, aFin, bIni, bFin) {
  const ini = normalizarFecha_(aIni) > normalizarFecha_(bIni) ? normalizarFecha_(aIni) : normalizarFecha_(bIni);
  const fin = normalizarFecha_(aFin) < normalizarFecha_(bFin) ? normalizarFecha_(aFin) : normalizarFecha_(bFin);
  if (!ini || !fin || fin < ini) return null;
  return { inicio: ini, fin: fin };
}
