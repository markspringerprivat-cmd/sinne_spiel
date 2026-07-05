const levelKnight = document.getElementById('levelKnight');
const levelMarkers = document.querySelectorAll('.level-marker');
const levelPopup = document.getElementById('levelPopup');
const levelPopupTitle = document.getElementById('levelPopupTitle');
const levelPopupText = document.getElementById('levelPopupText');
const levelPopupClose = document.getElementById('levelPopupClose');
const levelMusic = document.getElementById('levelMusic');

const STORAGE_VOLUME = 'sinnesmagie-volume';

function currentVolume() {
  const saved = Number(localStorage.getItem(STORAGE_VOLUME));
  if (Number.isFinite(saved)) return Math.min(1, Math.max(0, saved));
  return 0.6;
}

function startLevelMusic() {
  if (!levelMusic) return;
  levelMusic.volume = currentVolume();
  levelMusic.play().catch(() => {
    // Browser erlaubt Musik erst nach Nutzerinteraktion.
  });
}

function showLevelPopup(title, text) {
  levelPopupTitle.textContent = title || 'Level';
  levelPopupText.textContent = text || 'Inhalt folgt später.';
  levelPopup.classList.remove('hidden');
}

function moveLevelKnightTo(marker) {
  const x = marker.dataset.targetX;
  const y = marker.dataset.targetY;
  levelKnight.style.left = `${x}%`;
  levelKnight.style.top = `${y}%`;

  window.setTimeout(() => {
    showLevelPopup(marker.dataset.title || 'Level', marker.dataset.text || 'Inhalt folgt später.');
  }, 950);
}

levelMarkers.forEach(marker => {
  marker.addEventListener('click', () => moveLevelKnightTo(marker));
});

levelPopupClose.addEventListener('click', () => {
  levelPopup.classList.add('hidden');
  startLevelMusic();
});

levelPopup.addEventListener('click', event => {
  if (event.target === levelPopup) {
    levelPopup.classList.add('hidden');
    startLevelMusic();
  }
});

window.addEventListener('load', () => {
  window.setTimeout(() => {
    showLevelPopup('Level betreten', 'Platzhalter: Hier wird später kurz erklärt, was in diesem Bereich zu tun ist.');
  }, 180);
});
