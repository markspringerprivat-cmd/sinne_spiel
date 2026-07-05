const levelKnight = document.getElementById('levelKnight');
const levelMarkers = document.querySelectorAll('.level-marker');
const levelPopup = document.getElementById('levelPopup');
const levelPopupTitle = document.getElementById('levelPopupTitle');
const levelPopupText = document.getElementById('levelPopupText');
const levelPopupClose = document.getElementById('levelPopupClose');

function moveLevelKnightTo(marker) {
  const x = marker.dataset.targetX;
  const y = marker.dataset.targetY;
  levelKnight.style.left = `${x}%`;
  levelKnight.style.top = `${y}%`;

  window.setTimeout(() => {
    levelPopupTitle.textContent = marker.dataset.title || 'Level';
    levelPopupText.textContent = marker.dataset.text || 'Inhalt folgt später.';
    levelPopup.classList.remove('hidden');
  }, 950);
}

levelMarkers.forEach(marker => {
  marker.addEventListener('click', () => moveLevelKnightTo(marker));
});

levelPopupClose.addEventListener('click', () => {
  levelPopup.classList.add('hidden');
});

levelPopup.addEventListener('click', event => {
  if (event.target === levelPopup) {
    levelPopup.classList.add('hidden');
  }
});
