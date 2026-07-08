/**
 * Usuarios.gs
 * Control de acceso ligero. rol: admin | editor | viewer.
 * Si no hay usuarios registrados, el primero en entrar se considera admin.
 */

function listUsuarios() {
  return readAll_(SHEETS.USUARIOS);
}

function saveUsuario(data) {
  const obj = {
    email: (data.email || '').trim().toLowerCase(),
    rol: (data.rol || 'viewer').trim(),
    squadId: data.squadId || ''
  };
  if (!obj.email) throw new Error('El email es obligatorio.');
  // La clave de esta hoja es el email (columna 1); usamos upsert por esa columna.
  const rowIndex = findRowIndexById_(SHEETS.USUARIOS, obj.email);
  if (rowIndex === -1) return insert_(SHEETS.USUARIOS, obj);
  getSheet_(SHEETS.USUARIOS)
    .getRange(rowIndex, 1, 1, SHEETS.USUARIOS.headers.length)
    .setValues([objectToRow_(SHEETS.USUARIOS.headers, obj)]);
  return obj;
}

function deleteUsuario(email) {
  return remove_(SHEETS.USUARIOS, (email || '').trim().toLowerCase());
}
