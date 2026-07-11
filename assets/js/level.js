
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
const CASTLE_BUSH_DELAY_MIN_MS = 750;
const CASTLE_BUSH_DELAY_MAX_MS = 1450;
const CASTLE_BUSH_INTRO_FLIGHT_MS = 2900;
const CASTLE_SMELL_ROUNDS_TOTAL = 3;
const CASTLE_SMELL_CLOUD_COUNT = 6;
const CASTLE_SMELL_FLIGHT_MS = 2200;
const CASTLE_SMELL_ROW_GAP_MS = 2400;
const CASTLE_SMELL_FALL_SPEED = 14.5;
const CASTLE_SMELL_SPAWN_Y = 12;
const CASTLE_SMELL_IMPACT_Y = 80;

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

function castleSmellAsset(kind = 'stink') {
  return kind === 'scent'
    ? '../assets/images/castle-combat/smell_scent_cloud.png'
    : '../assets/images/castle-combat/smell_stink_cloud.png';
}

function activeQuizQuestions() {
  if (!activeQuiz) return [];
  return Array.isArray(activeQuiz.questions) ? activeQuiz.questions : activeQuiz.data?.questions || [];
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function shuffleArray(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const CASTLE_SENSE_FALLBACK_QUESTIONS = {
  farbenreich: [
    ['Mit welchem Sinnesorgan sehen wir?', ['Mit dem Auge', 'Mit der Nase', 'Mit der Haut', 'Mit dem Ohr'], 0]
  ],
  tastminen: [
    ['Mit welchem Sinnesorgan tastest und fühlst du?', ['Mit der Haut', 'Mit der Nase', 'Mit der Zunge', 'Mit dem Ohr'], 0]
  ],
  duftgarten: [
    ['Mit welchem Sinnesorgan riechen wir?', ['Mit der Nase', 'Mit dem Auge', 'Mit der Haut', 'Mit dem Ohr'], 0]
  ],
  flammenkueche: [
    ['Mit welchem Sinnesorgan schmecken wir?', ['Mit der Zunge', 'Mit dem Auge', 'Mit dem Ohr', 'Mit der Hand'], 0]
  ]
};

function getCastleSenseQuestion(areaId) {
  const sourceQuestions = window.SINNESMAGIE_QUIZZES?.[areaId]?.questions;
  const questions = Array.isArray(sourceQuestions) && sourceQuestions.length
    ? sourceQuestions
    : CASTLE_SENSE_FALLBACK_QUESTIONS[areaId] || [];
  if (!questions.length) return null;
  if (!activeQuiz) return questions[Math.floor(Math.random() * questions.length)] || questions[0];

  activeQuiz.senseQuestionPools ||= {};
  let pool = activeQuiz.senseQuestionPools[areaId];
  if (!Array.isArray(pool) || pool.length === 0) {
    pool = shuffleArray(questions.map((_, index) => index));
    activeQuiz.senseQuestionPools[areaId] = pool;
  }
  const index = pool.shift();
  return questions[index] || questions[0] || null;
}

function ensureCastleSenseQuestionPanel() {
  let panel = document.getElementById('castleSenseQuestionPanel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'castleSenseQuestionPanel';
    panel.className = 'castle-sense-question-panel hidden';
  }
  if (panel.parentElement !== document.body) document.body.appendChild(panel);
  panel.setAttribute('aria-hidden', panel.classList.contains('hidden') ? 'true' : 'false');
  return panel;
}

function hideCastleSenseQuestionPanel() {
  const panel = document.getElementById('castleSenseQuestionPanel');
  if (!panel) return;
  panel.classList.add('hidden');
  panel.setAttribute('aria-hidden', 'true');
  panel.style.display = 'none';
  panel.innerHTML = '';
}

function askCastleSenseQuestion(areaId, title) {
  const panel = ensureCastleSenseQuestionPanel();
  const question = getCastleSenseQuestion(areaId);
  if (!question) {
    console.error(`Keine Sinnesfrage für ${areaId} gefunden.`);
    return Promise.resolve(false);
  }

  const [questionText, rawAnswers, correctIndex] = question;
  if (!Array.isArray(rawAnswers) || rawAnswers.length === 0) {
    console.error(`Ungültige Antwortdaten für ${areaId}.`);
    return Promise.resolve(false);
  }

  const answers = shuffleArray(rawAnswers.map((answer, originalIndex) => ({
    answer,
    correct: originalIndex === correctIndex
  })));

  panel.innerHTML = `
    <div class="castle-sense-question-card" role="dialog" aria-modal="true" aria-labelledby="castleSenseQuestionTitle">
      <span class="castle-sense-question-kicker">Kurze Sinnesfrage</span>
      <h2 id="castleSenseQuestionTitle">${title}</h2>
      <p class="castle-sense-question-text">${questionText}</p>
      <div class="castle-sense-question-answers"></div>
      <p class="castle-sense-question-feedback hidden" aria-live="polite"></p>
    </div>
  `;
  panel.classList.remove('hidden');
  panel.setAttribute('aria-hidden', 'false');
  panel.style.display = 'grid';
  panel.style.pointerEvents = 'auto';

  return new Promise(resolve => {
    const answersWrap = panel.querySelector('.castle-sense-question-answers');
    const feedback = panel.querySelector('.castle-sense-question-feedback');
    let answered = false;

    answers.forEach(item => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'quiz-answer castle-sense-question-answer';
      button.textContent = item.answer;
      button.dataset.correct = item.correct ? '1' : '0';
      button.addEventListener('click', async event => {
        event.preventDefault();
        event.stopPropagation();
        if (answered) return;
        answered = true;
        const buttons = [...answersWrap.querySelectorAll('button')];
        buttons.forEach(btn => btn.disabled = true);
        button.classList.add(item.correct ? 'correct-answer' : 'wrong-answer');
        const correctButton = buttons.find(btn => btn.dataset.correct === '1');
        if (!item.correct) correctButton?.classList.add('correct-answer');

        feedback.textContent = item.correct
          ? 'Richtig – der Angriff kann beginnen!'
          : 'Falsch – du musst die Aufgabe erneut erspielen.';
        feedback.classList.remove('hidden');
        playSfx(item.correct ? sfxCorrect : sfxWrong);
        await wait(item.correct ? 650 : 950);
        hideCastleSenseQuestionPanel();
        resolve(item.correct);
      });
      answersWrap.appendChild(button);
    });

    requestAnimationFrame(() => {
      panel.querySelector('.castle-sense-question-answer')?.focus({ preventScroll: true });
    });
  });
}

function resetCastleBattleClasses() {
  const zone = document.getElementById('quizBattleZone');
  const knight = document.getElementById('quizKnight');
  const enemy = document.getElementById('quizEnemy');
  const speech = document.getElementById('castleSpeech');
  const beam = document.getElementById('castleBeam');
  if (zone) zone.classList.remove('castle-boss-mode', 'castle-dodge-mode', 'castle-final-question-mode', 'castle-final-hit-mode', 'castle-stand-off-mode', 'castle-clone-mode', 'castle-bush-mode', 'castle-smell-mode');
  if (knight) {
    knight.classList.remove('castle-runner', 'castle-knight-evade', 'castle-knight-hit', 'castle-final-jump', 'castle-walking', 'castle-smell-knight-damage', 'castle-smell-final-jump');
    knight.style.transform = '';
  }
  if (enemy) {
    enemy.classList.remove('castle-boss-dodge', 'castle-boss-smirk', 'castle-flight-left', 'castle-flight-right', 'castle-hover-drop', 'castle-hovering', 'castle-flyer', 'castle-pass-left', 'castle-pass-right', 'castle-final-damage-blink', 'castle-clone-hidden', 'castle-clone-mage-enter', 'castle-phase-hidden', 'castle-smell-hidden');
    enemy.style.transform = '';
  }
  if (speech) {
    speech.classList.add('hidden');
    speech.innerHTML = '';
  }
  if (beam) beam.classList.add('hidden');
  const finalPanel = document.getElementById('castleFinalQuestionPanel');
  if (finalPanel) finalPanel.classList.add('hidden');
  hideCastleSenseQuestionPanel();
}


function clearCastleProjectiles() {
  const layer = document.getElementById('castleProjectileLayer');
  if (layer) layer.innerHTML = '';
  if (activeQuiz?.castleDodge) activeQuiz.castleDodge.projectiles = [];
}

function cleanupCastleDodgeGame() {
  hideCastleSenseQuestionPanel();
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
  hideCastleSenseQuestionPanel();
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
  hideCastleSenseQuestionPanel();
  const state = activeQuiz?.castleBush;
  if (state) {
    state.running = false;
    if (state.revealTimer) clearTimeout(state.revealTimer);
    if (state.sequenceTimer) clearTimeout(state.sequenceTimer);
    if (state.fadeTimer) clearTimeout(state.fadeTimer);
  }
  if (activeQuiz) activeQuiz.castleBush = null;

  const layer = document.getElementById('castleBushLayer');
  if (layer) {
    layer.classList.add('hidden');
    layer.innerHTML = '';
  }

  const panel = document.getElementById('castleClonePanel');
  if (panel?.classList.contains('castle-bush-panel')) {
    panel.classList.add('hidden');
    panel.innerHTML = '';
  }

  const zone = document.getElementById('quizBattleZone');
  if (zone) {
    zone.classList.remove('castle-bush-mode');
    ['--bush-knight-x', '--bush-knight-bottom', '--bush-mage-x', '--bush-mage-bottom'].forEach(name => zone.style.removeProperty(name));
  }

  const knight = document.getElementById('quizKnight');
  if (knight) {
    knight.classList.remove('castle-bush-knight-damage');
    knight.style.removeProperty('left');
    knight.style.removeProperty('top');
    knight.style.removeProperty('right');
    knight.style.removeProperty('bottom');
    knight.style.removeProperty('transform');
    knight.style.removeProperty('transition');
  }

  const enemy = document.getElementById('quizEnemy');
  if (enemy) {
    enemy.classList.remove('castle-bush-hidden');
    enemy.style.removeProperty('left');
    enemy.style.removeProperty('top');
    enemy.style.removeProperty('right');
    enemy.style.removeProperty('bottom');
    enemy.style.removeProperty('opacity');
    enemy.style.removeProperty('transform');
    enemy.style.removeProperty('transition');
  }
}

function cleanupCastleSmellGame() {
  hideCastleSenseQuestionPanel();
  const state = activeQuiz?.castleSmell;
  if (state) {
    state.running = false;
    state.attemptToken = (state.attemptToken || 0) + 1;
    if (state.rafId) cancelAnimationFrame(state.rafId);
    (state.timers || []).forEach(timer => clearTimeout(timer));
    (state.rows || []).forEach(row => {
      if (!row.resolved) {
        row.resolved = true;
        row.resolve?.(false);
      }
      row.el?.remove();
    });
  }
  if (activeQuiz) activeQuiz.castleSmell = null;
  const layer = document.getElementById('castleSmellLayer');
  if (layer) { layer.classList.add('hidden'); layer.innerHTML = ''; }
  const panel = document.getElementById('castleSmellPanel');
  if (panel) { panel.classList.add('hidden'); panel.innerHTML = ''; }
  const zone = document.getElementById('quizBattleZone');
  if (zone) {
    zone.classList.remove('castle-smell-mode');
    ['--smell-player-x','--smell-mage-x','--smell-mage-top'].forEach(name => zone.style.removeProperty(name));
  }
  const knight = document.getElementById('quizKnight');
  if (knight) {
    knight.classList.remove('castle-smell-knight-damage','castle-smell-final-jump','castle-walking');
    ['left','right','top','bottom','transform','transition'].forEach(prop => knight.style.removeProperty(prop));
  }
  const enemy = document.getElementById('quizEnemy');
  if (enemy) {
    enemy.classList.remove('castle-smell-hidden','castle-phase-hidden','castle-final-damage-blink');
    ['left','right','top','bottom','transform','transition','opacity'].forEach(prop => enemy.style.removeProperty(prop));
  }
}

function setCastleStandardBattlePoseVisual() {
  const zone = document.getElementById('quizBattleZone');
  const knight = document.getElementById('quizKnight');
  const enemy = document.getElementById('quizEnemy');
  if (!zone || !knight || !enemy) return;
  zone.classList.remove('castle-boss-mode','castle-dodge-mode','castle-final-question-mode','castle-final-hit-mode','castle-clone-mode','castle-bush-mode','castle-smell-mode');
  zone.classList.add('castle-stand-off-mode');
  knight.className = 'battle-sprite knight-battle';
  enemy.className = 'battle-sprite enemy-battle';
  knight.src = castleKnightAsset('normal');
  enemy.src = castleEnemyAsset('laugh');
  ['left','right','top','bottom','transform','transition','opacity'].forEach(prop => {
    knight.style.removeProperty(prop); enemy.style.removeProperty(prop);
  });
  ['--castle-player-left','--castle-mage-left','--castle-clone-mage-left','--castle-clone-mage-top','--bush-knight-x','--bush-knight-bottom','--bush-mage-x','--bush-mage-bottom','--smell-player-x','--smell-mage-x','--smell-mage-top'].forEach(name => zone.style.removeProperty(name));
  hideCastleSpeech();
}

async function flyCastleMageOutBeforePhase(direction = 'left') {
  const enemy = document.getElementById('quizEnemy');
  if (!enemy) return;
  setCastleStandardBattlePoseVisual();
  await wait(360);
  enemy.src = castleEnemyAsset(direction === 'right' ? 'flyRight' : 'flyLeft');
  enemy.classList.remove('castle-flight-left','castle-flight-right','castle-phase-hidden');
  void enemy.offsetWidth;
  const className = direction === 'right' ? 'castle-flight-right' : 'castle-flight-left';
  enemy.classList.add(className);
  await wait(1150);
  enemy.classList.remove(className);
  enemy.classList.add('castle-phase-hidden');
}

function restoreCastleStandardBattlePose() {
  cleanupCastleBushGame();
  cleanupCastleSmellGame();
  setCastleStandardBattlePoseVisual();
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
    [JUMP_ASSETS.right.jump, JUMP_ASSETS.right.fall, JUMP_ASSETS.left.jump, JUMP_ASSETS.left.fall].forEach(preloadImage);
    ['shield', 'laugh', 'surprised', 'flyLeft', 'flyRight', 'hover'].forEach(state => preloadImage(castleEnemyAsset(state)));
    ['bush', 'real', 'fake'].forEach(kind => preloadImage(castleBushAsset(kind)));
    ['stink', 'scent'].forEach(kind => preloadImage(castleSmellAsset(kind)));
  }
  if (FRAGMENT_REWARDS[quizId]) preloadImage(FRAGMENT_REWARDS[quizId].image);
}

