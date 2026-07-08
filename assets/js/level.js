
const levelStage = document.querySelector('.level-map-stage');
const levelKnight = document.getElementById('levelKnight');
const levelMarkers = [...document.querySelectorAll('.level-marker')];
const levelPopup = document.getElementById('levelPopup');
const levelPopupTitle = document.getElementById('levelPopupTitle');
const levelPopupText = document.getElementById('levelPopupText');
const levelPopupClose = document.getElementById('levelPopupClose');
const levelMusic = document.getElementById('levelMusic');
const levelMusicLoop = window.createCrossfadeLoop ? window.createCrossfadeLoop(levelMusic, { fadeSeconds: 0.025 }) : null;
const backButton = document.querySelector('.level-back-button');

const STORAGE_VOLUME = 'sinnesmagie-volume';
const STORAGE_FRAGMENTS = 'sinnesmagie-fragments';
const STORAGE_LEVEL_PROGRESS = 'sinnesmagie-level-progress';
const STORAGE_LEVEL_NODE = 'sinnesmagie-level-node';
const QUIZ_SECONDS = 30;
const QUIZ_TRANSITION_MS = 560;
const BATTLE_ANIMATION_MS = 1500;
const STRIKE_RESET_MS = 760;
const DAMAGE_RESET_MS = 760;
const ATTACK_IMPACT_MS = 320;
const ENEMY_IMPACT_MS = 320;
const MOVE_MS = 560;

const currentArea = window.location.pathname.split('/').pop().replace('.html', '');
const AREA_TITLES = {
  zauberschloss: 'Zauberschloss',
  farbenreich: 'Farbenreich',
  klangwald: 'Klangwald',
  tastminen: 'Tastminen',
  duftgarten: 'Duftgarten',
  flammenkueche: 'Flammenküche'
};

const AREA_PATH_TEMPLATES = {
  tastminen: {
    red: [[19,82],[24,83],[37,79],[49,72],[58,64],[68,55],[77,49]],
    purple: [[77,49],[68,47],[58,40],[47,31],[37,23],[28,18]],
    blue: [[28,18],[27,31],[32,45],[42,60],[51,72],[38,79],[25,82],[19,82]]
  },
  farbenreich: {
    red: [[20,82],[26,82],[39,76],[49,68],[56,59],[64,50],[75,41]],
    purple: [[75,41],[65,39],[54,33],[43,25],[34,19],[29,17]],
    blue: [[29,17],[31,30],[37,45],[47,60],[55,71],[43,78],[27,82],[20,82]]
  },
  klangwald: {
    red: [[20,82],[27,82],[40,77],[49,69],[57,60],[65,54],[74,49]],
    purple: [[74,49],[65,47],[55,40],[44,31],[35,22],[30,17]],
    blue: [[30,17],[31,30],[37,45],[47,60],[56,72],[43,79],[27,82],[20,82]]
  },
  duftgarten: {
    red: [[20,83],[27,83],[42,76],[52,66],[62,55],[73,46]],
    purple: [[73,46],[65,44],[55,37],[44,29],[34,21],[27,18]],
    blue: [[27,18],[30,31],[37,46],[48,61],[55,73],[43,80],[27,83],[20,83]]
  },
  flammenkueche: {
    red: [[20,82],[27,82],[39,78],[50,72],[62,65],[72,60]],
    purple: [[72,60],[64,55],[54,47],[43,35],[34,24],[28,18]],
    blue: [[28,18],[31,32],[38,46],[49,60],[58,72],[45,80],[28,82],[20,82]]
  }
};
const FRAGMENT_REWARDS = {
  farbenreich: { name: 'Kristall des Sehens', image: '../assets/images/fragments/red.png' },
  klangwald: { name: 'Kristall des Hörens', image: '../assets/images/fragments/blue.png' },
  tastminen: { name: 'Kristall des Tastens', image: '../assets/images/fragments/gold.png' },
  duftgarten: { name: 'Kristall des Riechens', image: '../assets/images/fragments/purple.png' },
  flammenkueche: { name: 'Kristall des Schmeckens', image: '../assets/images/fragments/green.png' }
};
const ENEMIES_WITH_ATTACK_ASSET = new Set(['farbgolem', 'waldgeist', 'maulwurf', 'duftgeist', 'feuergolem']);

let activeQuiz = null;
let quizTimer = null;
let popupCloseHandler = null;
let currentNode = 'start';
let guideSvg = null;

