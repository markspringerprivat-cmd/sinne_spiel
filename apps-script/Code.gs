/******************************************************
 * Sinnesmagie Cloud- und Highscore-API
 * Version 2.1 – Admin: Einträge löschen und Liste leeren
 ******************************************************/

const SPREADSHEET_ID = '1u0FokOg9_mRPydS2iY4vQnh5FW0_xFyEhL0Z5R6qgZw';
const SHEET_NAME = 'Highscores';
const ADMIN_PASSWORD = 'Mark123';

const HEADERS = [
  'Geräte-ID', 'Name', 'Gesamt-Highscore',
  'Fortschritt Duftgarten', 'Fortschritt Klangwald', 'Fortschritt Farbenreich',
  'Fortschritt Tastminen', 'Fortschritt Flammenküche', 'Fortschritt Zauberschloss',
  'Duftgarten L1', 'Duftgarten L2', 'Klangwald L1', 'Klangwald L2',
  'Farbenreich L1', 'Farbenreich L2', 'Tastminen L1', 'Tastminen L2',
  'Flammenküche L1', 'Flammenküche L2', 'Zauberschloss L1', 'Zauberschloss L2', 'Zauberschloss L3',
  'Letzte Aktualisierung'
];

function doGet(e) {
  setupSheet_();
  const action = String((e && e.parameter && e.parameter.action) || 'list');

  if (action === 'list') return publicRanking_();
  if (action === 'admin') {
    const password = String((e && e.parameter && e.parameter.password) || '');
    if (password !== ADMIN_PASSWORD) return json_({ success: false, error: 'Zugriff verweigert.' });
    return adminData_();
  }

  return json_({ success: false, error: 'Unbekannte Aktion.' });
}

function doPost(e) {
  setupSheet_();
  try {
    const input = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const action = String(input.action || 'save');

    if (action === 'adminDelete') {
      if (String(input.password || '') !== ADMIN_PASSWORD) {
        return json_({ success: false, error: 'Zugriff verweigert.' });
      }
      return deletePlayer_(cleanText_(input.deviceId, 100));
    }

    if (action === 'adminClear') {
      if (String(input.password || '') !== ADMIN_PASSWORD) {
        return json_({ success: false, error: 'Zugriff verweigert.' });
      }
      return clearPlayers_();
    }

    const deviceId = cleanText_(input.deviceId, 100);
    const name = cleanText_(input.name, 70);
    if (!deviceId) return json_({ success: false, error: 'Geräte-ID fehlt.' });
    if (!name) return json_({ success: false, error: 'Name fehlt.' });

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const sheet = getSheet_();
      const values = sheet.getDataRange().getValues();
      let rowNumber = -1;
      let old = null;
      for (let i = 1; i < values.length; i += 1) {
        if (String(values[i][0]) === deviceId) {
          rowNumber = i + 1;
          old = values[i];
          break;
        }
      }

      const best = function(index, incoming, max) {
        return Math.min(max, Math.max(number_(old && old[index]), number_(incoming)));
      };
      const progress = function(index, incoming, max) {
        return Math.min(max, Math.max(number_(old && old[index]), number_(incoming)));
      };

      const scores = [
        best(9, input.duftgarten1, 1000), best(10, input.duftgarten2, 1000),
        best(11, input.klangwald1, 1000), best(12, input.klangwald2, 1000),
        best(13, input.farbenreich1, 1000), best(14, input.farbenreich2, 1000),
        best(15, input.tastminen1, 1000), best(16, input.tastminen2, 1000),
        best(17, input.flammen1, 1000), best(18, input.flammen2, 1000),
        best(19, input.zauber1, 1000), best(20, input.zauber2, 1000), best(21, input.zauber3, 5000)
      ];
      const totalScore = scores.reduce(function(sum, score) { return sum + score; }, 0);

      const record = [
        deviceId, name, totalScore,
        progress(3, input.progressDuftgarten, 2),
        progress(4, input.progressKlangwald, 2),
        progress(5, input.progressFarbenreich, 2),
        progress(6, input.progressTastminen, 2),
        progress(7, input.progressFlammenkueche, 2),
        progress(8, input.progressZauberschloss, 3),
        scores[0], scores[1], scores[2], scores[3], scores[4], scores[5], scores[6], scores[7], scores[8], scores[9], scores[10], scores[11], scores[12],
        new Date()
      ];

      if (rowNumber === -1) sheet.appendRow(record);
      else sheet.getRange(rowNumber, 1, 1, record.length).setValues([record]);

      return json_({ success: true, score: totalScore });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    return json_({ success: false, error: String(error) });
  }
}

