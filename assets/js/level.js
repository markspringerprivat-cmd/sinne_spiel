
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
const STORAGE_PENDING_NOTICE = 'sinnesmagie-pending-notice';
const QUIZ_SECONDS = 30;
const QUIZ_TRANSITION_MS = 560;
const BATTLE_ANIMATION_MS = 1500;
const STRIKE_RESET_MS = 760;
const DAMAGE_RESET_MS = 760;
const ATTACK_IMPACT_MS = 320;
const ENEMY_IMPACT_MS = 320;
const MOVE_MS = 560;
const CASTLE_QUIZ_QUESTION_COUNT = 3;
const CASTLE_DODGE_DURATION_MS = 30000;
const CASTLE_PROJECTILE_SPAWN_MS = 3400;
const CASTLE_FLIGHT_SWAP_MS = 1200;
const CASTLE_STUN_MS = 1000;
const CASTLE_TASTE_GOAL = 5;
const CASTLE_GOOD_THROW_MS = 5000;
const CASTLE_BAD_THROW_MIN_MS = 3000;
const CASTLE_BAD_THROW_MAX_MS = 4000;
const CASTLE_GOOD_FOODS = ['🍎'];
const CASTLE_FINAL_QUESTION_INDEX = 3;
const CASTLE_CLONE_ROUNDS_TOTAL = 3;
const CASTLE_CLONE_COUNT = 15;
const CASTLE_BUSH_TARGET_HITS = 3;
const CASTLE_BUSH_REVEAL_MS = 2000;
const CASTLE_BUSH_DELAY_MIN_MS = 1800;
const CASTLE_BUSH_DELAY_MAX_MS = 3200;

const currentArea = window.location.pathname.split('/').pop().replace('.html', '');
const AREA_TITLES = {
  zauberschloss: 'Zauberschloss',
  farbenreich: 'Farbenreich',
  klangwald: 'Klangwald',
  tastminen: 'Tastminen',
  duftgarten: 'Duftgarten',
  flammenkueche: 'Flammenküche'
};

const FRAGMENT_REWARDS = {
  farbenreich: { name: 'Kristall des Sehens', image: '../assets/images/fragments/red.png' },
  klangwald: { name: 'Kristall des Hörens', image: '../assets/images/fragments/blue.png' },
  tastminen: { name: 'Kristall des Tastens', image: '../assets/images/fragments/gold.png' },
  duftgarten: { name: 'Kristall des Riechens', image: '../assets/images/fragments/purple.png' },
  flammenkueche: { name: 'Kristall des Schmeckens', image: '../assets/images/fragments/green.png' }
};
const ENEMIES_WITH_ATTACK_ASSET = new Set(['farbgolem', 'waldgeist', 'maulwurf', 'duftgeist', 'feuergolem']);

const AREA_SENSE_INFO = {
  farbenreich: 'Achte auf Farben, Formen und Muster. Das hilft dir beim Quiz zum Sehen.',
  klangwald: 'Höre genau hin: Im Klangwald geht es um Geräusche, Musik und Richtungshören.',
  tastminen: 'Hier geht es um Materialien: hart, weich, glatt, rau und stabil.',
  duftgarten: 'Im Duftgarten geht es um Gerüche, Warnsignale und die Nase.',
  flammenkueche: 'Hier geht es um Geschmack: süß, sauer, salzig, bitter und um Sicherheit beim Essen.',
  zauberschloss: 'Im Zauberschloss geht es darum, ruhig zu bleiben, genau zu reagieren und den Magier zu überwinden.'
};

function isCastleBossQuiz(quizId = activeQuiz?.quizId) {
  return quizId === 'zauberschloss';
}

function castleEnemyAsset(state = 'normal') {
  if (state === 'shield') return '../assets/images/castle-combat/mage_shield.png';
  if (state === 'laugh') return '../assets/images/castle-combat/mage_laugh.png';
  if (state === 'surprised') return '../assets/images/castle-combat/mage_surprised.png';
  if (state === 'flyLeft') return '../assets/images/castle-combat/mage_fly_left.png';
  if (state === 'flyRight') return '../assets/images/castle-combat/mage_fly_right.png';
  if (state === 'hover') return '../assets/images/castle-combat/mage_hover.png';
  return '../assets/images/castle-combat/mage.png';
}

function castleKnightAsset(state = 'normal') {
  if (state === 'attack') return '../assets/images/castle-combat/knight_attack.png';
  if (state === 'finalAttack') return '../assets/images/castle-combat/knight_final_attack.png';
  if (state === 'runLeft1') return '../assets/images/castle-combat/knight_run_left_1.png';
  if (state === 'runLeft2') return '../assets/images/castle-combat/knight_run_left_2.png';
  if (state === 'runRight1') return '../assets/images/castle-combat/knight_run_right_1.png';
  if (state === 'runRight2') return '../assets/images/castle-combat/knight_run_right_2.png';
  return '../assets/images/castle-combat/knight.png';
}

function castleBushAsset(kind = 'bush') {
  if (kind === 'real') return '../assets/images/castle-combat/mage_bush_real.png';
  if (kind === 'fake') return '../assets/images/castle-combat/mage_bush_fake.png';
  return '../assets/images/castle-combat/mage_bush_only.png';
}