const sfxCorrect = new Audio('../assets/audio/richtig_1.mp3');
const sfxWrong = new Audio('../assets/audio/falsch_3.mp3');

function playSfx(audio) {
  if (!audio) return;
  try {
    audio.pause();
    audio.currentTime = 0;
    audio.volume = currentVolume();
    audio.play().catch(() => {});
  } catch {}
}

function currentVolume() {
  const saved = Number(localStorage.getItem(STORAGE_VOLUME));
  if (Number.isFinite(saved)) return Math.min(1, Math.max(0, saved));
  return 0.5;
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

function readProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_LEVEL_PROGRESS) || '{}');
    return saved && typeof saved === 'object' ? saved : {};
  } catch {
    return {};
  }
}

function writeProgress(progress) {
  localStorage.setItem(STORAGE_LEVEL_PROGRESS, JSON.stringify(progress));
}

function getAreaProgress() {
  const progress = readProgress();
  return {
    level1Completed: !!progress[currentArea]?.level1Completed,
    level2Completed: !!progress[currentArea]?.level2Completed
  };
}

function setAreaProgress(patch) {
  const progress = readProgress();
  progress[currentArea] = {
    level1Completed: !!progress[currentArea]?.level1Completed,
    level2Completed: !!progress[currentArea]?.level2Completed,
    ...patch
  };
  writeProgress(progress);
}

function awardFragment(quizId) {
  const reward = FRAGMENT_REWARDS[quizId];
  if (!reward) return { gained: false, reward: null, total: readFragments().size };

  const fragments = readFragments();
  const alreadyHad = fragments.has(quizId);
  if (!alreadyHad) {
    fragments.add(quizId);
    saveFragments(fragments);
  }

  return {
    gained: !alreadyHad,
    reward,
    total: fragments.size,
    allCollected: fragments.size >= Object.keys(FRAGMENT_REWARDS).length
  };
}

function startLevelMusic() {
  if (!levelMusic) return;
  if (levelMusicLoop) {
    levelMusicLoop.setVolume(currentVolume());
    levelMusicLoop.play();
  } else {
    levelMusic.volume = currentVolume();
    levelMusic.play().catch(() => {});
  }
}

function pauseLevelMusic() {
  if (!levelMusic) return;
  if (levelMusicLoop) {
    levelMusicLoop.pause();
  } else {
    levelMusic.pause();
  }
}

function parsePercent(value, fallback = 0) {
  const num = parseFloat(String(value || '').replace('%', ''));
  return Number.isFinite(num) ? num : fallback;
}

function stageStart() {
  return {
    x: parsePercent(levelStage.style.getPropertyValue('--start-x'), 20),
    y: parsePercent(levelStage.style.getPropertyValue('--start-y'), 82)
  };
}

function markerPoint(marker) {
  return {
    x: parsePercent(marker.style.getPropertyValue('--x')),
    y: parsePercent(marker.style.getPropertyValue('--y'))
  };
}

function getNodes() {
  return {
    start: stageStart(),
    level1: markerPoint(levelMarkers[0]),
    level2: markerPoint(levelMarkers[1])
  };
}

function readLevelNodes() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_LEVEL_NODE) || '{}');
    return saved && typeof saved === 'object' ? saved : {};
  } catch {
    return {};
  }
}

function saveCurrentNode(node) {
  currentNode = node;
  const saved = readLevelNodes();
  saved[currentArea] = node;
  localStorage.setItem(STORAGE_LEVEL_NODE, JSON.stringify(saved));
}

function initialNodeFromProgress() {
  const progress = getAreaProgress();
  if (progress.level2Completed) return 'level2';
  if (progress.level1Completed) return 'level1';
  return 'start';
}

function normalizePathTemplate(points, name) {
  const n = getNodes();
  const mapped = points.map(([x, y]) => ({ x, y }));
  if (name === 'red') {
    mapped[0] = n.start;
    mapped[mapped.length - 1] = n.level1;
  } else if (name === 'purple') {
    mapped[0] = n.level1;
    mapped[mapped.length - 1] = n.level2;
  } else if (name === 'blue') {
    mapped[0] = n.level2;
    mapped[mapped.length - 1] = n.start;
  }
  return mapped;
}

