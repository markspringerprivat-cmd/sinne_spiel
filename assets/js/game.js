const knight = document.getElementById('knight');
const hotspots = document.querySelectorAll('.hotspot');
const lockButtons = document.querySelectorAll('[data-lock-button]');

const backgroundMusic = document.getElementById('backgroundMusic');
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
const scanFromInfoButton = document.getElementById('scanFromInfoButton');

const settingsButton = document.getElementById('settingsButton');
const settingsModal = document.getElementById('settingsModal');
const showQrButton = document.getElementById('showQrButton');
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

const introSlides = [
  {
    title: 'Die Suche beginnt',
    text: 'Der Zauberer hat fünf Schlüsselfragmente in verschiedenen Bereichen des Königreichs versteckt. Finde sie, öffne sein Schloss und hole die Sinnesmagie zurück.'
  },
  {
    title: 'So schaltest du Level frei',
    text: 'An den Stationen im Raum findest du QR-Codes. Scanne sie, um Level freizuschalten und die Schlüsselfragmente zu erspielen.'
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

let unlockedAreas = readUnlocked();

function isUnlocked(area) {
  return unlockedAreas.has(area);
}

function currentVolume() {
  const saved = Number(localStorage.getItem(STORAGE_VOLUME));
  if (Number.isFinite(saved)) return Math.min(1, Math.max(0, saved));
  return 0.6;
}

function applyVolume(value) {
  const volume = Math.min(1, Math.max(0, Number(value)));
  backgroundMusic.volume = volume;
  localStorage.setItem(STORAGE_VOLUME, String(volume));
  volumeSlider.value = String(Math.round(volume * 100));
}

function startMusic() {
  applyVolume(Number(volumeSlider.value) / 100);
  backgroundMusic.play().catch(() => {
    // Browser blockiert Wiedergabe, bis erneut interagiert wird.
  });
}

function showInfo(title, text, options = {}) {
  infoModalTitle.textContent = title;
  infoModalText.textContent = text;
  infoModalActions.classList.toggle('hidden', !options.showScanButton);
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
  showInfo(
    `${areaNames[area]} ist gesperrt`,
    'Um dieses Level freizuschalten, musst du den entsprechenden QR-Code an der Station scannen.',
    { showScanButton: true }
  );
}

function updateLocks() {
  lockButtons.forEach(button => {
    const area = button.dataset.lockButton;
    button.classList.toggle('hidden-lock', isUnlocked(area));
    button.setAttribute('aria-hidden', isUnlocked(area) ? 'true' : 'false');
  });
}

function unlockArea(area) {
  if (!areaNames[area] || area === 'koenigsschloss') return false;
  const wasUnlocked = isUnlocked(area);
  unlockedAreas.add(area);
  saveUnlocked(unlockedAreas);
  updateLocks();
  return !wasUnlocked;
}

function moveKnightTo(button) {
  const area = button.dataset.area;

  if (!isUnlocked(area)) {
    showLockedInfo(area);
    return;
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
  try {
    await html5QrCode.stop();
  } catch {
    // ignore stop errors
  }
  try {
    await html5QrCode.clear();
  } catch {
    // ignore clear errors
  }
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

  if (!area || area === 'koenigsschloss') {
    scannerStatus.textContent = 'Dieser QR-Code gehört zu keinem gesperrten Gebiet.';
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

  introDots.innerHTML = introSlides.map((_, index) =>
    `<span class="slider-dot ${index === introIndex ? 'active' : ''}"></span>`
  ).join('');
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

scanFromInfoButton.addEventListener('click', openScanner);

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
  showQrButton.textContent = qrOverview.classList.contains('hidden')
    ? 'QR-Codes anzeigen'
    : 'QR-Codes ausblenden';
});

resetGameButton.addEventListener('click', () => {
  const confirmed = window.confirm('Spiel wirklich zurücksetzen? Alle Freischaltungen und gespeicherten Positionen werden gelöscht.');
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

document.querySelectorAll('[data-close-modal]').forEach(button => {
  button.addEventListener('click', closeInfo);
});

document.querySelectorAll('[data-close-settings]').forEach(button => {
  button.addEventListener('click', closeSettings);
});

document.querySelectorAll('[data-close-scanner]').forEach(button => {
  button.addEventListener('click', () => {
    closeScanner();
  });
});

infoModal.addEventListener('click', event => {
  if (event.target === infoModal) closeInfo();
});

settingsModal.addEventListener('click', event => {
  if (event.target === settingsModal) closeSettings();
});

scannerModal.addEventListener('click', event => {
  if (event.target === scannerModal) closeScanner();
});

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
