(() => {
  const KEY = 'sinnesmagie-score-v1';
  const NAME_KEY = 'sinnesmagie-player-name';
  const BOARD_KEY = 'sinnesmagie-local-leaderboard-v1';

  function safeJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || '') || fallback; } catch { return fallback; }
  }
  function getName() { return (localStorage.getItem(NAME_KEY) || '').trim(); }
  function setName(name) { localStorage.setItem(NAME_KEY, String(name || '').trim().slice(0, 70)); syncBoard(); renderAll(); window.SinnesCloud?.scheduleSync(100); }
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
  const sessions = new Map();
  let deltaTimer = 0;
  let summaryTimer = 0;
  function startSession(activity, max = 1000, initial = 0) {
    if (!activity) return 0;
    const data = getData();
    const session = { activity, max: Math.max(0, Number(max) || 1000), points: Number(initial) || 0, previousBest: Number(data.scores[activity]) || 0 };
    sessions.set(activity, session);
    return session.points;
  }
  function sessionValue(activity) { return Math.round(Number(sessions.get(activity)?.points) || 0); }
  function liveTotal() {
    const data = getData();
    let value = data.total;
    sessions.forEach(session => {
      value -= Math.max(0, Number(session.previousBest) || 0);
      value += Math.max(0, Math.round(Number(session.points) || 0));
    });
    return Math.max(0, Math.round(value));
  }
  function ensureDeltaNode() {
    ensureHud();
    const hud = document.getElementById('globalScoreHud');
    let node = hud?.querySelector('[data-score-delta]');
    if (!node && hud) {
      node = document.createElement('small');
      node.setAttribute('data-score-delta', '');
      node.className = 'global-score-delta';
      hud.appendChild(node);
    }
    return node;
  }
  function showDelta(delta) {
    const amount = Math.round(Number(delta) || 0);
    if (!amount) return;
    const node = ensureDeltaNode();
    if (!node) return;
    clearTimeout(deltaTimer);
    node.className = `global-score-delta ${amount > 0 ? 'positive' : 'negative'} show`;
    node.textContent = `${amount > 0 ? '+' : '−'}${Math.abs(amount).toLocaleString('de-DE')}`;
    deltaTimer = window.setTimeout(() => node.classList.remove('show'), 1250);
  }
  function showLevelSummary(points) {
    let toast = document.getElementById('levelScoreSummary');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'levelScoreSummary';
      toast.className = 'level-score-summary';
      document.body.appendChild(toast);
    }
    clearTimeout(summaryTimer);
    toast.innerHTML = `<strong>Level beendet</strong><span>Du hast ${Math.max(0, Math.round(Number(points) || 0)).toLocaleString('de-DE')} Punkte gesammelt.</span>`;
    toast.classList.add('show');
    summaryTimer = window.setTimeout(() => toast.classList.remove('show'), 3000);
  }
  function addPoints(activity, delta, max = null) {
    let session = sessions.get(activity);
    if (!session) { startSession(activity, max || 1000, 0); session = sessions.get(activity); }
    if (max != null) session.max = Math.max(0, Number(max) || session.max);
    const before = session.points;
    session.points = Math.max(0, Math.min(session.max, session.points + (Number(delta) || 0)));
    const actualDelta = Math.round(session.points - before);
    if (actualDelta) showDelta(actualDelta);
    renderAll();
    document.dispatchEvent(new CustomEvent('sinnesmagie:score-session', { detail: { activity, points: Math.round(session.points), max: session.max, delta: actualDelta } }));
    return Math.round(session.points);
  }
  function setSession(activity, value, max = null) {
    let session = sessions.get(activity);
    if (!session) { startSession(activity, max || 1000, 0); session = sessions.get(activity); }
    if (max != null) session.max = Math.max(0, Number(max) || session.max);
    const before = session.points;
    session.points = Math.max(0, Math.min(session.max, Number(value) || 0));
    const actualDelta = Math.round(session.points - before);
    if (actualDelta) showDelta(actualDelta);
    renderAll();
    return Math.round(session.points);
  }
  function finishSession(activity, fallback = 0, max = 1000) {
    const session = sessions.get(activity);
    const value = session ? Math.round(session.points) : Math.round(Number(fallback) || 0);
    sessions.delete(activity);
    const result = record(activity, value, session?.max || max);
    showLevelSummary(value);
    renderAll();
    return result;
  }
  function setGameplayActive(active) {
    document.body?.classList.toggle('score-gameplay-active', !!active);
  }
  function syncBoard() {
    const name = getName(); if (!name) return;
    const board = safeJson(BOARD_KEY, []);
    const next = Array.isArray(board) ? board.filter(x => x && x.name !== name) : [];
    next.push({ name, score: total(), updatedAt: Date.now() });
    next.sort((a,b) => b.score - a.score || a.name.localeCompare(b.name));
    localStorage.setItem(BOARD_KEY, JSON.stringify(next.slice(0, 50)));
  }
  function board() { syncBoard(); return safeJson(BOARD_KEY, []); }


  const UNIFIED_HUD_SELECTOR = '.rhythm-hud, .duft-hop-hud, .mine-hud, .slice-hud, .paint-hud, .pong-hud, .castle-dodge-hud';
  let unifiedHudScheduled = false;

  function supportsUnifiedHud() {
    if (document.body?.matches('.story-page, .castle-finale-page, .castle-outro-active')) return false;
    return !!document.body && document.body.matches('.game-page, .level-map-page, .duft-hop-page, .color-minigame-page, .flame-slice-page, .klang-rhythm-page, .mine-minigame-page, .pong-page, .castle-dodge-page, .castle-finale-page');
  }

  function organizeUnifiedHud() {
    unifiedHudScheduled = false;
    if (!supportsUnifiedHud()) return;
    ensureHud();
    let bar = document.getElementById('unifiedGameHud');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'unifiedGameHud';
      bar.className = 'unified-game-hud';
      bar.setAttribute('aria-label', 'Spielstatus');
      document.body.appendChild(bar);
    }
    const scoreHud = document.getElementById('globalScoreHud');
    if (scoreHud && scoreHud.parentElement !== bar) bar.prepend(scoreHud);

    const extraHuds = [...document.querySelectorAll(UNIFIED_HUD_SELECTOR)].filter(node => node !== bar && !node.closest('.score-modal'));
    extraHuds.forEach(node => {
      node.classList.add('unified-game-hud-content');
      if (node.parentElement !== bar) bar.appendChild(node);
    });
    bar.classList.toggle('hud-only-score', !bar.querySelector('.unified-game-hud-content'));
    document.body.classList.add('unified-game-hud-enabled');
  }

  function scheduleUnifiedHud() {
    if (unifiedHudScheduled) return;
    unifiedHudScheduled = true;
    requestAnimationFrame(organizeUnifiedHud);
  }

  function ensureHud() {
    if (document.body?.matches('.story-page, .castle-finale-page') || document.body?.classList.contains('castle-outro-active')) return;
    if (document.getElementById('globalScoreHud')) return;
    const el = document.createElement('div');
    el.id = 'globalScoreHud'; el.className = 'global-score-hud';
    el.innerHTML = '<span>Highscore:</span> <strong data-global-score>0</strong><small data-score-delta class="global-score-delta"></small>';
    document.body.appendChild(el);
  }
  function renderAll() {
    document.querySelectorAll('[data-global-score]').forEach(el => el.textContent = liveTotal().toLocaleString('de-DE'));
    document.querySelectorAll('[data-player-name]').forEach(el => el.textContent = getName() || 'Spieler');
    document.querySelectorAll('[data-final-score]').forEach(el => el.textContent = total().toLocaleString('de-DE'));
  }
  function nameDialog(force = false) {
    if (getName() && !force) return Promise.resolve(getName());
    return new Promise(resolve => {
      let modal = document.getElementById('playerNameModal');
      if (!modal) {
        modal = document.createElement('div'); modal.id = 'playerNameModal'; modal.className = 'score-modal';
        modal.innerHTML = `<div class="score-modal-card"><h2>Wie heißt du?</h2><p>Dein Name wird mit deinem Highscore gespeichert.</p><input id="playerNameInput" maxlength="70" autocomplete="name" placeholder="Dein Name"><button id="savePlayerName" class="primary-button" type="button">Spiel beginnen</button></div>`;
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
              <span><b>${index + 1}.</b> ${escapeHtml(publicDisplayName(entry.name || 'Spieler'))}</span>
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
  function publicDisplayName(fullName){const parts=String(fullName||'').trim().split(/\s+/).filter(Boolean);if(!parts.length)return 'Spieler';if(parts.length===1)return parts[0];return `${parts[0]} ${parts[parts.length-1].charAt(0).toUpperCase()}.`;}
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
  document.addEventListener('DOMContentLoaded',()=>{
    ensureHud(); renderAll(); addLeaderboardButton(); scheduleUnifiedHud();
    const observer = new MutationObserver(() => scheduleUnifiedHud());
    observer.observe(document.body, { childList: true, subtree: true });
    if(getName()) window.SinnesCloud?.scheduleSync(1200);
  });
  window.SinnesScore={record,total,liveTotal,getData,getName,setName,nameDialog,showLeaderboard,board,render:renderAll,startSession,addPoints,setSession,sessionValue,finishSession,setGameplayActive,showDelta,showLevelSummary};
})();