function curvedPath(name) {
  const template = AREA_PATH_TEMPLATES[currentArea]?.[name] || AREA_PATH_TEMPLATES.klangwald[name];
  if (!template) return [stageStart()];
  return normalizePathTemplate(template, name);
}

function cubicPoint(p1, c1, c2, p2, t) {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  return {
    x: mt2 * mt * p1.x + 3 * mt2 * t * c1.x + 3 * mt * t2 * c2.x + t2 * t * p2.x,
    y: mt2 * mt * p1.y + 3 * mt2 * t * c1.y + 3 * mt * t2 * c2.y + t2 * t * p2.y
  };
}

function catmullSegment(points, i) {
  const p0 = points[i - 1] || points[i];
  const p1 = points[i];
  const p2 = points[i + 1];
  const p3 = points[i + 2] || p2;
  return {
    p1,
    p2,
    c1: { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 },
    c2: { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 }
  };
}

function smoothSamples(points, samplesPerSegment = 26) {
  if (!points || points.length < 2) return points ? points.slice() : [];
  const samples = [points[0]];
  for (let i = 0; i < points.length - 1; i += 1) {
    const seg = catmullSegment(points, i);
    for (let s = 1; s <= samplesPerSegment; s += 1) {
      samples.push(cubicPoint(seg.p1, seg.c1, seg.c2, seg.p2, s / samplesPerSegment));
    }
  }
  return samples;
}

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function pathLength(points) {
  let len = 0;
  for (let i = 1; i < points.length; i += 1) len += distance(points[i - 1], points[i]);
  return len;
}

function reversePath(points) {
  return points.slice().reverse();
}

function pathBetween(from, to) {
  if (from === to) return [];
  const red = curvedPath('red');
  const purple = curvedPath('purple');
  const blue = curvedPath('blue');
  if (from === 'start' && to === 'level1') return red;
  if (from === 'level1' && to === 'start') return reversePath(red);
  if (from === 'level1' && to === 'level2') return purple;
  if (from === 'level2' && to === 'level1') return reversePath(purple);
  if (from === 'level2' && to === 'start') return blue;
  if (from === 'start' && to === 'level2') return red.concat(purple.slice(1));
  return [getNodes()[to]].filter(Boolean);
}

function pathToSvgData(points) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const seg = catmullSegment(points, i);
    d += ` C ${seg.c1.x.toFixed(2)} ${seg.c1.y.toFixed(2)}, ${seg.c2.x.toFixed(2)} ${seg.c2.y.toFixed(2)}, ${seg.p2.x.toFixed(2)} ${seg.p2.y.toFixed(2)}`;
  }
  return d;
}

function showLevelPopup(title, text, buttonLabel = 'Weiter', onClose = null) {
  levelPopupTitle.textContent = title || 'Level';
  levelPopupText.textContent = text || 'Inhalt folgt später.';
  levelPopupClose.textContent = buttonLabel;
  popupCloseHandler = onClose;
  levelPopup.classList.remove('hidden');
}

function closeLevelPopup() {
  levelPopup.classList.add('hidden');
  const handler = popupCloseHandler;
  popupCloseHandler = null;
  if (typeof handler === 'function') handler();
  startLevelMusic();
}

function setMarkersDisabled(disabled) {
  levelMarkers.forEach(marker => {
    marker.disabled = disabled;
    marker.classList.toggle('movement-disabled', disabled);
  });
  if (backButton) backButton.classList.toggle('movement-disabled', disabled);
}

function setKnightPosition(point) {
  levelKnight.style.left = `${point.x}%`;
  levelKnight.style.top = `${point.y}%`;
}

function pointAtDistance(samples, targetDistance) {
  if (!samples.length) return null;
  if (targetDistance <= 0) return samples[0];
  let traveled = 0;
  for (let i = 1; i < samples.length; i += 1) {
    const a = samples[i - 1];
    const b = samples[i];
    const segLen = distance(a, b);
    if (traveled + segLen >= targetDistance) {
      const t = segLen ? (targetDistance - traveled) / segLen : 0;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    traveled += segLen;
  }
  return samples[samples.length - 1];
}

function moveKnightAlong(points) {
  if (!points || points.length === 0) return Promise.resolve();
  const samples = smoothSamples(points, 30);
  const totalLength = pathLength(samples);
  if (totalLength <= 0) return Promise.resolve();

  setMarkersDisabled(true);
  levelKnight.style.transition = 'none';

  const duration = Math.min(3600, Math.max(1500, totalLength * 34));
  return new Promise(resolve => {
    const start = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const point = pointAtDistance(samples, totalLength * eased);
      if (point) setKnightPosition(point);
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        setKnightPosition(samples[samples.length - 1]);
        setMarkersDisabled(false);
        resolve();
      }
    }
    requestAnimationFrame(frame);
  });
}

