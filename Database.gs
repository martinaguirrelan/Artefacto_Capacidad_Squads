/**
 * Database.gs
 * Capa de acceso a datos. Cada "tabla" es una hoja del Spreadsheet contenedor.
 * La primera fila de cada hoja son las cabeceras (headers) y actúa como esquema.
 *
 * Herramienta de Capacidad de Squads Ágiles.
 */

const SHEETS = {
  SQUADS: {
    name: 'Squads',
    headers: ['id', 'nombre', 'gerencia', 'horasDia', 'diasSprint', 'descripcion', 'creadoEn']
  },
  MIEMBROS: {
    name: 'Miembros',
    // horasDia y factorFocus permiten override por persona (si vacíos, hereda del squad / 100%).
    headers: ['id', 'squadId', 'nombre', 'email', 'rol', 'horasDia', 'factorFocus', 'activo', 'creadoEn']
  },
  CEREMONIAS: {
    name: 'Ceremonias',
    // horas totales por sprint = duracionHoras * ocurrencias.
    headers: ['id', 'squadId', 'nombre', 'duracionHoras', 'ocurrencias', 'activo']
  },
  SPRINTS: {
    name: 'Sprints',
    headers: ['id', 'squadId', 'nombre', 'trimestre', 'fechaInicio', 'fechaFin', 'estado']
  },
  AUSENCIAS: {
    name: 'Ausencias',
    // tipo: vacaciones | curso | evento | chapter
    // diaCompleto: SI => consume días hábiles completos; NO => consume 'horas' fijas.
    headers: ['id', 'miembroId', 'tipo', 'fechaInicio', 'fechaFin', 'diaCompleto', 'horas', 'descripcion', 'creadoEn']
  },
  FERIADOS: {
    name: 'Feriados',
    headers: ['id', 'fecha', 'descripcion']
  },
  USUARIOS: {
    name: 'Usuarios',
    headers: ['email', 'rol', 'squadId']
  }
};

/**
 * ID del Spreadsheet contenedor. Se usa como respaldo cuando la app corre como
 * Web App (doGet): en ese contexto no hay "hoja activa" y
 * SpreadsheetApp.getActiveSpreadsheet() devuelve null.
 * Si despliegas sobre otra hoja, ejecuta guardarSpreadsheetId() una vez desde
 * el menú/editor (con la hoja abierta) o reemplaza este valor por tu ID.
 */
const SPREADSHEET_ID_FALLBACK = '12r3unuNPo-YaLnU0yJynWsj1APS_XJ9Rw8crRBNglGI';

/** Devuelve el Spreadsheet contenedor (activo o, si no, abierto por ID). */
function getSpreadsheet_() {
  const activo = SpreadsheetApp.getActiveSpreadsheet();
  if (activo) return activo;
  const propId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  const id = propId || SPREADSHEET_ID_FALLBACK;
  if (!id) throw new Error('No se pudo determinar el Spreadsheet contenedor.');
  return SpreadsheetApp.openById(id);
}

/** Guarda el ID de la hoja activa en Script Properties (ejecutar con la hoja abierta). */
function guardarSpreadsheetId() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Ejecútalo desde la hoja (Extensiones → Apps Script) con la hoja abierta.');
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', ss.getId());
  return ss.getId();
}

/**
 * Garantiza que existan todas las hojas con sus cabeceras.
 * Idempotente: se puede ejecutar tantas veces como se quiera.
 */
function setupSpreadsheet() {
  const ss = getSpreadsheet_();
  Object.keys(SHEETS).forEach(function (key) {
    const def = SHEETS[key];
    let sheet = ss.getSheetByName(def.name);
    if (!sheet) {
      sheet = ss.insertSheet(def.name);
    }
    const range = sheet.getRange(1, 1, 1, def.headers.length);
    range.setValues([def.headers]);
    range.setFontWeight('bold');
    sheet.setFrozenRows(1);
  });
  // Eliminar hoja por defecto vacía si quedó suelta.
  const defaultSheet = ss.getSheetByName('Hoja 1') || ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 3) {
    ss.deleteSheet(defaultSheet);
  }
  return true;
}

function getSheet_(def) {
  const sheet = getSpreadsheet_().getSheetByName(def.name);
  if (!sheet) {
    setupSpreadsheet();
    return getSpreadsheet_().getSheetByName(def.name);
  }
  return sheet;
}

/** Lee todas las filas de una hoja como array de objetos {header: valor}. */
function readAll_(def) {
  const sheet = getSheet_(def);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const numCols = def.headers.length;
  const values = sheet.getRange(2, 1, lastRow - 1, numCols).getValues();
  return values
    .filter(function (row) { return row[0] !== '' && row[0] !== null; })
    .map(function (row) { return rowToObject_(def.headers, row); });
}

function rowToObject_(headers, row) {
  const obj = {};
  headers.forEach(function (h, i) { obj[h] = normalizarCelda_(row[i]); });
  return obj;
}

/**
 * Normaliza el valor de una celda a un tipo serializable por google.script.run.
 * En particular convierte Date -> 'yyyy-MM-dd' (todas nuestras fechas son de
 * día completo). Los objetos Date sin convertir pueden hacer que el objeto
 * devuelto llegue como null al cliente.
 */
function normalizarCelda_(v) {
  if (Object.prototype.toString.call(v) === '[object Date]') {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return v;
}

function objectToRow_(headers, obj) {
  return headers.map(function (h) {
    return obj[h] === undefined || obj[h] === null ? '' : obj[h];
  });
}

/** Busca el índice de fila (1-based en la hoja) de un registro por id (col 1). */
function findRowIndexById_(def, id) {
  const sheet = getSheet_(def);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2; // +2: fila 1 son headers
  }
  return -1;
}

/** Inserta un objeto como nueva fila. Devuelve el objeto guardado. */
function insert_(def, obj) {
  const sheet = getSheet_(def);
  sheet.appendRow(objectToRow_(def.headers, obj));
  return obj;
}

/** Actualiza (upsert) por id. Si no existe, inserta. Devuelve el objeto. */
function upsert_(def, obj) {
  const rowIndex = findRowIndexById_(def, obj.id);
  if (rowIndex === -1) return insert_(def, obj);
  const sheet = getSheet_(def);
  sheet.getRange(rowIndex, 1, 1, def.headers.length)
    .setValues([objectToRow_(def.headers, obj)]);
  return obj;
}

/** Elimina un registro por id. Devuelve true si eliminó. */
function remove_(def, id) {
  const rowIndex = findRowIndexById_(def, id);
  if (rowIndex === -1) return false;
  getSheet_(def).deleteRow(rowIndex);
  return true;
}

/** Genera un id único corto y ordenable por tiempo. */
function newId_(prefix) {
  const stamp = new Date().getTime().toString(36);
  const rand = Math.floor(Math.random() * 1e6).toString(36);
  return (prefix || 'id') + '_' + stamp + rand;
}

/** ISO 'YYYY-MM-DD' de hoy en la zona del script. */
function hoyIso_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}