function deletePlayer_(deviceId) {
  if (!deviceId) return json_({ success: false, error: 'Geräte-ID fehlt.' });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet_();
    const values = sheet.getDataRange().getValues();
    for (let i = values.length - 1; i >= 1; i -= 1) {
      if (String(values[i][0] || '') === deviceId) {
        sheet.deleteRow(i + 1);
        return json_({ success: true, deleted: true, deviceId: deviceId });
      }
    }
    return json_({ success: true, deleted: false, deviceId: deviceId });
  } finally {
    lock.releaseLock();
  }
}

function clearPlayers_() {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet_();
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);
    return json_({ success: true, cleared: Math.max(0, lastRow - 1) });
  } finally {
    lock.releaseLock();
  }
}

function publicRanking_() {
  const rows = readPlayers_()
    .filter(function(player) { return player.progress.zauberschloss >= 3; })
    .sort(function(a, b) { return b.score - a.score || a.name.localeCompare(b.name); })
    .slice(0, 100)
    .map(function(player) {
      return { name: publicName_(player.name), score: player.score, progress: { zauberschloss: player.progress.zauberschloss } };
    });
  return json_({ success: true, ranking: rows });
}

function adminData_() {
  const players = readPlayers_().sort(function(a, b) { return b.score - a.score || a.name.localeCompare(b.name); });
  return json_({ success: true, players: players });
}

function readPlayers_() {
  const values = getSheet_().getDataRange().getValues();
  return values.slice(1).filter(function(row) { return row[0] || row[1]; }).map(function(row) {
    return {
      deviceId: String(row[0] || ''), name: String(row[1] || ''), score: number_(row[2]), totalScore: number_(row[2]),
      progress: {
        duftgarten: number_(row[3]), klangwald: number_(row[4]), farbenreich: number_(row[5]),
        tastminen: number_(row[6]), flammenkueche: number_(row[7]), zauberschloss: number_(row[8])
      },
      scores: {
        duftgarten1: number_(row[9]), duftgarten2: number_(row[10]),
        klangwald1: number_(row[11]), klangwald2: number_(row[12]),
        farbenreich1: number_(row[13]), farbenreich2: number_(row[14]),
        tastminen1: number_(row[15]), tastminen2: number_(row[16]),
        flammen1: number_(row[17]), flammen2: number_(row[18]),
        zauber1: number_(row[19]), zauber2: number_(row[20]), zauber3: number_(row[21])
      },
      updatedAt: row[22] instanceof Date ? row[22].toISOString() : String(row[22] || '')
    };
  });
}

function setupSheet_() {
  const sheet = getSheet_();
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  } else {
    const current = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
    if (HEADERS.some(function(header, index) { return current[index] !== header; })) {
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
      sheet.setFrozenRows(1);
    }
  }
}

function getSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  return spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
}

function publicName_(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'Spieler';
  const firstName = parts[0];
  if (parts.length === 1) return firstName;
  const lastName = parts[parts.length - 1];
  return firstName + ' ' + lastName.charAt(0).toUpperCase() + '.';
}

function cleanText_(value, maxLength) {
  return String(value || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function number_(value) {
  const number = Math.round(Number(value) || 0);
  return Math.max(0, number);
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
