
const knight = document.getElementById('knight');
const hotspots = document.querySelectorAll('.hotspot');
const lockButtons = document.querySelectorAll('[data-lock-button]');
const mapStage = document.querySelector('.map-stage');

const backgroundMusic = document.getElementById('backgroundMusic');
const backgroundMusicLoop = window.createCrossfadeLoop ? window.createCrossfadeLoop(backgroundMusic, { fadeSeconds: 0.025 }) : null;
const volumeSlider = document.getElementById('volumeSlider');

const introModal = document.getElementById('introModal');
const introTitle = document.getElementById('introTitle');
const introText = document.getElementById('introText');
const introDots = document.getElementById('introDots');
const introBackButton = document.getElementById('introBackButton');
const introNextButton = document.getElementById('introNextButton');

const returnModal = document.getElementById('returnModal');
const returnContinueButton = document.getElementById('returnContinueButton');

const infoModal = document.getElementById('infoModal');
const infoModalTitle = document.getElementById('infoModalTitle');
const infoModalText = document.getElementById('infoModalText');
const infoModalActions = document.getElementById('infoModalActions');

const settingsButton = document.getElementById('settingsButton');
const settingsModal = document.getElementById('settingsModal');
const showQrButton = document.getElementById('showQrButton');
const adminActivateButton = document.getElementById('adminActivateButton');
const adminTools = document.getElementById('adminTools');
const adminEvaluationButton = document.getElementById('adminEvaluationButton');
const unlockAdminLevelsButton = document.getElementById('unlockAdminLevelsButton');
const removeAreaLocksButton = document.getElementById('removeAreaLocksButton');
const resetGameButton = document.getElementById('resetGameButton');
const adminPasswordModal = document.getElementById('adminPasswordModal');
const adminPasswordInput = document.getElementById('adminPasswordInput');
const adminPasswordError = document.getElementById('adminPasswordError');
const adminPasswordSubmit = document.getElementById('adminPasswordSubmit');
const adminPasswordCancel = document.getElementById('adminPasswordCancel');
const qrOverview = document.getElementById('qrOverview');

const scannerModal = document.getElementById('scannerModal');
const scannerStatus = document.getElementById('scannerStatus');

const STORAGE_UNLOCKED = 'sinnesmagie-unlocked-areas';
const STORAGE_POS_X = 'sinnesmagie-knight-x';
const STORAGE_POS_Y = 'sinnesmagie-knight-y';
const STORAGE_AREA = 'sinnesmagie-last-area';
const STORAGE_INTRO_SEEN = 'sinnesmagie-game-intro-seen';
const STORAGE_VOLUME = 'sinnesmagie-volume';
const STORAGE_FRAGMENTS = 'sinnesmagie-fragments';
const STORAGE_FRAGMENT_SEAL_BROKEN='sinnesmagie-fragment-seal-broken';
const STORAGE_LEVEL_PROGRESS = 'sinnesmagie-level-progress';
const STORAGE_PENDING_NOTICE = 'sinnesmagie-pending-notice';
const STORAGE_ADMIN_MODE = 'sinnesmagie-admin-mode';
const STORAGE_ADMIN_LEVELS_UNLOCKED = 'sinnesmagie-admin-levels-unlocked';

const areaNames = {
  koenigsschloss: 'Königsschloss',
  zauberschloss: 'Zauberschloss',
  farbenreich: 'Farbenreich',
  klangwald: 'Klangwald',
  tastminen: 'Tastminen',
  duftgarten: 'Duftgarten',
  flammenkueche: 'Flammenküche'
};

const levelPages = {
  zauberschloss: 'levels/zauberschloss.html',
  farbenreich: 'levels/farbenreich.html',
  klangwald: 'levels/klangwald.html',
  tastminen: 'levels/tastminen.html',
  duftgarten: 'levels/duftgarten.html',
  flammenkueche: 'levels/flammenkueche.html'
};

const fragmentMeta = {
  farbenreich: { label: 'Kristall des Sehens', image: 'assets/images/fragments/red.png' },
  klangwald: { label: 'Kristall des Hörens', image: 'assets/images/fragments/blue.png' },
  tastminen: { label: 'Kristall des Tastens', image: 'assets/images/fragments/gold.png' },
  duftgarten: { label: 'Kristall des Riechens', image: 'assets/images/fragments/purple.png' },
  flammenkueche: { label: 'Kristall des Schmeckens', image: 'assets/images/fragments/green.png' }
};

const fragmentOrbitPositions = {
  farbenreich: { x: 42, y: 16.4, delay: 0 },
  klangwald: { x: 50, y: 12.2, delay: 0.6 },
  tastminen: { x: 58, y: 16.4, delay: 1.2 },
  duftgarten: { x: 45.5, y: 20.8, delay: 1.8 },
  flammenkueche: { x: 54.5, y: 20.8, delay: 2.4 }
};
const fragmentAreas = Object.keys(fragmentMeta);