async function moveToNode(targetNode) {
  const points = pathBetween(currentNode, targetNode);
  await moveKnightAlong(points);
  saveCurrentNode(targetNode);
}

function ensureGuideSvg() {
  if (guideSvg) return guideSvg;
  guideSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  guideSvg.setAttribute('viewBox', '0 0 100 100');
  guideSvg.setAttribute('preserveAspectRatio', 'none');
  guideSvg.classList.add('level-path-svg');
  levelStage.appendChild(guideSvg);
  return guideSvg;
}

function renderGuidePath() {
  const svg = ensureGuideSvg();
  const progress = getAreaProgress();
  let points = null;

  if (!progress.level1Completed) {
    points = curvedPath('red');
  } else if (!progress.level2Completed) {
    points = curvedPath('purple');
  }

  if (!points) {
    svg.innerHTML = '';
    return;
  }

  svg.innerHTML = `<path class="level-guide-line" d="${pathToSvgData(points)}"></path>`;
}

function applyMarkerStates() {
  const progress = getAreaProgress();
  levelMarkers.forEach((marker, index) => {
    const isLevel1 = index === 0;
    const completed = isLevel1 ? progress.level1Completed : progress.level2Completed;
    const locked = !isLevel1 && !progress.level1Completed;
    marker.classList.toggle('completed', completed);
    marker.classList.toggle('locked', locked);
    marker.classList.toggle('available', !locked && !completed);
    marker.setAttribute('aria-disabled', locked ? 'true' : 'false');
    marker.disabled = locked;
  });
  renderGuidePath();
}

async function handleLevelOne() {
  const progress = getAreaProgress();
  await moveToNode('level1');

  if (!progress.level1Completed) {
    const minigameUrl = levelMarkers[0].dataset.minigameUrl;
    if (minigameUrl) {
      showLevelPopup(
        levelMarkers[0].dataset.title || 'Minispiel',
        `${levelMarkers[0].dataset.text || 'Hier startet das Minispiel.'} Danach wird der zweite Punkt freigeschaltet.`,
        'Minispiel starten',
        () => { window.location.href = minigameUrl; }
      );
      return;
    }

    showLevelPopup(
      levelMarkers[0].dataset.title || 'Minispiel',
      `${levelMarkers[0].dataset.text || 'Hier startet das Minispiel.'} Wenn du hier fertig bist, wird der zweite Punkt freigeschaltet.`,
      'Minispiel abschließen',
      () => {
        setAreaProgress({ level1Completed: true });
        saveCurrentNode('level1');
        applyMarkerStates();
        showLevelPopup('Level 1 geschafft', 'Der zweite Punkt mit dem Quiz ist jetzt freigeschaltet.');
      }
    );
    return;
  }

  showLevelPopup(levelMarkers[0].dataset.title || 'Minispiel', 'Dieses Minispiel hast du bereits geschafft. Der nächste Punkt ist freigeschaltet.');
}

async function handleLevelTwo() {
  const progress = getAreaProgress();
  if (!progress.level1Completed) {
    showLevelPopup('Noch gesperrt', 'Du musst zuerst das erste Level mit dem Minispiel abschließen, bevor du das Quiz betreten kannst.');
    return;
  }

  await moveToNode('level2');
  openQuizIntro(levelMarkers[1].dataset.quizId || currentArea);
}

async function moveLevelKnightTo(marker, index) {
  if (marker.disabled || marker.classList.contains('movement-disabled')) return;
  if (index === 0) await handleLevelOne();
  else await handleLevelTwo();
}

levelMarkers.forEach((marker, index) => {
  marker.addEventListener('click', () => moveLevelKnightTo(marker, index));
});

if (levelPopupClose) {
  levelPopupClose.addEventListener('click', closeLevelPopup);
}

if (levelPopup) {
  levelPopup.addEventListener('click', event => {
    if (event.target === levelPopup) closeLevelPopup();
  });
}

function enemyAsset(enemy, state) {
  if (state === 'damage') return `../assets/images/enemies/${enemy}_damage.png`;
  if (state === 'defeated') return `../assets/images/enemies/${enemy}_defeated.png`;
  return `../assets/images/enemies/${enemy}.png`;
}