function ensureQuizModal() {
  let modal = document.getElementById('quizModal');
  if (modal) {
    ensureCastleSenseQuestionPanel();
    return modal;
  }
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
        <div id="castleBushLayer" class="castle-bush-layer hidden"></div>
        <div id="castleSmellLayer" class="castle-smell-layer hidden"></div>
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
      <div id="castleSmellPanel" class="quiz-panel castle-smell-panel hidden"></div>
      <div id="castleFinalQuestionPanel" class="quiz-panel castle-final-question-panel hidden"></div>
      <div id="castleClonePanel" class="quiz-panel castle-clone-panel hidden"></div>
      <div id="quizResult" class="quiz-result quiz-panel hidden"></div>
    </div>`;
  document.body.appendChild(modal);
  ensureCastleSenseQuestionPanel();
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
  modal.querySelector('#castleSmellPanel')?.classList.add('hidden');
  modal.querySelector('#castleFinalQuestionPanel')?.classList.add('hidden');
  modal.querySelector('#castleClonePanel')?.classList.add('hidden');
  hideCastleSenseQuestionPanel();
  resetCastleBattleClasses();
  clearCastleProjectiles();
  cleanupCastleBushGame();
  cleanupCastleSmellGame();
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
  cleanupCastleSmellGame();
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
    castleBush: null,
    castleSmell: null,
    senseQuestionPools: {}
  };
  const modal = ensureQuizModal();
  setQuizScene(modal, data, quizId);
  modal.querySelector('#quizIntro').classList.add('hidden');
  modal.querySelector('#quizResult').classList.add('hidden');
  modal.querySelector('#castleDodgePanel').classList.add('hidden');
  modal.querySelector('#castleSmellPanel')?.classList.add('hidden');
  modal.querySelector('#castleFinalQuestionPanel')?.classList.add('hidden');
  modal.querySelector('#castleClonePanel')?.classList.add('hidden');
  hideCastleSenseQuestionPanel();
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

  await flyCastleMageOutBeforePhase('left');
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
  enemy.classList.remove('castle-phase-hidden');
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

function resumeCastleTasteCollectionAfterWrongAnswer() {
  const state = activeQuiz?.castleDodge;
  const dodgePanel = document.getElementById('castleDodgePanel');
  const layer = document.getElementById('castleProjectileLayer');
  const zone = document.getElementById('quizBattleZone');
  const knight = document.getElementById('quizKnight');
  const enemy = document.getElementById('quizEnemy');
  if (!state || !dodgePanel || !layer || !zone || !knight || !enemy) return;

  clearCastleProjectiles();
  state.goodCollected = 0;
  state.finishing = false;
  state.running = true;
  state.moveDir = 0;
  state.stunnedUntil = 0;
  state.lastFrame = 0;
  state.lastRunDir = 0;
  state.lastRunKey = '';
  state.spawnTimer = null;
  state.badSpawnTimer = null;
  state.rafId = null;

  zone.classList.remove('castle-final-hit-mode');
  zone.classList.add('castle-dodge-mode');
  dodgePanel.classList.remove('hidden');
  layer.classList.remove('hidden');
  knight.src = castleKnightAsset('normal');
  knight.classList.add('castle-runner');
  enemy.classList.remove('castle-final-damage-blink');
  enemy.classList.add('castle-flyer');
  updateCastleTasteStatus();
  showCastleTasteFeedback('Falsch beantwortet – sammle erneut 5 Äpfel.', 1800);

  state.spawnTimer = setInterval(spawnCastleGoodFood, CASTLE_GOOD_THROW_MS);
  setTimeout(spawnCastleGoodFood, 800);
  scheduleCastleBadFood();
  state.rafId = requestAnimationFrame(castleDodgeFrame);
}

async function finishCastleDodgeGame() {
  if (!activeQuiz?.castleDodge || activeQuiz.castleDodge.finishing) return;
  const state = activeQuiz.castleDodge;
  state.finishing = true;
  stopCastleDodgeLoop();
  clearCastleProjectiles();

  const dodgePanel = document.getElementById('castleDodgePanel');
  const layer = document.getElementById('castleProjectileLayer');
  const zone = document.getElementById('quizBattleZone');
  const knight = document.getElementById('quizKnight');
  const enemy = document.getElementById('quizEnemy');
  if (dodgePanel) dodgePanel.classList.add('hidden');
  if (layer) layer.classList.add('hidden');

  const quizCorrect = await askCastleSenseQuestion('flammenkueche', 'Geschmackssinn');
  if (!activeQuiz?.castleDodge) return;
  if (!quizCorrect) {
    resumeCastleTasteCollectionAfterWrongAnswer();
    return;
  }

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
  await flyCastleMageOutBeforePhase('left');

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
  enemy.classList.remove('castle-clone-hidden', 'castle-final-damage-blink', 'castle-clone-mage-enter', 'castle-flight-left', 'castle-phase-hidden');
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
  if (!state || !enemy || !knight) return false;

  setCastleCloneMagePoint(point.x, point.y);
  enemy.classList.remove('castle-clone-hidden', 'castle-clone-mage-enter', 'castle-final-damage-blink');
  enemy.src = castleEnemyAsset('normal');
  await animateCastleCloneKnightRun(point.x);
  if (!activeQuiz?.castleClone?.running) return false;

  const quizCorrect = await askCastleSenseQuestion('farbenreich', 'Sehsinn');
  if (!activeQuiz?.castleClone?.running) return false;

  if (!quizCorrect) {
    enemy.src = castleEnemyAsset('laugh');
    showCastleSpeech('Du hast mich gefunden – aber die Sinnesfrage war noch nicht richtig!');
    await wait(850);
    hideCastleSpeech();
    await animateCastleCloneKnightRun(31);
    if (!activeQuiz?.castleClone?.running) return false;
    enemy.src = castleEnemyAsset('flyLeft');
    enemy.classList.remove('castle-clone-hidden', 'castle-flight-left');
    void enemy.offsetWidth;
    enemy.classList.add('castle-flight-left');
    await wait(1000);
    enemy.classList.remove('castle-flight-left');
    enemy.classList.add('castle-clone-hidden');
    return false;
  }

  knight.src = castleKnightAsset('finalAttack');
  knight.classList.remove('castle-final-jump');
  void knight.offsetWidth;
  knight.classList.add('castle-final-jump');
  await wait(420);
  if (!activeQuiz?.castleClone?.running) return false;
  enemy.src = castleEnemyAsset('surprised');
  enemy.classList.add('castle-final-damage-blink');
  await wait(720);
  knight.classList.remove('castle-final-jump');
  enemy.classList.remove('castle-final-damage-blink');
  knight.src = castleKnightAsset('normal');
  enemy.src = castleEnemyAsset('normal');
  setCastleCloneMagePoint(64, 22);
  await animateCastleCloneKnightRun(31);
  if (!activeQuiz?.castleClone?.running) return false;
  if (state.round < CASTLE_CLONE_ROUNDS_TOTAL) {
    enemy.src = castleEnemyAsset('flyLeft');
    enemy.classList.remove('castle-clone-hidden', 'castle-flight-left');
    void enemy.offsetWidth;
    enemy.classList.add('castle-flight-left');
    await wait(1150);
    enemy.classList.remove('castle-flight-left');
    enemy.classList.add('castle-clone-hidden');
  }
  return true;
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
    const hitSucceeded = await playCastleCloneSuccess(point);
    if (!activeQuiz?.castleClone?.running) return;
    if (!hitSucceeded) {
      await wait(360);
      if (!activeQuiz?.castleClone?.running) return;
      await beginCastleCloneAttempt(false);
      return;
    }
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
  cleanupCastleCloneSearch();
  if (!activeQuiz) return;
  activeQuiz.cloneSearchCompleted = true;
  setCastleStandardBattlePoseVisual();
  await flyCastleMageOutBeforePhase('left');
  await startCastleBushSearchSequence();
}


async function startCastleBushSearchSequence() {
  cleanupCastleBushGame();
  const panel = document.getElementById('castleClonePanel');
  const layer = document.getElementById('castleBushLayer');
  const zone = document.getElementById('quizBattleZone');
  const knight = document.getElementById('quizKnight');
  const enemy = document.getElementById('quizEnemy');
  if (!activeQuiz || !panel || !layer || !zone || !knight || !enemy) return;

  const modal = ensureQuizModal();
  modal.querySelector('#quizGame')?.classList.add('hidden');
  modal.querySelector('#quizIntro')?.classList.add('hidden');
  modal.querySelector('#quizResult')?.classList.add('hidden');
  modal.querySelector('#castleDodgePanel')?.classList.add('hidden');
  modal.querySelector('#castleFinalQuestionPanel')?.classList.add('hidden');

  activeQuiz.castleBush = {
    running: true,
    hits: 0,
    targetHits: CASTLE_BUSH_TARGET_HITS,
    revealTimer: null,
    sequenceTimer: null,
    fadeTimer: null,
    currentReveals: [],
    locked: true,
    homeX: 14,
    knightX: 14,
    groundBottom: 4,
    slots: [34, 58, 82],
    mageBottom: 11,
    dropped: [false, false, false],
    appearancePattern: ['fake', 'real', 'fake', 'fake', 'real', 'fake', 'fake', 'real', 'fake'],
    appearanceIndex: 0,
    lastPrimarySlot: -1
  };

  zone.classList.remove('castle-stand-off-mode', 'castle-clone-mode', 'castle-final-hit-mode');
  zone.classList.add('castle-bush-mode');
  layer.classList.remove('hidden');
  knight.src = castleKnightAsset('normal');
  knight.classList.remove('castle-final-jump', 'castle-walking', 'castle-knight-hit', 'castle-bush-knight-damage');
  enemy.classList.remove('castle-final-damage-blink', 'castle-flight-left', 'castle-flight-right', 'castle-clone-hidden', 'castle-bush-hidden');
  enemy.src = castleEnemyAsset('flyRight');

  panel.className = 'quiz-panel castle-clone-panel castle-bush-panel';
  panel.innerHTML = `
    <div class="castle-clone-hud">
      <strong class="castle-clone-hud-title">Sinn des Tastens</strong>
      <span id="castleCloneRound">Treffer 0 / ${CASTLE_BUSH_TARGET_HITS}</span>
    </div>
    <div id="castleCloneDialog" class="castle-clone-dialog" role="dialog" aria-modal="true" aria-label="Hinweis zur Tastphase">
      <p>Vertraue jetzt deinem Tastsinn. Springe nur auf den echten Magier, sobald er hinter einem Busch erscheint.</p>
      <p>Die spitze Magier-Attrappe fühlt sich gefährlich an – ein Sprung darauf tut weh.</p>
      <button id="castleCloneStartButton" class="primary-button" type="button">OK</button>
    </div>
  `;
  panel.classList.remove('hidden');
  buildCastleBushSlots();
  updateCastleBushLabel();
  setCastleBushKnightPosition(activeQuiz.castleBush.homeX, activeQuiz.castleBush.groundBottom);
  setCastleBushMagePosition(-28, activeQuiz.castleBush.mageBottom);
  hideCastleSpeech();

  document.getElementById('castleCloneStartButton')?.addEventListener('click', async () => {
    document.getElementById('castleCloneDialog')?.classList.add('hidden');
    unlockSfxForMobile();
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
  const layer = document.getElementById('castleBushLayer');
  if (!state || !layer) return;
  layer.innerHTML = '';

  state.slots.forEach((x, index) => {
    const slot = document.createElement('div');
    slot.className = 'castle-bush-slot hidden';
    slot.dataset.index = String(index);
    slot.style.setProperty('--bush-slot-x', `${x}%`);
    slot.innerHTML = `
      <img class="castle-bush-base" src="${castleBushAsset('bush')}" alt="Busch" draggable="false">
      <button type="button" class="castle-bush-reveal" data-index="${index}" aria-label="Figur hinter dem Busch antippen" disabled>
        <img src="${castleBushAsset('fake')}" alt="Figur hinter dem Busch" draggable="false">
      </button>
    `;
    layer.appendChild(slot);
  });

  [...layer.querySelectorAll('.castle-bush-reveal')].forEach(button => {
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      handleCastleBushPick(Number(button.dataset.index));
    });
  });
}

function getCastleBushSlot(index) {
  return document.querySelector(`#castleBushLayer .castle-bush-slot[data-index="${index}"]`);
}