const introSlides = [
  {
    title: 'Sinnesmagie',
    text: '<span class="intro-visual">✨🧩✨</span><br>Finde die fünf Sinnes-Kristalle.'
  },
  {
    title: 'QR-Code',
    text: '<span class="intro-visual">📱 🔓</span><br>Scanne Stationen, um Gebiete freizuschalten.'
  },
  {
    title: 'Spielen',
    text: '<span class="intro-visual">🗺️ ⚙️</span><br>Tippe Gebiete an. Lautstärke unten rechts.'
  }
];

let introIndex = 0;
let selectedLockedArea = '';
let html5QrCode = null;
let scannerRunning = false;
let scannerBusy = false;
let pendingNavigation = null;
let overworldJumpFrame = 0;
let overworldMoving = false;
const OVERWORLD_JUMP_ASSETS = {
  right: { jump: 'assets/images/characters/knight_right_jump.png', fall: 'assets/images/characters/knight_right_fall.png' },
  left: { jump: 'assets/images/characters/knight_left_jump.png', fall: 'assets/images/characters/knight_left_fall.png' },
  stand: 'assets/images/characters/knight.png'
};

let fragmentOrbitLayer = null;
let completedAreaLayer = null;
let currentInfoOnClose = null;

function readUnlocked() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_UNLOCKED) || '[]');
    return new Set(['koenigsschloss', ...(Array.isArray(saved) ? saved : [])]);
  } catch {
    return new Set(['koenigsschloss']);
  }
}

function saveUnlocked(unlockedSet) {
  const values = [...unlockedSet].filter(area => area !== 'koenigsschloss');
  localStorage.setItem(STORAGE_UNLOCKED, JSON.stringify(values));
}

function readFragments() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_FRAGMENTS) || '[]');
    return new Set(Array.isArray(saved) ? saved : []);
  } catch {
    return new Set();
  }
}

function saveFragments(fragmentSet) {
  localStorage.setItem(STORAGE_FRAGMENTS, JSON.stringify([...fragmentSet]));
}

function allFragmentsCollected() {
  return readFragments().size >= fragmentAreas.length;
}

function readLevelProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_LEVEL_PROGRESS) || '{}');
    return saved && typeof saved === 'object' ? saved : {};
  } catch {
    return {};
  }
}

function isAreaCompleted(area) {
  const progress = readLevelProgress();
  return !!progress[area]?.level2Completed;
}

function allPlayableAreasCompleted() {
  const progress = readLevelProgress();
  return fragmentAreas.every(area => !!progress[area]?.level2Completed);
}

function readPendingNotice() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_PENDING_NOTICE) || 'null');
    return saved && typeof saved === 'object' ? saved : null;
  } catch {
    return null;
  }
}

function clearPendingNotice() {
  localStorage.removeItem(STORAGE_PENDING_NOTICE);
}

function nextPlayableStep() {
  const progress = readLevelProgress();
  const unlocked = readUnlocked();
  const playable = fragmentAreas.filter(area => unlocked.has(area) && !isAreaCompleted(area));
  if (!playable.length) {
    if (allPlayableAreasCompleted()) {
      return {
        title: 'Alle Sinnes-Kristalle gesammelt',
        html: `<div class="visual-notice"><div class="visual-notice-icon">🏰✨</div><p>Geh zum Zauberschloss und hole die Magie der Sinne zurück.</p></div>`
      };
    }
    return {
      title: 'Nächstes Gebiet freischalten',
      html: `<div class="visual-notice"><div class="visual-notice-icon">📱</div><p>Scanne einen QR-Code, um ein weiteres Gebiet zu öffnen.</p></div>`
    };
  }

  const area = playable[0];
  const p = progress[area] || {};
  if (!p.level1Completed) {
    return {
      title: `Weiter im ${areaNames[area]}`,
      html: `<div class="visual-notice"><div class="visual-notice-icon">⭐</div><p>Als Nächstes wartet das Minispiel.</p></div>`
    };
  }
  return {
    title: `Bossbegegnung im ${areaNames[area]}`,
    html: `<div class="visual-notice"><div class="visual-notice-icon">⚔️</div><p>Das Boss-Quiz ist freigeschaltet.</p></div>`
  };
}


