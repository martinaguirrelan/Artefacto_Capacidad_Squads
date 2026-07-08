/**
 * Code.gs
 * Punto de entrada: menú del Spreadsheet y publicación de la Web App.
 */

/** Menú personalizado al abrir la hoja. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Capacidad Squads')
    .addItem('Inicializar hojas', 'setupSpreadsheet')
    .addItem('Abrir panel (sidebar)', 'abrirSidebar')
    .addSeparator()
    .addItem('Cargar datos de ejemplo', 'menuSembrar')
    .addItem('Cargar feriados Perú (año actual)', 'menuFeriados')
    .addSeparator()
    .addItem('Registrar administrador…', 'menuAgregarAdmin')
    .addToUi();
}

/** Acción de menú: registra un email como administrador. */
function menuAgregarAdmin() {
  const ui = SpreadsheetApp.getUi();
  const resp = ui.prompt(
    'Registrar administrador',
    'Email de la persona que será administrador (verá y editará todos los squads):',
    ui.ButtonSet.OK_CANCEL);
  if (resp.getSelectedButton() !== ui.Button.OK) return;
  const email = (resp.getResponseText() || '').trim();
  if (!email) { ui.alert('No se ingresó ningún email.'); return; }
  saveUsuario({ email: email, rol: 'admin', squadId: '' });
  ui.alert('Listo', 'Se registró "' + email.toLowerCase() + '" como administrador.', ui.ButtonSet.OK);
}

/** Acción de menú: carga los datos de ejemplo (con confirmación). */
function menuSembrar() {
  const ui = SpreadsheetApp.getUi();
  const resp = ui.alert(
    'Cargar datos de ejemplo',
    'Se creará un squad de ejemplo con miembros, ceremonias, un par de sprints y algunas ausencias. ' +
    'Los registros que ya existan por id se omiten.\n\n¿Continuar?',
    ui.ButtonSet.OK_CANCEL);
  if (resp !== ui.Button.OK) return;
  const r = sembrarEjemplo();
  ui.alert('Carga completada',
    'Squads: ' + r.squads + '\nMiembros: ' + r.miembros + '\nCeremonias: ' + r.ceremonias +
    '\nSprints: ' + r.sprints + '\nAusencias: ' + r.ausencias,
    ui.ButtonSet.OK);
}

/** Acción de menú: carga feriados de Perú del año en curso. */
function menuFeriados() {
  const r = sembrarFeriadosPeru();
  SpreadsheetApp.getUi().alert('Feriados cargados', 'Se agregaron ' + r.agregados +
    ' feriados (' + r.anio + '). Omitidos por ya existir: ' + r.omitidos + '.', SpreadsheetApp.getUi().ButtonSet.OK);
}

/** Abre la interfaz dentro del propio Spreadsheet como sidebar. */
function abrirSidebar() {
  const html = HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Capacidad · Squads Ágiles');
  SpreadsheetApp.getUi().showSidebar(html);
}

/** Publicación como Web App independiente. */
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Capacidad · Squads Ágiles')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Permite incluir parciales HTML (CSS/JS) desde Index.html. */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/** Devuelve el email del usuario actual (para la cabecera del cliente). */
function getUsuarioActual() {
  const email = (Session.getActiveUser().getEmail() || '').toLowerCase();
  const usuarios = readAll_(SHEETS.USUARIOS);
  const u = usuarios.filter(function (x) { return String(x.email).toLowerCase() === email; })[0];
  return {
    email: email,
    rol: u ? u.rol : (usuarios.length === 0 ? 'admin' : 'viewer'),
    squadId: u ? u.squadId : ''
  };
}