function enemyAttackAsset(enemy) {
  if (ENEMIES_WITH_ATTACK_ASSET.has(enemy)) {
    return `../assets/images/enemies/${enemy}_attack.png`;
  }
  return enemyAsset(enemy, 'normal');
}

function knightAsset(state) {
  if (state === 'attack') return '../assets/images/characters/ritter_attack.png';
  if (state === 'damage') return '../assets/images/characters/ritter_damage.png';
  if (state === 'defeated') return '../assets/images/characters/ritter_defeated.png';
  if (state === 'victory') return '../assets/images/characters/ritter_victory.png';
  return '../assets/images/characters/knight.png';
}

function battleBackgroundAsset(quizId) {
  return `../assets/images/battle-backgrounds/${quizId}.png`;
}

const preloadedImages = new Set();
function preloadImage(src) {
  if (!src || preloadedImages.has(src)) return;
  preloadedImages.add(src);
  const img = new Image();
  img.src = src;
}

function preloadQuizAssets(data, quizId) {
  preloadImage(battleBackgroundAsset(quizId));
  ['normal', 'attack', 'damage', 'defeated', 'victory'].forEach(state => preloadImage(knightAsset(state)));
  ['normal', 'damage', 'defeated'].forEach(state => preloadImage(enemyAsset(data.enemy, state)));
  preloadImage(enemyAttackAsset(data.enemy));
  if (FRAGMENT_REWARDS[quizId]) preloadImage(FRAGMENT_REWARDS[quizId].image);
}

function ensureQuizModal() {
  let modal = document.getElementById('quizModal');
  if (modal) return modal;
  modal = document.createElement('div');
  modal.id = 'quizModal';
  modal.className = 'quiz-modal hidden';
  modal.innerHTML = `
    <div class="quiz-card" role="dialog" aria-modal="true" aria-labelledby="quizTitle">
      <img id="quizBattleBg" class="quiz-battle-bg" alt="" draggable="false">
      <div class="quiz-hearts-area"><div id="quizHearts" class="quiz-hearts" aria-label="Lebenspunkte"></div></div>
      <div class="quiz-battle-zone" aria-hidden="true">
        <img id="quizKnight" class="battle-sprite knight-battle" alt="Ritter" draggable="false">
        <img id="quizEnemy" class="battle-sprite enemy-battle" alt="Gegner" draggable="false">
        <span id="battleFeedback" class="battle-feedback hidden"></span>
      </div>
      <div id="quizIntro" class="quiz-intro quiz-panel"></div>
      <div id="quizGame" class="quiz-game quiz-panel hidden">
        <div class="quiz-panel-top">
          <div id="quizCounter" class="quiz-counter"></div>
          <div id="quizTimer" class="quiz-timer">30</div>
        </div>
        <h2 id="quizTitle"></h2>
        <p id="quizQuestion" class="quiz-question"></p>
        <div id="quizAnswers" class="quiz-answers"></div>
      </div>
      <div id="quizResult" class="quiz-result quiz-panel hidden"></div>
    </div>`;
  document.body.appendChild(modal);
  return modal;
}

function setQuizScene(modal, data, quizId) {
  const bg = modal.querySelector('#quizBattleBg');
  bg.src = battleBackgroundAsset(quizId);
  bg.alt = `${data.title} Kampfhintergrund`;
  modal.querySelector('#quizKnight').src = knightAsset('normal');
  modal.querySelector('#quizEnemy').src = enemyAsset(data.enemy, 'normal');
  modal.querySelector('#battleFeedback').classList.add('hidden');
}

function openQuizIntro(quizId) {
  const data = window.SINNESMAGIE_QUIZZES?.[quizId];
  if (!data) {
    showLevelPopup('Quiz', 'Quizdaten fehlen noch.');
    return;
  }
  pauseLevelMusic();
  preloadQuizAssets(data, quizId);
  const modal = ensureQuizModal();
  clearInterval(quizTimer);
  modal.classList.remove('hidden');
  modal.querySelector('#quizGame').classList.add('hidden');
  modal.querySelector('#quizResult').classList.add('hidden');
  setQuizScene(modal, data, quizId);
  const intro = modal.querySelector('#quizIntro');
  intro.className = 'quiz-intro quiz-panel';
  intro.innerHTML = `
    <h2>${data.title}</h2>
    <p><strong>${data.enemyName}</strong> stellt sich dir in den Weg.</p>
    <p>Beantworte sieben Fragen. Richtige Antworten lassen den Ritter angreifen. Bei falschen Antworten oder abgelaufener Zeit greift der Gegner an und du verlierst ein Herz.</p>
    <button id="startQuizButton" class="primary-button" type="button">Kampf starten</button>
  `;
  modal.querySelector('#startQuizButton').addEventListener('click', () => startQuiz(quizId));
}