function celebrateAllFragments() {
  return new Promise(resolve => {
    moveKnightHome();
    mapStage?.classList.add('fragment-seal-shake');
    renderFragments();
    const layer = ensureFragmentOrbitLayer();
    const fragments = [...layer.querySelectorAll('.castle-fragment-orbit')];
    const colors = { farbenreich:'#ff4b67', klangwald:'#48a8ff', tastminen:'#ffd34f', duftgarten:'#b66cff', flammenkueche:'#55d86a' };
    fragments.forEach((wrap,index) => {
      const area = wrap.dataset.area || fragmentAreas[index];
      wrap.style.setProperty('--burst-color', colors[area] || '#fff');
      window.setTimeout(() => {
        wrap.classList.add('fragment-bursting');
        for(let i=0;i<14;i+=1){
          const spark=document.createElement('i');
          spark.className='fragment-burst-spark';
          spark.style.setProperty('--angle',`${(360/14)*i}deg`);
          spark.style.setProperty('--distance',`${45+Math.random()*55}px`);
          wrap.appendChild(spark);
        }
      }, index*200);
    });
    window.setTimeout(() => {
      layer.innerHTML=''; localStorage.setItem(STORAGE_FRAGMENT_SEAL_BROKEN,'1');
      showInfo('Alle Fragmente gesammelt!', `<div class="visual-notice all-fragments-notice"><div class="visual-notice-icon">💎✨🏰</div><p>Alle fünf Schlüsselfragmente sind vereint.</p><p>Das Siegel am Zauberschloss ist gebrochen. Begib dich jetzt zum Schloss und stelle dich dem Zauberer!</p></div>`, { html:true, showScanButton:false, backLabel:'Zum Zauberschloss', onClose:()=>{ startMusic(); resolve(); } });
          mapStage?.classList.remove('fragment-seal-shake');
    }, Math.max(1000, fragments.length*200)+650);
  });
}


function isWholeGameCompleted() {
  try {
    const progress = JSON.parse(localStorage.getItem(STORAGE_LEVEL_PROGRESS) || '{}');
    return !!(progress.zauberschloss?.finaleCompleted || progress.zauberschloss?.level4Completed || progress.zauberschloss?.level3Completed);
  } catch { return false; }
}

function addPostgameVillageArrow() {
  if (!isWholeGameCompleted()) return;
  const stage = document.querySelector('.map-stage');
  if (!stage || stage.querySelector('.village-gold-arrow')) return;
  const hint = document.createElement('div');
  hint.className = 'village-gold-arrow';
  hint.innerHTML = '<span>Musik im Dorf</span><b>↓</b>';
  hint.setAttribute('aria-hidden','true');
  stage.appendChild(hint);
}

function showReturnGuidance(pending = null) {
  if (isWholeGameCompleted()) {
    addPostgameVillageArrow();
    showInfo(
      'Das Königreich ist gerettet!',
      `<div class="visual-notice kingdom-saved-notice">
        <div class="visual-notice-icon">🏰✨🎶</div>
        <p>Die Sinnesmagie ist zurückgekehrt und im Königreich wird wieder gefeiert.</p>
        <p>Du kannst jetzt die Bestenliste öffnen oder das Dorf in der Kartenmitte besuchen. Dort versucht sich der Ritter als Barde.</p>
      </div>`,
      { html:true, showScanButton:false, backLabel:'Weiter', onClose:()=>startMusic() }
    );
    return;
  }
  if (pending?.type === 'fragment' && pending.allCollected) { celebrateAllFragments(); return; }
  if (pending?.type === 'castleBossComplete' || (pending?.area === 'zauberschloss' && isAreaCompleted('zauberschloss'))) {
    showInfo(
      'Boss besiegt!',
      `<div class="visual-notice">
        <div class="visual-notice-icon">🏰✨</div>
        <p>Das nächste Level im Zauberschloss ist jetzt freigeschaltet.</p>
      </div>`,
      {
        html: true,
        hideBackButton: true,
        showScanButton: false,
        extraButtons: [
          {
            label: 'Zurück zum Zauberschloss',
            className: 'primary-button',
            onClick: () => {
              localStorage.setItem(STORAGE_PENDING_NOTICE, JSON.stringify({ type: 'castleNextLevelUnlocked', area: 'zauberschloss' }));
              window.location.href = 'levels/zauberschloss.html?nextLevelUnlocked=1';
            }
          }
        ]
      }
    );
    return;
  }

  let title = 'Weiter geht’s';
  let html = '';
  if (pending?.type === 'fragment' && pending.area && fragmentMeta[pending.area]) {
    const meta = fragmentMeta[pending.area];
    const next = nextPlayableStep();
    title = `${meta.label} erhalten`;
    html = `
      <div class="visual-notice">
        <div class="visual-notice-hero"><img src="${meta.image}" alt="${meta.label}"></div>
        <p>Du hast ${areaNames[pending.area]} abgeschlossen.</p>
        <p>${next.title}</p>
      </div>`;
  } else {
    const next = nextPlayableStep();
    title = next.title;
    html = next.html;
  }

  showInfo(title, html, {
    html: true,
    showScanButton: false,
    backLabel: 'OK',
    onClose: () => startMusic()
  });
}


function saveLevelProgress(progress) {
  localStorage.setItem(STORAGE_LEVEL_PROGRESS, JSON.stringify(progress));
}

let unlockedAreas = readUnlocked();

function isUnlocked(area) {
  return unlockedAreas.has(area);
}

function currentVolume() {
  const saved = Number(localStorage.getItem(STORAGE_VOLUME));
  if (Number.isFinite(saved)) return Math.min(1, Math.max(0, saved));
  return 0.5;
}