function setCastleBushKnightPosition(xPercent, bottomPercent) {
  const state = activeQuiz?.castleBush;
  const zone = document.getElementById('quizBattleZone');
  if (!state || !zone) return;
  state.knightX = xPercent;
  zone.style.setProperty('--bush-knight-x', `${xPercent}%`);
  zone.style.setProperty('--bush-knight-bottom', `${bottomPercent}%`);
}

function setCastleBushMagePosition(xPercent, bottomPercent) {
  const zone = document.getElementById('quizBattleZone');
  if (!zone) return;
  zone.style.setProperty('--bush-mage-x', `${xPercent}%`);
  zone.style.setProperty('--bush-mage-bottom', `${bottomPercent}%`);
}

function revealDroppedBush(index) {
  const state = activeQuiz?.castleBush;
  const slot = getCastleBushSlot(index);
  if (!state || !slot || state.dropped[index]) return;
  state.dropped[index] = true;
  slot.classList.remove('hidden');
  slot.classList.remove('castle-bush-drop-in');
  void slot.offsetWidth;
  slot.classList.add('castle-bush-drop-in');
}

async function playCastleBushIntroFlight() {
  const state = activeQuiz?.castleBush;
  const enemy = document.getElementById('quizEnemy');
  if (!state || !state.running || !enemy) return;

  state.locked = true;
  enemy.src = castleEnemyAsset('flyRight');
  enemy.classList.remove('castle-bush-hidden', 'castle-phase-hidden');
  const startX = -28;
  const endX = 130;
  const duration = CASTLE_BUSH_INTRO_FLIGHT_MS;
  const startTime = performance.now();

  await new Promise(resolve => {
    function frame(now) {
      if (!activeQuiz?.castleBush?.running) {
        resolve();
        return;
      }
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      const x = startX + (endX - startX) * eased;
      const bob = Math.sin(progress * Math.PI * 5) * 1.15;
      setCastleBushMagePosition(x, state.mageBottom + bob);

      state.slots.forEach((slotX, index) => {
        if (!state.dropped[index] && x >= slotX - 1.5) revealDroppedBush(index);
      });

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        resolve();
      }
    }
    requestAnimationFrame(frame);
  });

  if (!activeQuiz?.castleBush?.running) return;
  enemy.classList.add('castle-bush-hidden');
  state.locked = false;
  scheduleCastleBushReveal();
}

