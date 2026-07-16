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
  const mobileList = document.getElementById('adminMobileList');
  const sortSelect = document.getElementById('adminSortSelect');
  const sortDirectionButton = document.getElementById('adminSortDirection');
  const clearAllButton = document.getElementById('adminClearAllButton');

  let players = [];
  let sortKey = 'totalScore';
  let sortDirection = -1;

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
    const topPlayer = [...rows].sort((a,b)=>b.totalScore-a.totalScore)[0];
    topEl.textContent = topPlayer ? `${topPlayer.totalScore.toLocaleString('de-DE')} · ${topPlayer.name}` : '0';
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
      <td><button class="admin-delete-player admin-danger-button" type="button" data-device-id="${escapeHtml(player.deviceId)}" data-player-name="${escapeHtml(player.name)}">Löschen</button></td>
    </tr>`;
  }

  function mobileCardHtml(player) {
    const p = player.progress, s = player.scores;
    return `<details class="admin-player-card">
      <summary><span><strong>${escapeHtml(player.name)}</strong><small>${player.totalScore.toLocaleString('de-DE')} Punkte</small></span><b>⌄</b></summary>
      <div class="admin-player-details">
        <p><span>Geräte-ID</span><code>${escapeHtml(player.deviceId)}</code></p>
        <p><span>Aktualisiert</span><strong>${formatDate(player.updatedAt)}</strong></p>
        <h3>Fortschritt</h3>
        <div class="admin-progress-grid">
          <span>Duftgarten <b>${p.duftgarten}/2</b></span><span>Klangwald <b>${p.klangwald}/2</b></span>
          <span>Farbenreich <b>${p.farbenreich}/2</b></span><span>Tastminen <b>${p.tastminen}/2</b></span>
          <span>Flammenküche <b>${p.flammenkueche}/2</b></span><span>Zauberschloss <b>${p.zauberschloss}/3</b></span>
        </div>
        <h3>Level-Highscores</h3>
        <div class="admin-score-grid">
          <span>Duft L1 <b>${s.duftgarten1}</b></span><span>Duft L2 <b>${s.duftgarten2}</b></span>
          <span>Klang L1 <b>${s.klangwald1}</b></span><span>Klang L2 <b>${s.klangwald2}</b></span>
          <span>Farben L1 <b>${s.farbenreich1}</b></span><span>Farben L2 <b>${s.farbenreich2}</b></span>
          <span>Tast L1 <b>${s.tastminen1}</b></span><span>Tast L2 <b>${s.tastminen2}</b></span>
          <span>Flammen L1 <b>${s.flammen1}</b></span><span>Flammen L2 <b>${s.flammen2}</b></span>
          <span>Schloss L1 <b>${s.zauber1}</b></span><span>Schloss L2 <b>${s.zauber2}</b></span><span>Schloss L3 <b>${s.zauber3}</b></span>
        </div>
        <button class="admin-delete-player admin-danger-button admin-mobile-delete" type="button" data-device-id="${escapeHtml(player.deviceId)}" data-player-name="${escapeHtml(player.name)}">Diesen Eintrag löschen</button>
      </div>
    </details>`;
  }


  function valueAt(object, path) {
    return String(path || '').split('.').reduce((value, key) => value == null ? undefined : value[key], object);
  }
  function sortRows(rows) {
    return [...rows].sort((a,b) => {
      const av=valueAt(a,sortKey), bv=valueAt(b,sortKey);
      if (sortKey==='name' || sortKey==='deviceId') return String(av||'').localeCompare(String(bv||''),'de') * sortDirection;
      return ((Number(av)||0)-(Number(bv)||0)) * sortDirection;
    });
  }

  function renderTable() {
    const term = (search.value || '').trim().toLowerCase();
    const filtered = sortRows(players.filter(player => !term || player.name.toLowerCase().includes(term) || player.deviceId.toLowerCase().includes(term)));
    tableBody.innerHTML = filtered.length ? filtered.map(rowHtml).join('') : '<tr><td colspan="24">Keine passenden Einträge.</td></tr>';
    if (mobileList) mobileList.innerHTML = filtered.length ? filtered.map(mobileCardHtml).join('') : '<p class="admin-mobile-empty">Keine passenden Einträge.</p>';
    status.textContent = `${filtered.length} von ${players.length} Spielern angezeigt.`;
  }

  async function deletePlayer(deviceId, playerName) {
    if (!deviceId) return;
    const confirmed = window.confirm(`Eintrag von „${playerName || 'Spieler'}“ wirklich dauerhaft löschen?`);
    if (!confirmed) return;

    const password = sessionStorage.getItem(PASSWORD_KEY) || '';
    status.textContent = `Eintrag von ${playerName || 'Spieler'} wird gelöscht …`;
    try {
      await window.SinnesCloud.deleteAdminPlayer(password, deviceId);
      players = players.filter(player => player.deviceId !== deviceId);
      renderSummary(players);
      renderTable();
      status.textContent = `Eintrag von ${playerName || 'Spieler'} wurde gelöscht.`;
    } catch (error) {
      errorBox.innerHTML = `<strong>Eintrag konnte nicht gelöscht werden.</strong><br>${escapeHtml(error.message || error)}`;
      errorBox.classList.remove('hidden');
    }
  }

  async function clearAllPlayers() {
    if (!players.length) {
      window.alert('Die Liste ist bereits leer.');
      return;
    }

    const firstConfirm = window.confirm(`Wirklich alle ${players.length} Einträge dauerhaft löschen?`);
    if (!firstConfirm) return;
    const confirmationText = window.prompt('Zur Sicherheit bitte LEEREN eingeben:');
    if (String(confirmationText || '').trim().toUpperCase() !== 'LEEREN') {
      window.alert('Vorgang abgebrochen.');
      return;
    }

    const password = sessionStorage.getItem(PASSWORD_KEY) || '';
    clearAllButton.disabled = true;
    status.textContent = 'Alle Einträge werden gelöscht …';
    try {
      await window.SinnesCloud.clearAdminPlayers(password);
      players = [];
      renderSummary(players);
      renderTable();
      status.textContent = 'Die Highscore-Liste wurde vollständig geleert.';
    } catch (error) {
      errorBox.innerHTML = `<strong>Liste konnte nicht geleert werden.</strong><br>${escapeHtml(error.message || error)}`;
      errorBox.classList.remove('hidden');
    } finally {
      clearAllButton.disabled = false;
    }
  }

  async function load() {
    errorBox.classList.add('hidden');
    status.textContent = 'Online-Daten werden geladen …';
    refresh.disabled = true;
    try {
      const password = sessionStorage.getItem(PASSWORD_KEY) || '';
      const result = await window.SinnesCloud.loadAdminData(password);
      players = result.map(normalize);
      renderSummary(players);
      renderTable();
    } catch (error) {
      tableBody.innerHTML = '<tr><td colspan="24">Keine Admin-Daten verfügbar.</td></tr>';
      status.textContent = 'Abruf fehlgeschlagen.';
      errorBox.innerHTML = `<strong>Admin-Daten konnten nicht geladen werden.</strong><br>${escapeHtml(error.message || error)}<br><small>Die beigefügte Apps-Script-Datei muss in Google Apps Script eingesetzt und erneut als Web-App bereitgestellt werden.</small>`;
      errorBox.classList.remove('hidden');
    } finally {
      refresh.disabled = false;
    }
  }

  refresh.addEventListener('click', load);
  search.addEventListener('input', renderTable);
  sortSelect?.addEventListener('change', () => { sortKey = sortSelect.value; renderTable(); });
  sortDirectionButton?.addEventListener('click', () => { sortDirection *= -1; sortDirectionButton.textContent = sortDirection < 0 ? '↓' : '↑'; renderTable(); });
  document.querySelectorAll('.admin-table th[data-sort]').forEach(th => th.addEventListener('click', () => { const key=th.dataset.sort; if(sortKey===key) sortDirection*=-1; else {sortKey=key; sortDirection= key==='name'||key==='deviceId' ? 1 : -1;} if(sortSelect) sortSelect.value=key; if(sortDirectionButton) sortDirectionButton.textContent=sortDirection<0?'↓':'↑'; renderTable(); }));
  document.addEventListener('click', event => {
    const button = event.target.closest('.admin-delete-player');
    if (!button) return;
    event.preventDefault();
    deletePlayer(button.dataset.deviceId || '', button.dataset.playerName || 'Spieler');
  });
  clearAllButton?.addEventListener('click', clearAllPlayers);

  logout.addEventListener('click', () => {
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(PASSWORD_KEY);
    window.location.href = 'game.html';
  });

  load();
})();