function startQuiz(quizId) {
  pauseLevelMusic();
  const data = window.SINNESMAGIE_QUIZZES[quizId];
  preloadQuizAssets(data, quizId);
  activeQuiz = {
    quizId,
    data,
    index: 0,
    hearts: 3,
    correct: 0,
    answered: false,
    seconds: QUIZ_SECONDS,
    finished: false,
    transitioning: false
  };
  const modal = ensureQuizModal();
  setQuizScene(modal, data, quizId);
  modal.querySelector('#quizIntro').classList.add('hidden');
  modal.querySelector('#quizResult').classList.add('hidden');
  const game = modal.querySelector('#quizGame');
  game.className = 'quiz-game quiz-panel hidden';
  game.style.display = '';
  game.classList.remove('hidden');
  renderQuestion('in');
}

function renderHearts() {
  const hearts = document.getElementById('quizHearts');
  if (!hearts || !activeQuiz) return;
  hearts.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const span = document.createElement('span');
    span.textContent = i < activeQuiz.hearts ? '♥' : '♡';
    hearts.appendChild(span);
  }
}

function renderQuestion(entrance = 'none') {
  clearInterval(quizTimer);
  if (!activeQuiz || activeQuiz.finished) return;
  const q = activeQuiz.data.questions[activeQuiz.index];
  activeQuiz.answered = false;
  activeQuiz.transitioning = false;
  activeQuiz.seconds = QUIZ_SECONDS;

  const game = document.getElementById('quizGame');
  game.className = 'quiz-game quiz-panel';
  if (entrance === 'in') {
    game.classList.add('slide-in-right');
    setTimeout(() => game.classList.remove('slide-in-right'), QUIZ_TRANSITION_MS + 80);
  }

  document.getElementById('quizTitle').textContent = activeQuiz.data.title;
  document.getElementById('quizCounter').textContent = `Frage ${activeQuiz.index + 1} / ${activeQuiz.data.questions.length}`;
  document.getElementById('quizTimer').textContent = activeQuiz.seconds;
  document.getElementById('quizQuestion').textContent = q[0];
  document.getElementById('quizKnight').src = knightAsset('normal');
  document.getElementById('quizEnemy').src = enemyAsset(activeQuiz.data.enemy, 'normal');
  document.getElementById('battleFeedback').classList.add('hidden');
  renderHearts();

  const answers = document.getElementById('quizAnswers');
  answers.innerHTML = '';
  q[1].forEach((answer, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quiz-answer';
    btn.textContent = answer;
    btn.addEventListener('click', () => answerQuestion(idx));
    answers.appendChild(btn);
  });

  quizTimer = setInterval(() => {
    if (!activeQuiz || activeQuiz.answered || activeQuiz.transitioning) return;
    activeQuiz.seconds -= 1;
    document.getElementById('quizTimer').textContent = activeQuiz.seconds;
    if (activeQuiz.seconds <= 0) answerQuestion(-1);
  }, 1000);
}

function answerQuestion(idx) {
  if (!activeQuiz || activeQuiz.answered || activeQuiz.finished || activeQuiz.transitioning) return;
  activeQuiz.answered = true;
  activeQuiz.transitioning = true;
  clearInterval(quizTimer);

  const q = activeQuiz.data.questions[activeQuiz.index];
  const correct = idx === q[2];
  const answerButtons = document.querySelectorAll('.quiz-answer');
  answerButtons.forEach((btn, i) => {
    btn.disabled = true;
    if (i === q[2]) btn.classList.add('correct-answer');
    if (i === idx && !correct) btn.classList.add('wrong-answer');
  });

  setTimeout(() => {
    const game = document.getElementById('quizGame');
    game.classList.add('slide-out-left');
    setTimeout(() => {
      game.classList.add('hidden');
      game.classList.remove('slide-out-left');
      playBattleAnimation(correct, idx);
    }, QUIZ_TRANSITION_MS);
  }, 430);
}