function scheduleCastleBushReveal() {
  const state = activeQuiz?.castleBush;
  if (!state || !state.running || state.locked) return;
  const delay = CASTLE_BUSH_DELAY_MIN_MS + Math.random() * (CASTLE_BUSH_DELAY_MAX_MS - CASTLE_BUSH_DELAY_MIN_MS);
  state.sequenceTimer = setTimeout(showCastleBushReveal, delay);
}

function shuffledCastleBushIndices() {
  const state = activeQuiz?.castleBush;
  if (!state) return [];
  const indices = state.slots.map((_, index) => index);
  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  if (indices[0] === state.lastPrimarySlot && indices.length > 1) {
    [indices[0], indices[1]] = [indices[1], indices[0]];
  }
  return indices;
}

function chooseCastleBushAppearances() {
  const state = activeQuiz?.castleBush;
  if (!state) return [];
  const primaryKind = state.appearancePattern[state.appearanceIndex % state.appearancePattern.length];
  state.appearanceIndex += 1;
  const indices = shuffledCastleBushIndices();
  state.lastPrimarySlot = indices[0];
  const appearances = [{ slotIndex: indices[0], kind: primaryKind }];

  if (Math.random() < 0.38) {
    appearances.push({ slotIndex: indices[1], kind: 'fake' });
  }
  return appearances;
}