function activeQuizQuestions() {
  if (!activeQuiz) return [];
  return Array.isArray(activeQuiz.questions) ? activeQuiz.questions : activeQuiz.data?.questions || [];
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function resetCastleBattleClasses() {
  const zone = document.getElementById('quizBattleZone');
  const knight = document.getElementById('quizKnight');
  const enemy = document.getElementById('quizEnemy');
  const speech = document.getElementById('castleSpeech');
  const beam = document.getElementById('castleBeam');
  if (zone) zone.classList.remove('castle-boss-mode', 'castle-dodge-mode', 'castle-final-question-mode', 'castle-final-hit-mode', 'castle-stand-off-mode', 'castle-clone-mode', 'castle-bush-mode');
  if (knight) {
    knight.classList.remove('castle-runner', 'castle-knight-evade', 'castle-knight-hit', 'castle-final-jump', 'castle-walking');
    knight.style.transform = '';
  }
  if (enemy) {
    enemy.classList.remove('castle-boss-dodge', 'castle-boss-smirk', 'castle-flight-left', 'castle-flight-right', 'castle-hover-drop', 'castle-hovering', 'castle-flyer', 'castle-pass-left', 'castle-pass-right', 'castle-final-damage-blink', 'castle-clone-hidden', 'castle-clone-mage-enter');
    enemy.style.transform = '';
  }
  if (speech) {
    speech.classList.add('hidden');
    speech.innerHTML = '';
  }
  if (beam) beam.classList.add('hidden');
  const finalPanel = document.getElementById('castleFinalQuestionPanel');
  if (finalPanel) finalPanel.classList.add('hidden');
}


function clearCastleProjectiles() {
  const layer = document.getElementById('castleProjectileLayer');
  if (layer) layer.innerHTML = '';
  if (activeQuiz?.castleDodge) activeQuiz.castleDodge.projectiles = [];
}

function cleanupCastleDodgeGame() {
  if (!activeQuiz?.castleDodge) return;
  const state = activeQuiz.castleDodge;
  state.running = false;
  if (state.spawnTimer) clearInterval(state.spawnTimer);
  if (state.flightTimer) clearInterval(state.flightTimer);
  if (state.rafId) cancelAnimationFrame(state.rafId);
  clearCastleProjectiles();
  activeQuiz.castleDodge = null;
  const dodgePanel = document.getElementById('castleDodgePanel');
  if (dodgePanel) dodgePanel.classList.add('hidden');
  const layer = document.getElementById('castleProjectileLayer');
  if (layer) layer.classList.add('hidden');
  resetCastleBattleClasses();
}

function cleanupCastleCloneSearch() {
  const state = activeQuiz?.castleClone;
  if (state) {
    state.running = false;
    (state.timers || []).forEach(timer => clearTimeout(timer));
  }
  if (activeQuiz) activeQuiz.castleClone = null;
  const panel = document.getElementById('castleClonePanel');
  if (panel) {
    panel.classList.add('hidden');
    panel.innerHTML = '';
  }
  const zone = document.getElementById('quizBattleZone');
  if (zone) {
    zone.classList.remove('castle-clone-mode');
    zone.style.removeProperty('--castle-player-left');
    zone.style.removeProperty('--castle-clone-mage-left');
    zone.style.removeProperty('--castle-clone-mage-top');
  }
  const enemy = document.getElementById('quizEnemy');
  if (enemy) {
    enemy.classList.remove('castle-clone-hidden', 'castle-clone-mage-enter');
    enemy.style.removeProperty('left');
    enemy.style.removeProperty('top');
    enemy.style.removeProperty('bottom');
  }
  const knight = document.getElementById('quizKnight');
  if (knight) {
    knight.style.removeProperty('left');
    knight.style.removeProperty('right');
    knight.style.removeProperty('transition');
  }
  hideCastleSpeech();
}

function cleanupCastleBushGame() {
  const state = activeQuiz?.castleBush;
  if (state) {
    state.running = false;
    if (state.revealTimer) clearTimeout(state.revealTimer);
    if (state.sequenceTimer) clearTimeout(state.sequenceTimer);
  }
  if (activeQuiz) activeQuiz.castleBush = null;
  const panel = document.getElementById('castleClonePanel');
  if (panel && panel.classList.contains('castle-bush-panel')) {
    panel.classList.add('hidden');
    panel.innerHTML = '';
  }
  const zone = document.getElementById('quizBattleZone');
  if (zone) zone.classList.remove('castle-bush-mode');
  const enemy = document.getElementById('quizEnemy');
  if (enemy) {
    enemy.classList.remove('castle-clone-hidden');
    enemy.style.removeProperty('left');
    enemy.style.removeProperty('top');
    enemy.style.removeProperty('right');
    enemy.style.removeProperty('bottom');
    enemy.style.removeProperty('opacity');
  }
  const knight = document.getElementById('quizKnight');
  if (knight) {
    knight.style.removeProperty('left');
    knight.style.removeProperty('top');
    knight.style.removeProperty('right');
    knight.style.removeProperty('bottom');
    knight.style.removeProperty('transform');
  }
}

function showCastleSpeech(html) {
  const speech = document.getElementById('castleSpeech');
  if (!speech) return;
  speech.innerHTML = html;
  speech.classList.remove('hidden');
}

function hideCastleSpeech() {
  const speech = document.getElementById('castleSpeech');
  if (!speech) return;
  speech.classList.add('hidden');
  speech.innerHTML = '';
}

function formatCastleDodgeTime(ms) {
  return Math.max(0, ms / 1000).toFixed(1);
}

function writePendingNotice(notice) {
  try {
    localStorage.setItem(STORAGE_PENDING_NOTICE, JSON.stringify(notice));
  } catch {}
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

function bossImageForArea(area) {
  const quiz = window.SINNESMAGIE_QUIZZES?.[area];
  return quiz?.enemy ? `../assets/images/enemies/${quiz.enemy}.png` : '';
}

function showBossUnlockedNotice(area) {
  const data = window.SINNESMAGIE_QUIZZES?.[area];
  const img = bossImageForArea(area);
  const visual = img ? `<div class="visual-notice-hero"><img src="${img}" alt="${data?.enemyName || 'Boss'}"></div>` : '<div class="visual-notice-icon">⚔️</div>';
  showLevelPopup(
    'Bossbegegnung freigeschaltet',
    `<div class="visual-notice">${visual}<p>${data?.enemyName || 'Der Boss'} wartet beim zweiten Punkt.</p><p>${AREA_SENSE_INFO[area] || 'Bereite dich auf das Quiz vor.'}</p></div>`,
    'OK'
  );
}

function showQuizLoading() {
  let panel = document.getElementById('quizLoadingPanel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'quizLoadingPanel';
    panel.className = 'quiz-loading-panel hidden';
    panel.innerHTML = `
      <div class="quiz-loading-card">
        Kampf wird vorbereitet …
        <div class="quiz-loading-bar"><span></span></div>
      </div>`;
    document.body.appendChild(panel);
  }
  const bar = panel.querySelector('.quiz-loading-bar span');
  if (bar) {
    bar.style.animation = 'none';
    void bar.offsetWidth;
    bar.style.animation = '';
  }
  panel.classList.remove('hidden');
  return panel;
}

function hideQuizLoading() {
  const panel = document.getElementById('quizLoadingPanel');
  if (panel) panel.classList.add('hidden');
}

function preloadImageAsync(src) {
  return new Promise(resolve => {
    if (!src) return resolve();
    const img = new Image();
    img.onload = resolve;
    img.onerror = resolve;
    img.src = src;
    if (img.decode) img.decode().then(resolve).catch(resolve);
  });
}

async function preloadQuizAssetsAsync(data, quizId) {
  const imgs = [
    battleBackgroundAsset(quizId),
    knightAsset('normal'), knightAsset('attack'), knightAsset('damage'), knightAsset('defeated'), knightAsset('victory'),
    enemyAsset(data.enemy, 'normal'), enemyAsset(data.enemy, 'damage'), enemyAsset(data.enemy, 'defeated'),
    enemyAttackAsset(data.enemy),
    FRAGMENT_REWARDS[quizId]?.image
  ].filter(Boolean);
  if (isCastleBossQuiz(quizId)) {
    imgs.push(castleKnightAsset('normal'), castleKnightAsset('attack'), castleKnightAsset('finalAttack'), castleKnightAsset('runLeft1'), castleKnightAsset('runLeft2'), castleKnightAsset('runRight1'), castleKnightAsset('runRight2'), castleEnemyAsset('shield'), castleEnemyAsset('laugh'), castleEnemyAsset('surprised'), castleEnemyAsset('flyLeft'), castleEnemyAsset('flyRight'), castleEnemyAsset('hover'));
  }
  await Promise.race([
    Promise.all(imgs.map(preloadImageAsync)),
    new Promise(resolve => setTimeout(resolve, 1600))
  ]);
}


let activeQuiz = null;
let quizTimer = null;
let popupCloseHandler = null;
let currentNode = 'start';

const sfxCorrect = new Audio('../assets/audio/richtig_1.mp3');
const sfxWrong = new Audio('../assets/audio/falsch_3.mp3');
const sfxClick = new Audio('../assets/audio/slice_cut.mp3');

const bossMusic = new Audio('../assets/audio/bossencounter.mp3');
bossMusic.loop = true;
let bossMusicWanted = false;
let bossMusicMode = 'full';

function playSfx(audio) {
  if (!audio) return;
  try {
    audio.pause();
    audio.currentTime = 0;
    audio.volume = currentVolume();
    audio.play().catch(() => {});
  } catch {}
}


let sfxUnlocked = false;
function unlockSfxForMobile() {
  if (sfxUnlocked) return;
  sfxUnlocked = true;
  [sfxCorrect, sfxWrong, sfxClick].forEach(audio => {
    if (!audio) return;
    try {
      audio.volume = 0;
      const played = audio.play();
      if (played && typeof played.then === 'function') {
        played.then(() => {
          audio.pause();
          audio.currentTime = 0;
          audio.volume = currentVolume();
        }).catch(() => {
          audio.volume = currentVolume();
        });
      } else {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = currentVolume();
      }
    } catch {}
  });
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
  const area = progress[currentArea] || {};
  const result = {};
  const maxLevels = Math.max(4, levelMarkers.length);
  for (let i = 1; i <= maxLevels; i++) result[`level${i}Completed`] = !!area[`level${i}Completed`];
  return result;
}

function setAreaProgress(patch) {
  const progress = readProgress();
  const area = progress[currentArea] || {};
  const next = {};
  const maxLevels = Math.max(4, levelMarkers.length);
  for (let i = 1; i <= maxLevels; i++) next[`level${i}Completed`] = !!area[`level${i}Completed`];
  progress[currentArea] = { ...next, ...patch };
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
  pauseBossMusic();
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

function bossVolumeForMode(mode = bossMusicMode) {
  const base = currentVolume();
  return base * (mode === 'question' ? 0.7 : 1);
}

function setBossMusicMode(mode) {
  bossMusicMode = mode === 'question' ? 'question' : 'full';
  try {
    bossMusic.volume = bossVolumeForMode();
  } catch {}
}

function startBossMusic(mode = 'full') {
  bossMusicWanted = true;
  bossMusicMode = mode === 'question' ? 'question' : 'full';
  try {
    bossMusic.loop = true;
    bossMusic.volume = bossVolumeForMode();
    bossMusic.play().catch(() => {});
  } catch {}
}

function pauseBossMusic() {
  bossMusicWanted = false;
  try {
    bossMusic.pause();
  } catch {}
}

function showLevelPopup(title, text, buttonLabel = 'Weiter', onClose = null) {
  if (!levelPopup || !levelPopupTitle || !levelPopupText || !levelPopupClose) return;
  levelPopupTitle.textContent = title || 'Level';
  if (text && /<[a-z][\s\S]*>/i.test(text)) levelPopupText.innerHTML = text;
  else levelPopupText.textContent = text || 'Inhalt folgt später.';
  levelPopupClose.textContent = buttonLabel || 'Weiter';
  popupCloseHandler = onClose;
  levelPopup.classList.remove('hidden');
}

function closeLevelPopup() {
  if (!levelPopup) return;
  levelPopup.classList.add('hidden');
  const handler = popupCloseHandler;
  popupCloseHandler = null;
  if (typeof handler === 'function') handler();
  startLevelMusic();
}

function setMarkersDisabled(disabled) {
  levelMarkers.forEach(marker => {
    marker.classList.toggle('movement-disabled', disabled);
    if (disabled) {
      marker.disabled = true;
      return;
    }
    marker.disabled = marker.classList.contains('locked') || marker.getAttribute('aria-disabled') === 'true';
  });
  if (backButton) backButton.classList.toggle('movement-disabled', disabled);
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
  const nodes = { start: stageStart() };
  levelMarkers.forEach((marker, index) => {
    nodes[`level${index + 1}`] = markerPoint(marker);
  });
  return nodes;
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
  for (let i = levelMarkers.length; i >= 1; i--) {
    if (progress[`level${i}Completed`] && levelMarkers[i - 1]) return `level${i}`;
  }
  return 'start';
}

const JUMP_ASSETS = {
  stand: '../assets/images/characters/knight.png',
  right: {
    jump: '../assets/images/characters/knight_right_jump.png',
    fall: '../assets/images/characters/knight_right_fall.png'
  },
  left: {
    jump: '../assets/images/characters/knight_left_jump.png',
    fall: '../assets/images/characters/knight_left_fall.png'
  }
};

function setKnightSprite(src) {
  if (!levelKnight || !src || levelKnight.getAttribute('src') === src) return;
  levelKnight.setAttribute('src', src);
}

function setKnightPosition(point) {
  levelKnight.style.left = `${point.x}%`;
  levelKnight.style.top = `${point.y}%`;
}

function pointForNode(node) {
  const nodes = getNodes();
  return nodes[node] || nodes.start || stageStart();
}

function nextJumpNode(from, to) {
  if (from === to) return to;
  const order = ['start', ...levelMarkers.map((_, index) => `level${index + 1}`)];
  const fromIndex = order.indexOf(from);
  const toIndex = order.indexOf(to);
  if (fromIndex === -1 || toIndex === -1) return to;
  const step = Math.sign(toIndex - fromIndex);
  return order[fromIndex + step] || to;
}

function jumpDuration(fromPoint, toPoint) {
  const dist = Math.hypot(toPoint.x - fromPoint.x, toPoint.y - fromPoint.y);
  return Math.min(1250, Math.max(760, dist * 18));
}

function jumpArcHeight(fromPoint, toPoint) {
  const dist = Math.hypot(toPoint.x - fromPoint.x, toPoint.y - fromPoint.y);
  return Math.min(16, Math.max(7, dist * 0.22));
}

function moveKnightJump(fromNode, toNode) {
  const fromPoint = pointForNode(fromNode);
  const toPoint = pointForNode(toNode);
  const direction = toPoint.x >= fromPoint.x ? 'right' : 'left';
  const assets = JUMP_ASSETS[direction];
  const duration = jumpDuration(fromPoint, toPoint);
  const arc = jumpArcHeight(fromPoint, toPoint);

  levelKnight.style.transition = 'none';
  levelKnight.style.animation = 'none';

  return new Promise(resolve => {
    const startTime = performance.now();

    function frame(now) {
      const raw = Math.min(1, (now - startTime) / duration);
      const eased = raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2;
      const x = fromPoint.x + (toPoint.x - fromPoint.x) * eased;
      const y = fromPoint.y + (toPoint.y - fromPoint.y) * eased - Math.sin(Math.PI * eased) * arc;
      const squash = 1 + Math.sin(Math.PI * raw) * 0.035;

      setKnightSprite(raw < 0.5 ? assets.jump : assets.fall);
      levelKnight.style.left = `${x}%`;
      levelKnight.style.top = `${y}%`;
      levelKnight.style.transform = `translate(-50%, -88%) scale(${squash.toFixed(3)})`;

      if (raw < 1) {
        requestAnimationFrame(frame);
        return;
      }

      setKnightPosition(toPoint);
      levelKnight.style.transform = 'translate(-50%, -88%) scale(1)';
      setKnightSprite(JUMP_ASSETS.stand);
      resolve();
    }

    requestAnimationFrame(frame);
  });
}

async function moveToNode(targetNode) {
  if (!targetNode || currentNode === targetNode) return;
  setMarkersDisabled(true);

  while (currentNode !== targetNode) {
    const nextNode = nextJumpNode(currentNode, targetNode);
    if (!nextNode || nextNode === currentNode) break;
    await moveKnightJump(currentNode, nextNode);
    saveCurrentNode(nextNode);
  }

  levelKnight.style.animation = '';
  setMarkersDisabled(false);
}

function renderGuidePath() {
  // Keine gestrichelte Pfadlinie mehr: Der Ritter springt direkt zwischen den Feldern.
}


function preloadLevelJumpSprites() {
  [
    JUMP_ASSETS.stand,
    JUMP_ASSETS.right.jump,
    JUMP_ASSETS.right.fall,
    JUMP_ASSETS.left.jump,
    JUMP_ASSETS.left.fall
  ].forEach(src => {
    const img = new Image();
    img.src = src;
  });
}

function applyMarkerStates() {
  const progress = getAreaProgress();
  levelMarkers.forEach((marker, index) => {
    const levelKey = `level${index + 1}Completed`;
    const previousKey = `level${index}Completed`;
    const completed = !!progress[levelKey];
    const locked = index > 0 && !progress[previousKey];
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
        `<div class="visual-notice"><div class="visual-notice-icon">🎮</div><p>${levelMarkers[0].dataset.text || 'Hier startet das Minispiel.'}</p><p>${AREA_SENSE_INFO[currentArea] || 'Das hilft dir später im Quiz.'}</p></div>`,
        'Minispiel starten',
        () => { pauseLevelMusic(); window.location.href = minigameUrl; }
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
  await openQuizIntro(levelMarkers[1].dataset.quizId || currentArea);
}

async function handleLevelThree() {
  const progress = getAreaProgress();
  if (!progress.level2Completed) {
    showLevelPopup('Noch gesperrt', 'Du musst zuerst die Bossbegegnung schaffen, bevor du weiter zum Schloss kannst.');
    return;
  }
  await moveToNode('level3');
  if (!progress.level3Completed) {
    showLevelPopup(
      levelMarkers[2]?.dataset.title || 'Vor dem Schloss',
      `<div class="visual-notice"><div class="visual-notice-icon">🏰</div><p>${levelMarkers[2]?.dataset.text || 'Der Weg zum letzten Tor ist frei.'}</p></div>`,
      'Weiter',
      () => {
        setAreaProgress({ level3Completed: true });
        saveCurrentNode('level3');
        applyMarkerStates();
      }
    );
    return;
  }
  showLevelPopup(levelMarkers[2]?.dataset.title || 'Vor dem Schloss', 'Dieser Punkt ist geschafft. Das finale Tor ist freigeschaltet.', 'OK');
}

async function handleLevelFour() {
  const progress = getAreaProgress();
  if (!progress.level3Completed) {
    showLevelPopup('Noch gesperrt', 'Du musst zuerst den Punkt vor dem Schloss erreichen.');
    return;
  }
  await moveToNode('level4');
  showLevelPopup(
    levelMarkers[3]?.dataset.title || 'Finale',
    `<div class="visual-notice"><div class="visual-notice-icon">✨🏰</div><p>${levelMarkers[3]?.dataset.text || 'Hier startet später das Finale.'}</p></div>`,
    'OK'
  );
}

async function moveLevelKnightTo(marker, index) {
  if (marker.disabled || marker.classList.contains('movement-disabled')) return;
  if (index === 0) await handleLevelOne();
  else if (index === 1) await handleLevelTwo();
  else if (index === 2) await handleLevelThree();
  else await handleLevelFour();
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
  if (isCastleBossQuiz(quizId)) {
    preloadImage(castleKnightAsset('normal'));
    preloadImage(castleKnightAsset('attack'));
    preloadImage(castleKnightAsset('finalAttack'));
    ['runLeft1', 'runLeft2', 'runRight1', 'runRight2'].forEach(state => preloadImage(castleKnightAsset(state)));
    ['shield', 'laugh', 'surprised', 'flyLeft', 'flyRight', 'hover'].forEach(state => preloadImage(castleEnemyAsset(state)));
  }
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
      <div id="quizBattleZone" class="quiz-battle-zone" aria-hidden="true">
        <img id="quizKnight" class="battle-sprite knight-battle" alt="Ritter" draggable="false">
        <img id="quizEnemy" class="battle-sprite enemy-battle" alt="Gegner" draggable="false">
        <div id="castleProjectileLayer" class="castle-projectile-layer hidden"></div>
        <div id="castleBeam" class="castle-beam hidden"></div>
        <div id="castleSpeech" class="castle-speech hidden"></div>
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
      <div id="castleDodgePanel" class="quiz-panel castle-dodge-panel hidden">
        <div class="castle-dodge-top">
          <strong>Geschmack sammeln!</strong>
          <span id="castleDodgeTimer">0 / 5</span>
        </div>
        <p class="castle-dodge-info">Nutze den Sinn des Schmeckens: Sammle leckere Gemüsesorten, um dich für den Kampf zu stärken. Scharfe Chilis machen dich 1 Sekunde bewegungsunfähig.</p>
        <div id="castleDodgeFeedback" class="castle-dodge-feedback hidden"></div>
        <div class="castle-dodge-controls">
          <button id="castleMoveLeft" class="ghost-button castle-arrow-button" type="button" aria-label="Nach links laufen">←</button>
          <button id="castleMoveRight" class="primary-button castle-arrow-button" type="button" aria-label="Nach rechts laufen">→</button>
        </div>
      </div>
      <div id="castleFinalQuestionPanel" class="quiz-panel castle-final-question-panel hidden"></div>
      <div id="castleClonePanel" class="quiz-panel castle-clone-panel hidden"></div>
      <div id="quizResult" class="quiz-result quiz-panel hidden"></div>
    </div>`;
  document.body.appendChild(modal);
  return modal;
}

function setQuizScene(modal, data, quizId) {
  modal.classList.toggle('castle-quiz-modal', isCastleBossQuiz(quizId));
  const bg = modal.querySelector('#quizBattleBg');
  bg.src = battleBackgroundAsset(quizId);
  bg.alt = `${data.title} Kampfhintergrund`;
  modal.querySelector('#quizKnight').src = isCastleBossQuiz(quizId) ? castleKnightAsset('normal') : knightAsset('normal');
  modal.querySelector('#quizEnemy').src = isCastleBossQuiz(quizId) ? castleEnemyAsset('normal') : enemyAsset(data.enemy, 'normal');
  modal.querySelector('#battleFeedback').classList.add('hidden');
}

async function openQuizIntro(quizId) {
  const data = window.SINNESMAGIE_QUIZZES?.[quizId];
  if (!data) {
    showLevelPopup('Quiz', 'Quizdaten fehlen noch.');
    return;
  }
  pauseLevelMusic();
  const loading = showQuizLoading();
  preloadQuizAssets(data, quizId);
  await preloadQuizAssetsAsync(data, quizId);
  await new Promise(resolve => setTimeout(resolve, 450));
  hideQuizLoading();
  const modal = ensureQuizModal();
  clearInterval(quizTimer);
  modal.classList.remove('hidden');
  modal.querySelector('#quizGame').classList.add('hidden');
  modal.querySelector('#quizResult').classList.add('hidden');
  modal.querySelector('#castleDodgePanel').classList.add('hidden');
  modal.querySelector('#castleFinalQuestionPanel')?.classList.add('hidden');
  modal.querySelector('#castleClonePanel')?.classList.add('hidden');
  resetCastleBattleClasses();
  clearCastleProjectiles();
  cleanupCastleBushGame();
  setQuizScene(modal, data, quizId);
  const intro = modal.querySelector('#quizIntro');
  intro.className = 'quiz-intro quiz-panel';
  const introText = isCastleBossQuiz(quizId)
    ? 'Beantworte drei Fragen. Selbst richtige Treffer bringen den Zauberer nur kurz aus dem Gleichgewicht.'
    : 'Beantworte die Fragen. Richtig: Ritter greift an. Falsch: Du verlierst ein Herz.';
  intro.innerHTML = `
    <h2>${data.title}</h2>
    <div class="visual-notice">
      <div class="visual-notice-hero"><img src="${enemyAsset(data.enemy, 'normal')}" alt="${data.enemyName}"></div>
      <p><strong>${data.enemyName}</strong> fordert dich heraus.</p>
      <p>${introText}</p>
    </div>
    <button id="startQuizButton" class="primary-button" type="button">Kampf starten</button>
  `;
  modal.querySelector('#startQuizButton').addEventListener('click', () => startQuiz(quizId));
}

function startQuiz(quizId) {
  pauseLevelMusic();
  startBossMusic('full');
  const data = window.SINNESMAGIE_QUIZZES[quizId];
  preloadQuizAssets(data, quizId);
  const questions = isCastleBossQuiz(quizId) ? data.questions.slice(0, CASTLE_QUIZ_QUESTION_COUNT) : data.questions.slice();
  cleanupCastleDodgeGame();
  cleanupCastleBushGame();
  activeQuiz = {
    quizId,
    data,
    questions,
    index: 0,
    hearts: isCastleBossQuiz(quizId) ? 3 : 3,
    correct: 0,
    answered: false,
    seconds: QUIZ_SECONDS,
    finished: false,
    transitioning: false,
    castleDodge: null,
    castleClone: null,
    castleBush: null
  };
  const modal = ensureQuizModal();
  setQuizScene(modal, data, quizId);
  modal.querySelector('#quizIntro').classList.add('hidden');
  modal.querySelector('#quizResult').classList.add('hidden');
  modal.querySelector('#castleDodgePanel').classList.add('hidden');
  modal.querySelector('#castleFinalQuestionPanel')?.classList.add('hidden');
  modal.querySelector('#castleClonePanel')?.classList.add('hidden');
  const game = modal.querySelector('#quizGame');
  game.className = 'quiz-game quiz-panel hidden';
  game.style.display = '';
  game.classList.remove('hidden');
  renderQuestion('in');
}

function renderHearts() {
  const heartsWrap = document.querySelector('.quiz-hearts-area');
  const hearts = document.getElementById('quizHearts');
  if (!hearts || !activeQuiz) return;
  if (isCastleBossQuiz()) {
    hearts.innerHTML = '';
    if (heartsWrap) heartsWrap.classList.add('hidden');
    return;
  }
  if (heartsWrap) heartsWrap.classList.remove('hidden');
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
  const questions = activeQuizQuestions();
  const q = questions[activeQuiz.index];
  activeQuiz.answered = false;
  activeQuiz.transitioning = false;
  activeQuiz.seconds = QUIZ_SECONDS;
  setBossMusicMode('question');

  const game = document.getElementById('quizGame');
  game.className = 'quiz-game quiz-panel';
  if (entrance === 'in') {
    game.classList.add('slide-in-right');
    setTimeout(() => game.classList.remove('slide-in-right'), QUIZ_TRANSITION_MS + 80);
  }

  document.getElementById('quizTitle').textContent = activeQuiz.data.title;
  document.getElementById('quizCounter').textContent = `Frage ${activeQuiz.index + 1} / ${questions.length}`;
  document.getElementById('quizTimer').textContent = activeQuiz.seconds;
  document.getElementById('quizQuestion').textContent = q[0];
  document.getElementById('quizKnight').src = isCastleBossQuiz() ? castleKnightAsset('normal') : knightAsset('normal');
  document.getElementById('quizEnemy').src = isCastleBossQuiz() ? castleEnemyAsset('normal') : enemyAsset(activeQuiz.data.enemy, 'normal');
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
  if (isCastleBossQuiz()) {
    answerCastleQuestion(idx);
    return;
  }
  activeQuiz.answered = true;
  activeQuiz.transitioning = true;
  clearInterval(quizTimer);
  setBossMusicMode('full');

  const q = activeQuizQuestions()[activeQuiz.index];
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

    if (activeQuiz.hearts <= 0 || activeQuiz.index >= activeQuizQuestions().length - 1) {
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

async function answerCastleQuestion(idx) {
  if (!activeQuiz || activeQuiz.answered || activeQuiz.finished || activeQuiz.transitioning) return;
  activeQuiz.answered = true;
  activeQuiz.transitioning = true;
  clearInterval(quizTimer);
  setBossMusicMode('full');

  const q = activeQuizQuestions()[activeQuiz.index];
  const correct = idx === q[2];
  const answerButtons = document.querySelectorAll('.quiz-answer');
  answerButtons.forEach((btn, i) => {
    btn.disabled = true;
    if (i === q[2]) btn.classList.add('correct-answer');
    if (i === idx && !correct) btn.classList.add('wrong-answer');
  });

  await wait(320);
  const game = document.getElementById('quizGame');
  game.classList.add('slide-out-left');
  await wait(QUIZ_TRANSITION_MS);
  game.classList.add('hidden');
  game.classList.remove('slide-out-left');
  await playCastleQuizAnimation(correct, idx);
}

async function playCastleQuizAnimation(correct, idx) {
  const feedback = document.getElementById('battleFeedback');
  const knight = document.getElementById('quizKnight');
  const enemy = document.getElementById('quizEnemy');
  feedback.classList.remove('hidden');
  feedback.classList.remove('castle-taunt-bubble');
  knight.classList.remove('knight-strike', 'knight-damaged', 'knight-attack-pose', 'castle-knight-evade', 'castle-knight-hit');
  enemy.classList.remove('castle-boss-dodge', 'castle-boss-smirk');

  if (correct) {
    activeQuiz.correct += 1;
    feedback.textContent = 'Richtig!';
    knight.src = castleKnightAsset('attack');
    knight.classList.add('knight-attack-pose');
    enemy.src = castleEnemyAsset('shield');
    void knight.offsetWidth;
    void enemy.offsetWidth;
    playSfx(sfxCorrect);
    knight.classList.add('knight-strike');
    enemy.classList.add('castle-boss-dodge');
    await wait(1050);
  } else {
    feedback.textContent = idx === -1 ? 'Zeit abgelaufen!' : 'Falsch!';
    enemy.src = castleEnemyAsset('laugh');
    playSfx(sfxWrong);
    enemy.classList.add('castle-boss-smirk');
    await wait(900);
  }

  knight.classList.remove('knight-strike', 'knight-attack-pose');
  enemy.classList.remove('castle-boss-dodge', 'castle-boss-smirk');
  knight.src = castleKnightAsset('normal');
  enemy.src = castleEnemyAsset('normal');
  feedback.classList.add('hidden');

  if (activeQuiz.index >= activeQuizQuestions().length - 1) {
    await startCastlePostQuizSequence();
    return;
  }

  activeQuiz.index += 1;
  document.getElementById('quizGame').classList.remove('hidden');
  renderQuestion('in');
}

async function startCastlePostQuizSequence() {
  if (!activeQuiz || !isCastleBossQuiz()) return;
  const modal = ensureQuizModal();
  const zone = document.getElementById('quizBattleZone');
  const knight = document.getElementById('quizKnight');
  const enemy = document.getElementById('quizEnemy');
  const feedback = document.getElementById('battleFeedback');
  feedback.classList.add('hidden');
  modal.querySelector('#quizGame').classList.add('hidden');
  modal.querySelector('#quizIntro').classList.add('hidden');
  modal.querySelector('#quizResult').classList.add('hidden');
  zone.classList.add('castle-boss-mode');
  knight.src = castleKnightAsset('normal');
  enemy.src = castleEnemyAsset('laugh');

  showCastleSpeech('<strong>Ha!</strong><br>Deine Schläge können mir nichts anhaben.<br>Nichts wird die Magie zurück ins Königreich bringen!');
  await wait(2500);
  hideCastleSpeech();

  enemy.src = castleEnemyAsset('flyLeft');
  enemy.classList.add('castle-flight-left');
  await wait(1150);
  enemy.classList.remove('castle-flight-left');

  await startCastleDodgeGame();
}

function setCastleMoveDir(direction) {
  if (!activeQuiz?.castleDodge || !activeQuiz.castleDodge.running) return;
  const state = activeQuiz.castleDodge;
  if (performance.now() < state.stunnedUntil) return;
  state.moveDir = direction;
}

function stopCastleMoveDir(direction) {
  if (!activeQuiz?.castleDodge) return;
  const state = activeQuiz.castleDodge;
  if (state.moveDir === direction) {
    state.moveDir = 0;
    state.lastRunDir = 0;
    state.lastRunKey = '';
    const knight = document.getElementById('quizKnight');
    if (knight && performance.now() >= state.stunnedUntil) {
      knight.src = castleKnightAsset('normal');
      knight.classList.remove('castle-walking');
    }
  }
}

function moveCastleKnight(direction) {
  setCastleMoveDir(direction);
}

function updateCastleTasteStatus() {
  const state = activeQuiz?.castleDodge;
  const counter = document.getElementById('castleDodgeTimer');
  if (!state || !counter) return;
  counter.textContent = `${state.goodCollected} / ${state.goal}`;
}

function showCastleTasteFeedback(message, duration = 900) {
  const feedback = document.getElementById('castleDodgeFeedback');
  if (!feedback) return;
  feedback.textContent = message;
  feedback.classList.remove('hidden');
  clearTimeout(showCastleTasteFeedback.timeoutId);
  showCastleTasteFeedback.timeoutId = setTimeout(() => {
    feedback.classList.add('hidden');
  }, duration);
}


function buildCastleTastePanel() {
  const dodgePanel = document.getElementById('castleDodgePanel');
  if (!dodgePanel) return;
  dodgePanel.className = 'quiz-panel castle-dodge-panel castle-taste-panel';
  dodgePanel.innerHTML = `
    <div class="castle-dodge-top">
      <strong>Geschmack sammeln!</strong>
      <span id="castleDodgeTimer">0 / 5</span>
    </div>
    <p class="castle-dodge-info">Nutze den Sinn des Geschmacks, um die scharfen Chilis von den süßen Äpfeln zu trennen. Sammle die Äpfel und stärke dich für den Kampf gegen den Zauberer.</p>
    <div id="castleDodgeFeedback" class="castle-dodge-feedback hidden"></div>
    <div id="castleTasteIntro" class="castle-taste-dialog" role="dialog" aria-modal="true" aria-label="Geschmackssinn Hinweis">
      <p>Nutze den Sinn des Geschmacks, um die scharfen Chilis von den süßen Äpfeln zu trennen.</p>
      <p>Sammle die Äpfel und stärke dich für den Kampf gegen den Zauberer.</p>
      <button id="castleTasteStartButton" class="primary-button" type="button">OK</button>
    </div>
    <div class="castle-dodge-controls">
      <button id="castleMoveLeft" class="ghost-button castle-arrow-button" type="button" aria-label="Nach links laufen">←</button>
      <button id="castleMoveRight" class="primary-button castle-arrow-button" type="button" aria-label="Nach rechts laufen">→</button>
    </div>
  `;
}

function waitForCastleTasteStart() {
  return new Promise(resolve => {
    const button = document.getElementById('castleTasteStartButton');
    const dialog = document.getElementById('castleTasteIntro');
    if (!button) {
      resolve();
      return;
    }
    button.addEventListener('click', () => {
      unlockSfxForMobile();
      dialog?.classList.add('hidden');
      resolve();
    }, { once: true });
  });
}

function spawnCastleTasteItem(kind = 'good') {
  if (!activeQuiz?.castleDodge || !activeQuiz.castleDodge.running) return;
  const state = activeQuiz.castleDodge;
  const layer = document.getElementById('castleProjectileLayer');
  if (!layer) return;
  const el = document.createElement('div');
  el.className = `castle-projectile castle-food-item ${kind === 'good' ? 'good-food' : 'bad-food'}`;
  el.textContent = kind === 'good'
    ? CASTLE_GOOD_FOODS[Math.floor(Math.random() * CASTLE_GOOD_FOODS.length)]
    : '🌶️';
  const x = Math.max(10, Math.min(90, state.mageX + 15 + (Math.random() * 14 - 7)));
  el.style.left = `${x}%`;
  el.style.top = '6%';
  layer.appendChild(el);
  state.projectiles.push({
    el,
    x,
    y: 6,
    kind,
    speed: kind === 'good' ? 26 + Math.random() * 4 : 29 + Math.random() * 5
  });
}

function spawnCastleGoodFood() {
  spawnCastleTasteItem('good');
}

function scheduleCastleBadFood() {
  const state = activeQuiz?.castleDodge;
  if (!state || !state.running) return;
  const delay = CASTLE_BAD_THROW_MIN_MS + Math.random() * (CASTLE_BAD_THROW_MAX_MS - CASTLE_BAD_THROW_MIN_MS);
  state.badSpawnTimer = setTimeout(() => {
    const current = activeQuiz?.castleDodge;
    if (!current || !current.running) return;
    spawnCastleTasteItem('bad');
    scheduleCastleBadFood();
  }, delay);
}

function setCastleMagePosition() {
  const enemy = document.getElementById('quizEnemy');
  const state = activeQuiz?.castleDodge;
  if (!enemy || !state) return;
  const zone = document.getElementById('quizBattleZone');
  if (zone) zone.style.setProperty('--castle-mage-left', `${state.mageX}%`);
  enemy.style.right = 'auto';
  enemy.src = state.mageDir >= 0 ? castleEnemyAsset('flyRight') : castleEnemyAsset('flyLeft');
}

function castleKnightHit() {
  const state = activeQuiz?.castleDodge;
  const knight = document.getElementById('quizKnight');
  const feedback = document.getElementById('castleDodgeFeedback');
  if (!state || performance.now() < state.stunnedUntil || !knight) return;
  state.stunnedUntil = performance.now() + CASTLE_STUN_MS;
  state.moveDir = 0;
  state.lastRunDir = 0;
  state.lastRunKey = '';
  knight.src = castleKnightAsset('normal');
  knight.classList.remove('castle-walking');
  knight.classList.add('castle-knight-hit');
  if (feedback) {
    feedback.textContent = 'Zu scharf! Kurz bewegungsunfähig!';
    feedback.classList.remove('hidden');
  }
  setTimeout(() => {
    if (feedback) feedback.classList.add('hidden');
    knight.classList.remove('castle-knight-hit');
  }, CASTLE_STUN_MS);
}

function updateCastleProjectiles(deltaSeconds) {
  const state = activeQuiz?.castleDodge;
  if (!state || !state.running) return;
  const knight = document.getElementById('quizKnight');
  if (!knight) return;
  const knightRect = knight.getBoundingClientRect();

  state.projectiles = state.projectiles.filter(projectile => {
    projectile.y += projectile.speed * deltaSeconds;
    projectile.el.style.top = `${projectile.y}%`;
    if (projectile.y > 108) {
      projectile.el.remove();
      return false;
    }
    const rect = projectile.el.getBoundingClientRect();
    const overlaps = !(rect.right < knightRect.left || rect.left > knightRect.right || rect.bottom < knightRect.top || rect.top > knightRect.bottom);
    if (overlaps) {
      projectile.el.remove();
      if (projectile.kind === 'good') {
        state.goodCollected = Math.min(state.goal, state.goodCollected + 1);
        playSfx(sfxClick);
        updateCastleTasteStatus();
        showCastleTasteFeedback(`Apfel gesammelt! ${state.goodCollected} von ${state.goal}.`, 850);
        if (state.goodCollected >= state.goal) {
          finishCastleDodgeGame();
        }
      } else {
        playSfx(sfxWrong);
        castleKnightHit();
      }
      return false;
    }
    return true;
  });
}


function updateCastleKnightRunSprite(now) {
  const state = activeQuiz?.castleDodge;
  const knight = document.getElementById('quizKnight');
  if (!state || !knight) return;
  if (state.moveDir === 0 || now < state.stunnedUntil) {
    if (state.lastRunDir !== 0) {
      knight.src = castleKnightAsset('normal');
      knight.classList.remove('castle-walking');
      state.lastRunDir = 0;
    }
    return;
  }
  const frame = Math.floor(now / 190) % 2 === 0 ? 1 : 2;
  const key = state.moveDir < 0 ? `runLeft${frame}` : `runRight${frame}`;
  if (state.lastRunKey !== key) {
    knight.src = castleKnightAsset(key);
    knight.classList.add('castle-walking');
    state.lastRunKey = key;
  }
  state.lastRunDir = state.moveDir;
}

function castleDodgeFrame(now) {
  const state = activeQuiz?.castleDodge;
  if (!state || !state.running) return;
  const delta = Math.min(0.05, (now - (state.lastFrame || now)) / 1000 || 0);
  state.lastFrame = now;
  const knight = document.getElementById('quizKnight');
  updateCastleKnightRunSprite(now);

  if (now >= state.stunnedUntil) {
    state.playerX += state.moveDir * 56 * delta;
    state.playerX = Math.max(0, Math.min(100, state.playerX));
    if (knight) {
      const zone = document.getElementById('quizBattleZone');
      if (zone) zone.style.setProperty('--castle-player-left', `${state.playerX}%`);
      knight.style.transform = 'translateX(0)';
    }
  }

  state.mageX += state.mageDir * 22.5 * delta;
  if (state.mageX > 106) {
    state.mageX = 106;
    state.mageDir = -1;
  } else if (state.mageX < -6) {
    state.mageX = -6;
    state.mageDir = 1;
  }
  setCastleMagePosition();
  updateCastleProjectiles(delta);
  state.rafId = requestAnimationFrame(castleDodgeFrame);
}

function installCastleHoldControls() {
  const left = document.getElementById('castleMoveLeft');
  const right = document.getElementById('castleMoveRight');
  if (!left || !right || left.dataset.holdReady === '1') return;
  const bind = (button, dir) => {
    button.dataset.holdReady = '1';
    button.addEventListener('contextmenu', event => event.preventDefault());
    button.addEventListener('selectstart', event => event.preventDefault());
    button.addEventListener('touchstart', event => event.preventDefault(), { passive: false });
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      button.setPointerCapture?.(event.pointerId);
      setCastleMoveDir(dir);
    });
    button.addEventListener('pointerup', event => {
      event.preventDefault();
      stopCastleMoveDir(dir);
    });
    button.addEventListener('pointercancel', () => stopCastleMoveDir(dir));
    button.addEventListener('pointerleave', () => stopCastleMoveDir(dir));
  };
  bind(left, -1);
  bind(right, 1);
}

async function startCastleDodgeGame() {
  if (!activeQuiz) return;
  const zone = document.getElementById('quizBattleZone');
  const layer = document.getElementById('castleProjectileLayer');
  const dodgePanel = document.getElementById('castleDodgePanel');
  const knight = document.getElementById('quizKnight');
  const enemy = document.getElementById('quizEnemy');
  if (!zone || !layer || !dodgePanel || !knight || !enemy) return;

  buildCastleTastePanel();
  installCastleHoldControls();
  zone.classList.remove('castle-boss-mode');
  zone.classList.add('castle-dodge-mode');
  layer.classList.remove('hidden');
  dodgePanel.classList.remove('hidden');
  knight.src = castleKnightAsset('normal');
  knight.classList.add('castle-runner');
  enemy.classList.remove('castle-hovering', 'castle-flight-left', 'castle-flight-right');
  enemy.classList.add('castle-flyer');
  clearCastleProjectiles();

  activeQuiz.castleDodge = {
    running: false,
    playerX: 50,
    moveDir: 0,
    mageX: 10,
    mageDir: 1,
    projectiles: [],
    stunnedUntil: 0,
    goodCollected: 0,
    goal: CASTLE_TASTE_GOAL,
    lastFrame: 0,
    lastRunDir: 0,
    lastRunKey: '',
    spawnTimer: null,
    badSpawnTimer: null,
    rafId: null,
    finishing: false
  };
  zone.style.setProperty('--castle-player-left', '50%');
  zone.style.setProperty('--castle-mage-left', '10%');
  knight.style.transform = 'translateX(0)';
  setCastleMagePosition();
  updateCastleTasteStatus();

  await waitForCastleTasteStart();
  if (!activeQuiz?.castleDodge) return;
  activeQuiz.castleDodge.running = true;
  showCastleTasteFeedback('Sammle 5 Äpfel!', 1400);
  activeQuiz.castleDodge.spawnTimer = setInterval(spawnCastleGoodFood, CASTLE_GOOD_THROW_MS);
  setTimeout(spawnCastleGoodFood, 1100);
  scheduleCastleBadFood();
  activeQuiz.castleDodge.rafId = requestAnimationFrame(castleDodgeFrame);
}

function stopCastleDodgeLoop() {
  if (!activeQuiz?.castleDodge) return;
  const state = activeQuiz.castleDodge;
  state.running = false;
  if (state.spawnTimer) clearInterval(state.spawnTimer);
  if (state.badSpawnTimer) clearTimeout(state.badSpawnTimer);
  if (state.flightTimer) clearInterval(state.flightTimer);
  if (state.rafId) cancelAnimationFrame(state.rafId);
  state.moveDir = 0;
}

async function finishCastleDodgeGame() {
  if (!activeQuiz?.castleDodge || activeQuiz.castleDodge.finishing) return;
  activeQuiz.castleDodge.finishing = true;
  stopCastleDodgeLoop();
  clearCastleProjectiles();
  const dodgePanel = document.getElementById('castleDodgePanel');
  const layer = document.getElementById('castleProjectileLayer');
  const zone = document.getElementById('quizBattleZone');
  const knight = document.getElementById('quizKnight');
  const enemy = document.getElementById('quizEnemy');
  if (dodgePanel) dodgePanel.classList.add('hidden');
  if (layer) layer.classList.add('hidden');
  if (zone) {
    zone.classList.remove('castle-dodge-mode');
    zone.classList.add('castle-final-hit-mode');
    zone.style.setProperty('--castle-player-left', '50%');
    zone.style.setProperty('--castle-mage-left', '50%');
  }
  if (knight) {
    knight.src = castleKnightAsset('normal');
    knight.classList.remove('castle-runner', 'castle-knight-hit', 'castle-walking');
    knight.style.transform = '';
  }
  if (enemy) {
    enemy.src = castleEnemyAsset('hover');
    enemy.classList.remove('castle-flyer', 'castle-pass-left', 'castle-pass-right');
    enemy.style.transform = '';
  }
  await wait(320);
  await playCastleFinalHit();
}

function showCastleFinalQuestion() {
  const panel = document.getElementById('castleFinalQuestionPanel');
  if (!panel || !activeQuiz) return;
  const fallback = [
    'Welche Aussage über die Sinne ist richtig?',
    ['Mehrere Sinne helfen gemeinsam beim Wahrnehmen.', 'Nur ein Sinn ist im Alltag wichtig.', 'Sinne braucht man nur beim Essen.', 'Geräusche sieht man mit der Haut.'],
    0
  ];
  const q = activeQuiz.data.questions[CASTLE_FINAL_QUESTION_INDEX] || activeQuiz.data.questions[activeQuiz.data.questions.length - 1] || fallback;
  activeQuiz.finalQuestion = q;
  panel.innerHTML = `
    <h2>Letzte Chance!</h2>
    <p class="castle-final-question-text">${q[0]}</p>
    <div class="quiz-answers castle-final-answers"></div>
  `;
  const answers = panel.querySelector('.castle-final-answers');
  q[1].forEach((answer, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quiz-answer';
    btn.textContent = answer;
    btn.addEventListener('click', () => answerCastleFinalQuestion(idx));
    answers.appendChild(btn);
  });
  panel.classList.remove('hidden');
}

async function answerCastleFinalQuestion(idx) {
  if (!activeQuiz || activeQuiz.finalAnswered) return;
  activeQuiz.finalAnswered = true;
  const panel = document.getElementById('castleFinalQuestionPanel');
  const q = activeQuiz.finalQuestion;
  const correct = idx === q[2];
  const buttons = panel ? [...panel.querySelectorAll('.quiz-answer')] : [];
  buttons.forEach((btn, i) => {
    btn.disabled = true;
    if (i === q[2]) btn.classList.add('correct-answer');
    if (i === idx && !correct) btn.classList.add('wrong-answer');
  });

  if (!correct) {
    await wait(900);
    activeQuiz.finalAnswered = false;
    buttons.forEach(btn => {
      btn.disabled = false;
      btn.classList.remove('correct-answer', 'wrong-answer');
    });
    return;
  }

  playSfx(sfxCorrect);
  await wait(520);
  if (panel) panel.classList.add('hidden');
  await playCastleFinalHit();
}

async function playCastleFinalHit() {
  const zone = document.getElementById('quizBattleZone');
  const knight = document.getElementById('quizKnight');
  const enemy = document.getElementById('quizEnemy');
  if (!zone || !knight || !enemy) return;
  zone.classList.remove('castle-final-question-mode');
  zone.classList.add('castle-final-hit-mode');
  knight.src = castleKnightAsset('finalAttack');
  enemy.src = castleEnemyAsset('hover');
  knight.classList.remove('castle-final-jump');
  enemy.classList.remove('castle-final-damage-blink');
  void knight.offsetWidth;
  knight.classList.add('castle-final-jump');
  await wait(520);
  enemy.classList.add('castle-final-damage-blink');
  await wait(1050);
  knight.classList.remove('castle-final-jump');
  enemy.classList.remove('castle-final-damage-blink');
  knight.src = castleKnightAsset('normal');
  enemy.src = castleEnemyAsset('laugh');
  zone.classList.remove('castle-final-hit-mode');
  zone.classList.add('castle-stand-off-mode');
  await wait(520);
  await startCastleCloneSearchSequence();
}



async function startCastleCloneSearchSequence() {
  cleanupCastleCloneSearch();
  const zone = document.getElementById('quizBattleZone');
  const knight = document.getElementById('quizKnight');
  const enemy = document.getElementById('quizEnemy');
  if (!activeQuiz || !zone || !knight || !enemy) return;

  zone.classList.remove('castle-final-hit-mode');
  zone.classList.add('castle-stand-off-mode');
  zone.style.setProperty('--castle-player-left', '31%');
  knight.src = castleKnightAsset('normal');
  enemy.src = castleEnemyAsset('laugh');
  hideCastleSpeech();
  await wait(420);

  enemy.src = castleEnemyAsset('flyLeft');
  enemy.classList.remove('castle-flight-left');
  void enemy.offsetWidth;
  enemy.classList.add('castle-flight-left');
  await wait(1150);
  enemy.classList.remove('castle-flight-left');

  if (!activeQuiz) return;
  startCastleCloneSearch();
}

function setCastleCloneMagePoint(leftPercent = 64, topPercent = 22) {
  const zone = document.getElementById('quizBattleZone');
  const enemy = document.getElementById('quizEnemy');
  if (zone) {
    zone.style.setProperty('--castle-clone-mage-left', `${leftPercent}%`);
    zone.style.setProperty('--castle-clone-mage-top', `${topPercent}%`);
  }
  if (enemy) {
    enemy.style.setProperty('left', `calc(${leftPercent}% - (var(--castle-sky-size) / 2))`, 'important');
    enemy.style.setProperty('top', `${topPercent}%`, 'important');
    enemy.style.setProperty('bottom', 'auto', 'important');
  }
}

function setCastleCloneKnightX(leftPercent = 31) {
  const zone = document.getElementById('quizBattleZone');
  const knight = document.getElementById('quizKnight');
  if (zone) zone.style.setProperty('--castle-player-left', `${leftPercent}%`);
  if (knight) {
    knight.style.setProperty('left', `calc(${leftPercent}% - (var(--castle-combat-size) / 2))`, 'important');
    knight.style.setProperty('right', 'auto', 'important');
  }
}

function shuffleCastleClonePoints(points) {
  const clone = [...points];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

function getCastleClonePoints() {
  return shuffleCastleClonePoints([
    { x: 15, y: 16 }, { x: 33, y: 14 }, { x: 51, y: 18 }, { x: 69, y: 14 }, { x: 85, y: 18 },
    { x: 20, y: 34 }, { x: 38, y: 31 }, { x: 56, y: 29 }, { x: 74, y: 33 }, { x: 88, y: 32 },
    { x: 17, y: 52 }, { x: 36, y: 50 }, { x: 58, y: 48 }, { x: 78, y: 49 }, { x: 70, y: 63 }
  ]).slice(0, CASTLE_CLONE_COUNT);
}

function updateCastleCloneRoundLabel() {
  const label = document.getElementById('castleCloneRound');
  const state = activeQuiz?.castleClone;
  if (!label || !state) return;
  label.textContent = `Runde ${state.round} / ${CASTLE_CLONE_ROUNDS_TOTAL}`;
}

function startCastleCloneSearch() {
  cleanupCastleCloneSearch();
  const panel = document.getElementById('castleClonePanel');
  const zone = document.getElementById('quizBattleZone');
  const knight = document.getElementById('quizKnight');
  const enemy = document.getElementById('quizEnemy');
  if (!panel || !zone || !activeQuiz || !knight || !enemy) return;

  activeQuiz.castleClone = {
    round: 1,
    running: true,
    locked: true,
    timers: [],
    playerX: 31,
    choosing: false
  };

  zone.classList.remove('castle-stand-off-mode');
  zone.classList.add('castle-clone-mode');
  setCastleCloneKnightX(31);
  setCastleCloneMagePoint(64, 22);
  knight.src = castleKnightAsset('normal');
  knight.classList.remove('castle-final-jump', 'castle-walking');
  knight.style.transition = '';
  enemy.classList.remove('castle-final-damage-blink', 'castle-clone-hidden', 'castle-clone-mage-enter');
  enemy.src = castleEnemyAsset('laugh');

  panel.className = 'quiz-panel castle-clone-panel';
  panel.innerHTML = `
    <div class="castle-clone-hud">
      <strong class="castle-clone-hud-title">Sinn des Sehens</strong>
      <span id="castleCloneRound">Runde 1 / ${CASTLE_CLONE_ROUNDS_TOTAL}</span>
    </div>
    <div id="castleCloneDialog" class="castle-clone-dialog" role="dialog" aria-modal="true" aria-label="Hinweis zur Sehphase">
      <p>Der Magier nutzt eine optische Täuschung, um sich zu verstecken. Benutze den Sinn des Sehens und finde den Zauberer, der nicht blinkt.</p>
      <button id="castleCloneStartButton" class="primary-button" type="button">OK</button>
    </div>
    <div id="castleClonePlayfield" class="castle-clone-playfield hidden" aria-live="polite"></div>
  `;
  panel.classList.remove('hidden');
  updateCastleCloneRoundLabel();

  const startButton = document.getElementById('castleCloneStartButton');
  startButton?.addEventListener('click', async () => {
    const dialog = document.getElementById('castleCloneDialog');
    if (dialog) dialog.classList.add('hidden');
    await beginCastleCloneAttempt(true);
  });
}

async function beginCastleCloneAttempt(showMageEnter = true) {
  const state = activeQuiz?.castleClone;
  const field = document.getElementById('castleClonePlayfield');
  const enemy = document.getElementById('quizEnemy');
  if (!state || !state.running || !field || !enemy) return;

  state.locked = true;
  state.choosing = false;
  field.classList.add('hidden');
  field.innerHTML = '';
  hideCastleSpeech();
  setCastleCloneKnightX(Number(state.playerX) || 31);
  setCastleCloneMagePoint(64, 22);
  enemy.classList.remove('castle-clone-hidden', 'castle-final-damage-blink', 'castle-clone-mage-enter', 'castle-flight-left');
  if (!showMageEnter) {
    enemy.classList.add('castle-clone-hidden');
    buildCastleCloneChoices();
    return;
  }
  enemy.src = castleEnemyAsset('flyRight');
  void enemy.offsetWidth;
  enemy.classList.add('castle-clone-mage-enter');
  await wait(900);
  if (!activeQuiz?.castleClone?.running) return;
  enemy.classList.remove('castle-clone-mage-enter');
  enemy.src = castleEnemyAsset('normal');
  await wait(220);
  if (!activeQuiz?.castleClone?.running) return;
  enemy.classList.add('castle-clone-hidden');
  buildCastleCloneChoices();
}

function buildCastleCloneChoices() {
  const state = activeQuiz?.castleClone;
  const field = document.getElementById('castleClonePlayfield');
  if (!state || !state.running || !field) return;

  const points = getCastleClonePoints();
  const stillIndex = Math.floor(Math.random() * points.length);
  field.innerHTML = '';
  field.classList.remove('hidden');

  points.forEach((point, index) => {
    const button = document.createElement('button');
    const isStill = index === stillIndex;
    button.type = 'button';
    button.className = `castle-clone-choice ${isStill ? 'is-still' : 'is-blinking'}`;
    button.style.left = `${point.x}%`;
    button.style.top = `${point.y}%`;
    button.style.setProperty('--clone-delay', `${(index % 6) * -0.12}s`);
    button.setAttribute('aria-label', isStill ? 'Nicht blinkender Zauberer' : 'Blinkender Zauberer');
    button.innerHTML = `<img src="${castleEnemyAsset('normal')}" alt="">`;
    button.addEventListener('click', () => handleCastleCloneChoice(isStill, point));
    field.appendChild(button);
  });

  state.locked = false;
  state.choosing = true;
}

async function animateCastleCloneKnightRun(targetX) {
  const state = activeQuiz?.castleClone;
  const knight = document.getElementById('quizKnight');
  if (!state || !knight) return;

  const startX = Number(state.playerX) || 31;
  const clampedTarget = Math.max(12, Math.min(78, targetX));
  const direction = clampedTarget >= startX ? 1 : -1;
  const distance = Math.abs(clampedTarget - startX);
  const duration = Math.max(420, Math.min(1100, distance * 24 + 260));
  let frame = 0;

  setCastleCloneKnightX(startX);
  void knight.offsetWidth;
  knight.classList.add('castle-walking');
  knight.style.setProperty('transition', `left ${duration}ms linear`, 'important');
  const frameTimer = setInterval(() => {
    frame += 1;
    knight.src = direction >= 0
      ? castleKnightAsset(frame % 2 === 0 ? 'runRight1' : 'runRight2')
      : castleKnightAsset(frame % 2 === 0 ? 'runLeft1' : 'runLeft2');
  }, 110);

  requestAnimationFrame(() => setCastleCloneKnightX(clampedTarget));
  await wait(duration);
  clearInterval(frameTimer);
  knight.style.removeProperty('transition');
  knight.classList.remove('castle-walking');
  knight.src = castleKnightAsset('normal');
  setCastleCloneKnightX(clampedTarget);
  state.playerX = clampedTarget;
}

async function playCastleCloneSuccess(point) {
  const state = activeQuiz?.castleClone;
  const enemy = document.getElementById('quizEnemy');
  const knight = document.getElementById('quizKnight');
  if (!state || !enemy || !knight) return;

  playSfx(sfxCorrect);
  setCastleCloneMagePoint(point.x, point.y);
  enemy.classList.remove('castle-clone-hidden', 'castle-clone-mage-enter', 'castle-final-damage-blink');
  enemy.src = castleEnemyAsset('normal');
  await animateCastleCloneKnightRun(point.x);
  if (!activeQuiz?.castleClone?.running) return;

  knight.src = castleKnightAsset('finalAttack');
  knight.classList.remove('castle-final-jump');
  void knight.offsetWidth;
  knight.classList.add('castle-final-jump');
  await wait(420);
  if (!activeQuiz?.castleClone?.running) return;
  enemy.src = castleEnemyAsset('surprised');
  enemy.classList.add('castle-final-damage-blink');
  await wait(720);
  knight.classList.remove('castle-final-jump');
  enemy.classList.remove('castle-final-damage-blink');
  knight.src = castleKnightAsset('normal');
  enemy.src = castleEnemyAsset('normal');
  setCastleCloneMagePoint(64, 22);
  await animateCastleCloneKnightRun(31);
  if (!activeQuiz?.castleClone?.running) return;
  enemy.src = castleEnemyAsset('flyLeft');
  enemy.classList.remove('castle-clone-hidden', 'castle-flight-left');
  void enemy.offsetWidth;
  enemy.classList.add('castle-flight-left');
  await wait(1150);
  enemy.classList.remove('castle-flight-left');
  enemy.classList.add('castle-clone-hidden');
}

async function playCastleCloneFailure() {
  const enemy = document.getElementById('quizEnemy');
  if (!enemy || !activeQuiz?.castleClone?.running) return;
  playSfx(sfxWrong);
  setCastleCloneMagePoint(64, 22);
  enemy.classList.remove('castle-clone-hidden', 'castle-clone-mage-enter', 'castle-final-damage-blink');
  enemy.src = castleEnemyAsset('laugh');
  showCastleSpeech('So wirst du mich niemals besiegen!');
  await wait(1500);
  hideCastleSpeech();
}

async function handleCastleCloneChoice(isStill, point) {
  const state = activeQuiz?.castleClone;
  const field = document.getElementById('castleClonePlayfield');
  if (!state || !state.running || state.locked || !field) return;

  state.locked = true;
  state.choosing = false;
  [...field.querySelectorAll('.castle-clone-choice')].forEach(button => button.disabled = true);
  field.innerHTML = '';
  field.classList.add('hidden');

  if (isStill) {
    await playCastleCloneSuccess(point);
    if (!activeQuiz?.castleClone?.running) return;
    state.round += 1;
    if (state.round > CASTLE_CLONE_ROUNDS_TOTAL) {
      await finishCastleCloneSearch();
      return;
    }
    updateCastleCloneRoundLabel();
    await wait(420);
    if (!activeQuiz?.castleClone?.running) return;
    await beginCastleCloneAttempt(false);
    return;
  }

  await playCastleCloneFailure();
  if (!activeQuiz?.castleClone?.running) return;
  await beginCastleCloneAttempt();
}

async function finishCastleCloneSearch() {
  const state = activeQuiz?.castleClone;
  const panel = document.getElementById('castleClonePanel');
  const enemy = document.getElementById('quizEnemy');
  const knight = document.getElementById('quizKnight');
  const zone = document.getElementById('quizBattleZone');
  if (!state || !state.running || !enemy || !knight || !zone) return;
  state.running = false;

  if (panel) panel.classList.add('hidden');
  hideCastleSpeech();
  setCastleCloneMagePoint(64, 22);
  enemy.classList.remove('castle-clone-hidden', 'castle-clone-mage-enter', 'castle-final-damage-blink');
  enemy.src = castleEnemyAsset('flyLeft');
  enemy.classList.remove('castle-flight-left');
  void enemy.offsetWidth;
  enemy.classList.add('castle-flight-left');
  await wait(1150);
  enemy.classList.remove('castle-flight-left');

  cleanupCastleCloneSearch();
  if (!activeQuiz) return;
  activeQuiz.cloneSearchCompleted = true;
  zone.classList.add('castle-stand-off-mode');
  knight.src = castleKnightAsset('normal');
  enemy.src = castleEnemyAsset('laugh');
  await wait(260);
  await startCastleBushSearchSequence();
}


async function startCastleBushSearchSequence() {
  cleanupCastleBushGame();
  const panel = document.getElementById('castleClonePanel');
  const zone = document.getElementById('quizBattleZone');
  const knight = document.getElementById('quizKnight');
  const enemy = document.getElementById('quizEnemy');
  if (!activeQuiz || !panel || !zone || !knight || !enemy) return;

  activeQuiz.castleBush = {
    running: true,
    hits: 0,
    targetHits: CASTLE_BUSH_TARGET_HITS,
    revealTimer: null,
    sequenceTimer: null,
    currentReveals: [],
    locked: false,
    homeX: 10.5,
    knightX: 10.5,
    slots: [38, 57, 76],
    groundY: 72,
    bushY: 72,
    mageY: 66
  };

  zone.classList.remove('castle-stand-off-mode', 'castle-clone-mode', 'castle-final-hit-mode');
  zone.classList.add('castle-bush-mode');
  knight.src = castleKnightAsset('normal');
  knight.classList.remove('castle-final-jump', 'castle-walking', 'castle-knight-hit');
  enemy.classList.remove('castle-final-damage-blink', 'castle-flight-left', 'castle-flight-right', 'castle-clone-hidden');
  enemy.src = castleEnemyAsset('hover');

  panel.className = 'quiz-panel castle-clone-panel castle-bush-panel';
  panel.innerHTML = `
    <div class="castle-clone-hud">
      <strong class="castle-clone-hud-title">Sinn des Tastens</strong>
      <span id="castleCloneRound">Treffer 0 / ${CASTLE_BUSH_TARGET_HITS}</span>
    </div>
    <div id="castleCloneDialog" class="castle-clone-dialog" role="dialog" aria-modal="true" aria-label="Hinweis zur Tastphase">
      <p>Vertraue jetzt deinem Tastsinn. Springe nur auf den echten Magier, wenn er kurz hinter einem Busch erscheint.</p>
      <p>Triffst du die spitze Attrappe, tut das weh.</p>
      <button id="castleCloneStartButton" class="primary-button" type="button">OK</button>
    </div>
    <div id="castleClonePlayfield" class="castle-clone-playfield castle-bush-playfield hidden" aria-live="polite"></div>
  `;
  panel.classList.remove('hidden');
  buildCastleBushSlots();
  updateCastleBushLabel();
  setCastleBushKnightHome();
  setCastleBushMage(64, 72);
  hideCastleSpeech();

  document.getElementById('castleCloneStartButton')?.addEventListener('click', async () => {
    document.getElementById('castleCloneDialog')?.classList.add('hidden');
    document.getElementById('castleClonePlayfield')?.classList.remove('hidden');
    await playCastleBushIntroFlight();
  }, { once: true });
}

function updateCastleBushLabel() {
  const label = document.getElementById('castleCloneRound');
  const state = activeQuiz?.castleBush;
  if (!label || !state) return;
  label.textContent = `Treffer ${state.hits} / ${state.targetHits}`;
}

function buildCastleBushSlots() {
  const state = activeQuiz?.castleBush;
  const field = document.getElementById('castleClonePlayfield');
  if (!state || !field) return;
  field.innerHTML = '';
  state.slots.forEach((left, index) => {
    const slot = document.createElement('div');
    slot.className = 'castle-bush-slot hidden';
    slot.dataset.index = String(index);
    slot.style.left = `${left}%`;
    slot.style.top = `${state.bushY}%`;
    slot.innerHTML = `
      <img class="castle-bush-base" src="${castleBushAsset('bush')}" alt="Busch" draggable="false">
      <button type="button" class="castle-bush-reveal hidden" data-index="${index}" aria-label="Figur hinter Busch antippen">
        <img src="${castleBushAsset('fake')}" alt="Figur hinter dem Busch" draggable="false">
      </button>
    `;
    field.appendChild(slot);
  });
  [...field.querySelectorAll('.castle-bush-reveal')].forEach(btn => btn.addEventListener('click', () => handleCastleBushPick(Number(btn.dataset.index))));
}

function getCastleBushSlot(index) {
  return document.querySelector(`.castle-bush-slot[data-index="${index}"]`);
}

function setCastleBushKnightPosition(leftPercent, topPercent) {
  const knight = document.getElementById('quizKnight');
  if (!knight) return;
  knight.style.left = `${leftPercent}%`;
  knight.style.top = `${topPercent}%`;
  knight.style.right = 'auto';
  knight.style.bottom = 'auto';
  knight.style.transform = 'translate(-50%, -50%) scale(0.82)';
}

function setCastleBushKnightHome() {
  const state = activeQuiz?.castleBush;
  if (!state) return;
  state.knightX = state.homeX;
  setCastleBushKnightPosition(state.homeX, state.groundY);
}

function setCastleBushMage(leftPercent, topPercent = null) {
  const state = activeQuiz?.castleBush;
  const enemy = document.getElementById('quizEnemy');
  if (!enemy || !state) return;
  enemy.classList.remove('castle-clone-hidden');
  enemy.style.opacity = '1';
  enemy.style.left = `${leftPercent}%`;
  enemy.style.top = `${topPercent ?? state.mageY}%`;
  enemy.style.right = 'auto';
  enemy.style.bottom = 'auto';
  enemy.style.transform = 'translate(-50%, -50%)';
}

async function playCastleBushIntroFlight() {
  const state = activeQuiz?.castleBush;
  const enemy = document.getElementById('quizEnemy');
  if (!state || !enemy) return;

  setCastleBushKnightHome();
  enemy.classList.remove('castle-clone-hidden');
  enemy.src = castleEnemyAsset('flyRight');
  setCastleBushMage(24, state.mageY);
  await wait(220);

  for (let i = 0; i < state.slots.length; i += 1) {
    setCastleBushMage(state.slots[i], state.mageY);
    await wait(430);
    const slot = getCastleBushSlot(i);
    slot?.classList.remove('hidden');
    await wait(130);
  }

  setCastleBushMage(118, state.mageY);
  await wait(820);
  enemy.classList.add('castle-clone-hidden');
  scheduleCastleBushReveal();
}

function scheduleCastleBushReveal() {
  const state = activeQuiz?.castleBush;
  if (!state || !state.running || state.locked) return;
  const delay = CASTLE_BUSH_DELAY_MIN_MS + Math.random() * (CASTLE_BUSH_DELAY_MAX_MS - CASTLE_BUSH_DELAY_MIN_MS);
  state.sequenceTimer = setTimeout(showCastleBushReveal, delay);
}

function chooseCastleBushAppearance() {
  const state = activeQuiz?.castleBush;
  if (!state) return [];
  const slots = [...state.slots.keys()].sort(() => Math.random() - 0.5);
  const revealCount = Math.random() < 0.34 ? 2 : 1;
  if (revealCount === 1) {
    return [{ slotIndex: slots[0], kind: Math.random() < 0.36 ? 'real' : 'fake' }];
  }
  if (Math.random() < 0.44) {
    return [
      { slotIndex: slots[0], kind: 'real' },
      { slotIndex: slots[1], kind: 'fake' }
    ];
  }
  return [
    { slotIndex: slots[0], kind: 'fake' },
    { slotIndex: slots[1], kind: 'fake' }
  ];
}

function showCastleBushReveal() {
  const state = activeQuiz?.castleBush;
  if (!state || !state.running || state.locked) return;
  const reveals = chooseCastleBushAppearance();
  if (!reveals.length) return;
  state.currentReveals = reveals;

  reveals.forEach(revealState => {
    const slot = getCastleBushSlot(revealState.slotIndex);
    const base = slot?.querySelector('.castle-bush-base');
    const reveal = slot?.querySelector('.castle-bush-reveal');
    const img = reveal?.querySelector('img');
    if (!slot || !base || !reveal || !img) return;
    img.src = castleBushAsset(revealState.kind);
    base.classList.add('hidden');
    reveal.classList.remove('hidden');
    requestAnimationFrame(() => reveal.classList.add('visible'));
  });

  state.revealTimer = setTimeout(() => {
    hideAllCastleBushReveals();
    if (state.running && !state.locked) scheduleCastleBushReveal();
  }, CASTLE_BUSH_REVEAL_MS);
}

function hideAllCastleBushReveals() {
  const state = activeQuiz?.castleBush;
  if (!state) return;
  (state.currentReveals || []).forEach(revealState => {
    const slot = getCastleBushSlot(revealState.slotIndex);
    const base = slot?.querySelector('.castle-bush-base');
    const reveal = slot?.querySelector('.castle-bush-reveal');
    reveal?.classList.remove('visible');
    if (reveal) reveal.classList.add('hidden');
    base?.classList.remove('hidden');
  });
  state.currentReveals = [];
  if (state.revealTimer) {
    clearTimeout(state.revealTimer);
    state.revealTimer = null;
  }
}

function getCastleBushReveal(index) {
  const state = activeQuiz?.castleBush;
  if (!state) return null;
  return (state.currentReveals || []).find(revealState => revealState.slotIndex === index) || null;
}

async function animateCastleBushJump(targetX, isReturnJump = false) {
  const state = activeQuiz?.castleBush;
  const knight = document.getElementById('quizKnight');
  if (!state || !knight) return;
  const startX = Number(state.knightX ?? state.homeX);
  const startY = state.groundY;
  const duration = isReturnJump ? 520 : 650;
  const arc = isReturnJump ? 8 : 13;
  const startTime = performance.now();

  return new Promise(resolve => {
    function frame(now) {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      const x = startX + (targetX - startX) * eased;
      const y = startY - Math.sin(Math.PI * eased) * arc;
      setCastleBushKnightPosition(x, y);
      knight.src = progress > 0.72 ? castleKnightAsset('attack') : castleKnightAsset('normal');
      if (progress < 1) {
        requestAnimationFrame(frame);
        return;
      }
      state.knightX = targetX;
      setCastleBushKnightPosition(targetX, state.groundY);
      knight.src = castleKnightAsset('normal');
      resolve();
    }
    requestAnimationFrame(frame);
  });
}

async function handleCastleBushPick(index) {
  const state = activeQuiz?.castleBush;
  const knight = document.getElementById('quizKnight');
  if (!state || !state.running || state.locked || !knight) return;
  const revealState = getCastleBushReveal(index);
  if (!revealState) return;

  state.locked = true;
  if (state.sequenceTimer) clearTimeout(state.sequenceTimer);
  if (state.revealTimer) clearTimeout(state.revealTimer);

  const targetX = state.slots[index];
  const isReal = revealState.kind === 'real';
  const slot = getCastleBushSlot(index);
  const revealImg = slot?.querySelector('.castle-bush-reveal img');

  await animateCastleBushJump(targetX, false);
  if (!activeQuiz?.castleBush?.running) return;

  if (isReal) {
    playSfx(sfxCorrect);
    revealImg?.classList.add('castle-bush-hit-blink');
    await wait(460);
    revealImg?.classList.remove('castle-bush-hit-blink');
    state.hits += 1;
    updateCastleBushLabel();
  } else {
    playSfx(sfxWrong);
    knight.classList.add('castle-knight-hit');
    await wait(460);
    knight.classList.remove('castle-knight-hit');
  }

  hideAllCastleBushReveals();
  await animateCastleBushJump(state.homeX, true);
  if (!activeQuiz?.castleBush?.running) return;
  setCastleBushKnightHome();
  state.locked = false;

  if (state.hits >= state.targetHits) {
    await finishCastleBushSearch();
    return;
  }
  scheduleCastleBushReveal();
}

async function finishCastleBushSearch() {
  const state = activeQuiz?.castleBush;
  const panel = document.getElementById('castleClonePanel');
  const zone = document.getElementById('quizBattleZone');
  const knight = document.getElementById('quizKnight');
  const enemy = document.getElementById('quizEnemy');
  if (!state || !state.running || !zone || !knight || !enemy) return;

  state.running = false;
  hideAllCastleBushReveals();
  if (state.sequenceTimer) clearTimeout(state.sequenceTimer);
  if (state.revealTimer) clearTimeout(state.revealTimer);

  enemy.classList.remove('castle-clone-hidden');
  enemy.src = castleEnemyAsset('flyLeft');
  setCastleBushMage(116, state.mageY);
  await wait(100);
  setCastleBushMage(64, 72);
  await wait(760);

  if (panel) panel.classList.add('hidden');
  cleanupCastleBushGame();

  zone.classList.remove('castle-bush-mode');
  zone.classList.add('castle-stand-off-mode');
  knight.classList.remove('castle-knight-hit', 'castle-final-jump', 'castle-walking');
  knight.style.removeProperty('left');
  knight.style.removeProperty('top');
  knight.style.removeProperty('bottom');
  knight.style.removeProperty('right');
  knight.style.removeProperty('transform');
  knight.src = castleKnightAsset('normal');

  enemy.classList.remove('castle-clone-hidden', 'castle-flight-left', 'castle-flight-right');
  enemy.style.removeProperty('left');
  enemy.style.removeProperty('top');
  enemy.style.removeProperty('right');
  enemy.style.removeProperty('bottom');
  enemy.style.removeProperty('opacity');
  enemy.style.removeProperty('transform');
  enemy.src = castleEnemyAsset('laugh');
  hideCastleSpeech();
}

function showQuizEndPanel() {
  activeQuiz.finished = true;
  setBossMusicMode('full');
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

  let fragmentStatus = { gained: false, reward: null, total: readFragments().size, allCollected: false };
  if (won) {
    setAreaProgress({ level2Completed: true });
    applyMarkerStates();
    fragmentStatus = awardFragment(activeQuiz.quizId);
    writePendingNotice({ type: 'fragment', area: activeQuiz.quizId, gained: fragmentStatus.gained, allCollected: fragmentStatus.allCollected });
  }

  const result = modal.querySelector('#quizResult');
  result.className = 'quiz-result quiz-panel quiz-final-result';

  if (won) {
    result.innerHTML = `
      <h2>Boss besiegt!</h2>
      <div class="visual-notice">
        <div class="visual-notice-icon">✅</div>
        <p>${activeQuiz.correct}/${activeQuizQuestions().length} Fragen richtig beantwortet.</p>
        <p>Deine Belohnung erscheint gleich auf der Weltkarte.</p>
      </div>
      <div class="quiz-result-actions single-action">
        <button id="closeQuizButton" class="primary-button" type="button">Zur Weltkarte</button>
      </div>
    `;
    document.getElementById('closeQuizButton').addEventListener('click', returnToOverworld);
    return;
  }

  result.innerHTML = `
    <h2>Verloren!</h2>
    <p>Du hast ${activeQuiz.correct} von ${activeQuizQuestions().length} Fragen richtig beantwortet.</p>
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
      <h2>Quiz geschafft</h2>
      <div class="mini-guide-wrap">
        <div class="mini-guide-slider" aria-label="Quiz Ergebnis">
          <article class="mini-guide-card">
            <div class="mini-guide-icon">✅</div>
            <p class="mini-guide-title">${activeQuiz.correct}/${activeQuizQuestions().length}</p>
            <p class="mini-guide-text">Fragen richtig beantwortet.</p>
          </article>
          <article class="mini-guide-card">
            <div class="mini-guide-icon">💎</div>
            <p class="mini-guide-title">Kristall</p>
            <p class="mini-guide-text">Deine Belohnung wartet.</p>
          </article>
        </div>
      </div>
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
        <p>Kristall erhalten.</p>
      </div>
    `
    : `<p>Kristall erhalten.</p>`;
  const afterText = fragmentStatus.allCollected
    ? 'Alle Kristalle gesammelt. Geh zum Zauberschloss.'
    : 'Gebiet abgeschlossen. Zur Weltkarte zurück.';
  result.innerHTML = `
    ${rewardBlock}
    <p>${afterText}</p>
    <div class="quiz-result-actions single-action">
      <button id="closeQuizButton" class="primary-button" type="button">Weiter</button>
    </div>
  `;
  document.getElementById('closeQuizButton').addEventListener('click', returnToOverworld);
}

async function returnToOverworld() {
  cleanupCastleDodgeGame();
  cleanupCastleCloneSearch();
  cleanupCastleBushGame();
  const modal = ensureQuizModal();
  modal.classList.add('hidden');
  pauseBossMusic();
  startLevelMusic();
  saveCurrentNode('level2');
  await moveToNode('start');
  window.location.href = `../game.html?fromLevel=1&completedArea=${encodeURIComponent(activeQuiz?.quizId || currentArea)}`;
}

async function exitLevel() {
  cleanupCastleDodgeGame();
  cleanupCastleCloneSearch();
  cleanupCastleBushGame();
  pauseBossMusic();
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


function ensureLevelKnightVisible() {
  if (!levelKnight) return;
  levelKnight.style.display = 'block';
  levelKnight.style.visibility = 'visible';
  levelKnight.style.opacity = '1';
  levelKnight.style.zIndex = '32';
}
ensureLevelKnightVisible();
setKnightSprite(JUMP_ASSETS.stand);

preloadLevelJumpSprites();
currentNode = initialNodeFromProgress();
saveCurrentNode(currentNode);
const initialPoint = getNodes()[currentNode] || stageStart();
levelKnight.style.left = `${initialPoint.x}%`;
levelKnight.style.top = `${initialPoint.y}%`;
applyMarkerStates();
const pendingNotice = readPendingNotice();
if (pendingNotice?.type === 'minigameComplete' && pendingNotice.area === currentArea) {
  clearPendingNotice();
  window.setTimeout(() => showBossUnlockedNotice(currentArea), 260);
} else {
  startLevelMusic();
}