function playBattleAnimation(correct, idx) {
  const feedback = document.getElementById('battleFeedback');
  const knight = document.getElementById('quizKnight');
  const enemy = document.getElementById('quizEnemy');

  feedback.classList.remove('hidden');
  knight.classList.remove('sprite-pop', 'sprite-shake', 'knight-strike', 'knight-damaged', 'knight-attack-pose');
  enemy.classList.remove('sprite-shake', 'enemy-hit', 'enemy-attack-strike');

  if (correct) {
    activeQuiz.correct += 1;
    feedback.textContent = 'Richtig!';
    knight.src = knightAsset('attack');
    knight.classList.add('knight-attack-pose');
    enemy.src = enemyAsset(activeQuiz.data.enemy, 'normal');
    void knight.offsetWidth;
    void enemy.offsetWidth;
    playSfx(sfxCorrect);
    knight.classList.add('knight-strike');

    setTimeout(() => {
      if (!activeQuiz || activeQuiz.finished) return;
      enemy.src = enemyAsset(activeQuiz.data.enemy, 'damage');
      enemy.classList.add('enemy-hit');
    }, ATTACK_IMPACT_MS);

    setTimeout(() => {
      if (!activeQuiz || activeQuiz.finished) return;
      knight.classList.remove('knight-strike');
      enemy.classList.remove('enemy-hit');
      knight.src = knightAsset('normal');
      knight.classList.remove('knight-attack-pose');
      enemy.src = enemyAsset(activeQuiz.data.enemy, 'normal');
    }, STRIKE_RESET_MS);
  } else {
    activeQuiz.hearts -= 1;
    feedback.textContent = idx === -1 ? 'Zeit abgelaufen!' : 'Falsch!';
    knight.src = knightAsset('normal');
    enemy.src = enemyAttackAsset(activeQuiz.data.enemy);
    void knight.offsetWidth;
    void enemy.offsetWidth;
    playSfx(sfxWrong);
    enemy.classList.add('enemy-attack-strike');

    setTimeout(() => {
      if (!activeQuiz || activeQuiz.finished) return;
      knight.src = knightAsset('damage');
      knight.classList.add('knight-damaged');
      renderHearts();
    }, ENEMY_IMPACT_MS);

    setTimeout(() => {
      if (!activeQuiz || activeQuiz.finished) return;
      knight.classList.remove('knight-damaged');
      enemy.classList.remove('enemy-attack-strike');
      knight.src = knightAsset('normal');
      knight.classList.remove('knight-attack-pose');
      enemy.src = enemyAsset(activeQuiz.data.enemy, 'normal');
    }, DAMAGE_RESET_MS);
  }

  if (correct) renderHearts();

  setTimeout(() => {
    knight.classList.remove('sprite-pop', 'sprite-shake', 'knight-strike', 'knight-damaged', 'knight-attack-pose');
    enemy.classList.remove('sprite-shake', 'enemy-hit', 'enemy-attack-strike');

    if (activeQuiz.hearts <= 0 || activeQuiz.index >= activeQuiz.data.questions.length - 1) {
      showQuizEndPanel();
    } else {
      activeQuiz.index += 1;
      knight.src = knightAsset('normal');
      knight.classList.remove('knight-attack-pose');
      enemy.src = enemyAsset(activeQuiz.data.enemy, 'normal');
      feedback.classList.add('hidden');
      document.getElementById('quizGame').classList.remove('hidden');
      renderQuestion('in');
    }
  }, BATTLE_ANIMATION_MS);
}

function showQuizEndPanel() {
  activeQuiz.finished = true;
  clearInterval(quizTimer);
  const modal = ensureQuizModal();
  modal.querySelector('#quizGame').classList.add('hidden');
  document.getElementById('battleFeedback').classList.add('hidden');
  showQuizResult();
}