function showCastleBushReveal() {
  const state = activeQuiz?.castleBush;
  if (!state || !state.running || state.locked) return;
  hideAllCastleBushReveals(true);
  const appearances = chooseCastleBushAppearances();
  state.currentReveals = appearances;

  appearances.forEach(appearance => {
    const slot = getCastleBushSlot(appearance.slotIndex);
    const base = slot?.querySelector('.castle-bush-base');
    const button = slot?.querySelector('.castle-bush-reveal');
    const image = button?.querySelector('img');
    if (!slot || !base || !button || !image) return;
    image.src = castleBushAsset(appearance.kind);
    button.dataset.kind = appearance.kind;
    button.disabled = false;
    slot.classList.add('castle-bush-showing');
    requestAnimationFrame(() => button.classList.add('visible'));
  });

  state.revealTimer = setTimeout(() => {
    hideAllCastleBushReveals();
    if (state.running && !state.locked) scheduleCastleBushReveal();
  }, CASTLE_BUSH_REVEAL_MS);
}

function hideAllCastleBushReveals(immediate = false) {
  const state = activeQuiz?.castleBush;
  if (!state) return;
  const active = [...(state.currentReveals || [])];
  active.forEach(appearance => {
    const slot = getCastleBushSlot(appearance.slotIndex);
    const button = slot?.querySelector('.castle-bush-reveal');
    if (button) {
      button.disabled = true;
      button.classList.remove('visible');
    }
    slot?.classList.remove('castle-bush-showing');
  });
  state.currentReveals = [];
  if (state.revealTimer) {
    clearTimeout(state.revealTimer);
    state.revealTimer = null;
  }
  if (immediate) return;
  if (state.fadeTimer) clearTimeout(state.fadeTimer);
  state.fadeTimer = setTimeout(() => {
    active.forEach(appearance => {
      const button = getCastleBushSlot(appearance.slotIndex)?.querySelector('.castle-bush-reveal');
      button?.classList.remove('visible');
    });
  }, 140);
}

function getCastleBushReveal(index) {
  const state = activeQuiz?.castleBush;
  return state?.currentReveals?.find(item => item.slotIndex === index) || null;
}

async function animateCastleBushKnightJump(targetX, isReturn = false) {
  const state = activeQuiz?.castleBush;
  const knight = document.getElementById('quizKnight');
  if (!state || !knight) return;

  const startX = state.knightX;
  const direction = targetX >= startX ? 'right' : 'left';
  const assets = JUMP_ASSETS[direction];
  const distance = Math.abs(targetX - startX);
  const duration = isReturn
    ? Math.max(480, Math.min(650, distance * 11 + 330))
    : Math.max(620, Math.min(850, distance * 13 + 390));
  const arc = isReturn ? 10 : 18;
  const startTime = performance.now();

  await new Promise(resolve => {
    function frame(now) {
      if (!activeQuiz?.castleBush?.running) {
        resolve();
        return;
      }
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      const x = startX + (targetX - startX) * eased;
      const bottom = state.groundBottom + Math.sin(Math.PI * eased) * arc;
      knight.src = progress < 0.5 ? assets.jump : assets.fall;
      setCastleBushKnightPosition(x, bottom);

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        setCastleBushKnightPosition(targetX, state.groundBottom);
        knight.src = castleKnightAsset('normal');
        resolve();
      }
    }
    requestAnimationFrame(frame);
  });
}

