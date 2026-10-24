/**
 * Fiesta de Disfraces — backend en Google Apps Script.
 * Usa la hoja de cálculo a la que está vinculado este script como base de datos.
 *
 * Hojas que crea la función setup():
 *   Disfraces: id | fecha | nombre | disfraz | barrio | autor
 *   Votos:     votante | disfrazId | fecha
 *   Config:    clave | valor
 */

// Barrios y ramas de la Estaca Osorno (mismo orden que en index.html).
const BARRIOS = [
  'Barrio La Unión', 'Barrio Antillanca', 'Barrio Centro', 'Barrio Ecuador', 'Barrio Franke',
  'Rama Lago Ranco', 'Rama Caupolicán', 'Rama Entre Lagos', 'Rama Río Bueno', 'Rama San Pablo',
];

const DEFAULT_CONFIG = {
  inscripcion_abierta: true,
  votacion_abierta: true,
  mostrar_resultados: true,
  titulo: 'Fiesta de Disfraces',
};

/** Ejecútala una vez desde el editor para crear las hojas. */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheet_(ss, 'Disfraces', ['id', 'fecha', 'nombre', 'disfraz', 'barrio', 'autor']);
  ensureSheet_(ss, 'Votos', ['votante', 'disfrazId', 'fecha']);
  const config = ensureSheet_(ss, 'Config', ['clave', 'valor']);
  if (config.getLastRow() < 2) {
    const rows = Object.keys(DEFAULT_CONFIG).map(k => [k, DEFAULT_CONFIG[k]]);
    config.getRange(2, 1, rows.length, 2).setValues(rows);
  }
}

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'list';
  try {
    if (action === 'list') return json_(list_(e.parameter.voterId || ''));
    return json_({ ok: false, error: 'Acción desconocida' });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const body = JSON.parse(e.postData.contents || '{}');
    if (body.action === 'register') return json_(register_(body));
    if (body.action === 'vote') return json_(vote_(body));
    return json_({ ok: false, error: 'Acción desconocida' });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

function list_(voterId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const config = getConfig_(ss);
  const votes = readRows_(ss.getSheetByName('Votos'));
  const counts = {};
  let myVote = null;
  votes.forEach(v => {
    counts[v.disfrazId] = (counts[v.disfrazId] || 0) + 1;
    if (voterId && v.votante === voterId) myVote = v.disfrazId;
  });
  const costumes = readRows_(ss.getSheetByName('Disfraces')).map(r => ({
    id: r.id,
    name: r.nombre,
    costume: r.disfraz,
    barrio: r.barrio,
    mine: !!voterId && r.autor === voterId,
    votes: config.mostrar_resultados ? (counts[r.id] || 0) : null,
  }));
  return { ok: true, config, costumes, myVote };
}

function register_(body) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const config = getConfig_(ss);
  if (!config.inscripcion_abierta) throw new Error('Las inscripciones están cerradas.');

  const name = clean_(body.name, 60);
  const costume = clean_(body.costume, 80);
  const barrio = clean_(body.barrio, 60);
  const voterId = clean_(body.voterId, 64);
  if (!name || !costume || !barrio) throw new Error('Rellena nombre, disfraz y barrio.');
  if (BARRIOS.indexOf(barrio) === -1) throw new Error('Elige un barrio o rama de la lista.');

  const id = Utilities.getUuid().slice(0, 8);
  ss.getSheetByName('Disfraces').appendRow([id, new Date(), name, costume, barrio, voterId]);
  return { ok: true, id };
}

function vote_(body) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const config = getConfig_(ss);
  if (!config.votacion_abierta) throw new Error('La votación está cerrada.');

  const voterId = clean_(body.voterId, 64);
  const costumeId = clean_(body.costumeId, 16);
  if (!voterId || !costumeId) throw new Error('Voto no válido.');

  const costumes = readRows_(ss.getSheetByName('Disfraces'));
  const target = costumes.find(c => c.id === costumeId);
  if (!target) throw new Error('Ese disfraz no existe.');
  if (target.autor === voterId) throw new Error('No puedes votar por tu propio disfraz 😉');

  // Un voto por persona: si ya votó, se cambia su voto.
  const sheet = ss.getSheetByName('Votos');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === voterId) {
      sheet.getRange(i + 1, 2, 1, 2).setValues([[costumeId, new Date()]]);
      return { ok: true, changed: true };
    }
  }
  sheet.appendRow([voterId, costumeId, new Date()]);
  return { ok: true, changed: false };
}

function getConfig_(ss) {
  const config = Object.assign({}, DEFAULT_CONFIG);
  const sheet = ss.getSheetByName('Config');
  if (!sheet) return config;
  sheet.getDataRange().getValues().slice(1).forEach(([k, v]) => {
    if (!k) return;
    if (typeof v === 'string' && /^(true|false|si|sí|no)$/i.test(v.trim())) {
      v = /^(true|si|sí)$/i.test(v.trim());
    }
    config[String(k).trim()] = v;
  });
  return config;
}

function readRows_(sheet) {
  if (!sheet) throw new Error('Falta una hoja. Ejecuta la función setup() en el editor.');
  const [header, ...rows] = sheet.getDataRange().getValues();
  return rows.filter(r => r[0] !== '').map(r => {
    const o = {};
    header.forEach((h, i) => { o[h] = r[i] instanceof Date ? r[i].toISOString() : String(r[i]); });
    return o;
  });
}

function ensureSheet_(ss, name, header) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(header);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, header.length).setFontWeight('bold');
  }
  return sheet;
}

function clean_(value, max) {
  return String(value == null ? '' : value).trim().slice(0, max);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