function applyVolume(value) {
  const volume = Math.min(1, Math.max(0, Number(value)));
  if (backgroundMusicLoop) {
    backgroundMusicLoop.setVolume(volume);
  } else if (backgroundMusic) {
    backgroundMusic.volume = volume;
  }
  localStorage.setItem(STORAGE_VOLUME, String(volume));
  volumeSlider.value = String(Math.round(volume * 100));
}

function startMusic() {
  applyVolume(Number(volumeSlider.value) / 100);
  if (backgroundMusicLoop) {
    backgroundMusicLoop.play();
  } else if (backgroundMusic) {
    backgroundMusic.play().catch(() => {});
  }
}

function ensureFragmentOrbitLayer() {
  if (fragmentOrbitLayer) return fragmentOrbitLayer;
  fragmentOrbitLayer = document.createElement('div');
  fragmentOrbitLayer.id = 'fragmentOrbitLayer';
  fragmentOrbitLayer.className = 'fragment-orbit-layer';
  mapStage.appendChild(fragmentOrbitLayer);
  return fragmentOrbitLayer;
}

function renderFragments() {
  if(localStorage.getItem(STORAGE_FRAGMENT_SEAL_BROKEN)==='1'){ const layer=ensureFragmentOrbitLayer(); layer.innerHTML=''; return; }
  const layer = ensureFragmentOrbitLayer();
  const fragments = readFragments();
  layer.innerHTML = '';

  [...fragments].forEach(area => {
    const meta = fragmentMeta[area];
    const pos = fragmentOrbitPositions[area];
    if (!meta || !pos) return;
    const wrap = document.createElement('div');
    wrap.className = 'castle-fragment-orbit';
    wrap.dataset.area = area;
    wrap.style.setProperty('--x', `${pos.x}%`);
    wrap.style.setProperty('--y', `${pos.y}%`);
    wrap.style.setProperty('--delay', `${pos.delay}s`);
    wrap.title = meta.label;

    const img = document.createElement('img');
    img.src = meta.image;
    img.alt = meta.label;
    img.draggable = false;
    wrap.appendChild(img);
    layer.appendChild(wrap);
  });
}

function ensureCompletedAreaLayer() {
  if (completedAreaLayer) return completedAreaLayer;
  completedAreaLayer = document.createElement('div');
  completedAreaLayer.id = 'completedAreaLayer';
  completedAreaLayer.className = 'completed-area-layer';
  mapStage.appendChild(completedAreaLayer);
  return completedAreaLayer;
}

function completedAreaMessage(area) {
  if (allPlayableAreasCompleted()) {
    return 'Du hast alle Level abgeschlossen. Geh zum Zauberschloss und hole die Magie der Sinne zurück.';
  }
  return 'Du hast dieses Gebiet abgeschlossen. Scanne einen QR-Code, um ein anderes Gebiet freizuschalten.';
}

function showCompletedAreaInfo(area) {
  const meta = fragmentMeta[area];
  const allDone = allPlayableAreasCompleted();
  const visual = meta
    ? `<div class="simple-fragment-box"><img class="fragment-mini-image floating-fragment" src="${meta.image}" alt="${meta.label}"><strong>${meta.label}</strong></div>`
    : '<div class="intro-visual">✓</div>';
  showInfo(
    `${areaNames[area] || 'Gebiet'} abgeschlossen`,
    `${visual}<p>Dieses Gebiet hast du bereits abgeschlossen. Du kannst es jederzeit erneut spielen.</p>`,
    {
      showScanButton: !allDone,
      html: true,
      extraButtons: levelPages[area] ? [
        {
          label: 'Gebiet erneut spielen',
          className: 'primary-button',
          onClick: () => { window.location.href = levelPages[area]; }
        }
      ] : []
    }
  );
}

function renderCompletedAreaBadges() {
  const layer = ensureCompletedAreaLayer();
  layer.innerHTML = '';

  hotspots.forEach(button => {
    const area = button.dataset.area;
    const completed = isAreaCompleted(area) && fragmentMeta[area];
    button.classList.toggle('area-completed', !!completed);
    if (!completed) return;

    const badge = document.createElement('button');
    badge.className = 'completed-area-badge';
    badge.type = 'button';
    badge.textContent = '✓';
    badge.style.setProperty('--x', `${button.dataset.targetX || 50}%`);
    badge.style.setProperty('--y', `${button.dataset.targetY || 50}%`);
    badge.setAttribute('aria-label', `${areaNames[area]} abgeschlossen`);
    badge.addEventListener('click', event => {
      event.stopPropagation();
      moveKnightTo(button);
    });
    layer.appendChild(badge);
  });
}

