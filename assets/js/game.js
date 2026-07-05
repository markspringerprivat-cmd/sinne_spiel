const knight = document.getElementById('knight');
const regionCards = document.querySelectorAll('[data-region]');
const regionButtons = document.querySelectorAll('.region-button');
const infoModal = document.getElementById('infoModal');
const infoModalTitle = document.getElementById('infoModalTitle');
const infoModalText = document.getElementById('infoModalText');
const infoModalImageWrap = document.getElementById('infoModalImageWrap');
const infoModalImage = document.getElementById('infoModalImage');
const settingsButton = document.getElementById('settingsButton');
const settingsModal = document.getElementById('settingsModal');
const scannerModal = document.getElementById('scannerModal');
const scannerStatus = document.getElementById('scannerStatus');

const STORAGE_UNLOCKED = 'sinnesmagie-unlocked-areas';
const STORAGE_POS_X = 'sinnesmagie-knight-x';
const STORAGE_POS_Y = 'sinnesmagie-knight-y';
const STORAGE_AREA = 'sinnesmagie-last-area';

const START_AREA = 'koenigsschloss';
const START_X = '50';
const START_Y = '61';

const areaNames = {
  koenigsschloss: 'Königsschloss',
  zauberschloss: 'Zauberschloss',
  farbenreich: 'Farbenreich',
  klangwald: 'Klangwald',
  tastminen: 'Tastminen',
  duftgarten: 'Duftgarten',
  flammenkueche: 'Flammenküche'
};

const areaPreviewImages = {
  koenigsschloss: 'assets/images/regions/koenigsschloss.png',
  zauberschloss: 'assets/images/regions/zauberschloss.png',
  farbenreich: 'assets/images/regions/farbenreich.png',
  klangwald: 'assets/images/regions/klangwald.png',
  tastminen: 'assets/images/regions/tastminen.png',
  duftgarten: 'assets/images/regions/duftgarten.png',
  flammenkueche: 'assets/images/regions/flammenkueche.png'
};

let html5QrCode = null;
let scannerRunning = false;
let scannerBusy = false;

function readUnlocked() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_UNLOCKED) || '[]');
    const unlocked = new Set(Array.isArray(saved) ? saved.filter(area => areaNames[area]) : []);
    unlocked.add(START_AREA);
    return unlocked;
  } catch {
    return new Set([START_AREA]);
  }
}

function saveUnlocked(unlockedSet) {
  localStorage.setItem(STORAGE_UNLOCKED, JSON.stringify([...unlockedSet]));
}

let unlockedAreas = readUnlocked();
saveUnlocked(unlockedAreas);

function isUnlocked(area) {
  return unlockedAreas.has(area);
}

function showInfo(title, text, imageSrc = '') {
  infoModalTitle.textContent = title;
  infoModalText.textContent = text;

  if (imageSrc) {
    infoModalImage.src = imageSrc;
    infoModalImage.alt = title;
    infoModalImageWrap.classList.remove('hidden');
  } else {
    infoModalImage.removeAttribute('src');
    infoModalImage.alt = '';
    infoModalImageWrap.classList.add('hidden');
  }

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

function updateRegionVisuals() {
  regionCards.forEach(card => {
    const area = card.dataset.region;
    const unlocked = isUnlocked(area);
    card.classList.toggle('unlocked', unlocked);
    card.classList.toggle('locked', !unlocked);
  });

  regionButtons.forEach(button => {
    const area = button.dataset.area;
    const unlocked = isUnlocked(area);
    const name = areaNames[area] || button.dataset.name || area;

    if (area === START_AREA) {
      button.setAttribute('aria-label', 'Königsschloss öffnen und QR-Code scannen');
    } else {
      button.setAttribute('aria-label', unlocked ? `${name} betreten` : `${name} ist gesperrt`);
    }
  });
}

function unlockArea(area) {
  if (!areaNames[area]) return false;
  const wasUnlocked = isUnlocked(area);
  unlockedAreas.add(area);
  saveUnlocked(unlockedAreas);
  updateRegionVisuals();
  return !wasUnlocked;
}

function moveKnightToXY(x, y, area = '') {
  knight.style.left = `${x}%`;
  knight.style.top = `${y}%`;
  localStorage.setItem(STORAGE_POS_X, x);
  localStorage.setItem(STORAGE_POS_Y, y);
  if (area) {
    localStorage.setItem(STORAGE_AREA, area);
  }
}

function moveKnightTo(button) {
  const area = button.dataset.area;
  const x = button.dataset.targetX;
  const y = button.dataset.targetY;
  moveKnightToXY(x, y, area);
}

function handleRegionInteraction(button) {
  const area = button.dataset.area;

  if (area === START_AREA) {
    moveKnightTo(button);
    openScanner();
    return;
  }

  if (!isUnlocked(area)) {
    showInfo(
      `${areaNames[area]} ist noch gesperrt`,
      'Scanne den QR-Code am Königsschloss, um dieses Gebiet freizuschalten.'
    );
    return;
  }

  moveKnightTo(button);
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
    if (hashUnlock && areaNames[hashUnlock.trim().toLowerCase()]) return hashUnlock.trim().toLowerCase();
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
  if (!area) {
    scannerStatus.textContent = 'Dieser QR-Code gehört zu keinem bekannten Gebiet.';
    scannerBusy = false;
    return;
  }

  const newlyUnlocked = unlockArea(area);
  await closeScanner();

  showInfo(
    newlyUnlocked ? `${areaNames[area]} freigeschaltet` : `${areaNames[area]} ist bereits freigeschaltet`,
    newlyUnlocked
      ? 'Das Gebiet ist jetzt offen. Tippe nun auf das Gebiet, damit der Ritter dorthin läuft.'
      : 'Dieses Gebiet war bereits offen und kann direkt betreten werden.',
    areaPreviewImages[area]
  );

  scannerBusy = false;
}

async function openScanner() {
  scannerModal.classList.remove('hidden');
  scannerStatus.textContent = 'Kamera wird vorbereitet …';

  if (!window.Html5Qrcode) {
    scannerStatus.textContent = 'Der QR-Code-Scanner konnte nicht geladen werden.';
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

  if (areaNames[area]) {
    showInfo(
      newlyUnlocked ? `${areaNames[area]} freigeschaltet` : `${areaNames[area]} ist bereits freigeschaltet`,
      newlyUnlocked
        ? 'Das Gebiet ist jetzt offen. Tippe darauf, damit der Ritter dorthin läuft.'
        : 'Du kannst dieses Gebiet bereits betreten.',
      areaPreviewImages[area]
    );
  }

  const cleanUrl = `${window.location.origin}${window.location.pathname}`;
  window.history.replaceState({}, document.title, cleanUrl);
}

regionButtons.forEach(button => {
  button.addEventListener('click', () => handleRegionInteraction(button));
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

moveKnightToXY(START_X, START_Y, START_AREA);

updateRegionVisuals();
applyUnlockFromUrl();
