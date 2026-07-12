(() => {
  'use strict';

  const AUTH_KEY = 'sinnesmagie-admin-auth';
  const PASSWORD_KEY = 'sinnesmagie-admin-password';
  const EXPECTED_PASSWORD = 'Mark123';

  if (sessionStorage.getItem(AUTH_KEY) !== '1' || sessionStorage.getItem(PASSWORD_KEY) !== EXPECTED_PASSWORD) {
    window.location.replace('game.html');
    return;
  }

  const tableBody = document.getElementById('adminTableBody');
  const status = document.getElementById('adminStatus');
  const errorBox = document.getElementById('adminError');
  const search = document.getElementById('adminSearchInput');
  const refresh = document.getElementById('adminRefreshButton');
  const logout = document.getElementById('adminLogoutButton');
  const countEl = document.getElementById('adminPlayerCount');
  const completedEl = document.getElementById('adminCompletedCount');
  const averageEl = document.getElementById('adminAverageScore');
  const topEl = document.getElementById('adminTopScore');

  let players = [];

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  }

  function number(value) {
    return Math.max(0, Math.round(Number(value) || 0));
  }

  function formatDate(value) {
    if (!value) return '–';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? escapeHtml(value) : date.toLocaleString('de-DE');
  }

  function normalize(player) {
    const progress = player.progress || {};
    const scores = player.scores || {};
    return {
      deviceId: String(player.deviceId || ''),
      name: String(player.name || 'Spieler'),
      totalScore: number(player.totalScore ?? player.score),
      progress: {
        duftgarten: number(progress.duftgarten ?? player.progressDuftgarten),
        klangwald: number(progress.klangwald ?? player.progressKlangwald),
        farbenreich: number(progress.farbenreich ?? player.progressFarbenreich),
        tastminen: number(progress.tastminen ?? player.progressTastminen),
        flammenkueche: number(progress.flammenkueche ?? progress.flammen ?? player.progressFlammenkueche),
        zauberschloss: number(progress.zauberschloss ?? player.progressZauberschloss)
      },
      scores: {
        duftgarten1: number(scores.duftgarten1 ?? player.duftgarten1), duftgarten2: number(scores.duftgarten2 ?? player.duftgarten2),
        klangwald1: number(scores.klangwald1 ?? player.klangwald1), klangwald2: number(scores.klangwald2 ?? player.klangwald2),
        farbenreich1: number(scores.farbenreich1 ?? player.farbenreich1), farbenreich2: number(scores.farbenreich2 ?? player.farbenreich2),
        tastminen1: number(scores.tastminen1 ?? player.tastminen1), tastminen2: number(scores.tastminen2 ?? player.tastminen2),
        flammen1: number(scores.flammen1 ?? player.flammen1), flammen2: number(scores.flammen2 ?? player.flammen2),
        zauber1: number(scores.zauber1 ?? player.zauber1), zauber2: number(scores.zauber2 ?? player.zauber2), zauber3: number(scores.zauber3 ?? player.zauber3)
      },
      updatedAt: player.updatedAt || player.lastUpdated || player.date || ''
    };
  }

  function renderSummary(rows) {
    const scores = rows.map(row => row.totalScore);
    const completed = rows.filter(row => row.progress.zauberschloss >= 3).length;
    countEl.textContent = rows.length.toLocaleString('de-DE');
    completedEl.textContent = completed.toLocaleString('de-DE');
    averageEl.textContent = (rows.length ? Math.round(scores.reduce((sum, value) => sum + value, 0) / rows.length) : 0).toLocaleString('de-DE');
    topEl.textContent = (scores.length ? Math.max(...scores) : 0).toLocaleString('de-DE');
  }

  function rowHtml(player) {
    const p = player.progress;
    const s = player.scores;
    return `<tr>
      <td class="admin-name-cell">${escapeHtml(player.name)}</td>
      <td><code>${escapeHtml(player.deviceId)}</code></td>
      <td><strong>${player.totalScore.toLocaleString('de-DE')}</strong></td>
      <td>${p.duftgarten}/2</td><td>${p.klangwald}/2</td><td>${p.farbenreich}/2</td><td>${p.tastminen}/2</td><td>${p.flammenkueche}/2</td><td>${p.zauberschloss}/3</td>
      <td>${s.duftgarten1}</td><td>${s.duftgarten2}</td><td>${s.klangwald1}</td><td>${s.klangwald2}</td><td>${s.farbenreich1}</td><td>${s.farbenreich2}</td><td>${s.tastminen1}</td><td>${s.tastminen2}</td><td>${s.flammen1}</td><td>${s.flammen2}</td><td>${s.zauber1}</td><td>${s.zauber2}</td><td>${s.zauber3}</td>
      <td>${formatDate(player.updatedAt)}</td>
    </tr>`;
  }

  function renderTable() {
    const term = (search.value || '').trim().toLowerCase();
    const filtered = players.filter(player => !term || player.name.toLowerCase().includes(term) || player.deviceId.toLowerCase().includes(term));
    tableBody.innerHTML = filtered.length ? filtered.map(rowHtml).join('') : '<tr><td colspan="23">Keine passenden Einträge.</td></tr>';
    status.textContent = `${filtered.length} von ${players.length} Spielern angezeigt.`;
  }

  async function load() {
    errorBox.classList.add('hidden');
    status.textContent = 'Online-Daten werden geladen …';
    refresh.disabled = true;
    try {
      const password = sessionStorage.getItem(PASSWORD_KEY) || '';
      const result = await window.SinnesCloud.loadAdminData(password);
      players = result.map(normalize).sort((a, b) => b.totalScore - a.totalScore || a.name.localeCompare(b.name, 'de'));
      renderSummary(players);
      renderTable();
    } catch (error) {
      tableBody.innerHTML = '<tr><td colspan="23">Keine Admin-Daten verfügbar.</td></tr>';
      status.textContent = 'Abruf fehlgeschlagen.';
      errorBox.innerHTML = `<strong>Admin-Daten konnten nicht geladen werden.</strong><br>${escapeHtml(error.message || error)}<br><small>Die beigefügte Apps-Script-Datei muss in Google Apps Script eingesetzt und erneut als Web-App bereitgestellt werden.</small>`;
      errorBox.classList.remove('hidden');
    } finally {
      refresh.disabled = false;
    }
  }

  refresh.addEventListener('click', load);
  search.addEventListener('input', renderTable);
  logout.addEventListener('click', () => {
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(PASSWORD_KEY);
    window.location.href = 'game.html';
  });

  load();
})();
