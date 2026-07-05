const knight = document.getElementById('knight');
const hotspots = document.querySelectorAll('.hotspot');
const lockButtons = document.querySelectorAll('[data-lock-button]');
const infoModal = document.getElementById('infoModal');
const infoModalTitle = document.getElementById('infoModalTitle');
const infoModalText = document.getElementById('infoModalText');
const infoModalActions = document.getElementById('infoModalActions');
const scanFromInfoButton = document.getElementById('scanFromInfoButton');
const settingsButton = document.getElementById('settingsButton');
const settingsModal = document.getElementById('settingsModal');
const scannerModal = document.getElementById('scannerModal');
const scannerStatus = document.getElementById('scannerStatus');

const STORAGE_UNLOCKED = 'sinnesmagie-unlocked-areas';
const STORAGE_POS_X = 'sinnesmagie-knight-x';
const STORAGE_POS_Y = 'sinnesmagie-knight-y';
const STORAGE_AREA = 'sinnesmagie-last-area';

const areaNames = {
  koenigsschloss: 'Königsschloss',
  zauberschloss: 'Zauberschloss',
  farbenreich: 'Farbenreich',
  klangwald: 'Klangwald',
  tastminen: 'Tastminen',
  duftgarten: 'Duftgarten',
  flammenkueche: 'Flammenküche'
};

let selectedLockedArea = '';
let html5QrCode = null;
let scannerRunning = false;
let scannerBusy = false;

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

updateLocks();
applyUnlockFromUrl();