function renderInfoActions(options = {}) {
  infoModalActions.innerHTML = '';
  currentInfoOnClose = typeof options.onClose === 'function' ? options.onClose : null;

  if (!options.hideBackButton) {
    const backButton = document.createElement('button');
    backButton.className = 'ghost-button';
    backButton.type = 'button';
    backButton.textContent = options.backLabel || 'Zurück';
    backButton.addEventListener('click', closeInfo);
    infoModalActions.appendChild(backButton);
  }

  if (options.showScanButton) {
    const scanButton = document.createElement('button');
    scanButton.id = 'scanFromInfoButton';
    scanButton.className = 'primary-button';
    scanButton.type = 'button';
    scanButton.textContent = 'QR-Code scannen';
    scanButton.addEventListener('click', openScanner);
    infoModalActions.appendChild(scanButton);
  }

  (options.extraButtons || []).forEach(buttonConfig => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = buttonConfig.className || 'primary-button';
    button.textContent = buttonConfig.label;
    button.addEventListener('click', buttonConfig.onClick);
    infoModalActions.appendChild(button);
  });
}

function showInfo(title, text, options = {}) {
  infoModalTitle.textContent = title;
  if (options.html) infoModalText.innerHTML = text;
  else infoModalText.textContent = text;
  renderInfoActions(options);
  infoModal.classList.remove('hidden');
}

function closeInfo() {
  infoModal.classList.add('hidden');
  const handler = currentInfoOnClose;
  currentInfoOnClose = null;
  if (typeof handler === 'function') handler();
  else startMusic();
}

function openSettings() {
  settingsModal.classList.remove('hidden');
}

function closeSettings() {
  settingsModal.classList.add('hidden');
}

function openAdminPassword() {
  closeSettings();
  adminPasswordError?.classList.add('hidden');
  if (adminPasswordInput) adminPasswordInput.value = '';
  adminPasswordModal?.classList.remove('hidden');
  window.setTimeout(() => adminPasswordInput?.focus(), 60);
}

function closeAdminPassword() {
  adminPasswordModal?.classList.add('hidden');
  adminPasswordError?.classList.add('hidden');
}

function isAdminMode() {
  return sessionStorage.getItem(STORAGE_ADMIN_MODE) === '1';
}

function updateAdminTools() {
  const active = isAdminMode();
  adminTools?.classList.toggle('hidden', !active);
  if (adminActivateButton) adminActivateButton.textContent = active ? 'Admin deaktivieren' : 'Admin aktivieren';
}

function deactivateAdminMode() {
  sessionStorage.removeItem(STORAGE_ADMIN_MODE);
  sessionStorage.removeItem('sinnesmagie-admin-auth');
  sessionStorage.removeItem('sinnesmagie-admin-password');
  localStorage.removeItem(STORAGE_ADMIN_LEVELS_UNLOCKED);
  updateAdminTools();
}

function submitAdminPassword() {
  const password = adminPasswordInput?.value || '';
  if (password !== 'Mark123') {
    adminPasswordError?.classList.remove('hidden');
    adminPasswordInput?.focus();
    adminPasswordInput?.select();
    return;
  }
  sessionStorage.setItem(STORAGE_ADMIN_MODE, '1');
  sessionStorage.setItem('sinnesmagie-admin-auth', '1');
  sessionStorage.setItem('sinnesmagie-admin-password', password);
  closeAdminPassword();
  updateAdminTools();
  openSettings();
}

function showLockedInfo(area) {
  selectedLockedArea = area;

  if (area === 'zauberschloss') {
    const total = readFragments().size;
    if (allFragmentsCollected()) {
      showInfo(
        'Zauberschloss versiegelt',
        'Alle fünf Kristalle sind gesammelt. Nutze ihre Magie, um das Schloss zu zerbrechen und den Zauberer herauszufordern.',
        {
          showScanButton: false,
          extraButtons: [
            {
              label: 'Schloss zerbrechen',
              className: 'primary-button',
              onClick: breakCastleSeal
            }
          ]
        }
      );
    } else {
      showInfo(
        'Zauberschloss ist gesperrt',
        `Du brauchst zuerst alle fünf Kristalle. Bisher gesammelt: ${total} / ${fragmentAreas.length}.`,
        { showScanButton: false }
      );
    }
    return;
  }

  showInfo(
    `${areaNames[area]} ist gesperrt`,
    'Um dieses Level freizuschalten, musst du den entsprechenden QR-Code an der Station scannen.',
    { showScanButton: true }
  );
}

function updateLocks() {
  const canBreakCastle = allFragmentsCollected() && !isUnlocked('zauberschloss');
  lockButtons.forEach(button => {
    const area = button.dataset.lockButton;
    const unlocked = isUnlocked(area);
    button.classList.toggle('hidden-lock', unlocked);
    button.setAttribute('aria-hidden', unlocked ? 'true' : 'false');

    if (area === 'zauberschloss') {
      button.classList.toggle('castle-ready', canBreakCastle);
      button.textContent = canBreakCastle ? '✨' : '🔒';
      button.setAttribute(
        'aria-label',
        unlocked
          ? 'Zauberschloss ist geöffnet'
          : canBreakCastle
            ? 'Zauberschloss kann zerbrochen werden'
            : 'Zauberschloss ist gesperrt'
      );
    }
  });
  renderFragments();
  renderCompletedAreaBadges();
}

