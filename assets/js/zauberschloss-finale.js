const STORAGE_LEVEL_PROGRESS = 'sinnesmagie-level-progress';
const STORAGE_LEVEL_NODE = 'sinnesmagie-level-node';

const orbFrames = [
  '../assets/images/finale/orb_stage_1.png',
  '../assets/images/finale/orb_stage_2.png',
  '../assets/images/finale/orb_stage_3.png',
  '../assets/images/finale/orb_stage_4.png',
  '../assets/images/finale/orb_stage_5.png'
];

const hitTexts = [
  'Der Ritter schleicht in den Thronsaal. Vor ihm ruht die Glaskugel, in der die Sinnesmagie gefangen ist.',
  'Ein erster Schlag! Feine Risse laufen über die Glaskugel.',
  'Noch ein Treffer – die Kugel wird instabil und die Magie beginnt zu flackern.',
  'Die Hülle hält kaum noch stand. Ein letzter kräftiger Angriff wird sie sprengen.',
  'Die Glaskugel zerbricht! Die Sinnesmagie bricht mit gewaltiger Kraft hervor.'
];

const stage = document.getElementById('castleFinaleStage');
const knight = document.getElementById('castleFinaleKnight');
const orb = document.getElementById('castleFinaleOrb');
const caption = document.getElementById('castleFinaleCaption');
const attackButton = document.getElementById('castleFinaleAttack');
const hitSfx = document.getElementById('castleFinaleHitSfx');
const crashSfx = document.getElementById('castleFinaleCrashSfx');

let orbIndex = 0;
let busy = true;
let finished = false;

function getProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_LEVEL_PROGRESS) || '{}');
  } catch {
    return {};
  }
}

function saveProgress(patch) {
  const progress = getProgress();
  const area = progress.zauberschloss || {};
  progress.zauberschloss = { ...area, ...patch };
  localStorage.setItem(STORAGE_LEVEL_PROGRESS, JSON.stringify(progress));
}

function playAudio(audio) {
  if (!audio) return;
  try {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch {}
}

function setCaption(index) {
  caption.textContent = hitTexts[Math.max(0, Math.min(hitTexts.length - 1, index))];
}

function enterKnight() {
  setCaption(0);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => knight.classList.add('entered'));
  });
  window.setTimeout(() => {
    busy = false;
    attackButton.disabled = false;
  }, 1220);
}

function finishFinale() {
  if (finished) return;
  finished = true;
  busy = true;
  attackButton.disabled = true;
  attackButton.textContent = 'Die Magie kehrt zurück ...';
  saveProgress({ level4Completed: true, finaleCompleted: true });
  try {
    const nodes = JSON.parse(localStorage.getItem(STORAGE_LEVEL_NODE) || '{}');
    nodes.zauberschloss = 'level4';
    localStorage.setItem(STORAGE_LEVEL_NODE, JSON.stringify(nodes));
  } catch {
    localStorage.setItem(STORAGE_LEVEL_NODE, JSON.stringify({ zauberschloss: 'level4' }));
  }
  orb.classList.add('destroyed');
  stage.classList.add('shaking');
  playAudio(crashSfx);
  window.setTimeout(() => {
    window.location.href = 'zauberschloss-outro.html';
  }, 1800);
}

function performStrike() {
  if (busy || finished) return;
  busy = true;
  attackButton.disabled = true;
  knight.src = '../assets/images/characters/ritter_attack.png';
  knight.classList.add('attacking');
  playAudio(hitSfx);

  window.setTimeout(() => {
    orbIndex = Math.min(orbFrames.length - 1, orbIndex + 1);
    orb.src = orbFrames[orbIndex];
    orb.classList.add('hit');
    setCaption(orbIndex);
  }, 220);

  window.setTimeout(() => {
    orb.classList.remove('hit');
    knight.classList.remove('attacking');
    knight.src = '../assets/images/characters/knight.png';

    if (orbIndex === orbFrames.length - 1) {
      finishFinale();
      return;
    }

    busy = false;
    attackButton.disabled = false;
  }, 620);
}

attackButton?.addEventListener('click', performStrike);

orbFrames.forEach(src => {
  const img = new Image();
  img.src = src;
});

enterKnight();