async function handleCastleBushPick(index) {
  const state = activeQuiz?.castleBush;
  const knight = document.getElementById('quizKnight');
  if (!state || !state.running || state.locked || !knight) return;
  const selected = getCastleBushReveal(index);
  if (!selected) return;

  state.locked = true;
  if (state.sequenceTimer) clearTimeout(state.sequenceTimer);
  if (state.revealTimer) clearTimeout(state.revealTimer);
  [...document.querySelectorAll('#castleBushLayer .castle-bush-reveal')].forEach(button => button.disabled = true);

  const targetX = state.slots[index];
  const image = getCastleBushSlot(index)?.querySelector('.castle-bush-reveal img');

  if (selected.kind === 'real') {
    const quizCorrect = await askCastleSenseQuestion('tastminen', 'Tastsinn');
    if (!activeQuiz?.castleBush?.running) return;
    if (!quizCorrect) {
      hideAllCastleBushReveals(true);
      state.locked = false;
      scheduleCastleBushReveal();
      return;
    }

    await animateCastleBushKnightJump(targetX, false);
    if (!activeQuiz?.castleBush?.running) return;
    image?.classList.add('castle-bush-hit-blink');
    await wait(520);
    image?.classList.remove('castle-bush-hit-blink');
    state.hits += 1;
    updateCastleBushLabel();
  } else {
    await animateCastleBushKnightJump(targetX, false);
    if (!activeQuiz?.castleBush?.running) return;
    playSfx(sfxWrong);
    knight.classList.add('castle-bush-knight-damage');
    await wait(520);
    knight.classList.remove('castle-bush-knight-damage');
  }

  hideAllCastleBushReveals(true);
  await animateCastleBushKnightJump(state.homeX, true);
  if (!activeQuiz?.castleBush?.running) return;
  knight.src = castleKnightAsset('normal');
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
  if (!state || !state.running) return;
  state.running = false;
  if (state.sequenceTimer) clearTimeout(state.sequenceTimer);
  if (state.revealTimer) clearTimeout(state.revealTimer);
  hideAllCastleBushReveals(true);

  panel?.classList.add('hidden');
  await wait(180);
  cleanupCastleBushGame();
  setCastleStandardBattlePoseVisual();
  await flyCastleMageOutBeforePhase('left');
  await startCastleSmellSearchSequence();
}