function unlockArea(area, options = {}) {
  if (!areaNames[area] || area === 'koenigsschloss') return false;
  if (area === 'zauberschloss' && !options.force) return false;
  const wasUnlocked = isUnlocked(area);
  unlockedAreas.add(area);
  saveUnlocked(unlockedAreas);
  updateLocks();
  return !wasUnlocked;
}

function breakCastleSeal() {
  const newlyUnlocked = unlockArea('zauberschloss', { force: true });
  closeInfo();
  showInfo(
    newlyUnlocked ? 'Zauberschloss geöffnet' : 'Zauberschloss ist bereits geöffnet',
    newlyUnlocked
      ? 'Die Kristalle zerbrechen das Schloss. Jetzt kannst du das Zauberschloss betreten.'
      : 'Das Zauberschloss ist bereits geöffnet.',
    { showScanButton: false }
  );
}

function moveKnightTo(button) {
  const area = button.dataset.area;

  if (!isUnlocked(area)) {
    showLockedInfo(area);
    return;
  }

  if (pendingNavigation) {
    clearTimeout(pendingNavigation);
    pendingNavigation = null;
  }
  if (overworldJumpFrame) cancelAnimationFrame(overworldJumpFrame);

  const targetX = Number(button.dataset.targetX || 50);
  const targetY = Number(button.dataset.targetY || 60);
  const startX = Number.parseFloat(knight.style.left) || Number(localStorage.getItem(STORAGE_POS_X)) || 50;
  const startY = Number.parseFloat(knight.style.top) || Number(localStorage.getItem(STORAGE_POS_Y)) || 60;
  const dx = targetX - startX;
  const dy = targetY - startY;
  const direction = dx < 0 ? 'left' : 'right';
  const assets = OVERWORLD_JUMP_ASSETS[direction];
  const distance = Math.hypot(dx, dy);
  const duration = Math.max(620, Math.min(1150, 540 + distance * 13));
  const arcHeight = Math.max(5.5, Math.min(13, 5 + distance * 0.16));
  const started = performance.now();

  overworldMoving = true;
  knight.classList.add('overworld-knight-jumping');

  const frame = now => {
    const raw = Math.min(1, (now - started) / duration);
    const eased = raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2;
    knight.style.left = `${startX + dx * eased}%`;
    knight.style.top = `${startY + dy * eased - Math.sin(Math.PI * raw) * arcHeight}%`;
    knight.src = raw < 0.5 ? assets.jump : assets.fall;
    if (raw < 1) {
      overworldJumpFrame = requestAnimationFrame(frame);
      return;
    }
    overworldJumpFrame = 0;
    overworldMoving = false;
    knight.classList.remove('overworld-knight-jumping');
    knight.src = OVERWORLD_JUMP_ASSETS.stand;
    knight.style.left = `${targetX}%`;
    knight.style.top = `${targetY}%`;
    localStorage.setItem(STORAGE_POS_X, String(targetX));
    localStorage.setItem(STORAGE_POS_Y, String(targetY));
    localStorage.setItem(STORAGE_AREA, area);

    if (area === 'koenigsschloss' && isWholeGameCompleted()) {
      pendingNavigation = window.setTimeout(() => {
        window.location.href = 'musikdorf.html';
      }, 180);
    } else if (levelPages[area]) {
      pendingNavigation = window.setTimeout(() => {
        window.location.href = levelPages[area];
      }, 180);
    }
  };
  overworldJumpFrame = requestAnimationFrame(frame);
}

