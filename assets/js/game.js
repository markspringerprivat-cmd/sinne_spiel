const knight = document.getElementById('knight');
const hotspots = document.querySelectorAll('.hotspot');
const shades = document.querySelectorAll('[data-lock-area]');
const lockButtons = document.querySelectorAll('[data-lock-button]');
const infoModal = document.getElementById('infoModal');
const infoModalTitle = document.getElementById('infoModalTitle');
const infoModalText = document.getElementById('infoModalText');
const settingsButton = document.getElementById('settingsButton');
const settingsModal = document.getElementById('settingsModal');

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

function readUnlocked() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_UNLOCKED) || '[]');
    return new Set(['koenigsschloss', ...saved]);
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

function showInfo(title, text) {
  infoModalTitle.textContent = title;
  infoModalText.textContent = text;
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

function updateLocks() {
  shades.forEach(shade => {
    const area = shade.dataset.lockArea;
    shade.classList.toggle('unlocked', isUnlocked(area));
  });

  lockButtons.forEach(button => {
    const area = button.dataset.lockButton;
    button.classList.toggle('hidden-lock', isUnlocked(area));
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
    showInfo(
      `${areaNames[area]} ist noch gesperrt`,
      `Scanne den QR-Code bei der entsprechenden Station, um dieses Gebiet freizuschalten.`
    );
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
        ? `Das Schloss ist geöffnet. Tippe auf das Gebiet, damit der Ritter dorthin läuft.`
        : `Du kannst dieses Gebiet bereits betreten.`
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
    showInfo(
      `${areaNames[area]} ist noch gesperrt`,
      `Scanne den QR-Code bei der entsprechenden Station, um dieses Gebiet freizuschalten.`
    );
  });
});

document.querySelectorAll('[data-close-modal]').forEach(button => {
  button.addEventListener('click', closeInfo);
});

document.querySelectorAll('[data-close-settings]').forEach(button => {
  button.addEventListener('click', closeSettings);
});

infoModal.addEventListener('click', event => {
  if (event.target === infoModal) closeInfo();
});

settingsModal.addEventListener('click', event => {
  if (event.target === settingsModal) closeSettings();
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
