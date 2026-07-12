(() => {
  const KEY = 'sinnesmagie-score-v1';
  const NAME_KEY = 'sinnesmagie-player-name';
  const BOARD_KEY = 'sinnesmagie-local-leaderboard-v1';

  function safeJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || '') || fallback; } catch { return fallback; }
  }
  function getName() { return (localStorage.getItem(NAME_KEY) || '').trim(); }
  function setName(name) { localStorage.setItem(NAME_KEY, String(name || '').trim().slice(0, 24)); syncBoard(); renderAll(); window.SinnesCloud?.scheduleSync(100); }
  function getData() {
    const data = safeJson(KEY, { scores: {}, total: 0 });
    data.scores = data.scores && typeof data.scores === 'object' ? data.scores : {};
    data.total = Object.values(data.scores).reduce((a,b) => a + (Number(b) || 0), 0);
    return data;
  }
  function saveData(data) {
    data.total = Object.values(data.scores).reduce((a,b) => a + (Number(b) || 0), 0);
    localStorage.setItem(KEY, JSON.stringify(data));
    syncBoard(); renderAll(); window.SinnesCloud?.scheduleSync(100);
    return data.total;
  }
  function record(activity, points, max = 1000) {
    if (!activity) return getData().total;
    const data = getData();
    const value = Math.max(0, Math.min(max, Math.round(Number(points) || 0)));
    data.scores[activity] = Math.max(Number(data.scores[activity]) || 0, value);
    return saveData(data);
  }
  function total() { return getData().total; }
  function syncBoard() {
    const name = getName(); if (!name) return;
    const board = safeJson(BOARD_KEY, []);
    const next = Array.isArray(board) ? board.filter(x => x && x.name !== name) : [];
    next.push({ name, score: total(), updatedAt: Date.now() });
    next.sort((a,b) => b.score - a.score || a.name.localeCompare(b.name));
    localStorage.setItem(BOARD_KEY, JSON.stringify(next.slice(0, 50)));
  }
  function board() { syncBoard(); return safeJson(BOARD_KEY, []); }

  function ensureHud() {
    if (document.getElementById('globalScoreHud')) return;
    const el = document.createElement('div');
    el.id = 'globalScoreHud'; el.className = 'global-score-hud';
    el.innerHTML = '<span>Highscore:</span> <strong data-global-score>0</strong>';
    document.body.appendChild(el);
  }
  function renderAll() {
    document.querySelectorAll('[data-global-score]').forEach(el => el.textContent = total().toLocaleString('de-DE'));
    document.querySelectorAll('[data-player-name]').forEach(el => el.textContent = getName() || 'Spieler');
    document.querySelectorAll('[data-final-score]').forEach(el => el.textContent = total().toLocaleString('de-DE'));
  }
  function nameDialog(force = false) {
    if (getName() && !force) return Promise.resolve(getName());
    return new Promise(resolve => {
      let modal = document.getElementById('playerNameModal');
      if (!modal) {
        modal = document.createElement('div'); modal.id = 'playerNameModal'; modal.className = 'score-modal';
        modal.innerHTML = `<div class="score-modal-card"><h2>Wie heißt du?</h2><p>Dein Name wird mit deinem Highscore gespeichert.</p><input id="playerNameInput" maxlength="24" autocomplete="name" placeholder="Dein Name"><button id="savePlayerName" class="primary-button" type="button">Spiel beginnen</button></div>`;
        document.body.appendChild(modal);
      }
      modal.classList.remove('hidden');
      const input = modal.querySelector('#playerNameInput'); input.value = getName(); setTimeout(() => input.focus(), 50);
      const submit = () => { const name = input.value.trim(); if (!name) { input.focus(); return; } setName(name); modal.classList.add('hidden'); resolve(name); };
      modal.querySelector('#savePlayerName').onclick = submit;
      input.onkeydown = e => { if (e.key === 'Enter') submit(); };
    });
  }
  async function showLeaderboard() {
    let modal = document.getElementById('scoreBoardModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'scoreBoardModal';
      modal.className = 'score-modal hidden';
      modal.innerHTML = `
        <div class="score-modal-card score-board-card">
          <button class="modal-close" type="button" aria-label="Bestenliste schließen">×</button>
          <h2>Bestenliste</h2>
          <p class="score-board-subtitle">Name und Gesamt-Highscore</p>
          <div data-score-board><p>Bestenliste wird geladen …</p></div>
        </div>`;
      document.body.appendChild(modal);
      modal.querySelector('.modal-close').onclick = () => modal.classList.add('hidden');
      modal.onclick = event => { if (event.target === modal) modal.classList.add('hidden'); };
    }

    const boardRoot = modal.querySelector('[data-score-board]');
    boardRoot.innerHTML = '<p class="score-board-loading">Bestenliste wird geladen …</p>';
    modal.classList.remove('hidden');

    try {
      const rows = await window.SinnesCloud?.loadPublicRanking?.();
      const ranking = (Array.isArray(rows) ? rows : []).filter(entry => {
        const castle = Number(entry?.progress?.zauberschloss);
        return !Number.isFinite(castle) || castle >= 3;
      });
      boardRoot.innerHTML = ranking.length
        ? ranking.slice(0, 100).map((entry, index) => `
            <div class="score-board-row">
              <span><b>${index + 1}.</b> ${escapeHtml(entry.name || 'Spieler')}</span>
              <strong>${Math.max(0, Number(entry.score) || 0).toLocaleString('de-DE')}</strong>
            </div>`).join('')
        : '<p>Noch keine Online-Einträge.</p>';
    } catch (error) {
      const localRows = board();
      boardRoot.innerHTML = `
        <p class="score-board-error">Online-Bestenliste gerade nicht erreichbar. Lokale Anzeige:</p>
        ${localRows.length
          ? localRows.map((entry, index) => `<div class="score-board-row"><span><b>${index + 1}.</b> ${escapeHtml(entry.name)}</span><strong>${Number(entry.score).toLocaleString('de-DE')}</strong></div>`).join('')
          : '<p>Noch keine lokalen Einträge.</p>'}`;
    }
  }
  function escapeHtml(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
  function addLeaderboardButton() {
    const settings = document.getElementById('settingsButton');
    if (!settings || document.getElementById('leaderboardButton')) return;
    const button = document.createElement('button');
    button.id = 'leaderboardButton';
    button.className = 'leaderboard-button';
    button.type = 'button';
    button.setAttribute('aria-label', 'Bestenliste öffnen');
    button.textContent = '☷';
    button.onclick = showLeaderboard;
    settings.insertAdjacentElement('afterend', button);

    let completed = false;
    try {
      const progress = JSON.parse(localStorage.getItem('sinnesmagie-level-progress') || '{}');
      completed = !!(progress.zauberschloss?.finaleCompleted || progress.zauberschloss?.level4Completed);
    } catch {}
    if (completed && !sessionStorage.getItem('sinnesmagie-score-arrow-seen')) {
      const hint = document.createElement('div');
      hint.className = 'score-arrow';
      hint.innerHTML = '<span>Bestenliste</span><b>↓</b>';
      hint.setAttribute('aria-hidden', 'true');
      button.appendChild(hint);
      button.addEventListener('click', () => {
        sessionStorage.setItem('sinnesmagie-score-arrow-seen', '1');
        hint.remove();
      }, { once: true });
    }
  }
  document.addEventListener('DOMContentLoaded',()=>{ensureHud(); renderAll(); addLeaderboardButton(); if(document.body.classList.contains('cover-page')) nameDialog(false).then(()=>window.SinnesCloud?.syncNow()); else window.SinnesCloud?.scheduleSync(1200);});
  window.SinnesScore={record,total,getData,getName,setName,nameDialog,showLeaderboard,board,render:renderAll};
})();