function normalizeScannedArea(rawText) {
  const text = String(rawText || '').trim();
  if (!text) return '';

  const plain = text.toLowerCase();
  if (areaNames[plain]) return plain;

  const withBase = text.startsWith('http://') || text.startsWith('https://')
    ? text
    : `https://example.com/${text.replace(/^\/+/, '')}`;

  try {
    const url = new URL(withBase);
    const unlock = (url.searchParams.get('unlock') || '').trim().toLowerCase();
    if (areaNames[unlock]) return unlock;

    const hashUnlock = (new URLSearchParams(url.hash.replace(/^#/, ''))).get('unlock');
    if (hashUnlock && areaNames[hashUnlock.trim().toLowerCase()]) {
      return hashUnlock.trim().toLowerCase();
    }
  } catch {
    // ignore malformed values
  }

  const match = plain.match(/unlock=([a-z_]+)/);
  if (match && areaNames[match[1]]) return match[1];

  return '';
}

async function stopScanner() {
  if (!html5QrCode || !scannerRunning) return;
  try { await html5QrCode.stop(); } catch {}
  try { await html5QrCode.clear(); } catch {}
  scannerRunning = false;
}

async function closeScanner() {
  await stopScanner();
  scannerModal.classList.add('hidden');
}

async function onScanSuccess(decodedText) {
  if (scannerBusy) return;
  scannerBusy = true;

  const area = normalizeScannedArea(decodedText);

  if (!area) {
    scannerStatus.textContent = 'Dieser QR-Code gehört zu keinem gesperrten Gebiet.';
    scannerBusy = false;
    return;
  }

  if (area === 'zauberschloss') {
    await closeScanner();
    showInfo(
      'Zauberschloss bleibt versiegelt',
      'Das Zauberschloss wird nicht per QR-Code geöffnet. Sammle zuerst alle fünf Kristalle und zerbrich dann das Schloss auf der Overworld.',
      { showScanButton: false }
    );
    scannerBusy = false;
    return;
  }

  const newlyUnlocked = unlockArea(area);
  await closeScanner();

  showInfo(
    newlyUnlocked ? `${areaNames[area]} freigeschaltet` : `${areaNames[area]} war bereits freigeschaltet`,
    newlyUnlocked
      ? 'Das Schloss ist verschwunden. Tippe auf das Gebiet, damit der Ritter dorthin läuft.'
      : 'Du kannst dieses Gebiet bereits betreten.',
    { showScanButton: false }
  );

  scannerBusy = false;
}

async function openScanner() {
  closeInfo();
  scannerModal.classList.remove('hidden');
  scannerStatus.textContent = 'Kamera wird vorbereitet …';

  if (!window.Html5Qrcode) {
    scannerStatus.textContent = 'Der QR-Code-Scanner konnte nicht geladen werden. Prüfe die Internetverbindung.';
    return;
  }

  if (!html5QrCode) {
    html5QrCode = new Html5Qrcode('qr-reader');
  }

  if (scannerRunning) return;

  try {
    await html5QrCode.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 220, height: 220 } },
      onScanSuccess,
      () => {}
    );
    scannerRunning = true;
    scannerStatus.textContent = 'Halte den QR-Code in den markierten Bereich.';
  } catch (error) {
    console.error(error);
    scannerStatus.textContent = 'Die Kamera konnte nicht gestartet werden. Bitte erlaube den Kamerazugriff.';
  }
}

function applyUnlockFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const unlock = params.get('unlock');
  if (!unlock) return;

  const area = unlock.trim().toLowerCase();
  if (area === 'zauberschloss') {
    showInfo(
      'Zauberschloss bleibt versiegelt',
      'Das Zauberschloss öffnet sich nicht per Direktlink. Sammle zuerst alle Kristalle und zerbrich dann das Schloss auf der Overworld.',
      { showScanButton: false }
    );
    const cleanUrl = `${window.location.origin}${window.location.pathname}`;
    window.history.replaceState({}, document.title, cleanUrl);
    return;
  }

  const newlyUnlocked = unlockArea(area);

  if (areaNames[area] && area !== 'koenigsschloss') {
    showInfo(
      newlyUnlocked ? `${areaNames[area]} freigeschaltet` : `${areaNames[area]} ist bereits freigeschaltet`,
      newlyUnlocked
        ? 'Das Schloss ist verschwunden. Tippe auf das Gebiet, damit der Ritter dorthin läuft.'
        : 'Du kannst dieses Gebiet bereits betreten.',
      { showScanButton: false }
    );
  }

  const cleanUrl = `${window.location.origin}${window.location.pathname}`;
  window.history.replaceState({}, document.title, cleanUrl);
}

function renderIntro() {
  const slide = introSlides[introIndex];
  introTitle.textContent = slide.title;
  introText.innerHTML = slide.text;
  introBackButton.classList.toggle('hidden', introIndex === 0);
  introNextButton.textContent = introIndex === introSlides.length - 1 ? 'Abenteuer beginnen' : 'Weiter';
  introDots.innerHTML = introSlides.map((_, index) => `<span class="slider-dot ${index === introIndex ? 'active' : ''}"></span>`).join('');
}

function openIntro() {
  introIndex = 0;
  renderIntro();
  introModal.classList.remove('hidden');
}

function closeIntroAndStart() {
  introModal.classList.add('hidden');
  localStorage.setItem(STORAGE_INTRO_SEEN, 'true');
  startMusic();
}

function moveKnightHome() {
  const homeX = '50';
  const homeY = '60';
  knight.style.left = `${homeX}%`;
  knight.style.top = `${homeY}%`;
  localStorage.setItem(STORAGE_POS_X, homeX);
  localStorage.setItem(STORAGE_POS_Y, homeY);
  localStorage.setItem(STORAGE_AREA, 'koenigsschloss');
}

function maybeShowEntryModal() {
  const params = new URLSearchParams(window.location.search);
  const fromLevel = params.get('fromLevel') === '1';
  const completedArea = (params.get('completedArea') || '').trim().toLowerCase();

  if (fromLevel) {
    const cleanUrl = `${window.location.origin}${window.location.pathname}`;
    window.history.replaceState({}, document.title, cleanUrl);
    window.setTimeout(moveKnightHome, 220);
    window.setTimeout(() => renderCompletedAreaBadges(), 260);
    const pending = readPendingNotice();
    clearPendingNotice();
    window.setTimeout(() => showReturnGuidance(pending || (completedArea ? { type: 'fragment', area: completedArea } : null)), 420);
    return;
  }

  if (localStorage.getItem(STORAGE_INTRO_SEEN) !== 'true') {
    openIntro();
  }
}