function buildCastleSmellPanel() {
  const panel = document.getElementById('castleSmellPanel');
  if (!panel) return;
  panel.className = 'quiz-panel castle-smell-panel';
  panel.innerHTML = `
    <div class="castle-smell-hud"><strong>Riechsinn</strong><span id="castleSmellRound">Runde 1 / ${CASTLE_SMELL_ROUNDS_TOTAL}</span></div>
    <div id="castleSmellFeedback" class="castle-smell-feedback hidden" aria-live="polite"></div>
    <div id="castleSmellIntro" class="castle-smell-dialog" role="dialog" aria-modal="true" aria-label="Hinweis zum Riechsinn">
      <p><strong>Der Zauberer hat es auf deinen Riechsinn abgesehen!</strong></p>
      <p>Weiche den übelriechenden Wolken aus und stelle dich in den Schutz der angenehmen Duftwolke.</p>
      <button id="castleSmellStartButton" class="primary-button" type="button">OK</button>
    </div>
    <div class="castle-smell-controls">
      <button id="castleSmellMoveLeft" class="ghost-button castle-arrow-button" type="button" aria-label="Nach links laufen">←</button>
      <button id="castleSmellMoveRight" class="primary-button castle-arrow-button" type="button" aria-label="Nach rechts laufen">→</button>
    </div>`;
  panel.classList.remove('hidden');
}
function updateCastleSmellRoundLabel(){const s=activeQuiz?.castleSmell,l=document.getElementById('castleSmellRound');if(s&&l)l.textContent=`Runde ${s.round} / ${s.totalRounds}`;}
function showCastleSmellFeedback(message,duration=1300){const b=document.getElementById('castleSmellFeedback');if(!b)return;b.textContent=message;b.classList.remove('hidden');clearTimeout(showCastleSmellFeedback.timerId);showCastleSmellFeedback.timerId=setTimeout(()=>b.classList.add('hidden'),duration);}
function setCastleSmellControlsEnabled(enabled){['castleSmellMoveLeft','castleSmellMoveRight'].forEach(id=>{const b=document.getElementById(id);if(b)b.disabled=!enabled;});}
function setCastleSmellMoveDir(direction){const s=activeQuiz?.castleSmell;if(!s||!s.running||!s.started||s.locked)return;s.moveDir=direction;}
function stopCastleSmellMoveDir(direction){const s=activeQuiz?.castleSmell;if(s&&s.moveDir===direction)s.moveDir=0;}
function installCastleSmellControls(){const l=document.getElementById('castleSmellMoveLeft'),r=document.getElementById('castleSmellMoveRight');if(!l||!r)return;const bind=(b,d)=>{if(b.dataset.smellReady==='1')return;b.dataset.smellReady='1';b.addEventListener('contextmenu',e=>e.preventDefault());b.addEventListener('touchstart',e=>e.preventDefault(),{passive:false});b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture?.(e.pointerId);setCastleSmellMoveDir(d);});b.addEventListener('pointerup',e=>{e.preventDefault();stopCastleSmellMoveDir(d);});b.addEventListener('pointercancel',()=>stopCastleSmellMoveDir(d));b.addEventListener('pointerleave',()=>stopCastleSmellMoveDir(d));};bind(l,-1);bind(r,1);}
function prepareCastleSmellModeVisual(){const s=activeQuiz?.castleSmell,z=document.getElementById('quizBattleZone'),layer=document.getElementById('castleSmellLayer'),panel=document.getElementById('castleSmellPanel'),k=document.getElementById('quizKnight'),e=document.getElementById('quizEnemy');if(!s||!z||!layer||!panel||!k||!e)return;z.classList.remove('castle-stand-off-mode','castle-boss-mode','castle-dodge-mode','castle-final-hit-mode','castle-final-question-mode','castle-clone-mode','castle-bush-mode');z.classList.add('castle-smell-mode');layer.classList.remove('hidden');panel.classList.remove('hidden');k.className='battle-sprite knight-battle castle-smell-runner';k.src=castleKnightAsset('normal');e.className='battle-sprite enemy-battle castle-phase-hidden';e.src=castleEnemyAsset('flyRight');s.playerX=50;s.moveDir=0;s.lastRunDir=0;s.lastRunKey='';z.style.setProperty('--smell-player-x','50%');z.style.setProperty('--smell-mage-x','-20%');z.style.setProperty('--smell-mage-top','11%');}
function setCastleSmellMagePosition(x,top=11){const z=document.getElementById('quizBattleZone');if(z){z.style.setProperty('--smell-mage-x',`${x}%`);z.style.setProperty('--smell-mage-top',`${top}%`);}}
function updateCastleSmellRunSprite(now){const s=activeQuiz?.castleSmell,k=document.getElementById('quizKnight');if(!s||!k)return;if(s.moveDir===0||s.locked){if(s.lastRunDir!==0){k.src=castleKnightAsset('normal');k.classList.remove('castle-walking');s.lastRunDir=0;s.lastRunKey='';}return;}const f=Math.floor(now/175)%2===0?1:2,key=s.moveDir<0?`runLeft${f}`:`runRight${f}`;if(s.lastRunKey!==key){k.src=castleKnightAsset(key);k.classList.add('castle-walking');s.lastRunKey=key;}s.lastRunDir=s.moveDir;}
function nearestCastleSmellLaneIndex(x,lanes){let n=0,d=Infinity;lanes.forEach((v,i)=>{const c=Math.abs(x-v);if(c<d){d=c;n=i;}});return n;}
function resolveCastleSmellRow(row){const s=activeQuiz?.castleSmell,k=document.getElementById('quizKnight');if(!s||!s.running||row.resolved)return;row.resolved=true;const safe=nearestCastleSmellLaneIndex(s.playerX,s.lanes)===row.safeIndex;row.el.classList.add(safe?'castle-smell-row-safe':'castle-smell-row-danger');row.resolve?.(safe);if(safe){playSfx(sfxCorrect);showCastleSmellFeedback('Die Duftwolke schützt dich!',950);return;}if(s.failureHandling)return;s.failureHandling=true;s.locked=true;s.moveDir=0;setCastleSmellControlsEnabled(false);playSfx(sfxWrong);k?.classList.add('castle-smell-knight-damage');showCastleSmellFeedback('Gestank getroffen! Diese Runde beginnt erneut.',1700);const timer=setTimeout(async()=>{const c=activeQuiz?.castleSmell;if(!c?.running)return;k?.classList.remove('castle-smell-knight-damage');c.attemptToken+=1;clearCastleSmellRows(false);c.failureHandling=false;await wait(420);if(activeQuiz?.castleSmell?.running)await restartCastleSmellRound();},720);s.timers.push(timer);}
function castleSmellFrame(now){const s=activeQuiz?.castleSmell;if(!s||!s.running)return;const delta=Math.min(.05,(now-(s.lastFrame||now))/1000||0);s.lastFrame=now;updateCastleSmellRunSprite(now);if(s.started&&!s.locked){s.playerX+=s.moveDir*53*delta;s.playerX=Math.max(4.5,Math.min(95.5,s.playerX));document.getElementById('quizBattleZone')?.style.setProperty('--smell-player-x',`${s.playerX}%`);}s.rows.forEach(row=>{if(!row.falling)return;row.y+=CASTLE_SMELL_FALL_SPEED*delta;row.el.style.top=`${row.y}%`;if(!row.resolved&&row.y>=CASTLE_SMELL_IMPACT_Y)resolveCastleSmellRow(row);if(row.y>116&&row.el.isConnected)row.el.remove();});s.rafId=requestAnimationFrame(castleSmellFrame);}
function createCastleSmellRow(safeIndex,sequenceIndex){const s=activeQuiz?.castleSmell,layer=document.getElementById('castleSmellLayer');if(!s||!layer)return null;const el=document.createElement('div');el.className='castle-smell-row';el.style.top=`${CASTLE_SMELL_SPAWN_Y}%`;el.style.zIndex=String(30+sequenceIndex);layer.appendChild(el);let resolver;const promise=new Promise(resolve=>resolver=resolve);const row={id:++s.rowId,el,safeIndex,spawned:new Set(),y:CASTLE_SMELL_SPAWN_Y,falling:false,resolved:false,resolve:resolver,promise};s.rows.push(row);return row;}
function appendCastleSmellCloud(row,laneIndex){const s=activeQuiz?.castleSmell;if(!s||!row||row.spawned.has(laneIndex))return;row.spawned.add(laneIndex);const kind=laneIndex===row.safeIndex?'scent':'stink',img=document.createElement('img');img.className=`castle-smell-cloud castle-smell-cloud-${kind}`;img.src=castleSmellAsset(kind);img.alt=kind==='scent'?'Duftwolke':'Gestankwolke';img.draggable=false;img.style.left=`${s.lanes[laneIndex]}%`;img.style.setProperty('--smell-cloud-delay',`${laneIndex*-.07}s`);row.el.appendChild(img);}
async function animateCastleSmellMageAndSpawnRow(direction,sequenceIndex,token){const s=activeQuiz?.castleSmell,e=document.getElementById('quizEnemy');if(!s||!e||token!==s.attemptToken)return null;const safeIndex=Math.floor(Math.random()*CASTLE_SMELL_CLOUD_COUNT),row=createCastleSmellRow(safeIndex,sequenceIndex);if(!row)return null;const startX=direction>0?-18:118,endX=direction>0?118:-18,order=direction>0?s.lanes.map((_,i)=>i):s.lanes.map((_,i)=>i).reverse(),top=Math.max(6.5,11-sequenceIndex*1.2);e.src=castleEnemyAsset(direction>0?'flyRight':'flyLeft');e.classList.remove('castle-phase-hidden','castle-smell-hidden');setCastleSmellMagePosition(startX,top);const started=performance.now();await new Promise(resolve=>{function frame(now){const c=activeQuiz?.castleSmell;if(!c?.running||token!==c.attemptToken){resolve();return;}const p=Math.min(1,(now-started)/CASTLE_SMELL_FLIGHT_MS),ease=p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2,x=startX+(endX-startX)*ease,bob=Math.sin(p*Math.PI*4)*1.1;setCastleSmellMagePosition(x,top+bob);order.forEach(i=>{const crossed=direction>0?x>=s.lanes[i]:x<=s.lanes[i];if(crossed)appendCastleSmellCloud(row,i);});if(p<1)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});if(!activeQuiz?.castleSmell?.running||token!==s.attemptToken)return null;s.lanes.forEach((_,i)=>appendCastleSmellCloud(row,i));e.classList.add('castle-smell-hidden');row.falling=true;s.lastMageExitX=endX;return row;}
function clearCastleSmellRows(value=false){const s=activeQuiz?.castleSmell;if(!s)return;s.rows.forEach(row=>{if(!row.resolved){row.resolved=true;row.resolve?.(value);}row.el?.remove();});s.rows=[];}
function castleSmellDirectionsForRound(round){if(round===2)return[-1,1];if(round>=3)return[1,-1,1];return[1];}
async function waitCastleSmellGap(ms,token){await wait(ms);const s=activeQuiz?.castleSmell;return!!s?.running&&s.attemptToken===token&&!s.failureHandling;}
async function runCastleSmellRoundAttempt(){const s=activeQuiz?.castleSmell;if(!s||!s.running||s.attemptInProgress)return;s.attemptInProgress=true;s.failureHandling=false;s.locked=false;s.moveDir=0;s.lastFrame=performance.now();clearCastleSmellRows(false);setCastleSmellControlsEnabled(true);showCastleSmellFeedback(`Runde ${s.round}: Finde die Duftwolke!`,1200);const token=++s.attemptToken,directions=castleSmellDirectionsForRound(s.round),promises=[];for(let i=0;i<directions.length;i++){const row=await animateCastleSmellMageAndSpawnRow(directions[i],i,token);if(!row||!activeQuiz?.castleSmell?.running||s.attemptToken!==token){s.attemptInProgress=false;return;}promises.push(row.promise);if(i<directions.length-1&&!(await waitCastleSmellGap(CASTLE_SMELL_ROW_GAP_MS,token))){s.attemptInProgress=false;return;}}const results=await Promise.all(promises);if(!activeQuiz?.castleSmell?.running||s.attemptToken!==token||s.failureHandling){s.attemptInProgress=false;return;}s.attemptInProgress=false;if(results.every(Boolean))await completeCastleSmellRoundAttempt();}
async function animateCastleSmellKnightToX(targetX,duration=560){const s=activeQuiz?.castleSmell,k=document.getElementById('quizKnight'),z=document.getElementById('quizBattleZone');if(!s||!k||!z)return;const start=s.playerX,dir=targetX>=start?1:-1,t0=performance.now();let last=-1;await new Promise(resolve=>{function frame(now){if(!activeQuiz?.castleSmell?.running){resolve();return;}const p=Math.min(1,(now-t0)/duration),ease=p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2,x=start+(targetX-start)*ease;s.playerX=x;z.style.setProperty('--smell-player-x',`${x}%`);const f=Math.floor(now/150)%2;if(f!==last){k.src=dir>0?castleKnightAsset(f?'runRight2':'runRight1'):castleKnightAsset(f?'runLeft2':'runLeft1');last=f;}if(p<1)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});s.playerX=targetX;z.style.setProperty('--smell-player-x',`${targetX}%`);k.src=castleKnightAsset('normal');}
async function animateCastleSmellMageToCenter(){const s=activeQuiz?.castleSmell,e=document.getElementById('quizEnemy');if(!s||!e)return;const start=Number.isFinite(s.lastMageExitX)?s.lastMageExitX:118,end=50,t0=performance.now();e.src=castleEnemyAsset(start>end?'flyLeft':'flyRight');e.classList.remove('castle-smell-hidden','castle-phase-hidden');await new Promise(resolve=>{function frame(now){if(!activeQuiz?.castleSmell?.running){resolve();return;}const p=Math.min(1,(now-t0)/900),ease=1-Math.pow(1-p,3);setCastleSmellMagePosition(start+(end-start)*ease,9+(18-9)*ease);if(p<1)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});e.src=castleEnemyAsset('hover');setCastleSmellMagePosition(50,18);}
async function playCastleSmellAttack(){const s=activeQuiz?.castleSmell,k=document.getElementById('quizKnight'),e=document.getElementById('quizEnemy');if(!s||!k||!e)return;k.src=castleKnightAsset('finalAttack');k.classList.remove('castle-smell-final-jump');e.classList.remove('castle-final-damage-blink');void k.offsetWidth;k.classList.add('castle-smell-final-jump');await wait(520);e.src=castleEnemyAsset('surprised');e.classList.add('castle-final-damage-blink');playSfx(sfxCorrect);await wait(760);k.classList.remove('castle-smell-final-jump');e.classList.remove('castle-final-damage-blink');k.src=castleKnightAsset('normal');e.src=castleEnemyAsset('laugh');}
async function completeCastleSmellRoundAttempt(){const s=activeQuiz?.castleSmell;if(!s||!s.running)return;s.locked=true;s.moveDir=0;setCastleSmellControlsEnabled(false);await wait(280);clearCastleSmellRows(true);await animateCastleSmellKnightToX(50,520);await animateCastleSmellMageToCenter();if(!activeQuiz?.castleSmell?.running)return;const correct=await askCastleSenseQuestion('duftgarten','Riechsinn');if(!activeQuiz?.castleSmell?.running)return;if(!correct){showCastleSmellFeedback('Falsch beantwortet – diese Runde wird wiederholt.',1600);await wait(420);await restartCastleSmellRound();return;}await playCastleSmellAttack();if(!activeQuiz?.castleSmell?.running)return;s.round+=1;if(s.round>s.totalRounds){await finishCastleSmellSearch();return;}updateCastleSmellRoundLabel();showCastleSmellFeedback(`Treffer! Runde ${s.round} beginnt.`,1300);await wait(360);await restartCastleSmellRound();}
async function restartCastleSmellRound(){const s=activeQuiz?.castleSmell;if(!s||!s.running)return;s.locked=true;s.moveDir=0;s.attemptToken+=1;clearCastleSmellRows(false);setCastleSmellControlsEnabled(false);setCastleStandardBattlePoseVisual();await flyCastleMageOutBeforePhase('left');if(!activeQuiz?.castleSmell?.running)return;prepareCastleSmellModeVisual();s.locked=false;s.attemptInProgress=false;s.failureHandling=false;await wait(180);runCastleSmellRoundAttempt();}
async function startCastleSmellSearchSequence(){cleanupCastleSmellGame();const modal=ensureQuizModal(),panel=document.getElementById('castleSmellPanel'),layer=document.getElementById('castleSmellLayer'),zone=document.getElementById('quizBattleZone'),knight=document.getElementById('quizKnight'),enemy=document.getElementById('quizEnemy');if(!activeQuiz||!panel||!layer||!zone||!knight||!enemy)return;modal.querySelector('#quizGame')?.classList.add('hidden');modal.querySelector('#quizIntro')?.classList.add('hidden');modal.querySelector('#quizResult')?.classList.add('hidden');modal.querySelector('#castleDodgePanel')?.classList.add('hidden');modal.querySelector('#castleClonePanel')?.classList.add('hidden');modal.querySelector('#castleFinalQuestionPanel')?.classList.add('hidden');activeQuiz.castleSmell={running:true,started:false,round:1,totalRounds:CASTLE_SMELL_ROUNDS_TOTAL,playerX:50,moveDir:0,lastRunDir:0,lastRunKey:'',lastFrame:performance.now(),rafId:null,timers:[],rows:[],rowId:0,attemptToken:0,attemptInProgress:false,failureHandling:false,locked:true,lastMageExitX:-18,lanes:[8.5,25.1,41.7,58.3,74.9,91.5]};buildCastleSmellPanel();installCastleSmellControls();updateCastleSmellRoundLabel();prepareCastleSmellModeVisual();setCastleSmellControlsEnabled(false);activeQuiz.castleSmell.rafId=requestAnimationFrame(castleSmellFrame);document.getElementById('castleSmellStartButton')?.addEventListener('click',()=>{const st=activeQuiz?.castleSmell;if(!st||st.started)return;unlockSfxForMobile();st.started=true;st.locked=false;document.getElementById('castleSmellIntro')?.classList.add('hidden');setCastleSmellControlsEnabled(true);runCastleSmellRoundAttempt();},{once:true});}
async function finishCastleSmellSearch(){const s=activeQuiz?.castleSmell;if(!s||!s.running)return;s.running=false;s.attemptToken+=1;clearCastleSmellRows(true);await wait(240);cleanupCastleSmellGame();setCastleStandardBattlePoseVisual();}

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
  cleanupCastleSmellGame();
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
  cleanupCastleSmellGame();
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
