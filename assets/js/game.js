
const knight = document.getElementById('knight');
const hotspots = document.querySelectorAll('.hotspot');
const lockButtons = document.querySelectorAll('[data-lock-button]');
const mapStage = document.querySelector('.map-stage');

const backgroundMusic = document.getElementById('backgroundMusic');
const backgroundMusicLoop = window.createCrossfadeLoop ? window.createCrossfadeLoop(backgroundMusic, { fadeSeconds: 0.18 }) : null;
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
const unlockAllButton = document.getElementById('unlockAllButton');
const resetGameButton = document.getElementById('resetGameButton');
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
const STORAGE_LEVEL_PROGRESS = 'sinnesmagie-level-progress';

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
    title: 'Die Suche beginnt',
    text: 'Der Zauberer hat fünf Kristallfragmente in verschiedenen Bereichen des Königreichs versteckt. Finde sie, öffne sein Schloss und hole die Sinnesmagie zurück.'
  },
  {
    title: 'So schaltest du Level frei',
    text: 'An den Stationen im Raum findest du QR-Codes. Scanne sie, um Level freizuschalten und die Kristalle zu erspielen.'
  },
  {
    title: 'Spielfeld bedienen',
    text: 'Tippe auf ein Gebiet, um dorthin zu reisen. Unten rechts findest du die Einstellungen, zum Beispiel für die Lautstärke.'
  }
];

let introIndex = 0;
let selectedLockedArea = '';
let html5QrCode = null;
let scannerRunning = false;
let scannerBusy = false;
let pendingNavigation = null;
let fragmentOrbitLayer = null;

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
  const layer = ensureFragmentOrbitLayer();
  const fragments = readFragments();
  layer.innerHTML = '';

  [...fragments].forEach(area => {
    const meta = fragmentMeta[area];
    const pos = fragmentOrbitPositions[area];
    if (!meta || !pos) return;
    const wrap = document.createElement('div');
    wrap.className = 'castle-fragment-orbit';
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

function renderInfoActions(options = {}) {
  infoModalActions.innerHTML = '';

  const backButton = document.createElement('button');
  backButton.className = 'ghost-button';
  backButton.type = 'button';
  backButton.textContent = options.backLabel || 'Zurück';
  backButton.addEventListener('click', closeInfo);
  infoModalActions.appendChild(backButton);

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
  infoModalText.textContent = text;
  renderInfoActions(options);
  infoModal.classList.remove('hidden');
}

function closeInfo() {
  infoModal.classList.add('hidden');
}

function openSettings() {
  settingsModal.classList.remove('hidden');
}

function closeSettings() {
  settingsModal.classList.add('hidden');
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

  const x = button.dataset.targetX;
  const y = button.dataset.targetY;
  knight.style.left = `${x}%`;
  knight.style.top = `${y}%`;
  localStorage.setItem(STORAGE_POS_X, x);
  localStorage.setItem(STORAGE_POS_Y, y);
  localStorage.setItem(STORAGE_AREA, area);

  if (levelPages[area]) {
    pendingNavigation = window.setTimeout(() => {
      window.location.href = levelPages[area];
    }, 850);
  }
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
  introText.textContent = slide.text;
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

function maybeShowEntryModal() {
  const params = new URLSearchParams(window.location.search);
  const fromLevel = params.get('fromLevel') === '1';

  if (fromLevel) {
    returnModal.classList.remove('hidden');
    const cleanUrl = `${window.location.origin}${window.location.pathname}`;
    window.history.replaceState({}, document.title, cleanUrl);
    return;
  }

  if (localStorage.getItem(STORAGE_INTRO_SEEN) !== 'true') {
    openIntro();
  }
}

function unlockAllForTesting() {
  const confirmed = window.confirm('Alle Gebiete für Testzwecke freischalten? Kristalle und Level-Fortschritte bleiben unverändert.');
  if (!confirmed) return;

  unlockedAreas = new Set(['koenigsschloss', ...Object.keys(levelPages)]);
  saveUnlocked(unlockedAreas);

  updateLocks();
  closeSettings();
  showInfo('Test-Freischaltung aktiv', 'Alle Gebietsschlösser wurden entfernt. Die Level selbst müssen weiterhin nacheinander gespielt werden.', { showScanButton: false });
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

if (unlockAllButton) {
  unlockAllButton.addEventListener('click', unlockAllForTesting);
}

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

const savedX = localStorage.getItem(STORAGE_POS_X);
const savedY = localStorage.getItem(STORAGE_POS_Y);
if (savedX && savedY) {
  knight.style.left = `${savedX}%`;
  knight.style.top = `${savedY}%`;
}

applyVolume(currentVolume());
updateLocks();
applyUnlockFromUrl();
maybeShowEntryModal();