function removeAllAreaLocks() {
  const confirmed = window.confirm('Alle Gebietsschlösser entfernen? Die Level-Fortschritte bleiben unverändert.');
  if (!confirmed) return;
  unlockedAreas = new Set(['koenigsschloss', ...Object.keys(levelPages)]);
  saveUnlocked(unlockedAreas);
  updateLocks();
  closeSettings();
  showInfo('Schlösser entfernt', 'Alle Gebiete können jetzt ohne QR-Code betreten werden.', { showScanButton: false });
}

function unlockAllLevelsForAdmin() {
  localStorage.setItem(STORAGE_ADMIN_LEVELS_UNLOCKED, '1');
  closeSettings();
  showInfo('Alle Level freigeschaltet', 'Im Admin-Modus können jetzt alle Levelpunkte direkt geöffnet und bei Bedarf automatisch abgeschlossen werden.', { showScanButton: false });
}

hotspots.forEach(button => {
  button.addEventListener('click', () => moveKnightTo(button));
});

lockButtons.forEach(button => {
  button.addEventListener('click', event => {
    event.stopPropagation();
    const area = button.dataset.area;
    showLockedInfo(area);
  });
});

introNextButton.addEventListener('click', () => {
  if (introIndex < introSlides.length - 1) {
    introIndex += 1;
    renderIntro();
    return;
  }
  closeIntroAndStart();
});

introBackButton.addEventListener('click', () => {
  if (introIndex > 0) {
    introIndex -= 1;
    renderIntro();
  }
});

returnContinueButton.addEventListener('click', () => {
  returnModal.classList.add('hidden');
  startMusic();
});

showQrButton.addEventListener('click', () => {
  qrOverview.classList.toggle('hidden');
  showQrButton.textContent = qrOverview.classList.contains('hidden') ? 'QR-Codes anzeigen' : 'QR-Codes ausblenden';
});

adminActivateButton?.addEventListener('click', () => {
  if (isAdminMode()) {
    deactivateAdminMode();
    return;
  }
  openAdminPassword();
});
adminEvaluationButton?.addEventListener('click', () => {
  sessionStorage.setItem('sinnesmagie-admin-auth', '1');
  sessionStorage.setItem('sinnesmagie-admin-password', 'Mark123');
  window.location.href = 'admin.html';
});
unlockAdminLevelsButton?.addEventListener('click', unlockAllLevelsForAdmin);
removeAreaLocksButton?.addEventListener('click', removeAllAreaLocks);

adminPasswordSubmit?.addEventListener('click', submitAdminPassword);
adminPasswordCancel?.addEventListener('click', closeAdminPassword);
adminPasswordInput?.addEventListener('keydown', event => {
  if (event.key === 'Enter') submitAdminPassword();
  if (event.key === 'Escape') closeAdminPassword();
});
document.querySelectorAll('[data-close-admin-password]').forEach(button => button.addEventListener('click', closeAdminPassword));
adminPasswordModal?.addEventListener('click', event => { if (event.target === adminPasswordModal) closeAdminPassword(); });

resetGameButton.addEventListener('click', () => {
  const confirmed = window.confirm('Spiel wirklich zurücksetzen? Alle Freischaltungen, Kristalle und gespeicherten Positionen werden gelöscht.');
  if (!confirmed) return;
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('sinnesmagie-')) {
      localStorage.removeItem(key);
    }
  });
  window.location.href = 'index.html';
});

volumeSlider.addEventListener('input', event => {
  applyVolume(Number(event.target.value) / 100);
});

document.querySelectorAll('[data-close-modal]').forEach(button => button.addEventListener('click', closeInfo));
document.querySelectorAll('[data-close-settings]').forEach(button => button.addEventListener('click', closeSettings));
document.querySelectorAll('[data-close-scanner]').forEach(button => button.addEventListener('click', () => closeScanner()));

infoModal.addEventListener('click', event => { if (event.target === infoModal) closeInfo(); });
settingsModal.addEventListener('click', event => { if (event.target === settingsModal) closeSettings(); });
scannerModal.addEventListener('click', event => { if (event.target === scannerModal) closeScanner(); });
settingsButton.addEventListener('click', openSettings);


function ensureKnightVisible() {
  if (!knight) return;
  knight.style.display = 'block';
  knight.style.visibility = 'visible';
  knight.style.opacity = '1';
  knight.style.zIndex = '32';
}
ensureKnightVisible();

const savedX = localStorage.getItem(STORAGE_POS_X);
const savedY = localStorage.getItem(STORAGE_POS_Y);
if (savedX && savedY) {
  knight.style.left = `${savedX}%`;
  knight.style.top = `${savedY}%`;
}

applyVolume(currentVolume());
updateAdminTools();
updateLocks();
addPostgameVillageArrow();
applyUnlockFromUrl();
maybeShowEntryModal();