function showQuizResult() {
  const won = activeQuiz.hearts > 0;
  const modal = ensureQuizModal();
  const quizGame = modal.querySelector('#quizGame');
  quizGame.classList.add('hidden');
  quizGame.style.display = 'none';
  modal.querySelector('#quizIntro').classList.add('hidden');
  document.getElementById('battleFeedback').classList.add('hidden');
  const knight = document.getElementById('quizKnight');
  const enemy = document.getElementById('quizEnemy');
  knight.classList.remove('sprite-pop', 'sprite-shake', 'knight-strike', 'knight-damaged', 'knight-attack-pose');
  enemy.classList.remove('sprite-shake', 'enemy-hit', 'enemy-attack-strike');
  knight.src = won ? knightAsset('victory') : knightAsset('defeated');
  enemy.src = won ? enemyAsset(activeQuiz.data.enemy, 'defeated') : enemyAsset(activeQuiz.data.enemy, 'normal');

  if (won) {
    setAreaProgress({ level2Completed: true });
    applyMarkerStates();
  }

  const fragmentStatus = won ? awardFragment(activeQuiz.quizId) : { gained: false, reward: null, total: readFragments().size, allCollected: false };
  const reward = fragmentStatus.reward || FRAGMENT_REWARDS[activeQuiz.quizId] || null;
  const result = modal.querySelector('#quizResult');
  result.className = 'quiz-result quiz-panel quiz-final-result';

  if (won) {
    showWinResultSlide(result, reward, 1, fragmentStatus);
    return;
  }

  result.innerHTML = `
    <h2>Verloren!</h2>
    <p>Du hast ${activeQuiz.correct} von ${activeQuiz.data.questions.length} Fragen richtig beantwortet.</p>
    <div class="quiz-result-actions">
      <button id="retryQuizButton" class="ghost-button" type="button">Nochmal spielen</button>
      <button id="closeQuizButton" class="primary-button" type="button">Zur Weltkarte</button>
    </div>
  `;
  document.getElementById('retryQuizButton').addEventListener('click', () => startQuiz(activeQuiz.quizId));
  document.getElementById('closeQuizButton').addEventListener('click', returnToOverworld);
}

function showWinResultSlide(result, reward, slide, fragmentStatus = {}) {
  if (slide === 1) {
    result.innerHTML = `
      <h2>Gewonnen!</h2>
      <p>Du hast ${activeQuiz.correct} von ${activeQuiz.data.questions.length} Fragen richtig beantwortet.</p>
      <div class="quiz-result-actions single-action">
        <button id="winNextButton" class="primary-button" type="button">Weiter</button>
      </div>
    `;
    document.getElementById('winNextButton').addEventListener('click', () => showWinResultSlide(result, reward, 2, fragmentStatus));
    return;
  }
  const rewardBlock = reward
    ? `
      <div class="fragment-reward-box simple-fragment-box" aria-label="Kristall-Belohnung">
        <strong>Kristall erhalten</strong>
        <img class="fragment-mini-image floating-fragment" src="${reward.image}" alt="${reward.name}">
        <p>Der Kristall wird automatisch auf der Weltkarte angezeigt.</p>
      </div>
    `
    : `<p>Der Kristall wird automatisch auf der Weltkarte angezeigt.</p>`;
  const afterText = fragmentStatus.allCollected
    ? 'Du hast alle Sinnes-Kristalle gesammelt. Jetzt kannst du zum Zauberschloss gehen und die Magie der Sinne zurückholen.'
    : 'Dieses Gebiet ist abgeschlossen. Kehre zur Weltkarte zurück, um weitere Kristalle zu sammeln.';
  result.innerHTML = `
    ${rewardBlock}
    <p>${afterText}</p>
    <div class="quiz-result-actions single-action">
      <button id="closeQuizButton" class="primary-button" type="button">Zur Weltkarte</button>
    </div>
  `;
  document.getElementById('closeQuizButton').addEventListener('click', returnToOverworld);
}

async function returnToOverworld() {
  const modal = ensureQuizModal();
  modal.classList.add('hidden');
  startLevelMusic();
  saveCurrentNode('level2');
  await moveToNode('start');
  window.location.href = `../game.html?fromLevel=1&completedArea=${encodeURIComponent(activeQuiz?.quizId || currentArea)}`;
}

async function exitLevel() {
  pauseLevelMusic();
  await moveToNode('start');
  window.location.href = '../game.html?fromLevel=1';
}

if (backButton) {
  backButton.addEventListener('click', event => {
    event.preventDefault();
    exitLevel();
  });
}

currentNode = initialNodeFromProgress();
saveCurrentNode(currentNode);
const initialPoint = getNodes()[currentNode] || stageStart();
levelKnight.style.left = `${initialPoint.x}%`;
levelKnight.style.top = `${initialPoint.y}%`;
applyMarkerStates();
startLevelMusic();
