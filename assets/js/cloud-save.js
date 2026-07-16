(() => {
  'use strict';

  const API_URL = 'https://script.google.com/macros/s/AKfycbzJYTFZCbExoIkEHapupqHmhX7TP_sihY_SRssAgo-g1ruiXUYfvS6gGpTr5GBJNyW37g/exec';
  const DEVICE_KEY = 'sinnesmagie-device-id';
  const NAME_KEY = 'sinnesmagie-player-name';
  const SCORE_KEY = 'sinnesmagie-score-v1';
  const PROGRESS_KEY = 'sinnesmagie-level-progress';
  const PENDING_KEY = 'sinnesmagie-cloud-pending-v1';
  const LAST_SYNC_KEY = 'sinnesmagie-cloud-last-sync-v1';
  const WATCHED_KEYS = new Set([NAME_KEY, SCORE_KEY, PROGRESS_KEY]);

  let syncTimer = 0;
  let syncInFlight = null;
  let resyncRequested = false;

  function safeJson(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '');
      return value && typeof value === 'object' ? value : fallback;
    } catch {
      return fallback;
    }
  }

  function createId() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return `device-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  }

  function getDeviceId() {
    let id = (localStorage.getItem(DEVICE_KEY) || '').trim();
    if (!id) {
      id = createId();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  }

  function getName() {
    return (localStorage.getItem(NAME_KEY) || '').trim().slice(0, 70);
  }

  function scoreValue(scores, key) {
    return Math.max(0, Math.round(Number(scores?.[key]) || 0));
  }

  function areaProgress(area, maxLevels) {
    if (!area || typeof area !== 'object') return 0;
    let completed = 0;
    for (let i = 1; i <= maxLevels; i += 1) {
      if (area[`level${i}Completed`]) completed += 1;
    }
    return completed;
  }

  function castleProgress(area) {
    if (!area || typeof area !== 'object') return 0;
    let completed = 0;
    if (area.level1Completed) completed += 1;
    if (area.level2Completed) completed += 1;
    if (area.level3Completed || area.level4Completed || area.finaleCompleted) completed += 1;
    return Math.min(3, completed);
  }

  function buildPayload() {
    const scoreData = safeJson(SCORE_KEY, { scores: {}, total: 0 });
    const scores = scoreData.scores && typeof scoreData.scores === 'object' ? scoreData.scores : {};
    const progress = safeJson(PROGRESS_KEY, {});
    const totalScore = Object.values(scores).reduce((sum, value) => sum + (Number(value) || 0), 0);

    return {
      deviceId: getDeviceId(),
      name: getName(),
      totalScore: Math.max(0, Math.round(totalScore)),

      progressDuftgarten: areaProgress(progress.duftgarten, 2),
      progressKlangwald: areaProgress(progress.klangwald, 2),
      progressFarbenreich: areaProgress(progress.farbenreich, 2),
      progressTastminen: areaProgress(progress.tastminen, 2),
      progressFlammenkueche: areaProgress(progress.flammenkueche, 2),
      progressZauberschloss: castleProgress(progress.zauberschloss),

      duftgarten1: scoreValue(scores, 'game_duftgarten'),
      duftgarten2: scoreValue(scores, 'quiz_duftgarten'),
      klangwald1: scoreValue(scores, 'game_klangwald'),
      klangwald2: scoreValue(scores, 'quiz_klangwald'),
      farbenreich1: scoreValue(scores, 'game_farbenreich'),
      farbenreich2: scoreValue(scores, 'quiz_farbenreich'),
      tastminen1: scoreValue(scores, 'game_tastminen'),
      tastminen2: scoreValue(scores, 'quiz_tastminen'),
      flammen1: scoreValue(scores, 'game_flammenkueche'),
      flammen2: scoreValue(scores, 'quiz_flammenkueche'),
      zauber1: scoreValue(scores, 'game_zauberschloss_pong'),
      zauber2: scoreValue(scores, 'game_zauberschloss_dodge'),
      zauber3: scoreValue(scores, 'boss_zauberschloss_final')
    };
  }

  function markPending(payload) {
    try { localStorage.setItem(PENDING_KEY, JSON.stringify(payload)); } catch {}
  }

  function clearPending() {
    try { localStorage.removeItem(PENDING_KEY); } catch {}
  }

  function dispatchStatus(detail) {
    document.dispatchEvent(new CustomEvent('sinnesmagie:cloud-status', { detail }));
  }

  async function upload(payload, { keepalive = false } = {}) {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      cache: 'no-store',
      keepalive
    });
    if (!response.ok) throw new Error(`Cloud HTTP ${response.status}`);
    const result = await response.json();
    if (!result?.success) throw new Error(result?.message || result?.error || 'Cloud-Speicherung fehlgeschlagen');
    return result;
  }

  async function syncNow(options = {}) {
    const payload = buildPayload();
    if (!payload.name) {
      markPending(payload);
      return { success: false, skipped: 'missing-name' };
    }

    if (syncInFlight) {
      resyncRequested = true;
      return syncInFlight;
    }

    markPending(payload);
    dispatchStatus({ state: 'saving' });
    syncInFlight = upload(payload, options)
      .then(result => {
        clearPending();
        localStorage.setItem(LAST_SYNC_KEY, String(Date.now()));
        dispatchStatus({ state: 'saved', result });
        return result;
      })
      .catch(error => {
        markPending(payload);
        dispatchStatus({ state: 'offline', error: String(error) });
        return { success: false, offline: true, error: String(error) };
      })
      .finally(() => {
        syncInFlight = null;
        if (resyncRequested) {
          resyncRequested = false;
          scheduleSync(350);
        }
      });

    return syncInFlight;
  }

  function scheduleSync(delay = 900) {
    clearTimeout(syncTimer);
    syncTimer = window.setTimeout(() => syncNow(), Math.max(0, delay));
  }

  async function retryPending() {
    if (!navigator.onLine) return;
    const pending = safeJson(PENDING_KEY, null);
    if (pending?.deviceId && pending?.name) {
      await syncNow();
    }
  }

  async function loadPublicRanking() {
    const response = await fetch(`${API_URL}?action=list&t=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Cloud HTTP ${response.status}`);
    const result = await response.json();
    return Array.isArray(result?.ranking) ? result.ranking : [];
  }

  async function loadAdminData(password) {
    const url = new URL(API_URL);
    url.searchParams.set('action', 'admin');
    url.searchParams.set('password', String(password || ''));
    url.searchParams.set('t', String(Date.now()));
    const response = await fetch(url.toString(), { cache: 'no-store' });
    if (!response.ok) throw new Error(`Cloud HTTP ${response.status}`);
    const result = await response.json();
    if (!result?.success) throw new Error(result?.message || result?.error || 'Admin-Daten konnten nicht geladen werden.');
    return Array.isArray(result?.players) ? result.players : [];
  }

  async function adminPost(action, password, extra = {}) {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, password: String(password || ''), ...extra }),
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(`Cloud HTTP ${response.status}`);
    const result = await response.json();
    if (!result?.success) throw new Error(result?.message || result?.error || 'Admin-Aktion fehlgeschlagen.');
    return result;
  }

  function deleteAdminPlayer(password, deviceId) {
    return adminPost('adminDelete', password, { deviceId: String(deviceId || '') });
  }

  function clearAdminPlayers(password) {
    return adminPost('adminClear', password);
  }

  const nativeSetItem = Storage.prototype.setItem;
  const nativeRemoveItem = Storage.prototype.removeItem;
  Storage.prototype.setItem = function patchedSetItem(key, value) {
    nativeSetItem.call(this, key, value);
    if (this === localStorage && WATCHED_KEYS.has(String(key))) scheduleSync();
  };
  Storage.prototype.removeItem = function patchedRemoveItem(key) {
    nativeRemoveItem.call(this, key);
    if (this === localStorage && WATCHED_KEYS.has(String(key))) scheduleSync();
  };

  window.addEventListener('online', () => retryPending());
  window.addEventListener('pageshow', () => scheduleSync(1500));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') retryPending();
    else if (getName()) syncNow({ keepalive: true });
  });

  getDeviceId();
  window.SinnesCloud = {
    apiUrl: API_URL,
    getDeviceId,
    getName,
    buildPayload,
    scheduleSync,
    syncNow,
    retryPending,
    loadPublicRanking,
    loadAdminData,
    deleteAdminPlayer,
    clearAdminPlayers
  };
})();
