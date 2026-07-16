
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
const STORAGE_ADMIN_MODE = 'sinnesmagie-admin-mode';
const STORAGE_ADMIN_LEVELS_UNLOCKED = 'sinnesmagie-admin-levels-unlocked';
const STORAGE_AREA_INTROS_SEEN = 'sinnesmagie-area-intros-seen';

const AREA_INTRO_CONTENT = {
  farbenreich: {
    title: 'Willkommen im Farbenreich',
    html: '<div class="area-intro-popup"><div class="area-intro-icon">🎨👀</div><p>Im Farbenreich leuchten Formen, Muster und Farben an jeder Ecke. Der Sehsinn hilft uns, Unterschiede zu erkennen, uns zu orientieren und Gefahren oder wichtige Zeichen rechtzeitig wahrzunehmen.</p></div>'
  },
  klangwald: {
    title: 'Willkommen im Klangwald',
    html: '<div class="area-intro-popup"><div class="area-intro-icon">🌲🎵</div><p>Im Klangwald rascheln Blätter, Vögel singen und jedes Geräusch erzählt eine Geschichte. Mit unserem Gehör finden wir uns zurecht, hören Warnungen und erleben Sprache und Musik.</p></div>'
  },
  tastminen: {
    title: 'Willkommen in den Tastminen',
    html: '<div class="area-intro-popup"><div class="area-intro-icon">⛏️✋</div><p>In den Tastminen liegen raue Steine, glattes Metall und weiche Materialien verborgen. Der Tastsinn zeigt uns, wie sich Dinge anfühlen, und warnt uns vor Hitze, Kälte oder Schmerz.</p></div>'
  },
  duftgarten: {
    title: 'Willkommen im Duftgarten',
    html: '<div class="area-intro-popup"><div class="area-intro-icon">🌸👃</div><p>Im Duftgarten mischen sich der Geruch von Blumen, Kräutern und geheimnisvollen Wolken. Die Nase weckt Erinnerungen und Gefühle und kann uns zugleich vor Rauch oder verdorbenem Essen warnen.</p></div>'
  },
  flammenkueche: {
    title: 'Willkommen in der Flammenküche',
    html: '<div class="area-intro-popup"><div class="area-intro-icon">🔥👅</div><p>In der Flammenküche treffen süße, saure, salzige und bittere Geschmäcker aufeinander. Der Geschmack macht Essen zum Erlebnis und hilft uns dabei, Nahrung zu prüfen und Ungenießbares zu erkennen.</p></div>'
  },
  zauberschloss: {
    title: 'Willkommen im Zauberschloss',
    html: '<div class="area-intro-popup"><div class="area-intro-icon">🏰✨</div><p>Im Zauberschloss hält der Magier die Sinnesmagie gefangen. Hier werden alle fünf Sinne gebraucht, denn nur wer aufmerksam sieht, hört, riecht, schmeckt und fühlt, kann seine Prüfungen bestehen.</p></div>'
  }
};

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
const CASTLE_TASTE_DROP_MIN_MS = 1800;
const CASTLE_TASTE_DROP_MAX_MS = 2200;
const CASTLE_GOOD_FOODS = ['🍎'];
const CASTLE_FINAL_QUESTION_INDEX = 3;
const CASTLE_CLONE_ROUNDS_TOTAL = 2;
const CASTLE_CLONE_COUNT = 16;
const CASTLE_BUSH_TARGET_HITS = 3;
const CASTLE_BUSH_REVEAL_MS = 2000;
const CASTLE_BUSH_DELAY_MIN_MS = 750;
const CASTLE_BUSH_DELAY_MAX_MS = 1450;
const CASTLE_BUSH_INTRO_FLIGHT_MS = 2900;
const CASTLE_SMELL_ROUNDS_TOTAL = 2;
const CASTLE_SMELL_CLOUD_COUNT = 6;
const CASTLE_SMELL_FLIGHT_MS = 2200;
const CASTLE_SMELL_ROW_GAP_MS = 2400;
const CASTLE_SMELL_FALL_SPEED = 22.75;
const CASTLE_SMELL_SPAWN_Y = 12;
const CASTLE_SMELL_IMPACT_Y = 80;
const CASTLE_HEARING_ROUNDS_TOTAL = 2;
const CASTLE_HEARING_KEY_COUNT = 5;
const CASTLE_HEARING_KEY_FLIGHT_MS = 2450;
const CASTLE_HEARING_MAGE_RETURN_MS = 900;
const CASTLE_HEARING_PREVIEW_NOTE_MS = 700;
const CASTLE_HEARING_PREVIEW_GAP_MS = 180;
const CASTLE_HEARING_JUMP_MS = 620;
const CASTLE_HEARING_RETURN_JUMP_MS = 520;
const CASTLE_HEARING_SEQUENCE_LENGTH = 4;
const CASTLE_HEARING_NOTES = [
  { name: 'C', file: '../assets/audio/hoersinn_C3.mp3' },
  { name: 'D', file: '../assets/audio/hoersinn_D3.mp3' },
  { name: 'E', file: '../assets/audio/hoersinn_E3.mp3' },
  { name: 'F', file: '../assets/audio/hoersinn_F3.mp3' },
  { name: 'G', file: '../assets/audio/hoersinn_G3.mp3' }
];

const CASTLE_ULTIMATE_DURATION_MS = 60000;
const CASTLE_ULTIMATE_QUESTION_COUNT = 8;
const CASTLE_ULTIMATE_WRONG_PENALTY_MS = 2000;
const CASTLE_ULTIMATE_STATEMENTS = [
  { topic: 'Sehen', statement: 'Mit den Augen erkennen wir Farben, Formen und Bewegungen.', answer: true },
  { topic: 'Sehen', statement: 'Sehr laute Geräusche werden mit den Augen wahrgenommen.', answer: false },
  { topic: 'Hören', statement: 'Richtungshören hilft dabei zu erkennen, woher ein Geräusch kommt.', answer: true },
  { topic: 'Hören', statement: 'Je näher man an sehr laute Lautsprecher geht, desto besser schützt man die Ohren.', answer: false },
  { topic: 'Tasten', statement: 'Die Haut ist das Sinnesorgan des Tastsinns.', answer: true },
  { topic: 'Tasten', statement: 'Mit dicken Handschuhen fühlt man Oberflächen meistens genauer.', answer: false },
  { topic: 'Riechen', statement: 'Die Nase kann vor Rauch oder verdorbenen Lebensmitteln warnen.', answer: true },
  { topic: 'Riechen', statement: 'Olfaktorische Wahrnehmung ist das Fachwort für das Sehen.', answer: false },
  { topic: 'Schmecken', statement: 'Süß, sauer, salzig und bitter sind Geschmacksrichtungen.', answer: true },
  { topic: 'Schmecken', statement: 'Der Geruch eines Lebensmittels hat keinen Einfluss darauf, wie es schmeckt.', answer: false },
  { topic: 'Alle Sinne', statement: 'Mehrere Sinne arbeiten im Alltag häufig zusammen.', answer: true },
  { topic: 'Alle Sinne', statement: 'Jeder Sinn arbeitet immer vollständig allein.', answer: false }
];

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

function castleDefeatedMageAsset() {
  return '../assets/images/castle-combat/mage_defeated.png';
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
  klangwald: [
    ['Mit welchem Sinnesorgan hören wir?', ['Mit dem Ohr', 'Mit dem Auge', 'Mit der Nase', 'Mit der Haut'], 0]
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
  const card = panel.querySelector('.castle-sense-question-card');
  card?.classList.remove('slide-out-left');
  card?.classList.add('slide-in-right');
  setTimeout(() => card?.classList.remove('slide-in-right'), QUIZ_TRANSITION_MS + 80);

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

        if (item.correct) activeQuiz.scorePoints = Math.min(5000, (activeQuiz.scorePoints || 0) + 250);
        else activeQuiz.scorePoints = Math.max(0, (activeQuiz.scorePoints || 0) - 50);
        window.SinnesScore?.setSession('boss_zauberschloss_final', activeQuiz.scorePoints, 5000);
        feedback.textContent = item.correct
          ? 'Richtig – der Angriff kann beginnen!'
          : 'Falsch – du musst die Aufgabe erneut erspielen.';
        feedback.classList.remove('hidden');
        playSfx(item.correct ? sfxCorrect : sfxWrong);
        await wait(item.correct ? 650 : 950);
        card?.classList.remove('slide-in-right');
        card?.classList.add('slide-out-left');
        await wait(QUIZ_TRANSITION_MS);
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
  if (zone) zone.classList.remove('castle-boss-mode', 'castle-dodge-mode', 'castle-final-question-mode', 'castle-final-hit-mode', 'castle-stand-off-mode', 'castle-clone-mode', 'castle-bush-mode', 'castle-smell-mode', 'castle-hearing-mode', 'castle-ultimate-mode', 'castle-victory-result-mode');
  if (knight) {
    knight.classList.remove('castle-runner', 'castle-knight-evade', 'castle-knight-hit', 'castle-final-jump', 'castle-walking', 'castle-smell-knight-damage', 'castle-smell-final-jump', 'castle-hearing-knight-damage', 'castle-hearing-final-jump', 'castle-hearing-respawn', 'castle-ultimate-knight-glow', 'castle-ultimate-knight-hit');
    knight.style.transform = '';
  }
  if (enemy) {
    enemy.classList.remove('castle-boss-dodge', 'castle-boss-smirk', 'castle-flight-left', 'castle-flight-right', 'castle-hover-drop', 'castle-hovering', 'castle-flyer', 'castle-pass-left', 'castle-pass-right', 'castle-final-damage-blink', 'castle-clone-hidden', 'castle-clone-mage-enter', 'castle-phase-hidden', 'castle-smell-hidden', 'castle-hearing-hidden', 'castle-hearing-casting', 'castle-ultimate-casting', 'castle-ultimate-defeated');
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
  if (state.dropTimer) clearTimeout(state.dropTimer);
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
    ['--smell-player-x','--smell-mage-x','--smell-mage-top','--hearing-knight-x','--hearing-knight-bottom','--hearing-mage-x','--hearing-mage-top','--ultimate-knight-x','--ultimate-knight-bottom','--ultimate-mage-x','--ultimate-mage-top'].forEach(name => zone.style.removeProperty(name));
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

function cleanupCastleHearingGame() {
  hideCastleSenseQuestionPanel();
  cancelCastleHearingAudioGate();
  document.getElementById('castleHearingAudioGate')?.remove();
  castleHearingActiveToneCount = 0;
  try { if (bossMusicWanted) bossMusic.volume = bossVolumeForMode(); } catch {}
  (castleHearingHtmlPlayers || []).forEach(audio => {
    try { audio.pause(); audio.currentTime = 0; } catch {}
  });
  const state = activeQuiz?.castleHearing;
  if (state) {
    state.running = false;
    state.attemptToken = (state.attemptToken || 0) + 1;
    (state.timers || []).forEach(timer => clearTimeout(timer));
  }
  if (activeQuiz) activeQuiz.castleHearing = null;

  const layer = document.getElementById('castleHearingLayer');
  if (layer) {
    layer.classList.add('hidden');
    layer.innerHTML = '';
  }
  const panel = document.getElementById('castleHearingPanel');
  if (panel) {
    panel.classList.add('hidden');
    panel.innerHTML = '';
  }
  const zone = document.getElementById('quizBattleZone');
  if (zone) {
    zone.classList.remove('castle-hearing-mode');
    [
      '--hearing-knight-x', '--hearing-knight-bottom',
      '--hearing-mage-x', '--hearing-mage-top'
    ].forEach(name => zone.style.removeProperty(name));
  }
  const knight = document.getElementById('quizKnight');
  if (knight) {
    knight.classList.remove(
      'castle-hearing-knight-damage',
      'castle-hearing-final-jump',
      'castle-hearing-respawn',
      'castle-hearing-falling'
    );
    ['left','right','top','bottom','transform','transition','opacity','visibility'].forEach(prop => knight.style.removeProperty(prop));
  }
  const enemy = document.getElementById('quizEnemy');
  if (enemy) {
    enemy.classList.remove('castle-hearing-hidden','castle-hearing-casting','castle-phase-hidden','castle-final-damage-blink');
    ['left','right','top','bottom','transform','transition','opacity','visibility'].forEach(prop => enemy.style.removeProperty(prop));
  }
  hideCastleSpeech();
}


function cleanupCastleUltimateGame({ keepFinalMusic = false } = {}) {
  const state = activeQuiz?.castleUltimate;
  if (state) {
    state.running = false;
    state.finished = true;
    if (state.rafId) cancelAnimationFrame(state.rafId);
    (state.timers || []).forEach(timer => clearTimeout(timer));
  }
  if (activeQuiz) activeQuiz.castleUltimate = null;

  const layer = document.getElementById('castleUltimateLayer');
  if (layer) {
    layer.classList.add('hidden');
    layer.innerHTML = '';
    ['--ultimate-orb-scale','--ultimate-orb-progress','--ultimate-glow-a','--ultimate-glow-b','--ultimate-saturation','--ultimate-brightness']
      .forEach(name => layer.style.removeProperty(name));
  }
  const panel = document.getElementById('castleUltimatePanel');
  if (panel) {
    panel.classList.add('hidden');
    panel.innerHTML = '';
  }
  const zone = document.getElementById('quizBattleZone');
  if (zone) {
    zone.classList.remove('castle-ultimate-mode', 'castle-victory-result-mode');
    ['--ultimate-knight-x', '--ultimate-knight-bottom', '--ultimate-mage-x', '--ultimate-mage-top']
      .forEach(name => zone.style.removeProperty(name));
  }
  const knight = document.getElementById('quizKnight');
  if (knight) {
    knight.classList.remove('castle-ultimate-knight-glow', 'castle-ultimate-knight-hit');
    ['left','right','top','bottom','transform','transition','opacity','visibility','filter']
      .forEach(prop => knight.style.removeProperty(prop));
  }
  const enemy = document.getElementById('quizEnemy');
  if (enemy) {
    enemy.classList.remove('castle-ultimate-casting', 'castle-ultimate-defeated', 'castle-final-damage-blink', 'castle-phase-hidden');
    ['left','right','top','bottom','transform','transition','opacity','visibility','filter']
      .forEach(prop => enemy.style.removeProperty(prop));
  }
  if (!keepFinalMusic) pauseCastleUltimateMusic();
}

function setCastleStandardBattlePoseVisual() {
  const zone = document.getElementById('quizBattleZone');
  const knight = document.getElementById('quizKnight');
  const enemy = document.getElementById('quizEnemy');
  if (!zone || !knight || !enemy) return;
  zone.classList.remove('castle-boss-mode','castle-dodge-mode','castle-final-question-mode','castle-final-hit-mode','castle-clone-mode','castle-bush-mode','castle-smell-mode','castle-hearing-mode','castle-ultimate-mode','castle-victory-result-mode');
  zone.classList.add('castle-stand-off-mode');
  knight.className = 'battle-sprite knight-battle';
  enemy.className = 'battle-sprite enemy-battle';
  knight.src = castleKnightAsset('normal');
  enemy.src = castleEnemyAsset('laugh');
  ['left','right','top','bottom','transform','transition','opacity','animation-play-state'].forEach(prop => {
    knight.style.removeProperty(prop); enemy.style.removeProperty(prop);
  });
  ['--castle-player-left','--castle-mage-left','--castle-clone-mage-left','--castle-clone-mage-top','--bush-knight-x','--bush-knight-bottom','--bush-mage-x','--bush-mage-bottom','--smell-player-x','--smell-mage-x','--smell-mage-top','--hearing-knight-x','--hearing-knight-bottom','--hearing-mage-x','--hearing-mage-top','--ultimate-knight-x','--ultimate-knight-bottom','--ultimate-mage-x','--ultimate-mage-top'].forEach(name => zone.style.removeProperty(name));
  hideCastleSpeech();
}

async function animateCastleActorsToStandardPose(duration = 720) {
  const zone = document.getElementById('quizBattleZone');
  const knight = document.getElementById('quizKnight');
  const enemy = document.getElementById('quizEnemy');
  if (!zone || !knight || !enemy) {
    setCastleStandardBattlePoseVisual();
    return;
  }

  const knightStart = knight.getBoundingClientRect();
  const enemyStart = enemy.getBoundingClientRect();
  setCastleStandardBattlePoseVisual();
  const knightEnd = knight.getBoundingClientRect();
  const enemyEnd = enemy.getBoundingClientRect();

  const setup = (element, start, end) => {
    const dx = start.left - end.left;
    const dy = start.top - end.top;
    const sx = end.width ? start.width / end.width : 1;
    const sy = end.height ? start.height / end.height : 1;
    element.style.setProperty('transition', 'none', 'important');
    element.style.setProperty('transform-origin', 'center bottom', 'important');
    element.style.setProperty('transform', `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, 'important');
  };
  setup(knight, knightStart, knightEnd);
  setup(enemy, enemyStart, enemyEnd);
  void zone.offsetWidth;
  [knight, enemy].forEach(element => {
    element.style.setProperty('transition', `transform ${duration}ms cubic-bezier(.22,.78,.28,1), opacity ${duration}ms ease`, 'important');
    element.style.setProperty('transform', 'translate(0, 0) scale(1)', 'important');
    element.style.setProperty('opacity', '1', 'important');
  });
  await wait(duration + 40);
  [knight, enemy].forEach(element => {
    element.style.removeProperty('transition');
    element.style.removeProperty('transform');
    element.style.removeProperty('transform-origin');
    element.style.removeProperty('opacity');
  });
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
  cleanupCastleHearingGame();
  cleanupCastleUltimateGame();
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

function getCastleStrikeRisePx(knight, enemy) {
  if (!knight || !enemy) return 150;
  const knightRect = knight.getBoundingClientRect();
  const enemyRect = enemy.getBoundingClientRect();
  const knightCenterY = knightRect.top + knightRect.height / 2;
  const enemyCenterY = enemyRect.top + enemyRect.height / 2;
  return Math.max(72, knightCenterY - enemyCenterY);
}

function getCastleElementBottomPx(element, zone) {
  if (!element || !zone) return 0;
  const elementRect = element.getBoundingClientRect();
  const zoneRect = zone.getBoundingClientRect();
  return Math.max(0, zoneRect.bottom - elementRect.bottom);
}

async function animateCastleEnemyStrike({
  knight,
  enemy,
  duration = 1150,
  impactFraction = 0.5,
  enemyHitSrc = null,
  impactClass = 'castle-final-damage-blink'
} = {}) {
  const zone = document.getElementById('quizBattleZone');
  if (!knight || !enemy || !zone) return;

  const originalBottom = knight.style.getPropertyValue('bottom');
  const originalBottomPriority = knight.style.getPropertyPriority('bottom');
  const originalAnimationPlayState = enemy.style.getPropertyValue('animation-play-state');
  const originalAnimationPlayStatePriority = enemy.style.getPropertyPriority('animation-play-state');

  // Freeze the floating mage while the target height is measured. The hit then
  // occurs exactly when the knight reaches the mage's vertical centre.
  enemy.style.setProperty('animation-play-state', 'paused', 'important');
  const startBottomPx = getCastleElementBottomPx(knight, zone);
  const risePx = getCastleStrikeRisePx(knight, enemy);
  const startTime = performance.now();
  let impactTriggered = false;
  playSfx(sfxMageHit);

  await new Promise(resolve => {
    function frame(now) {
      const progress = Math.min(1, (now - startTime) / duration);
      const heightFactor = Math.sin(Math.PI * progress);
      const bottomPx = startBottomPx + risePx * heightFactor;
      knight.style.setProperty('bottom', `${bottomPx}px`, 'important');

      if (!impactTriggered && progress >= impactFraction) {
        impactTriggered = true;
        if (originalAnimationPlayState) {
          enemy.style.setProperty('animation-play-state', originalAnimationPlayState, originalAnimationPlayStatePriority || '');
        } else {
          enemy.style.removeProperty('animation-play-state');
        }
        if (enemyHitSrc) enemy.src = enemyHitSrc;
        enemy.classList.add(impactClass);
      }

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        resolve();
      }
    }
    requestAnimationFrame(frame);
  });

  if (originalBottom) {
    knight.style.setProperty('bottom', originalBottom, originalBottomPriority || '');
  } else {
    knight.style.removeProperty('bottom');
  }
  if (originalAnimationPlayState) {
    enemy.style.setProperty('animation-play-state', originalAnimationPlayState, originalAnimationPlayStatePriority || '');
  } else {
    enemy.style.removeProperty('animation-play-state');
  }
}

async function pauseCastleBeforeNextPhase(speechHtml, direction = 'left', delayMs = 5000) {
  await animateCastleActorsToStandardPose();
  if (speechHtml) showCastleSpeech(speechHtml);
  await wait(delayMs);
  hideCastleSpeech();
  await flyCastleMageOutBeforePhase(direction);
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
let adminPopupLevelIndex = null;
let currentNode = 'start';

const sfxCorrect = new Audio('../assets/audio/correct.mp3');
const sfxWrong = new Audio('../assets/audio/falsch_3.mp3');
const sfxClick = new Audio('../assets/audio/slice_cut.mp3');
const sfxMageHit = new Audio('../assets/audio/magehit.mp3');
const castleWinMusic = new Audio('../assets/audio/winfin.mp3');
castleWinMusic.preload = 'auto';
castleWinMusic.loop = false;

const bossMusic = new Audio('../assets/audio/bossencounter.mp3');
const BOSS_MUSIC_LOOP_START_SECONDS = 15;
const BOSS_MUSIC_LOOP_END_SECONDS = 112;
bossMusic.loop = false;
let bossMusicWanted = false;
let bossMusicMode = 'full';

function restartBossMusicBeforeFadeOut() {
  if (!bossMusicWanted || castleUltimateMusicWanted) return;
  try {
    bossMusic.currentTime = BOSS_MUSIC_LOOP_START_SECONDS;
    bossMusic.volume = bossVolumeForMode();
    bossMusic.play().catch(() => {});
  } catch {}
}

bossMusic.addEventListener('timeupdate', () => {
  if (bossMusicWanted && !castleUltimateMusicWanted && bossMusic.currentTime >= BOSS_MUSIC_LOOP_END_SECONDS) {
    restartBossMusicBeforeFadeOut();
  }
});
bossMusic.addEventListener('ended', restartBossMusicBeforeFadeOut);

const castleUltimateMusic = new Audio('../assets/audio/castle_finale_itsover.mp3');
castleUltimateMusic.preload = 'auto';
castleUltimateMusic.loop = false;
let castleUltimateMusicWanted = false;

function pauseCastleUltimateMusic() {
  castleUltimateMusicWanted = false;
  try {
    castleUltimateMusic.pause();
    castleUltimateMusic.currentTime = 0;
  } catch {}
}

async function crossfadeBossToCastleUltimateMusic(duration = 2600) {
  const targetVolume = currentVolume();
  const bossStartVolume = Number.isFinite(bossMusic.volume) ? bossMusic.volume : targetVolume;
  castleUltimateMusicWanted = true;
  let finaleStarted = false;
  try {
    castleUltimateMusic.pause();
    castleUltimateMusic.currentTime = 0;
    castleUltimateMusic.volume = 0;
    await castleUltimateMusic.play();
    finaleStarted = true;
  } catch {
    castleUltimateMusicWanted = false;
  }
  if (!finaleStarted) {
    try { bossMusic.volume = targetVolume; } catch {}
    return false;
  }

  const start = performance.now();
  await new Promise(resolve => {
    function frame(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = progress * progress * (3 - 2 * progress);
      try { bossMusic.volume = bossStartVolume * (1 - eased); } catch {}
      if (castleUltimateMusicWanted) {
        try { castleUltimateMusic.volume = targetVolume * eased; } catch {}
      }
      if (progress < 1) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });
  bossMusicWanted = false;
  try { bossMusic.pause(); } catch {}
  if (castleUltimateMusicWanted) {
    try { castleUltimateMusic.volume = targetVolume; } catch {}
  }
  return true;
}

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
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const buffer = context.createBuffer(1, 1, 22050);
    const source = context.createBufferSource();
    const gain = context.createGain();
    gain.gain.value = 0;
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(context.destination);
    source.start(0);
    if (context.state === 'suspended') context.resume().catch(() => {});
    window.setTimeout(() => context.close().catch(() => {}), 120);
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
  const area = progress[currentArea] || {};
  const result = {};
  const maxLevels = Math.max(4, levelMarkers.length);
  for (let i = 1; i <= maxLevels; i++) result[`level${i}Completed`] = !!area[`level${i}Completed`];
  result.finaleCompleted = !!area.finaleCompleted;
  return result;
}

function setAreaProgress(patch) {
  const progress = readProgress();
  const area = progress[currentArea] || {};
  const next = {};
  const maxLevels = Math.max(4, levelMarkers.length);
  for (let i = 1; i <= maxLevels; i++) next[`level${i}Completed`] = !!area[`level${i}Completed`];
  progress[currentArea] = { ...area, ...next, ...patch };
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

function pauseCastleWinMusic() {
  try {
    castleWinMusic.pause();
    castleWinMusic.currentTime = 0;
  } catch {}
}

function playCastleWinMusic() {
  pauseBossMusic();
  pauseCastleUltimateMusic();
  try {
    castleWinMusic.pause();
    castleWinMusic.currentTime = 0;
    castleWinMusic.volume = currentVolume();
    castleWinMusic.play().catch(() => {});
  } catch {}
}

function startLevelMusic() {
  pauseBossMusic();
  pauseCastleUltimateMusic();
  pauseCastleWinMusic();
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


function stabilizeCastleUltimateBossMusic() {
  const state = activeQuiz?.castleUltimate;
  if (!state?.running || castleUltimateMusicWanted || state.completing) return;
  if (state.finished && !state.failureCinematic) return;
  bossMusicWanted = true;
  bossMusicMode = 'full';
  try {
    bossMusic.loop = false;
    if (bossMusic.currentTime >= BOSS_MUSIC_LOOP_END_SECONDS) bossMusic.currentTime = BOSS_MUSIC_LOOP_START_SECONDS;
    bossMusic.volume = currentVolume();
    if (bossMusic.paused) bossMusic.play().catch(() => {});
  } catch {}
}

function scheduleCastleUltimateMusicRestore() {
  [80, 420, 900].forEach(delay => {
    const timer = setTimeout(stabilizeCastleUltimateBossMusic, delay);
    activeQuiz?.castleUltimate?.timers?.push(timer);
  });
}

function startBossMusic(mode = 'full') {
  pauseCastleUltimateMusic();
  bossMusicWanted = true;
  bossMusicMode = mode === 'question' ? 'question' : 'full';
  try {
    bossMusic.loop = false;
    if (bossMusic.currentTime >= BOSS_MUSIC_LOOP_END_SECONDS) bossMusic.currentTime = BOSS_MUSIC_LOOP_START_SECONDS;
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

function isAdminMode() {
  return sessionStorage.getItem(STORAGE_ADMIN_MODE) === '1';
}

function areAdminLevelsUnlocked() {
  return isAdminMode() && localStorage.getItem(STORAGE_ADMIN_LEVELS_UNLOCKED) === '1';
}

function ensureAdminCompleteButton() {
  if (!levelPopupClose) return null;
  let button = document.getElementById('adminAutoCompleteLevel');
  if (!button) {
    button = document.createElement('button');
    button.id = 'adminAutoCompleteLevel';
    button.type = 'button';
    button.className = 'ghost-button admin-auto-complete-level';
    button.textContent = 'Level automatisch abschließen';
    levelPopupClose.insertAdjacentElement('afterend', button);
  }
  return button;
}

function updateAdminCompleteButton() {
  const button = ensureAdminCompleteButton();
  if (!button) return;
  const visible = isAdminMode() && Number.isInteger(adminPopupLevelIndex);
  button.classList.toggle('hidden', !visible);
}

function adminCompleteSelectedLevel() {
  if (!isAdminMode() || !Number.isInteger(adminPopupLevelIndex)) return;
  const index = adminPopupLevelIndex;
  adminPopupLevelIndex = null;

  if (index === 0) {
    setAreaProgress({ level1Completed: true });
    saveCurrentNode('level1');
  } else if (index === 1) {
    setAreaProgress({ level1Completed: true, level2Completed: true });
    saveCurrentNode('level2');
    if (currentArea !== 'zauberschloss') {
      const fragmentStatus = awardFragment(currentArea);
      writePendingNotice({ type: 'fragment', area: currentArea, gained: fragmentStatus.gained, allCollected: fragmentStatus.allCollected });
    } else {
      writePendingNotice({ type: 'castleBossComplete', area: 'zauberschloss' });
    }
  } else if (index === 2 && currentArea === 'zauberschloss') {
    setAreaProgress({ level1Completed: true, level2Completed: true, level3Completed: true, level4Completed: true, finaleCompleted: true });
    saveCurrentNode('level3');
  }

  applyMarkerStates();
  popupCloseHandler = null;
  closeLevelPopup();
  showLevelPopup(
    'Admin-Abschluss gespeichert',
    'Dieses Level wurde für Testzwecke als abgeschlossen markiert. Es wurden keine zusätzlichen Punkte vergeben.',
    'Weiter'
  );
}

function showLevelPopup(title, text, buttonLabel = 'Weiter', onClose = null) {
  if (!levelPopup || !levelPopupTitle || !levelPopupText || !levelPopupClose) return;
  levelPopupTitle.textContent = title || 'Level';
  if (text && /<[a-z][\s\S]*>/i.test(text)) levelPopupText.innerHTML = text;
  else levelPopupText.textContent = text || 'Inhalt folgt später.';
  levelPopupClose.textContent = buttonLabel || 'Weiter';
  popupCloseHandler = onClose;
  levelPopup.classList.remove('hidden');
  updateAdminCompleteButton();
}

function closeLevelPopup() {
  if (!levelPopup) return;
  levelPopup.classList.add('hidden');
  const handler = popupCloseHandler;
  popupCloseHandler = null;
  adminPopupLevelIndex = null;
  updateAdminCompleteButton();

  // Popups mit eigener Folgeaktion (Seitenwechsel, Minispiel oder Bosskampf)
  // steuern die Musik selbst. Dadurch wird die Gebietsmusik nicht versehentlich
  // nach dem Start einer anderen Hintergrundmusik erneut eingeblendet.
  if (typeof handler === 'function') {
    handler();
    return;
  }
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
  if (currentArea === 'zauberschloss' && levelMarkers.length === 3) {
    if (progress.finaleCompleted || progress.level4Completed) return 'level3';
    if (progress.level2Completed) return 'level2';
    if (progress.level1Completed) return 'level1';
    return 'start';
  }
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
    let completed;
    let locked;
    if (currentArea === 'zauberschloss' && levelMarkers.length === 3 && index === 2) {
      completed = !!(progress.finaleCompleted || progress.level4Completed);
      locked = !progress.level2Completed;
    } else {
      const levelKey = `level${index + 1}Completed`;
      const previousKey = `level${index}Completed`;
      completed = !!progress[levelKey];
      locked = index > 0 && !progress[previousKey];
    }
    if (areAdminLevelsUnlocked()) locked = false;
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

  const minigameUrl = levelMarkers[0].dataset.minigameUrl;
  if (minigameUrl) {
    showLevelPopup(
      levelMarkers[0].dataset.title || 'Minispiel',
      `<div class="visual-notice"><div class="visual-notice-icon">🔁🎮</div><p>Dieses Minispiel hast du bereits geschafft.</p><p>Du kannst es jederzeit noch einmal spielen.</p></div>`,
      'Minispiel erneut spielen',
      () => {
        pauseLevelMusic();
        window.location.href = minigameUrl;
      }
    );
    return;
  }

  showLevelPopup(
    levelMarkers[0].dataset.title || 'Minispiel',
    'Dieses Level hast du bereits geschafft und kannst es erneut öffnen.',
    'Erneut spielen'
  );
}

async function handleLevelTwo() {
  const progress = getAreaProgress();
  if (!progress.level1Completed && !areAdminLevelsUnlocked()) {
    showLevelPopup('Noch gesperrt', 'Du musst zuerst das erste Level mit dem Minispiel abschließen, bevor du das Quiz betreten kannst.');
    return;
  }

  await moveToNode('level2');
  if (isAdminMode()) {
    showLevelPopup(
      levelMarkers[1]?.dataset.title || 'Quiz / Bossbegegnung',
      `<div class="visual-notice"><div class="visual-notice-icon">⚔️</div><p>${levelMarkers[1]?.dataset.text || 'Starte das Quiz und stelle dich der Bossbegegnung.'}</p></div>`,
      progress.level2Completed ? 'Boss erneut spielen' : 'Boss starten',
      () => { pauseLevelMusic(); openQuizIntro(levelMarkers[1].dataset.quizId || currentArea); }
    );
    return;
  }
  await openQuizIntro(levelMarkers[1].dataset.quizId || currentArea);
}

async function handleLevelThree() {
  const progress = getAreaProgress();
  if (!progress.level2Completed && !areAdminLevelsUnlocked()) {
    showLevelPopup('Noch gesperrt', 'Du musst zuerst die Bossbegegnung schaffen, bevor du das Schlosstor betreten kannst.');
    return;
  }
  await moveToNode('level3');
  saveCurrentNode('level3');
  const alreadyDone = !!(progress.finaleCompleted || progress.level4Completed);
  showLevelPopup(
    levelMarkers[2]?.dataset.title || 'Finale im Schloss',
    `<div class="visual-notice"><div class="visual-notice-icon">🏰💥</div><p>${levelMarkers[2]?.dataset.text || 'Betritt den Thronsaal, zerschlage die Glaskugel und befreie die Magie der Sinne.'}</p></div>`,
    alreadyDone ? 'Finale erneut spielen' : 'Finale starten',
    () => {
      pauseLevelMusic();
      window.location.href = 'zauberschloss-finale.html';
    }
  );
}

async function moveLevelKnightTo(marker, index) {
  const adminUnlocked = areAdminLevelsUnlocked();
  if (!adminUnlocked && (marker.disabled || marker.classList.contains('movement-disabled'))) return;
  adminPopupLevelIndex = isAdminMode() ? index : null;
  if (index === 0) await handleLevelOne();
  else if (index === 1) await handleLevelTwo();
  else if (index === 2) await handleLevelThree();
}

levelMarkers.forEach((marker, index) => {
  marker.addEventListener('click', () => moveLevelKnightTo(marker, index));
});

if (levelPopupClose) {
  levelPopupClose.addEventListener('click', closeLevelPopup);
}

ensureAdminCompleteButton()?.addEventListener('click', adminCompleteSelectedLevel);
updateAdminCompleteButton();

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
  return `../assets/images/battle-backgrounds/${quizId}.webp`;
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


const gameOverAudio = new Audio('../assets/audio/gameover.mp3');
gameOverAudio.preload = 'auto';
function playGameOverSound(){ try { gameOverAudio.currentTime=0; gameOverAudio.volume=Number(localStorage.getItem('masterVolume')||localStorage.getItem('sinnesmagie-volume')||0.5); gameOverAudio.play().catch(()=>{}); } catch{} }

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
        <div id="castleHearingLayer" class="castle-hearing-layer hidden"></div>
        <div id="castleUltimateLayer" class="castle-ultimate-layer hidden"></div>
        <div id="castleProjectileLayer" class="castle-projectile-layer hidden"></div>
        <div id="castleBeam" class="castle-beam hidden"></div>
        <div id="castleSpeech" class="castle-speech hidden"></div>
        <span id="battleFeedback" class="battle-feedback hidden"></span>
      </div>
      <div id="castleVictoryScene" class="castle-victory-scene hidden" aria-hidden="true">
        <img id="castleVictoryKnight" class="castle-victory-character castle-victory-knight" alt="Siegreicher Ritter" draggable="false">
        <img id="castleVictoryMage" class="castle-victory-character castle-victory-mage" alt="Besiegter Zauberer" draggable="false">
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
      <div id="castleHearingPanel" class="quiz-panel castle-hearing-panel hidden"></div>
      <div id="castleUltimatePanel" class="quiz-panel castle-ultimate-panel hidden"></div>
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
  const restartBtn = modal.querySelector('#castleRestartButton'); if (restartBtn) { restartBtn.classList.add('hidden'); restartBtn.onclick = null; }
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
  hideCastleVictoryScene();
  modal.querySelector('#castleDodgePanel').classList.add('hidden');
  modal.querySelector('#castleSmellPanel')?.classList.add('hidden');
  modal.querySelector('#castleHearingPanel')?.classList.add('hidden');
  modal.querySelector('#castleUltimatePanel')?.classList.add('hidden');
  modal.querySelector('#castleFinalQuestionPanel')?.classList.add('hidden');
  modal.querySelector('#castleClonePanel')?.classList.add('hidden');
  hideCastleSenseQuestionPanel();
  resetCastleBattleClasses();
  clearCastleProjectiles();
  cleanupCastleBushGame();
  cleanupCastleSmellGame();
  cleanupCastleHearingGame();
  setQuizScene(modal, data, quizId);
  const intro = modal.querySelector('#quizIntro');
  intro.className = 'quiz-intro quiz-panel';
  const introText = isCastleBossQuiz(quizId)
    ? 'Beantworte drei Fragen. Selbst richtige Treffer bringen den Zauberer nur kurz aus dem Gleichgewicht.'
    : 'Beantworte die Fragen. Richtig: Ritter greift an. Falsch: Du verlierst eines deiner zwei Herzen.';
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
  cleanupCastleHearingGame();
  cleanupCastleUltimateGame();
  activeQuiz = {
    quizId,
    data,
    questions,
    index: 0,
    hearts: isCastleBossQuiz(quizId) ? 3 : 2,
    correct: 0,
    answered: false,
    seconds: QUIZ_SECONDS,
    finished: false,
    transitioning: false,
    castleDodge: null,
    castleClone: null,
    castleBush: null,
    castleSmell: null,
    castleHearing: null,
    castleUltimate: null,
    castleUltimateFailed: false,
    senseQuestionPools: {},
    scorePoints: 0
  };
  window.SinnesScore?.startSession(isCastleBossQuiz(quizId) ? 'boss_zauberschloss_final' : `quiz_${quizId}`, isCastleBossQuiz(quizId) ? 5000 : 1000, 0);
  window.SinnesScore?.setGameplayActive(true);
  const modal = ensureQuizModal();
  setQuizScene(modal, data, quizId);
  modal.querySelector('#quizIntro').classList.add('hidden');
  modal.querySelector('#quizResult').classList.add('hidden');
  hideCastleVictoryScene();
  modal.querySelector('#castleDodgePanel').classList.add('hidden');
  modal.querySelector('#castleSmellPanel')?.classList.add('hidden');
  modal.querySelector('#castleHearingPanel')?.classList.add('hidden');
  modal.querySelector('#castleUltimatePanel')?.classList.add('hidden');
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
  for (let i = 0; i < (isCastleBossQuiz() ? 3 : 2); i++) {
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

async function answerQuestion(idx) {
  if (!activeQuiz || activeQuiz.answered || activeQuiz.finished || activeQuiz.transitioning) return;
  if (isCastleBossQuiz()) {
    await answerCastleQuestion(idx);
    return;
  }

  activeQuiz.answered = true;
  activeQuiz.transitioning = true;
  clearInterval(quizTimer);
  setBossMusicMode('full');

  const q = activeQuizQuestions()[activeQuiz.index];
  const correct = idx === q[2];
  const answerButtons = document.querySelectorAll('#quizGame .quiz-answer');
  answerButtons.forEach((btn, i) => {
    btn.disabled = true;
    if (i === q[2]) btn.classList.add('correct-answer');
    if (i === idx && !correct) btn.classList.add('wrong-answer');
  });
  if (correct) playSfx(sfxCorrect);

  // Erst die farbige Rückmeldung sichtbar lassen, danach die Karte vollständig
  // aus dem Kampffeld bewegen. Die Trefferanimation beginnt erst, wenn die
  // Karte tatsächlich verborgen ist.
  await wait(520);
  const game = document.getElementById('quizGame');
  game.classList.add('slide-out-left');
  await wait(QUIZ_TRANSITION_MS + 40);
  game.classList.add('hidden');
  game.classList.remove('slide-out-left');

  await playBattleAnimation(correct, idx);
}

async function playBattleAnimation(correct, idx) {
  if (!activeQuiz || activeQuiz.finished) return;

  const feedback = document.getElementById('battleFeedback');
  const knight = document.getElementById('quizKnight');
  const enemy = document.getElementById('quizEnemy');
  if (!feedback || !knight || !enemy) return;

  feedback.classList.remove('hidden');
  knight.classList.remove('sprite-pop', 'sprite-shake', 'knight-strike', 'knight-damaged', 'knight-attack-pose');
  enemy.classList.remove('sprite-shake', 'enemy-hit', 'enemy-attack-strike', 'boss-hit-freeze-blink');

  if (correct) {
    activeQuiz.correct += 1;
    activeQuiz.scorePoints = Math.min(1000, (activeQuiz.scorePoints || 0) + 125);
    window.SinnesScore?.setSession(`quiz_${activeQuiz.quizId}`, activeQuiz.scorePoints, 1000);
    feedback.textContent = 'Richtig!';

    knight.src = knightAsset('attack');
    enemy.src = enemyAsset(activeQuiz.data.enemy, 'normal');
    knight.classList.add('knight-attack-pose');
    void knight.offsetWidth;
    knight.classList.add('knight-strike');

    // Der Ritter bewegt sich sichtbar zum Gegner.
    await wait(ATTACK_IMPACT_MS);
    if (!activeQuiz || activeQuiz.finished) return;

    enemy.src = enemyAsset(activeQuiz.data.enemy, 'damage');
    enemy.classList.add('enemy-hit', 'boss-hit-freeze-blink');
    playSfx(sfxClick);

    // Gegner bleibt genau in der Trefferposition und blinkt 1,5 Sekunden.
    await wait(1500);
    if (!activeQuiz || activeQuiz.finished) return;

    enemy.classList.remove('enemy-hit', 'boss-hit-freeze-blink');
    knight.classList.remove('knight-strike', 'knight-attack-pose');
    knight.src = knightAsset('normal');
    enemy.src = enemyAsset(activeQuiz.data.enemy, 'normal');
    await wait(220);
  } else {
    activeQuiz.hearts -= 1;
    activeQuiz.scorePoints = Math.max(0, (activeQuiz.scorePoints || 0) - 250);
    window.SinnesScore?.setSession(`quiz_${activeQuiz.quizId}`, activeQuiz.scorePoints, 1000);
    feedback.textContent = idx === -1 ? 'Zeit abgelaufen!' : 'Falsch!';

    knight.src = knightAsset('normal');
    enemy.src = enemyAttackAsset(activeQuiz.data.enemy);
    playSfx(sfxWrong);
    void enemy.offsetWidth;
    enemy.classList.add('enemy-attack-strike');

    await wait(ENEMY_IMPACT_MS);
    if (!activeQuiz || activeQuiz.finished) return;

    knight.src = knightAsset('damage');
    knight.classList.add('knight-damaged');
    renderHearts();

    await wait(Math.max(700, DAMAGE_RESET_MS - ENEMY_IMPACT_MS));
    if (!activeQuiz || activeQuiz.finished) return;

    knight.classList.remove('knight-damaged');
    enemy.classList.remove('enemy-attack-strike');
    knight.src = knightAsset('normal');
    enemy.src = enemyAsset(activeQuiz.data.enemy, 'normal');
    await wait(180);
  }

  feedback.classList.add('hidden');
  knight.classList.remove('sprite-pop', 'sprite-shake', 'knight-strike', 'knight-damaged', 'knight-attack-pose');
  enemy.classList.remove('sprite-shake', 'enemy-hit', 'enemy-attack-strike', 'boss-hit-freeze-blink');

  if (activeQuiz.hearts <= 0 || activeQuiz.index >= activeQuizQuestions().length - 1) {
    if (activeQuiz.hearts <= 0) playGameOverSound();
    showQuizEndPanel();
    return;
  }

  activeQuiz.index += 1;
  knight.src = knightAsset('normal');
  enemy.src = enemyAsset(activeQuiz.data.enemy, 'normal');
  const game = document.getElementById('quizGame');
  game.classList.remove('hidden');
  renderQuestion('in');
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
  if (correct) playSfx(sfxCorrect);

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
  enemy.classList.remove('castle-boss-dodge', 'castle-boss-smirk', 'castle-final-damage-blink');

  if (correct) {
    activeQuiz.correct += 1;
    activeQuiz.scorePoints = Math.min(5000, (activeQuiz.scorePoints || 0) + 250);
    window.SinnesScore?.setSession('boss_zauberschloss_final', activeQuiz.scorePoints, 5000);
    feedback.textContent = 'Richtig!';
    knight.src = castleKnightAsset('attack');
    knight.classList.add('knight-attack-pose');
    enemy.src = castleEnemyAsset('shield');
    enemy.classList.remove('castle-final-damage-blink', 'castle-boss-dodge');
    void knight.offsetWidth;
    void enemy.offsetWidth;
    knight.classList.add('knight-strike');
    // Der Schild blockt vollständig: kein Ausweichen, kein Blinken und kein
    // Trefferschaden-Sound in dieser ersten Quizphase.
    await wait(1050);
  } else {
    activeQuiz.scorePoints = Math.max(0, (activeQuiz.scorePoints || 0) - 50);
    window.SinnesScore?.setSession('boss_zauberschloss_final', activeQuiz.scorePoints, 5000);
    feedback.textContent = idx === -1 ? 'Zeit abgelaufen!' : 'Falsch!';
    enemy.src = castleEnemyAsset('laugh');
    playSfx(sfxWrong);
    enemy.classList.add('castle-boss-smirk');
    await wait(900);
  }

  knight.classList.remove('knight-strike', 'knight-attack-pose');
  enemy.classList.remove('castle-boss-dodge', 'castle-boss-smirk', 'castle-final-damage-blink');
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
    <div id="castleTasteIntro" class="castle-taste-dialog castle-phase-guide" role="dialog" aria-modal="true" aria-label="Geschmackssinn Hinweis">
      <h2>Geschmackssinn</h2>
      <p class="castle-phase-guide-lead">Sammle Süßes und weiche Scharfem aus.</p>
      <div class="mini-guide-slider castle-phase-guide-slider" aria-label="Erklärung Geschmackssinn">
        <article class="mini-guide-card">
          <div class="mini-guide-icon"><span class="mini-guide-inline-row"><span class="mini-guide-inline-item">🍎</span></span></div>
          <p class="mini-guide-title">Äpfel sammeln</p>
          <p class="mini-guide-text">Jeder Apfel stärkt den Ritter.</p>
        </article>
        <article class="mini-guide-card">
          <div class="mini-guide-icon"><span class="mini-guide-inline-row"><span class="mini-guide-inline-item">🌶️</span></span></div>
          <p class="mini-guide-title">Chilis meiden</p>
          <p class="mini-guide-text">Scharfe Chilis kosten Kraft.</p>
        </article>
        <article class="mini-guide-card">
          <div class="mini-guide-icon"><span class="mini-guide-inline-row tight"><span class="mini-guide-inline-item">⬅️</span><span class="mini-guide-inline-item">➡️</span></span></div>
          <p class="mini-guide-title">Bewegen</p>
          <p class="mini-guide-text">Laufe nach links oder rechts.</p>
        </article>
      </div>
      <button id="castleTasteStartButton" class="primary-button" type="button">Starten</button>
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

function scheduleCastleTasteDrop(initialDelay = null) {
  const state = activeQuiz?.castleDodge;
  if (!state || !state.running) return;
  if (state.dropTimer) clearTimeout(state.dropTimer);
  const delay = initialDelay ?? (
    CASTLE_TASTE_DROP_MIN_MS + Math.random() * (CASTLE_TASTE_DROP_MAX_MS - CASTLE_TASTE_DROP_MIN_MS)
  );
  state.dropTimer = setTimeout(() => {
    const current = activeQuiz?.castleDodge;
    if (!current || !current.running) return;
    const kind = Math.random() < 0.68 ? 'good' : 'bad';
    spawnCastleTasteItem(kind);
    current.lastDropAt = performance.now();
    scheduleCastleTasteDrop();
  }, Math.max(1000, delay));
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

function shrinkCastleCollisionRect(rect, horizontalRatio = 0.2, verticalRatio = 0.16) {
  const insetX = rect.width * horizontalRatio;
  const insetY = rect.height * verticalRatio;
  return {
    left: rect.left + insetX,
    right: rect.right - insetX,
    top: rect.top + insetY,
    bottom: rect.bottom - insetY
  };
}

function updateCastleProjectiles(deltaSeconds) {
  const state = activeQuiz?.castleDodge;
  if (!state || !state.running) return;
  const knight = document.getElementById('quizKnight');
  if (!knight) return;
  const knightRect = shrinkCastleCollisionRect(knight.getBoundingClientRect(), 0.23, 0.14);

  state.projectiles = state.projectiles.filter(projectile => {
    projectile.y += projectile.speed * deltaSeconds;
    projectile.el.style.top = `${projectile.y}%`;
    if (projectile.y > 108) {
      projectile.el.remove();
      return false;
    }
    const rect = shrinkCastleCollisionRect(projectile.el.getBoundingClientRect(), 0.26, 0.22);
    const overlaps = !(rect.right < knightRect.left || rect.left > knightRect.right || rect.bottom < knightRect.top || rect.top > knightRect.bottom);
    if (overlaps) {
      projectile.el.remove();
      if (projectile.kind === 'good') {
        state.goodCollected = Math.min(state.goal, state.goodCollected + 1);
        playSfx(sfxCorrect);
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
  pauseCastleWinMusic();
  pauseCastleUltimateMusic();
  pauseLevelMusic();
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
    dropTimer: null,
    lastDropAt: 0,
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
  scheduleCastleTasteDrop(900);
  activeQuiz.castleDodge.rafId = requestAnimationFrame(castleDodgeFrame);
}

function stopCastleDodgeLoop() {
  if (!activeQuiz?.castleDodge) return;
  const state = activeQuiz.castleDodge;
  state.running = false;
  if (state.spawnTimer) clearInterval(state.spawnTimer);
  if (state.badSpawnTimer) clearTimeout(state.badSpawnTimer);
  if (state.dropTimer) clearTimeout(state.dropTimer);
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
  state.dropTimer = null;
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

  scheduleCastleTasteDrop(800);
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

  // Nach dem Sammeln bleibt der Ritter zunächst in seiner aktuellen Höhe.
  // Der Magier fliegt zuerst sichtbar in die Mitte, wird dort von der
  // Sprung-Schlaganimation getroffen und sinkt erst danach in die Standardpose.
  if (zone) {
    zone.classList.remove('castle-dodge-mode');
    zone.classList.add('castle-final-hit-mode');
    zone.style.setProperty('--castle-mage-left', '50%');
  }
  if (knight) {
    knight.src = castleKnightAsset('normal');
    knight.classList.remove('castle-knight-hit', 'castle-walking');
  }
  if (enemy) {
    const startRect = enemy.getBoundingClientRect();
    enemy.src = castleEnemyAsset('hover');
    enemy.classList.remove('castle-pass-left', 'castle-pass-right','castle-phase-hidden');
    enemy.style.setProperty('transition','left 720ms cubic-bezier(.22,.78,.28,1), top 720ms ease, transform 720ms ease','important');
    enemy.style.setProperty('left','50%','important');
    enemy.style.setProperty('top','21%','important');
    enemy.style.setProperty('transform','translateX(-50%)','important');
    await wait(760);
    enemy.style.removeProperty('transition');
  }
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
  panel.classList.remove('slide-out-left');
  panel.classList.add('slide-in-right');
  setTimeout(() => panel.classList.remove('slide-in-right'), QUIZ_TRANSITION_MS + 80);
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
    activeQuiz.scorePoints = Math.max(0, (activeQuiz.scorePoints || 0) - 50);
    window.SinnesScore?.setSession('boss_zauberschloss_final', activeQuiz.scorePoints, 5000);
    await wait(900);
    activeQuiz.finalAnswered = false;
    buttons.forEach(btn => {
      btn.disabled = false;
      btn.classList.remove('correct-answer', 'wrong-answer');
    });
    return;
  }

  activeQuiz.scorePoints = Math.min(5000, (activeQuiz.scorePoints || 0) + 500);
  window.SinnesScore?.setSession('boss_zauberschloss_final', activeQuiz.scorePoints, 5000);
  playSfx(sfxCorrect);
  await wait(520);
  if (panel) { panel.classList.remove('slide-in-right'); panel.classList.add('slide-out-left'); }
  await wait(QUIZ_TRANSITION_MS);
  if (panel) { panel.classList.add('hidden'); panel.classList.remove('slide-out-left'); }
  await playCastleFinalHit();
}

async function playCastleFinalHit() {
  activeQuiz.scorePoints = Math.min(5000, (activeQuiz.scorePoints || 0) + 250);
  window.SinnesScore?.setSession('boss_zauberschloss_final', activeQuiz.scorePoints, 5000);
  const zone = document.getElementById('quizBattleZone');
  const knight = document.getElementById('quizKnight');
  const enemy = document.getElementById('quizEnemy');
  if (!zone || !knight || !enemy) return;
  zone.classList.remove('castle-final-question-mode');
  zone.classList.add('castle-final-hit-mode');
  knight.src = castleKnightAsset('finalAttack');
  enemy.src = castleEnemyAsset('hover');
  enemy.classList.remove('castle-final-damage-blink');
  await animateCastleEnemyStrike({
    knight,
    enemy,
    duration: 1150,
    impactFraction: 0.52,
    enemyHitSrc: castleEnemyAsset('surprised')
  });
  enemy.classList.remove('castle-final-damage-blink');
  knight.src = castleKnightAsset('normal');
  enemy.src = castleEnemyAsset('laugh');
  await animateCastleActorsToStandardPose();
  await wait(260);
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
  await pauseCastleBeforeNextPhase('<strong>Du warst flink.</strong><br>Doch nun prüfe ich deine Augen!', 'left');

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

function getCastleClonePoints(round = 1) {
  const count = round <= 1 ? 8 : 16;
  return shuffleCastleClonePoints([
    { x: 15, y: 16 }, { x: 33, y: 14 }, { x: 51, y: 18 }, { x: 69, y: 14 }, { x: 85, y: 18 },
    { x: 20, y: 34 }, { x: 38, y: 31 }, { x: 56, y: 29 }, { x: 74, y: 33 }, { x: 88, y: 32 },
    { x: 17, y: 52 }, { x: 36, y: 50 }, { x: 58, y: 48 }, { x: 78, y: 49 }, { x: 70, y: 63 },
    { x: 88, y: 62 }
  ]).slice(0, count);
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
    <div id="castleCloneDialog" class="castle-clone-dialog castle-phase-guide" role="dialog" aria-modal="true" aria-label="Hinweis zur Sehphase">
      <h2>Sehsinn</h2>
      <p class="castle-phase-guide-lead">Finde den echten Magier zwischen seinen Kopien.</p>
      <div class="mini-guide-slider castle-phase-guide-slider" aria-label="Erklärung Sehsinn">
        <article class="mini-guide-card">
          <div class="mini-guide-icon">👀</div>
          <p class="mini-guide-title">Genau beobachten</p>
          <p class="mini-guide-text">Vergleiche alle Magier miteinander.</p>
        </article>
        <article class="mini-guide-card">
          <div class="mini-guide-icon"><span class="mini-guide-inline-row"><span class="mini-guide-inline-item">✨</span><span class="mini-guide-inline-item">🧙</span></span></div>
          <p class="mini-guide-title">Kopien blinken</p>
          <p class="mini-guide-text">Die falschen Magier blinken kurz.</p>
        </article>
        <article class="mini-guide-card">
          <div class="mini-guide-icon">🧙</div>
          <p class="mini-guide-title">Echter Magier</p>
          <p class="mini-guide-text">Tippe den Magier an, der nicht blinkt.</p>
        </article>
      </div>
      <button id="castleCloneStartButton" class="primary-button" type="button">Starten</button>
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

  enemy.classList.remove('castle-clone-hidden', 'castle-final-damage-blink', 'castle-clone-mage-enter', 'castle-flight-left', 'castle-flight-right', 'castle-phase-hidden');
  enemy.src = castleEnemyAsset('flyLeft');
  void enemy.offsetWidth;
  enemy.classList.add('castle-flight-left');
  await wait(showMageEnter ? 1120 : 980);
  if (!activeQuiz?.castleClone?.running) return;
  enemy.classList.remove('castle-flight-left');
  enemy.classList.add('castle-clone-hidden');
  await wait(120);
  if (!activeQuiz?.castleClone?.running) return;
  buildCastleCloneChoices();
}

function buildCastleCloneChoices() {
  const state = activeQuiz?.castleClone;
  const field = document.getElementById('castleClonePlayfield');
  if (!state || !state.running || !field) return;

  const points = getCastleClonePoints(state.round);
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
  enemy.classList.remove('castle-final-damage-blink');
  await animateCastleEnemyStrike({
    knight,
    enemy,
    duration: 980,
    impactFraction: 0.52,
    enemyHitSrc: castleEnemyAsset('surprised')
  });
  if (!activeQuiz?.castleClone?.running) return false;
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

  hideCastleSpeech();
  await animateCastleActorsToStandardPose();
  if (panel) panel.classList.add('hidden');
  cleanupCastleCloneSearch();
  if (!activeQuiz) return;
  activeQuiz.cloneSearchCompleted = true;
  await pauseCastleBeforeNextPhase('<strong>Gut gesehen!</strong><br>Jetzt finde mich mit deinen Händen.', 'left');
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
    homeX: 12,
    knightX: 12,
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
    <div id="castleCloneDialog" class="castle-clone-dialog castle-phase-guide" role="dialog" aria-modal="true" aria-label="Hinweis zur Tastphase">
      <h2>Tastsinn</h2>
      <p class="castle-phase-guide-lead">Erkenne, welche Figur sich sicher anfühlt.</p>
      <div class="mini-guide-slider castle-phase-guide-slider" aria-label="Erklärung Tastsinn">
        <article class="mini-guide-card">
          <div class="mini-guide-icon">🌳</div>
          <p class="mini-guide-title">Busch beobachten</p>
          <p class="mini-guide-text">Warte, bis eine Figur erscheint.</p>
        </article>
        <article class="mini-guide-card">
          <div class="mini-guide-icon">🧙</div>
          <p class="mini-guide-title">Echt und sicher</p>
          <p class="mini-guide-text">Springe nur auf den echten Magier.</p>
        </article>
        <article class="mini-guide-card">
          <div class="mini-guide-icon"><span class="mini-guide-inline-row"><span class="mini-guide-inline-item">⚠️</span><span class="mini-guide-inline-item">🗡️</span></span></div>
          <p class="mini-guide-title">Spitze Attrappe</p>
          <p class="mini-guide-text">Die falsche Figur verletzt den Ritter.</p>
        </article>
      </div>
      <button id="castleCloneStartButton" class="primary-button" type="button">Starten</button>
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

  const revealDuration = appearances.some(appearance => appearance.kind === 'real')
    ? 1000
    : CASTLE_BUSH_REVEAL_MS;
  state.revealTimer = setTimeout(() => {
    hideAllCastleBushReveals();
    if (state.running && !state.locked) scheduleCastleBushReveal();
  }, revealDuration);
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
    knight.src = castleKnightAsset('finalAttack');
    knight.classList.add('castle-bush-sword-swing');
    playSfx(sfxMageHit);
    image?.classList.add('castle-bush-hit-blink');
    await wait(520);
    knight.classList.remove('castle-bush-sword-swing');
    knight.src = castleKnightAsset('normal');
    image?.classList.remove('castle-bush-hit-blink');
    state.hits += 1;
    activeQuiz.scorePoints = Math.min(5000, (activeQuiz.scorePoints || 0) + 250);
    window.SinnesScore?.setSession('boss_zauberschloss_final', activeQuiz.scorePoints, 5000);
    updateCastleBushLabel();
  } else {
    await animateCastleBushKnightJump(targetX, false);
    if (!activeQuiz?.castleBush?.running) return;
    activeQuiz.scorePoints = Math.max(0, (activeQuiz.scorePoints || 0) - 200);
    window.SinnesScore?.setSession('boss_zauberschloss_final', activeQuiz.scorePoints, 5000);
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

  await animateCastleActorsToStandardPose();
  panel?.classList.add('hidden');
  await wait(120);
  cleanupCastleBushGame();
  await pauseCastleBeforeNextPhase('<strong>Du hast mich ertastet.</strong><br>Aber kannst du auch den richtigen Duft finden?', 'left');
  await startCastleSmellSearchSequence();
}


function buildCastleSmellPanel() {
  const panel = document.getElementById('castleSmellPanel');
  if (!panel) return;
  panel.className = 'quiz-panel castle-smell-panel';
  panel.innerHTML = `
    <div class="castle-smell-hud"><strong>Riechsinn</strong><span id="castleSmellRound">Runde 1 / ${CASTLE_SMELL_ROUNDS_TOTAL}</span></div>
    <div id="castleSmellFeedback" class="castle-smell-feedback hidden" aria-live="polite"></div>
    <div id="castleSmellIntro" class="castle-smell-dialog castle-phase-guide" role="dialog" aria-modal="true" aria-label="Hinweis zum Riechsinn">
      <h2>Riechsinn</h2>
      <p class="castle-phase-guide-lead">Finde den angenehmen Duft zwischen den Gestankwolken.</p>
      <div class="mini-guide-slider castle-phase-guide-slider" aria-label="Erklärung Riechsinn">
        <article class="mini-guide-card">
          <div class="mini-guide-icon"><span class="mini-guide-inline-row"><span class="mini-guide-inline-item">🤢</span><span class="mini-guide-inline-item">☁️</span></span></div>
          <p class="mini-guide-title">Gestank meiden</p>
          <p class="mini-guide-text">Weiche übelriechenden Wolken aus.</p>
        </article>
        <article class="mini-guide-card">
          <div class="mini-guide-icon"><span class="mini-guide-inline-row"><span class="mini-guide-inline-item">🌸</span><span class="mini-guide-inline-item">✨</span></span></div>
          <p class="mini-guide-title">Duft finden</p>
          <p class="mini-guide-text">Stelle dich in die angenehme Duftwolke.</p>
        </article>
        <article class="mini-guide-card">
          <div class="mini-guide-icon"><span class="mini-guide-inline-row tight"><span class="mini-guide-inline-item">⬅️</span><span class="mini-guide-inline-item">➡️</span></span></div>
          <p class="mini-guide-title">Ausweichen</p>
          <p class="mini-guide-text">Bewege den Ritter in die sichere Spur.</p>
        </article>
      </div>
      <button id="castleSmellStartButton" class="primary-button" type="button">Starten</button>
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
function resolveCastleSmellRow(row){const s=activeQuiz?.castleSmell,k=document.getElementById('quizKnight');if(!s||!s.running||row.resolved)return;row.resolved=true;const safe=nearestCastleSmellLaneIndex(s.playerX,s.lanes)===row.safeIndex;row.el.classList.add(safe?'castle-smell-row-safe':'castle-smell-row-danger');row.resolve?.(safe);if(safe){showCastleSmellFeedback('Die Duftwolke schützt dich!',950);return;}if(s.failureHandling)return;s.failureHandling=true;s.locked=true;s.moveDir=0;setCastleSmellControlsEnabled(false);activeQuiz.scorePoints=Math.max(0,(activeQuiz.scorePoints||0)-150);window.SinnesScore?.setSession('boss_zauberschloss_final',activeQuiz.scorePoints,5000);playSfx(sfxWrong);k?.classList.add('castle-smell-knight-damage');showCastleSmellFeedback('Gestank getroffen! Diese Runde beginnt erneut.',1700);const timer=setTimeout(async()=>{const c=activeQuiz?.castleSmell;if(!c?.running)return;k?.classList.remove('castle-smell-knight-damage');c.attemptToken+=1;clearCastleSmellRows(false);c.failureHandling=false;await wait(420);if(activeQuiz?.castleSmell?.running)await restartCastleSmellRound();},720);s.timers.push(timer);}
function castleSmellFrame(now){const s=activeQuiz?.castleSmell;if(!s||!s.running)return;const delta=Math.min(.05,(now-(s.lastFrame||now))/1000||0);s.lastFrame=now;updateCastleSmellRunSprite(now);if(s.started&&!s.locked){s.playerX+=s.moveDir*53*delta;s.playerX=Math.max(4.5,Math.min(95.5,s.playerX));document.getElementById('quizBattleZone')?.style.setProperty('--smell-player-x',`${s.playerX}%`);}s.rows.forEach(row=>{if(!row.falling)return;row.y+=CASTLE_SMELL_FALL_SPEED*delta;row.el.style.top=`${row.y}%`;if(!row.resolved&&row.y>=CASTLE_SMELL_IMPACT_Y)resolveCastleSmellRow(row);if(row.y>116&&row.el.isConnected)row.el.remove();});s.rafId=requestAnimationFrame(castleSmellFrame);}
function createCastleSmellRow(safeIndex,sequenceIndex){const s=activeQuiz?.castleSmell,layer=document.getElementById('castleSmellLayer');if(!s||!layer)return null;const el=document.createElement('div');el.className='castle-smell-row';el.style.top=`${CASTLE_SMELL_SPAWN_Y}%`;el.style.zIndex=String(30+sequenceIndex);layer.appendChild(el);let resolver;const promise=new Promise(resolve=>resolver=resolve);const row={id:++s.rowId,el,safeIndex,spawned:new Set(),y:CASTLE_SMELL_SPAWN_Y,falling:false,resolved:false,resolve:resolver,promise};s.rows.push(row);return row;}
function appendCastleSmellCloud(row,laneIndex){const s=activeQuiz?.castleSmell;if(!s||!row||row.spawned.has(laneIndex))return;row.spawned.add(laneIndex);const kind=laneIndex===row.safeIndex?'scent':'stink',img=document.createElement('img');img.className=`castle-smell-cloud castle-smell-cloud-${kind}`;img.src=castleSmellAsset(kind);img.alt=kind==='scent'?'Duftwolke':'Gestankwolke';img.draggable=false;img.style.left=`${s.lanes[laneIndex]}%`;img.style.setProperty('--smell-cloud-delay',`${laneIndex*-.07}s`);row.el.appendChild(img);}
async function animateCastleSmellMageAndSpawnRow(direction,sequenceIndex,token){const s=activeQuiz?.castleSmell,e=document.getElementById('quizEnemy');if(!s||!e||token!==s.attemptToken)return null;const safeIndex=Math.floor(Math.random()*CASTLE_SMELL_CLOUD_COUNT),row=createCastleSmellRow(safeIndex,sequenceIndex);if(!row)return null;const startX=direction>0?-18:118,endX=direction>0?118:-18,order=direction>0?s.lanes.map((_,i)=>i):s.lanes.map((_,i)=>i).reverse(),top=Math.max(6.5,11-sequenceIndex*1.2);e.src=castleEnemyAsset(direction>0?'flyRight':'flyLeft');e.classList.remove('castle-phase-hidden','castle-smell-hidden');setCastleSmellMagePosition(startX,top);const started=performance.now();await new Promise(resolve=>{function frame(now){const c=activeQuiz?.castleSmell;if(!c?.running||token!==c.attemptToken){resolve();return;}const p=Math.min(1,(now-started)/CASTLE_SMELL_FLIGHT_MS),ease=p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2,x=startX+(endX-startX)*ease,bob=Math.sin(p*Math.PI*4)*1.1;setCastleSmellMagePosition(x,top+bob);order.forEach(i=>{const crossed=direction>0?x>=s.lanes[i]:x<=s.lanes[i];if(crossed)appendCastleSmellCloud(row,i);});if(p<1)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});if(!activeQuiz?.castleSmell?.running||token!==s.attemptToken)return null;s.lanes.forEach((_,i)=>appendCastleSmellCloud(row,i));e.classList.add('castle-smell-hidden');row.falling=true;s.lastMageExitX=endX;return row;}
function clearCastleSmellRows(value=false){const s=activeQuiz?.castleSmell;if(!s)return;s.rows.forEach(row=>{if(!row.resolved){row.resolved=true;row.resolve?.(value);}row.el?.remove();});s.rows=[];}
function castleSmellDirectionsForRound(round){if(round===1)return[1,-1];return[1,-1,1,-1,1,-1];}
async function waitCastleSmellGap(ms,token){await wait(ms);const s=activeQuiz?.castleSmell;return!!s?.running&&s.attemptToken===token&&!s.failureHandling;}
async function runCastleSmellRoundAttempt(){const s=activeQuiz?.castleSmell;if(!s||!s.running||s.attemptInProgress)return;s.attemptInProgress=true;s.failureHandling=false;s.locked=false;s.moveDir=0;s.lastFrame=performance.now();clearCastleSmellRows(false);setCastleSmellControlsEnabled(true);showCastleSmellFeedback(`Runde ${s.round}: Finde die Duftwolke!`,1200);const token=++s.attemptToken,directions=castleSmellDirectionsForRound(s.round),promises=[];for(let i=0;i<directions.length;i++){const row=await animateCastleSmellMageAndSpawnRow(directions[i],i,token);if(!row||!activeQuiz?.castleSmell?.running||s.attemptToken!==token){s.attemptInProgress=false;return;}promises.push(row.promise);if(i<directions.length-1&&!(await waitCastleSmellGap(CASTLE_SMELL_ROW_GAP_MS,token))){s.attemptInProgress=false;return;}}const results=await Promise.all(promises);if(!activeQuiz?.castleSmell?.running||s.attemptToken!==token||s.failureHandling){s.attemptInProgress=false;return;}s.attemptInProgress=false;if(results.every(Boolean))await completeCastleSmellRoundAttempt();}
async function animateCastleSmellKnightToX(targetX,duration=560){const s=activeQuiz?.castleSmell,k=document.getElementById('quizKnight'),z=document.getElementById('quizBattleZone');if(!s||!k||!z)return;const start=s.playerX,dir=targetX>=start?1:-1,t0=performance.now();let last=-1;await new Promise(resolve=>{function frame(now){if(!activeQuiz?.castleSmell?.running){resolve();return;}const p=Math.min(1,(now-t0)/duration),ease=p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2,x=start+(targetX-start)*ease;s.playerX=x;z.style.setProperty('--smell-player-x',`${x}%`);const f=Math.floor(now/150)%2;if(f!==last){k.src=dir>0?castleKnightAsset(f?'runRight2':'runRight1'):castleKnightAsset(f?'runLeft2':'runLeft1');last=f;}if(p<1)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});s.playerX=targetX;z.style.setProperty('--smell-player-x',`${targetX}%`);k.src=castleKnightAsset('normal');}
async function animateCastleSmellMageToCenter(){const s=activeQuiz?.castleSmell,e=document.getElementById('quizEnemy');if(!s||!e)return;const start=Number.isFinite(s.lastMageExitX)?s.lastMageExitX:118,end=50,t0=performance.now();e.src=castleEnemyAsset(start>end?'flyLeft':'flyRight');e.classList.remove('castle-smell-hidden','castle-phase-hidden');await new Promise(resolve=>{function frame(now){if(!activeQuiz?.castleSmell?.running){resolve();return;}const p=Math.min(1,(now-t0)/900),ease=1-Math.pow(1-p,3);setCastleSmellMagePosition(start+(end-start)*ease,9+(18-9)*ease);if(p<1)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});e.src=castleEnemyAsset('hover');setCastleSmellMagePosition(50,18);}
async function playCastleSmellAttack(){const s=activeQuiz?.castleSmell,k=document.getElementById('quizKnight'),e=document.getElementById('quizEnemy');if(!s||!k||!e)return;activeQuiz.scorePoints=Math.min(5000,(activeQuiz.scorePoints||0)+250);window.SinnesScore?.setSession('boss_zauberschloss_final',activeQuiz.scorePoints,5000);k.src=castleKnightAsset('finalAttack');e.classList.remove('castle-final-damage-blink');await animateCastleEnemyStrike({knight:k,enemy:e,duration:1150,impactFraction:.52,enemyHitSrc:castleEnemyAsset('surprised')});e.classList.remove('castle-final-damage-blink');k.src=castleKnightAsset('normal');e.src=castleEnemyAsset('laugh');}
async function completeCastleSmellRoundAttempt(){const s=activeQuiz?.castleSmell;if(!s||!s.running)return;s.locked=true;s.moveDir=0;setCastleSmellControlsEnabled(false);await wait(280);clearCastleSmellRows(true);await animateCastleSmellKnightToX(50,520);await animateCastleSmellMageToCenter();if(!activeQuiz?.castleSmell?.running)return;const correct=await askCastleSenseQuestion('duftgarten','Riechsinn');if(!activeQuiz?.castleSmell?.running)return;if(!correct){showCastleSmellFeedback('Falsch beantwortet – diese Runde wird wiederholt.',1600);await wait(420);await restartCastleSmellRound();return;}await playCastleSmellAttack();if(!activeQuiz?.castleSmell?.running)return;s.round+=1;if(s.round>s.totalRounds){await finishCastleSmellSearch();return;}updateCastleSmellRoundLabel();showCastleSmellFeedback(`Treffer! Runde ${s.round} beginnt.`,1300);await wait(360);await restartCastleSmellRound();}
async function restartCastleSmellRound(){const s=activeQuiz?.castleSmell;if(!s||!s.running)return;s.locked=true;s.moveDir=0;s.attemptToken+=1;clearCastleSmellRows(false);setCastleSmellControlsEnabled(false);setCastleStandardBattlePoseVisual();await flyCastleMageOutBeforePhase('left');if(!activeQuiz?.castleSmell?.running)return;prepareCastleSmellModeVisual();s.locked=false;s.attemptInProgress=false;s.failureHandling=false;await wait(180);runCastleSmellRoundAttempt();}
async function startCastleSmellSearchSequence(){cleanupCastleSmellGame();const modal=ensureQuizModal(),panel=document.getElementById('castleSmellPanel'),layer=document.getElementById('castleSmellLayer'),zone=document.getElementById('quizBattleZone'),knight=document.getElementById('quizKnight'),enemy=document.getElementById('quizEnemy');if(!activeQuiz||!panel||!layer||!zone||!knight||!enemy)return;modal.querySelector('#quizGame')?.classList.add('hidden');modal.querySelector('#quizIntro')?.classList.add('hidden');modal.querySelector('#quizResult')?.classList.add('hidden');modal.querySelector('#castleDodgePanel')?.classList.add('hidden');modal.querySelector('#castleClonePanel')?.classList.add('hidden');modal.querySelector('#castleFinalQuestionPanel')?.classList.add('hidden');activeQuiz.castleSmell={running:true,started:false,round:1,totalRounds:CASTLE_SMELL_ROUNDS_TOTAL,playerX:50,moveDir:0,lastRunDir:0,lastRunKey:'',lastFrame:performance.now(),rafId:null,timers:[],rows:[],rowId:0,attemptToken:0,attemptInProgress:false,failureHandling:false,locked:true,lastMageExitX:-18,lanes:[8.5,25.1,41.7,58.3,74.9,91.5]};buildCastleSmellPanel();installCastleSmellControls();updateCastleSmellRoundLabel();prepareCastleSmellModeVisual();setCastleSmellControlsEnabled(false);activeQuiz.castleSmell.rafId=requestAnimationFrame(castleSmellFrame);document.getElementById('castleSmellStartButton')?.addEventListener('click',()=>{const st=activeQuiz?.castleSmell;if(!st||st.started)return;unlockSfxForMobile();st.started=true;st.locked=false;document.getElementById('castleSmellIntro')?.classList.add('hidden');setCastleSmellControlsEnabled(true);runCastleSmellRoundAttempt();},{once:true});}
async function finishCastleSmellSearch() {
  const state = activeQuiz?.castleSmell;
  if (!state || !state.running) return;
  state.running = false;
  state.attemptToken += 1;
  clearCastleSmellRows(true);
  await wait(240);
  await animateCastleActorsToStandardPose();
  cleanupCastleSmellGame();
  await pauseCastleBeforeNextPhase('<strong>Du folgst schon der richtigen Spur.</strong><br>Mal sehen, ob dein Gehör genauso stark ist!', 'left');
  await startCastleHearingSearchSequence();
}



let castleHearingHtmlPlayers = null;
let castleHearingAudioUnlocked = false;
let castleHearingAudioUnlockInProgress = null;
let castleHearingAudioGatePromise = null;
let castleHearingAudioGateResolve = null;
let castleHearingActiveToneCount = 0;
let castleHearingAudioListenersInstalled = false;

function initCastleHearingHtmlPlayers() {
  if (castleHearingHtmlPlayers) return castleHearingHtmlPlayers;
  castleHearingHtmlPlayers = CASTLE_HEARING_NOTES.map(note => {
    const audio = new Audio();
    audio.src = note.file;
    audio.preload = 'auto';
    audio.playsInline = true;
    audio.setAttribute('playsinline', '');
    audio.setAttribute('webkit-playsinline', '');
    audio.setAttribute('data-hearing-note', note.name);
    try { audio.load(); } catch {}
    return audio;
  });
  return castleHearingHtmlPlayers;
}

function stopCastleHearingMp3Players(exceptIndex = -1) {
  initCastleHearingHtmlPlayers().forEach((audio, index) => {
    if (index === exceptIndex) return;
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch {}
  });
}

function primeCastleHearingAudioFiles() {
  initCastleHearingHtmlPlayers().forEach(audio => {
    try { audio.load(); } catch {}
  });
}

function castleHearingToneVolume() {
  let volume = 0.8;
  try { volume = currentVolume(); } catch {}
  return Math.max(0.82, Math.min(1, volume * 1.6));
}

function beginCastleHearingMusicDuck() {
  castleHearingActiveToneCount += 1;
  try {
    if (bossMusicWanted && !bossMusic.paused) {
      bossMusic.volume = Math.min(bossMusic.volume, Math.max(0.012, currentVolume() * 0.07));
    }
  } catch {}
}

function endCastleHearingMusicDuck() {
  castleHearingActiveToneCount = Math.max(0, castleHearingActiveToneCount - 1);
  if (castleHearingActiveToneCount > 0) return;
  try {
    if (bossMusicWanted) bossMusic.volume = bossVolumeForMode();
  } catch {}
}

function setCastleHearingAudioStatus(message, type = '') {
  const status = document.getElementById('castleHearingAudioStatus');
  if (!status) return;
  status.textContent = message;
  status.classList.remove('is-error', 'is-ready');
  if (type === 'error') status.classList.add('is-error');
  if (type === 'ready') status.classList.add('is-ready');
}

function hideCastleHearingAudioGate() {
  document.getElementById('castleHearingAudioGate')?.classList.add('hidden');
}

function cancelCastleHearingAudioGate() {
  hideCastleHearingAudioGate();
  if (castleHearingAudioGateResolve) castleHearingAudioGateResolve(false);
  castleHearingAudioGateResolve = null;
  castleHearingAudioGatePromise = null;
}

async function unlockCastleHearingAudio({ playConfirmation = false } = {}) {
  if (castleHearingAudioUnlockInProgress) return castleHearingAudioUnlockInProgress;

  castleHearingAudioUnlockInProgress = (async () => {
    const players = initCastleHearingHtmlPlayers();
    stopCastleHearingMp3Players();

    // All play() calls are started synchronously inside the user's tap.
    // This unlocks every MP3 element on iOS/WebKit instead of relying on generated browser tones.
    const attempts = players.map((audio, index) => {
      try {
        audio.currentTime = 0;
        audio.muted = false;
        audio.volume = playConfirmation && index === 0 ? castleHearingToneVolume() : 0.001;
        const result = audio.play();
        return result && typeof result.then === 'function' ? result : Promise.resolve();
      } catch (error) {
        return Promise.reject(error);
      }
    });

    const results = await Promise.allSettled(attempts);
    await wait(playConfirmation ? 190 : 80);

    players.forEach(audio => {
      try {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = castleHearingToneVolume();
      } catch {}
    });

    const successfulPlayers = results.filter(result => result.status === 'fulfilled').length;
    castleHearingAudioUnlocked = successfulPlayers === players.length;

    if (!castleHearingAudioUnlocked) {
      console.warn(`Hörsinn-MP3-Freigabe unvollständig: ${successfulPlayers}/${players.length} Dateien.`);
      setCastleHearingAudioStatus('Der Ton wurde vom Browser blockiert. Tippe erneut auf „Ton aktivieren“.', 'error');
      return false;
    }

    return true;
  })();

  try {
    return await castleHearingAudioUnlockInProgress;
  } finally {
    castleHearingAudioUnlockInProgress = null;
  }
}

async function ensureCastleHearingAudioReady({ fromUserGesture = false, allowGate = true } = {}) {
  if (castleHearingAudioUnlocked && initCastleHearingHtmlPlayers().length === CASTLE_HEARING_NOTES.length) {
    return true;
  }

  if (fromUserGesture) {
    const unlocked = await unlockCastleHearingAudio();
    if (unlocked) return true;
  }

  if (!allowGate) return false;
  return requestCastleHearingAudioGate();
}

function requestCastleHearingAudioGate() {
  if (castleHearingAudioGatePromise) return castleHearingAudioGatePromise;
  const gate = document.getElementById('castleHearingAudioGate');
  const button = document.getElementById('castleHearingAudioGateButton');
  const message = document.getElementById('castleHearingAudioGateMessage');
  if (!gate || !button) return Promise.resolve(false);

  gate.classList.remove('hidden');
  if (message) message.textContent = 'Der Browser hat die MP3-Wiedergabe angehalten. Aktiviere den Ton, damit die Tonfolge fortgesetzt werden kann.';
  button.disabled = false;
  button.textContent = 'Ton aktivieren';

  castleHearingAudioGatePromise = new Promise(resolve => {
    castleHearingAudioGateResolve = resolve;
    button.onclick = async () => {
      button.disabled = true;
      button.textContent = 'Ton wird aktiviert …';
      const ready = await unlockCastleHearingAudio({ playConfirmation: true });
      if (!ready) {
        button.disabled = false;
        button.textContent = 'Erneut versuchen';
        if (message) message.textContent = 'Die MP3-Wiedergabe ist weiterhin blockiert. Prüfe die Medienlautstärke und tippe erneut.';
        return;
      }
      hideCastleHearingAudioGate();
      const done = castleHearingAudioGateResolve;
      castleHearingAudioGateResolve = null;
      castleHearingAudioGatePromise = null;
      done?.(true);
    };
  });
  return castleHearingAudioGatePromise;
}

async function playCastleHearingMp3(noteIndex) {
  const audio = initCastleHearingHtmlPlayers()[noteIndex];
  if (!audio) return false;

  stopCastleHearingMp3Players(noteIndex);
  try {
    audio.pause();
    audio.currentTime = 0;
    audio.muted = false;
    audio.volume = castleHearingToneVolume();
    await audio.play();
    return true;
  } catch (error) {
    console.warn(`Hörsinn-MP3 ${CASTLE_HEARING_NOTES[noteIndex]?.name || noteIndex} konnte nicht abgespielt werden.`, error);
    castleHearingAudioUnlocked = false;
    return false;
  }
}

async function playCastleHearingTone(noteIndex, durationMs = 700, options = {}) {
  const note = CASTLE_HEARING_NOTES[noteIndex];
  if (!note) {
    await wait(durationMs);
    return false;
  }

  let ready = options.skipUnlock
    ? castleHearingAudioUnlocked
    : await ensureCastleHearingAudioReady({
        fromUserGesture: !!options.fromUserGesture,
        allowGate: options.allowGate !== false
      });

  if (!ready && options.allowGate !== false) ready = await requestCastleHearingAudioGate();
  if (!ready) {
    await wait(durationMs);
    return false;
  }

  beginCastleHearingMusicDuck();
  let started = await playCastleHearingMp3(noteIndex);

  if (!started && options.allowGate !== false) {
    endCastleHearingMusicDuck();
    const reactivated = await requestCastleHearingAudioGate();
    if (reactivated) {
      return playCastleHearingTone(noteIndex, durationMs, { skipUnlock: true, allowGate: false });
    }
    await wait(durationMs);
    return false;
  }

  // The supplied MP3 files are about 0.7 seconds long.
  await wait(Math.max(680, durationMs));
  endCastleHearingMusicDuck();
  return started;
}

function installCastleHearingAudioLifecycleListeners() {
  if (castleHearingAudioListenersInstalled) return;
  castleHearingAudioListenersInstalled = true;

  const suspendMp3Playback = () => {
    if (!activeQuiz?.castleHearing?.running) return;
    stopCastleHearingMp3Players();
    castleHearingAudioUnlocked = false;
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') suspendMp3Playback();
  });
  window.addEventListener('pagehide', suspendMp3Playback);
}

function buildCastleHearingPanel() {
  const panel = document.getElementById('castleHearingPanel');
  if (!panel) return;
  document.getElementById('castleHearingAudioGate')?.remove();
  panel.className = 'quiz-panel castle-hearing-panel';
  panel.innerHTML = `
    <div class="castle-hearing-hud">
      <strong>Hörsinn</strong>
      <span id="castleHearingRound">Runde 1 / ${CASTLE_HEARING_ROUNDS_TOTAL}</span>
    </div>
    <div id="castleHearingFeedback" class="castle-hearing-feedback hidden" aria-live="polite"></div>
    <div id="castleHearingIntro" class="castle-hearing-dialog castle-phase-guide" role="dialog" aria-modal="true" aria-label="Hinweis zum Hörsinn">
      <h2>Hörsinn</h2>
      <p class="castle-phase-guide-lead">Höre genau zu und spiele die Tonfolge nach.</p>
      <div class="mini-guide-slider castle-phase-guide-slider" aria-label="Erklärung Hörsinn">
        <article class="mini-guide-card">
          <div class="mini-guide-icon">👂</div>
          <p class="mini-guide-title">Anhören</p>
          <p class="mini-guide-text">Merke dir die vier Töne.</p>
        </article>
        <article class="mini-guide-card">
          <div class="mini-guide-icon"><span class="mini-guide-inline-row tight"><span class="mini-guide-inline-item">🎵</span><span class="mini-guide-inline-item">🎵</span><span class="mini-guide-inline-item">🎵</span><span class="mini-guide-inline-item">🎵</span></span></div>
          <p class="mini-guide-title">Reihenfolge merken</p>
          <p class="mini-guide-text">Die Reihenfolge ist entscheidend.</p>
        </article>
        <article class="mini-guide-card">
          <div class="mini-guide-icon">🎹</div>
          <p class="mini-guide-title">Nachspielen</p>
          <p class="mini-guide-text">Tippe dieselben Töne nacheinander.</p>
        </article>
      </div>
      <button id="castleHearingStartButton" class="primary-button" type="button">Starten</button>
    </div>
    <div id="castleHearingAudioGate" class="castle-hearing-audio-gate hidden" role="dialog" aria-modal="true" aria-label="Ton aktivieren">
      <div class="castle-hearing-audio-gate-card">
        <strong>Ton erforderlich</strong>
        <p id="castleHearingAudioGateMessage">Der Browser hat den Ton angehalten.</p>
        <button id="castleHearingAudioGateButton" class="primary-button" type="button">Ton aktivieren</button>
      </div>
    </div>`;
  const audioGate = panel.querySelector('#castleHearingAudioGate');
  if (audioGate) document.body.appendChild(audioGate);
  panel.classList.remove('hidden');
}

function updateCastleHearingRoundLabel() {
  const state = activeQuiz?.castleHearing;
  const label = document.getElementById('castleHearingRound');
  if (!state || !label) return;
  label.textContent = `Runde ${state.round} / ${state.totalRounds} · ${CASTLE_HEARING_SEQUENCE_LENGTH} Töne`;
}

function showCastleHearingFeedback(message, duration = 1400) {
  const box = document.getElementById('castleHearingFeedback');
  if (!box) return;
  box.textContent = message;
  box.classList.remove('hidden');
  clearTimeout(showCastleHearingFeedback.timerId);
  showCastleHearingFeedback.timerId = setTimeout(() => box.classList.add('hidden'), duration);
}

function prepareCastleHearingModeVisual() {
  const state = activeQuiz?.castleHearing;
  const zone = document.getElementById('quizBattleZone');
  const layer = document.getElementById('castleHearingLayer');
  const panel = document.getElementById('castleHearingPanel');
  const knight = document.getElementById('quizKnight');
  const enemy = document.getElementById('quizEnemy');
  if (!state || !zone || !layer || !panel || !knight || !enemy) return;

  zone.classList.remove(
    'castle-stand-off-mode','castle-boss-mode','castle-dodge-mode','castle-final-hit-mode',
    'castle-final-question-mode','castle-clone-mode','castle-bush-mode','castle-smell-mode'
  );
  zone.classList.add('castle-hearing-mode');
  layer.classList.remove('hidden');
  panel.classList.remove('hidden');
  knight.className = 'battle-sprite knight-battle castle-hearing-knight';
  knight.src = castleKnightAsset('normal');
  enemy.className = 'battle-sprite enemy-battle castle-hearing-hidden';
  enemy.src = castleEnemyAsset('flyLeft');

  state.knightX = 31;
  zone.style.setProperty('--hearing-knight-x', '31%');
  zone.style.setProperty('--hearing-knight-bottom', '11.5%');
  zone.style.setProperty('--hearing-mage-x', '118%');
  zone.style.setProperty('--hearing-mage-top', '64%');
}

function setCastleHearingKnightPosition(x, bottom = 11.5) {
  const state = activeQuiz?.castleHearing;
  const zone = document.getElementById('quizBattleZone');
  if (!state || !zone) return;
  state.knightX = x;
  zone.style.setProperty('--hearing-knight-x', `${x}%`);
  zone.style.setProperty('--hearing-knight-bottom', `${bottom}%`);
}

function setCastleHearingMagePosition(x, top) {
  const zone = document.getElementById('quizBattleZone');
  if (!zone) return;
  zone.style.setProperty('--hearing-mage-x', `${x}%`);
  zone.style.setProperty('--hearing-mage-top', `${top}%`);
}

function getCastleHearingKey(index) {
  return document.querySelector(`.castle-hearing-key[data-index="${index}"]`);
}

function clearCastleHearingKeys() {
  const layer = document.getElementById('castleHearingLayer');
  if (!layer) return;
  [...layer.querySelectorAll('.castle-hearing-key, .castle-hearing-magic-bolt, .castle-hearing-impact')].forEach(el => el.remove());
  layer.classList.remove('castle-hearing-keys-falling');
}

function buildCastleHearingKeys() {
  const state = activeQuiz?.castleHearing;
  const layer = document.getElementById('castleHearingLayer');
  if (!state || !layer) return;
  clearCastleHearingKeys();
  state.keyXs.forEach((x, index) => {
    const key = document.createElement('button');
    key.type = 'button';
    key.className = 'castle-hearing-key hidden';
    key.dataset.index = String(index);
    key.style.left = `${x}%`;
    key.style.setProperty('--hearing-key-index', String(index));
    key.setAttribute('aria-label', `Taste ${CASTLE_HEARING_NOTES[index].name}`);
    key.innerHTML = `<span class="castle-hearing-key-letter">${CASTLE_HEARING_NOTES[index].name}</span>`;
    key.addEventListener('click', () => handleCastleHearingKeyPress(index));
    layer.appendChild(key);
  });
}

function setCastleHearingKeysEnabled(enabled) {
  document.querySelectorAll('.castle-hearing-key').forEach(key => {
    key.disabled = !enabled;
    key.classList.toggle('castle-hearing-key-enabled', enabled);
  });
}

function flashCastleHearingKey(index, source = 'mage', duration = 430) {
  const key = getCastleHearingKey(index);
  if (!key) return;
  const className = source === 'player' ? 'castle-hearing-key-player-active' : 'castle-hearing-key-mage-active';
  key.classList.remove('castle-hearing-key-player-active','castle-hearing-key-mage-active');
  void key.offsetWidth;
  key.classList.add(className);
  const timer = setTimeout(() => key.classList.remove(className), duration);
  activeQuiz?.castleHearing?.timers?.push(timer);
}

function setCastleHearingOccupiedKey(index = null) {
  document.querySelectorAll('.castle-hearing-key').forEach(key => {
    key.classList.toggle('castle-hearing-key-occupied', Number(key.dataset.index) === index);
  });
}

async function animateCastleHearingMageBottomFlight(token) {
  const state = activeQuiz?.castleHearing;
  const enemy = document.getElementById('quizEnemy');
  if (!state || !enemy || token !== state.attemptToken) return false;

  buildCastleHearingKeys();
  setCastleHearingKeysEnabled(false);
  enemy.src = castleEnemyAsset('flyLeft');
  enemy.classList.remove('castle-hearing-hidden','castle-phase-hidden','castle-hearing-casting');
  const startX = 118;
  const endX = -18;
  const top = 63;
  setCastleHearingMagePosition(startX, top);
  const order = [...state.keyXs.keys()].reverse();
  const revealed = new Set();
  const startTime = performance.now();

  await new Promise(resolve => {
    function frame(now) {
      const current = activeQuiz?.castleHearing;
      if (!current?.running || token !== current.attemptToken) {
        resolve();
        return;
      }
      const progress = Math.min(1, (now - startTime) / CASTLE_HEARING_KEY_FLIGHT_MS);
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      const x = startX + (endX - startX) * eased;
      const bob = Math.sin(progress * Math.PI * 5) * 1.15;
      setCastleHearingMagePosition(x, top + bob);
      order.forEach(index => {
        if (!revealed.has(index) && x <= state.keyXs[index] + 2) {
          revealed.add(index);
          const key = getCastleHearingKey(index);
          key?.classList.remove('hidden');
          key?.classList.add('castle-hearing-key-spawn');
        }
      });
      if (progress < 1) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });

  if (!activeQuiz?.castleHearing?.running || token !== state.attemptToken) return false;
  state.keyXs.forEach((_, index) => getCastleHearingKey(index)?.classList.remove('hidden'));
  enemy.classList.add('castle-hearing-hidden');
  return true;
}

async function animateCastleHearingMageToTopCenter(token) {
  const state = activeQuiz?.castleHearing;
  const enemy = document.getElementById('quizEnemy');
  if (!state || !enemy || token !== state.attemptToken) return false;
  enemy.src = castleEnemyAsset('flyRight');
  enemy.classList.remove('castle-hearing-hidden','castle-phase-hidden');
  const startX = -18;
  const startTop = 5;
  const endX = 50;
  const endTop = 16;
  setCastleHearingMagePosition(startX, startTop);
  const startTime = performance.now();
  await new Promise(resolve => {
    function frame(now) {
      const current = activeQuiz?.castleHearing;
      if (!current?.running || token !== current.attemptToken) {
        resolve();
        return;
      }
      const progress = Math.min(1, (now - startTime) / CASTLE_HEARING_MAGE_RETURN_MS);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCastleHearingMagePosition(
        startX + (endX - startX) * eased,
        startTop + (endTop - startTop) * eased - Math.sin(Math.PI * eased) * 2.5
      );
      if (progress < 1) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });
  if (!activeQuiz?.castleHearing?.running || token !== state.attemptToken) return false;
  enemy.src = castleEnemyAsset('hover');
  setCastleHearingMagePosition(50, 16);
  return true;
}

async function animateCastleHearingMagicBolt(keyIndex, token) {
  const state = activeQuiz?.castleHearing;
  const layer = document.getElementById('castleHearingLayer');
  const enemy = document.getElementById('quizEnemy');
  if (!state || !layer || !enemy || token !== state.attemptToken) return;

  enemy.classList.add('castle-hearing-casting');
  const bolt = document.createElement('span');
  bolt.className = 'castle-hearing-magic-bolt';
  layer.appendChild(bolt);
  const startX = 50;
  const startY = 25;
  const targetX = state.keyXs[keyIndex];
  const targetY = 78;
  const startTime = performance.now();

  await new Promise(resolve => {
    function frame(now) {
      const current = activeQuiz?.castleHearing;
      if (!current?.running || token !== current.attemptToken) {
        bolt.remove();
        resolve();
        return;
      }
      const progress = Math.min(1, (now - startTime) / 460);
      const eased = progress * progress;
      const x = startX + (targetX - startX) * eased;
      const y = startY + (targetY - startY) * eased - Math.sin(Math.PI * progress) * 7;
      bolt.style.left = `${x}%`;
      bolt.style.top = `${y}%`;
      if (progress < 1) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });

  bolt.remove();
  enemy.classList.remove('castle-hearing-casting');
  if (!activeQuiz?.castleHearing?.running || token !== state.attemptToken) return;
  const impact = document.createElement('span');
  impact.className = 'castle-hearing-impact';
  impact.style.left = `${targetX}%`;
  layer.appendChild(impact);
  flashCastleHearingKey(keyIndex, 'mage', CASTLE_HEARING_PREVIEW_NOTE_MS);
  await playCastleHearingTone(keyIndex, CASTLE_HEARING_PREVIEW_NOTE_MS);
  impact.remove();
}

function createCastleHearingSequence(round) {
  const length = Math.min(CASTLE_HEARING_KEY_COUNT, CASTLE_HEARING_SEQUENCE_LENGTH);
  return shuffleArray([...CASTLE_HEARING_NOTES.keys()]).slice(0, length);
}

async function previewCastleHearingSequence(token) {
  const state = activeQuiz?.castleHearing;
  if (!state || token !== state.attemptToken) return false;
  state.sequence = createCastleHearingSequence(state.round);
  state.inputIndex = 0;
  state.locked = true;
  setCastleHearingKeysEnabled(false);
  showCastleHearingFeedback('Höre genau hin und merke dir die Reihenfolge.', 1500);
  await wait(520);

  for (const keyIndex of state.sequence) {
    if (!activeQuiz?.castleHearing?.running || token !== state.attemptToken) return false;
    await animateCastleHearingMagicBolt(keyIndex, token);
    await wait(CASTLE_HEARING_PREVIEW_GAP_MS);
  }

  if (!activeQuiz?.castleHearing?.running || token !== state.attemptToken) return false;
  state.locked = false;
  setCastleHearingKeysEnabled(true);
  showCastleHearingFeedback('Jetzt du: Springe in derselben Reihenfolge auf die Tasten!', 1900);
  return true;
}

async function animateCastleHearingKnightJump(targetX, isReturn = false) {
  const state = activeQuiz?.castleHearing;
  const knight = document.getElementById('quizKnight');
  const zone = document.getElementById('quizBattleZone');
  if (!state || !knight || !zone) return;

  const startX = Number(state.knightX ?? 50);
  const direction = targetX >= startX ? 'right' : 'left';
  const assets = JUMP_ASSETS[direction];
  const duration = isReturn ? CASTLE_HEARING_RETURN_JUMP_MS : CASTLE_HEARING_JUMP_MS;
  const distance = Math.abs(targetX - startX);
  const arc = (isReturn ? 13 : 18) + Math.min(5, distance * 0.08);
  const startTime = performance.now();

  await new Promise(resolve => {
    function frame(now) {
      const current = activeQuiz?.castleHearing;
      if (!current?.running) {
        resolve();
        return;
      }
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      const x = startX + (targetX - startX) * eased;
      const bottom = 10 + Math.sin(Math.PI * eased) * arc;
      zone.style.setProperty('--hearing-knight-x', `${x}%`);
      zone.style.setProperty('--hearing-knight-bottom', `${bottom}%`);
      knight.src = progress < 0.52 ? assets.jump : assets.fall;
      if (progress < 1) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });

  state.knightX = targetX;
  zone.style.setProperty('--hearing-knight-x', `${targetX}%`);
  zone.style.setProperty('--hearing-knight-bottom', '11.5%');
  knight.src = castleKnightAsset('normal');
}

async function playCastleHearingFailure() {
  const state = activeQuiz?.castleHearing;
  const layer = document.getElementById('castleHearingLayer');
  const knight = document.getElementById('quizKnight');
  const enemy = document.getElementById('quizEnemy');
  if (!state || !layer || !knight || !enemy) return;

  state.locked = true;
  setCastleHearingKeysEnabled(false);
  activeQuiz.scorePoints = Math.max(0, (activeQuiz.scorePoints || 0) - 200);
  window.SinnesScore?.setSession('boss_zauberschloss_final', activeQuiz.scorePoints, 5000);
  playSfx(sfxWrong);
  enemy.src = castleEnemyAsset('laugh');
  showCastleSpeech('<strong>So wirst du mich niemals aufhalten!</strong>');
  showCastleHearingFeedback('Falscher Ton! Der Boden bricht auf.', 1600);
  knight.classList.add('castle-hearing-knight-damage');
  await wait(260);
  knight.classList.remove('castle-hearing-knight-damage');

  let abyss = layer.querySelector('.castle-hearing-abyss');
  if (!abyss) {
    abyss = document.createElement('div');
    abyss.className = 'castle-hearing-abyss';
    layer.appendChild(abyss);
  }
  requestAnimationFrame(() => abyss.classList.add('visible'));
  layer.classList.add('castle-hearing-keys-falling');
  await wait(330);

  knight.classList.add('castle-hearing-falling');
  knight.src = JUMP_ASSETS.right.fall;
  const zone = document.getElementById('quizBattleZone');
  const startBottom = 11.5;
  const startTime = performance.now();
  await new Promise(resolve => {
    function frame(now) {
      const progress = Math.min(1, (now - startTime) / 720);
      const bottom = startBottom - progress * 75;
      zone?.style.setProperty('--hearing-knight-bottom', `${bottom}%`);
      knight.style.transform = `translateX(-50%) rotate(${progress * 22}deg)`;
      if (progress < 1) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });

  knight.style.visibility = 'hidden';
  clearCastleHearingKeys();
  abyss.classList.remove('visible');
  await wait(420);
  abyss.remove();
  hideCastleSpeech();

  knight.classList.remove('castle-hearing-falling');
  knight.style.removeProperty('transform');
  knight.style.visibility = 'visible';
  setCastleHearingKnightPosition(50, 11.5);
  knight.src = castleKnightAsset('normal');
  knight.classList.add('castle-hearing-respawn');
  await wait(820);
  knight.classList.remove('castle-hearing-respawn');
}

async function handleCastleHearingKeyPress(keyIndex) {
  const state = activeQuiz?.castleHearing;
  if (!state || !state.running || state.locked) return;
  const expected = state.sequence[state.inputIndex];
  state.locked = true;
  setCastleHearingKeysEnabled(false);

  const audioReady = await ensureCastleHearingAudioReady({ fromUserGesture: true, allowGate: true });
  if (!audioReady || !activeQuiz?.castleHearing?.running) {
    state.locked = false;
    setCastleHearingKeysEnabled(true);
    return;
  }

  setCastleHearingOccupiedKey(null);
  flashCastleHearingKey(keyIndex, 'player', 520);
  const tonePlayback = playCastleHearingTone(keyIndex, 480, { skipUnlock: true, allowGate: true });
  await animateCastleHearingKnightJump(state.keyXs[keyIndex], false);
  await tonePlayback;
  setCastleHearingOccupiedKey(keyIndex);
  if (!activeQuiz?.castleHearing?.running) return;

  if (keyIndex !== expected) {
    await playCastleHearingFailure();
    if (!activeQuiz?.castleHearing?.running) return;
    await restartCastleHearingRoundAttempt();
    return;
  }

  state.inputIndex += 1;
  if (state.inputIndex < state.sequence.length) {
    state.locked = false;
    setCastleHearingKeysEnabled(true);
    showCastleHearingFeedback(`${state.inputIndex} von ${state.sequence.length} Tönen richtig`, 800);
    return;
  }

  showCastleHearingFeedback('Tonfolge richtig!', 1000);
  setCastleHearingOccupiedKey(null);
  await animateCastleHearingKnightJump(50, true);
  if (!activeQuiz?.castleHearing?.running) return;
  await completeCastleHearingRound();
}

async function playCastleHearingAttack() {
  activeQuiz.scorePoints = Math.min(5000, (activeQuiz.scorePoints || 0) + 250);
  window.SinnesScore?.setSession('boss_zauberschloss_final', activeQuiz.scorePoints, 5000);
  const state = activeQuiz?.castleHearing;
  const knight = document.getElementById('quizKnight');
  const enemy = document.getElementById('quizEnemy');
  if (!state || !knight || !enemy) return;
  knight.src = castleKnightAsset('finalAttack');
  enemy.classList.remove('castle-final-damage-blink');
  await animateCastleEnemyStrike({
    knight,
    enemy,
    duration: 1150,
    impactFraction: 0.52,
    enemyHitSrc: castleEnemyAsset('surprised')
  });
  enemy.classList.remove('castle-final-damage-blink');
  knight.src = castleKnightAsset('normal');
  enemy.src = castleEnemyAsset('laugh');
}

async function completeCastleHearingRound() {
  const state = activeQuiz?.castleHearing;
  if (!state || !state.running) return;
  state.locked = true;
  setCastleHearingKeysEnabled(false);
  const correct = await askCastleSenseQuestion('klangwald', 'Hörsinn');
  if (!activeQuiz?.castleHearing?.running) return;

  if (!correct) {
    const enemy = document.getElementById('quizEnemy');
    if (enemy) enemy.src = castleEnemyAsset('laugh');
    showCastleSpeech('<strong>Deine Ohren müssen noch genauer hinhören!</strong>');
    showCastleHearingFeedback('Falsch beantwortet – diese Runde beginnt erneut.', 1600);
    await wait(1000);
    hideCastleSpeech();
    await restartCastleHearingRoundAttempt();
    return;
  }

  await playCastleHearingAttack();
  if (!activeQuiz?.castleHearing?.running) return;
  state.round += 1;
  if (state.round > state.totalRounds) {
    await finishCastleHearingSearch();
    return;
  }
  updateCastleHearingRoundLabel();
  showCastleHearingFeedback(`Treffer! Runde ${state.round} beginnt.`, 1400);
  await wait(500);
  await restartCastleHearingRoundAttempt();
}

async function animateCastleHearingKnightToCenter() {
  const state = activeQuiz?.castleHearing;
  const knight = document.getElementById('quizKnight');
  const zone = document.getElementById('quizBattleZone');
  if (!state || !knight || !zone) return;
  const startX = Number(state.knightX ?? 31);
  const endX = 50;
  const startTime = performance.now();
  let lastFrame = -1;
  await new Promise(resolve => {
    function frame(now) {
      const current = activeQuiz?.castleHearing;
      if (!current?.running) {
        resolve();
        return;
      }
      const progress = Math.min(1, (now - startTime) / 620);
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      const x = startX + (endX - startX) * eased;
      zone.style.setProperty('--hearing-knight-x', `${x}%`);
      const frameIndex = Math.floor(now / 145) % 2;
      if (frameIndex !== lastFrame) {
        knight.src = castleKnightAsset(frameIndex ? 'runRight2' : 'runRight1');
        lastFrame = frameIndex;
      }
      if (progress < 1) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });
  state.knightX = 50;
  zone.style.setProperty('--hearing-knight-x', '50%');
  knight.src = castleKnightAsset('normal');
}

async function runCastleHearingRoundAttempt() {
  const state = activeQuiz?.castleHearing;
  if (!state || !state.running || state.attemptInProgress) return;
  state.attemptInProgress = true;
  state.locked = true;
  state.inputIndex = 0;
  state.sequence = [];
  setCastleHearingKnightPosition(50, 11.5);
  const knight = document.getElementById('quizKnight');
  if (knight) knight.src = castleKnightAsset('normal');
  clearCastleHearingKeys();
  const token = ++state.attemptToken;

  const spawned = await animateCastleHearingMageBottomFlight(token);
  if (!spawned || !activeQuiz?.castleHearing?.running || token !== state.attemptToken) {
    state.attemptInProgress = false;
    return;
  }
  const centered = await animateCastleHearingMageToTopCenter(token);
  if (!centered || !activeQuiz?.castleHearing?.running || token !== state.attemptToken) {
    state.attemptInProgress = false;
    return;
  }
  await wait(380);
  const previewed = await previewCastleHearingSequence(token);
  state.attemptInProgress = false;
  if (!previewed) return;
}

async function restartCastleHearingRoundAttempt() {
  const state = activeQuiz?.castleHearing;
  const enemy = document.getElementById('quizEnemy');
  if (!state || !state.running) return;
  state.locked = true;
  state.attemptToken += 1;
  state.attemptInProgress = false;
  state.sequence = [];
  state.inputIndex = 0;
  setCastleHearingKeysEnabled(false);
  clearCastleHearingKeys();
  setCastleHearingKnightPosition(50, 11.5);
  if (enemy) enemy.classList.add('castle-hearing-hidden');
  await wait(260);
  runCastleHearingRoundAttempt();
}

async function startCastleHearingSearchSequence() {
  cleanupCastleHearingGame();
  cleanupCastleUltimateGame();
  const modal = ensureQuizModal();
  const panel = document.getElementById('castleHearingPanel');
  const layer = document.getElementById('castleHearingLayer');
  const zone = document.getElementById('quizBattleZone');
  const knight = document.getElementById('quizKnight');
  const enemy = document.getElementById('quizEnemy');
  if (!activeQuiz || !panel || !layer || !zone || !knight || !enemy) return;

  modal.querySelector('#quizGame')?.classList.add('hidden');
  modal.querySelector('#quizIntro')?.classList.add('hidden');
  modal.querySelector('#quizResult')?.classList.add('hidden');
  modal.querySelector('#castleDodgePanel')?.classList.add('hidden');
  modal.querySelector('#castleSmellPanel')?.classList.add('hidden');
  modal.querySelector('#castleClonePanel')?.classList.add('hidden');
  modal.querySelector('#castleFinalQuestionPanel')?.classList.add('hidden');

  activeQuiz.castleHearing = {
    running: true,
    started: false,
    audioActivating: false,
    round: 1,
    totalRounds: CASTLE_HEARING_ROUNDS_TOTAL,
    locked: true,
    attemptToken: 0,
    attemptInProgress: false,
    timers: [],
    knightX: 31,
    sequence: [],
    inputIndex: 0,
    keyXs: [15, 32.5, 50, 67.5, 85]
  };

  buildCastleHearingPanel();
  updateCastleHearingRoundLabel();
  prepareCastleHearingModeVisual();
  primeCastleHearingAudioFiles();
  installCastleHearingAudioLifecycleListeners();
  const hearingStartButton = document.getElementById('castleHearingStartButton');
  hearingStartButton?.addEventListener('click', async () => {
    const state = activeQuiz?.castleHearing;
    if (!state || state.started || state.audioActivating) return;
    state.audioActivating = true;
    hearingStartButton.disabled = true;
    hearingStartButton.textContent = 'Ton wird aktiviert …';
    const audioUnlockAttempt = unlockCastleHearingAudio({ playConfirmation: false });
    unlockSfxForMobile();

    const audioReady = await audioUnlockAttempt;
    if (!activeQuiz?.castleHearing?.running) return;
    if (!audioReady) {
      state.audioActivating = false;
      hearingStartButton.disabled = false;
      hearingStartButton.textContent = 'Erneut versuchen';
        return;
    }

    state.audioActivating = false;
    state.started = true;
    document.getElementById('castleHearingIntro')?.classList.add('hidden');
    await animateCastleHearingKnightToCenter();
    if (activeQuiz?.castleHearing?.running) runCastleHearingRoundAttempt();
  });
}

async function finishCastleHearingSearch() {
  const state = activeQuiz?.castleHearing;
  if (!state || !state.running) return;
  state.running = false;
  state.attemptToken += 1;
  showCastleHearingFeedback('Der Klangzauber ist gebrochen!', 1200);
  await wait(520);
  await animateCastleActorsToStandardPose();
  cleanupCastleHearingGame();
  await pauseCastleBeforeNextPhase('<strong>Genug gespielt!</strong><br>Jetzt entfessele ich meine ganze Macht.', 'left');
  if (activeQuiz && !activeQuiz.finished) await startCastleUltimateSequence();
}


function createCastleUltimateQuestions() {
  const grouped = new Map();
  CASTLE_ULTIMATE_STATEMENTS.forEach(item => {
    if (!grouped.has(item.topic)) grouped.set(item.topic, []);
    grouped.get(item.topic).push(item);
  });
  const coreTopics = ['Sehen', 'Hören', 'Tasten', 'Riechen', 'Schmecken'];
  const selected = coreTopics.map(topic => {
    const pool = grouped.get(topic) || [];
    return pool[Math.floor(Math.random() * pool.length)];
  }).filter(Boolean);
  const remaining = CASTLE_ULTIMATE_STATEMENTS.filter(item => !selected.includes(item));
  selected.push(...shuffleArray(remaining).slice(0, Math.max(0, CASTLE_ULTIMATE_QUESTION_COUNT - selected.length)));
  return shuffleArray(selected).slice(0, CASTLE_ULTIMATE_QUESTION_COUNT);
}

function setCastleUltimateMagePosition(x, top = 5) {
  const zone = document.getElementById('quizBattleZone');
  if (!zone) return;
  zone.style.setProperty('--ultimate-mage-x', `${x}%`);
  zone.style.setProperty('--ultimate-mage-top', `${top}%`);
}


function alignCastleUltimateColumn() {
  const zone = document.getElementById('quizBattleZone');
  const knight = document.getElementById('quizKnight');
  const enemy = document.getElementById('quizEnemy');
  const orb = document.getElementById('castleUltimateOrb');
  if (!zone) return;

  zone.style.setProperty('--ultimate-knight-x', '50%');
  zone.style.setProperty('--ultimate-mage-x', '50%');
  if (knight) {
    knight.style.setProperty('left', '50%', 'important');
    knight.style.setProperty('right', 'auto', 'important');
  }
  if (enemy) {
    enemy.style.setProperty('left', '50%', 'important');
    enemy.style.setProperty('right', 'auto', 'important');
  }
  if (orb) orb.style.left = '50%';
}

function clearCastleUltimateQuestionOverlay() {
  const panel = document.getElementById('castleUltimatePanel');
  hideCastleSenseQuestionPanel();
  if (!panel) return;
  panel.classList.add('castle-ultimate-panel-fading');
}

function showCastleUltimateIntro() {
  const panel = document.getElementById('castleUltimatePanel');
  if (!panel) return Promise.resolve();
  panel.className = 'quiz-panel castle-ultimate-panel';
  panel.innerHTML = `
    <div class="castle-phase-guide castle-ultimate-intro" role="dialog" aria-modal="true" aria-label="Hinweis zur letzten Prüfung">
      <h2>Letzte Prüfung</h2>
      <p class="castle-phase-guide-lead">Nutze jetzt dein Wissen über alle fünf Sinne.</p>
      <div class="mini-guide-slider castle-phase-guide-slider" aria-label="Erklärung letzte Prüfung">
        <article class="mini-guide-card">
          <div class="mini-guide-icon"><span class="mini-guide-inline-row tight"><span class="mini-guide-inline-item">👀</span><span class="mini-guide-inline-item">👂</span><span class="mini-guide-inline-item">👃</span><span class="mini-guide-inline-item">👅</span><span class="mini-guide-inline-item">✋</span></span></div>
          <p class="mini-guide-title">Alle Sinne</p>
          <p class="mini-guide-text">Denke an alles, was du gelernt hast.</p>
        </article>
        <article class="mini-guide-card">
          <div class="mini-guide-icon"><span class="mini-guide-inline-row"><span class="mini-guide-inline-item">✅</span><span class="mini-guide-inline-item">❌</span></span></div>
          <p class="mini-guide-title">Richtig oder falsch</p>
          <p class="mini-guide-text">Bewerte jede Aussage sorgfältig.</p>
        </article>
        <article class="mini-guide-card">
          <div class="mini-guide-icon">⏱️</div>
          <p class="mini-guide-title">Zeit beachten</p>
          <p class="mini-guide-text">Beantworte alle Fragen rechtzeitig.</p>
        </article>
      </div>
      <button id="castleUltimateIntroButton" class="primary-button" type="button">Letzte Prüfung starten</button>
    </div>`;
  panel.classList.remove('hidden');
  return new Promise(resolve => {
    document.getElementById('castleUltimateIntroButton')?.addEventListener('click', resolve, { once: true });
  });
}

function buildCastleUltimatePanel() {
  const state = activeQuiz?.castleUltimate;
  const panel = document.getElementById('castleUltimatePanel');
  if (!state || !panel) return;
  const cards = state.questions.map((item, index) => `
    <article class="castle-ultimate-card" data-index="${index}" aria-hidden="${index === 0 ? 'false' : 'true'}">
      <span class="castle-ultimate-topic">${item.topic}</span>
      <p class="castle-ultimate-statement">${item.statement}</p>
      <div class="castle-ultimate-answer-row">
        <button type="button" class="castle-ultimate-answer castle-ultimate-true" data-value="true">Richtig</button>
        <button type="button" class="castle-ultimate-answer castle-ultimate-false" data-value="false">Falsch</button>
      </div>
    </article>
  `).join('');

  panel.innerHTML = `
    <div class="castle-ultimate-hud">
      <strong>Letzte Prüfung</strong>
      <span id="castleUltimateTimer">60</span>
    </div>
    <div class="castle-ultimate-progress" aria-hidden="true"><span id="castleUltimateProgressFill"></span></div>
    <div class="castle-ultimate-slider-window">
      <div id="castleUltimateSliderTrack" class="castle-ultimate-slider-track">${cards}</div>
    </div>
    <div class="castle-ultimate-footer">
      <span id="castleUltimateCounter">1 / ${state.questions.length}</span>
      <span id="castleUltimateFeedback" class="castle-ultimate-feedback">Entscheide: richtig oder falsch.</span>
    </div>
  `;
  panel.classList.remove('hidden');
  panel.querySelectorAll('.castle-ultimate-answer').forEach(button => {
    button.addEventListener('click', () => answerCastleUltimateStatement(button.dataset.value === 'true'));
  });
  updateCastleUltimateSlider();
}

function updateCastleUltimateSlider() {
  const state = activeQuiz?.castleUltimate;
  if (!state) return;
  const track = document.getElementById('castleUltimateSliderTrack');
  const counter = document.getElementById('castleUltimateCounter');
  const fill = document.getElementById('castleUltimateProgressFill');
  if (track) track.style.transform = `translateX(-${state.index * 100}%)`;
  if (counter) counter.textContent = `${Math.min(state.index + 1, state.questions.length)} / ${state.questions.length}`;
  if (fill) fill.style.width = `${(state.index / state.questions.length) * 100}%`;
  document.querySelectorAll('.castle-ultimate-card').forEach((card, index) => {
    card.setAttribute('aria-hidden', index === state.index ? 'false' : 'true');
  });
}

function setCastleUltimateAnswersEnabled(enabled) {
  document.querySelectorAll('.castle-ultimate-answer').forEach(button => {
    button.disabled = !enabled;
  });
}

function setCastleUltimateFeedback(message, kind = '') {
  const feedback = document.getElementById('castleUltimateFeedback');
  if (!feedback) return;
  feedback.textContent = message;
  feedback.className = `castle-ultimate-feedback${kind ? ` ${kind}` : ''}`;
}

async function animateCastleUltimateMageEntry() {
  const state = activeQuiz?.castleUltimate;
  const enemy = document.getElementById('quizEnemy');
  if (!state || !enemy) return false;
  enemy.src = castleEnemyAsset('flyLeft');
  enemy.classList.remove('castle-phase-hidden', 'castle-ultimate-defeated');
  const startX = 118;
  const endX = 50;
  const startTop = 13;
  const endTop = 4.5;
  setCastleUltimateMagePosition(startX, startTop);
  const startTime = performance.now();
  await new Promise(resolve => {
    function frame(now) {
      const current = activeQuiz?.castleUltimate;
      if (!current?.running) return resolve();
      const progress = Math.min(1, (now - startTime) / 1150);
      const eased = 1 - Math.pow(1 - progress, 3);
      const x = startX + (endX - startX) * eased;
      const top = startTop + (endTop - startTop) * eased - Math.sin(Math.PI * eased) * 2.2;
      setCastleUltimateMagePosition(x, top);
      if (progress < 1) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });
  if (!activeQuiz?.castleUltimate?.running) return false;
  const zone = document.getElementById('quizBattleZone');
  if (zone) {
    zone.style.setProperty('--ultimate-knight-x', '50%');
    zone.style.setProperty('--ultimate-mage-x', '50%');
  }
  enemy.src = castleEnemyAsset('hover');
  enemy.classList.add('castle-ultimate-casting');
  setCastleUltimateMagePosition(50, endTop);
  alignCastleUltimateColumn();
  return true;
}

function startCastleUltimateCountdown() {
  const state = activeQuiz?.castleUltimate;
  if (!state || !state.running) return;
  state.deadline = performance.now() + CASTLE_ULTIMATE_DURATION_MS;
  state.lastMusicStabilizeAt = 0;
  stabilizeCastleUltimateBossMusic();
  const layer = document.getElementById('castleUltimateLayer');
  const timer = document.getElementById('castleUltimateTimer');

  function frame(now) {
    const current = activeQuiz?.castleUltimate;
    if (!current?.running || current.finished) return;
    const remaining = Math.max(0, current.deadline - now);
    if (!current.lastMusicStabilizeAt || now - current.lastMusicStabilizeAt >= 500) {
      current.lastMusicStabilizeAt = now;
      stabilizeCastleUltimateBossMusic();
    }
    const elapsedProgress = Math.min(1, Math.max(0, 1 - remaining / CASTLE_ULTIMATE_DURATION_MS));
    if (timer) {
      timer.textContent = String(Math.max(0, Math.ceil(remaining / 1000)));
      timer.classList.toggle('urgent', remaining <= 10000);
    }
    if (layer) {
      layer.style.setProperty('--ultimate-orb-progress', elapsedProgress.toFixed(4));
      layer.style.setProperty('--ultimate-orb-scale', (0.72 + elapsedProgress * 1.95).toFixed(4));
      layer.style.setProperty('--ultimate-glow-a', `${18 + elapsedProgress * 40}px`);
      layer.style.setProperty('--ultimate-glow-b', `${44 + elapsedProgress * 65}px`);
      layer.style.setProperty('--ultimate-saturation', String(1 + elapsedProgress * 0.45));
      layer.style.setProperty('--ultimate-brightness', String(1 + elapsedProgress * 0.18));
    }
    if (remaining <= 0) {
      failCastleUltimateByTimeout();
      return;
    }
    current.rafId = requestAnimationFrame(frame);
  }
  state.rafId = requestAnimationFrame(frame);
}

async function answerCastleUltimateStatement(selectedValue) {
  const state = activeQuiz?.castleUltimate;
  if (!state || !state.running || state.finished || state.locked) return;
  const current = state.questions[state.index];
  if (!current) return;
  state.locked = true;
  setCastleUltimateAnswersEnabled(false);
  const card = document.querySelector(`.castle-ultimate-card[data-index="${state.index}"]`);
  const correct = selectedValue === current.answer;

  if (!correct) {
    activeQuiz.scorePoints = Math.max(0, (activeQuiz.scorePoints || 0) - 50);
    window.SinnesScore?.setSession('boss_zauberschloss_final', activeQuiz.scorePoints, 5000);
    state.deadline -= CASTLE_ULTIMATE_WRONG_PENALTY_MS;
    playSfx(sfxWrong);
    scheduleCastleUltimateMusicRestore();
    card?.classList.add('wrong');
    setCastleUltimateFeedback('Falsch – 2 Sekunden verloren.', 'wrong');
    await wait(520);
    card?.classList.remove('wrong');
    if (!activeQuiz?.castleUltimate?.running || state.finished) return;
    state.locked = false;
    setCastleUltimateAnswersEnabled(true);
    return;
  }

  activeQuiz.scorePoints = Math.min(5000, (activeQuiz.scorePoints || 0) + 250);
  window.SinnesScore?.setSession('boss_zauberschloss_final', activeQuiz.scorePoints, 5000);
  card?.classList.add('correct');
  setCastleUltimateFeedback('Richtig!', 'correct');
  const completesFinale = state.index + 1 >= state.questions.length;
  playSfx(sfxCorrect);
  if (!completesFinale) scheduleCastleUltimateMusicRestore();
  if (completesFinale) {
    state.completing = true;
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }
  }
  await wait(260);
  if (!activeQuiz?.castleUltimate?.running || state.finished) return;
  state.index += 1;
  if (state.index >= state.questions.length) {
    await completeCastleUltimateSuccess();
    return;
  }
  updateCastleUltimateSlider();
  setCastleUltimateFeedback('Nächste Aussage.', '');
  state.locked = false;
  setCastleUltimateAnswersEnabled(true);
}

async function animateCastleUltimateKnightIntoOrb() {
  const state = activeQuiz?.castleUltimate;
  const zone = document.getElementById('quizBattleZone');
  const knight = document.getElementById('quizKnight');
  const orb = document.getElementById('castleUltimateOrb');
  if (!state || !zone || !knight || !orb) return;

  alignCastleUltimateColumn();
  const zoneRect = zone.getBoundingClientRect();
  const knightRect = knight.getBoundingClientRect();
  const orbRect = orb.getBoundingClientRect();
  const startBottom = Math.max(0, zoneRect.bottom - knightRect.bottom);
  const startCenterX = knightRect.left + knightRect.width / 2 - zoneRect.left;
  const targetCenterX = orbRect.left + orbRect.width / 2 - zoneRect.left;
  const knightCenterY = knightRect.top + knightRect.height / 2;
  const orbCenterY = orbRect.top + orbRect.height / 2;
  const risePx = Math.max(100, knightCenterY - orbCenterY);
  const startTime = performance.now();
  knight.src = castleKnightAsset('finalAttack');
  knight.classList.add('castle-ultimate-knight-glow');

  await new Promise(resolve => {
    function frame(now) {
      const current = activeQuiz?.castleUltimate;
      if (!current?.running) return resolve();
      const progress = Math.min(1, (now - startTime) / 1050);
      const eased = 1 - Math.pow(1 - progress, 3);
      const bottomPx = startBottom + risePx * eased;
      const centerX = startCenterX + (targetCenterX - startCenterX) * eased;
      knight.style.setProperty('left', `${centerX}px`, 'important');
      knight.style.setProperty('bottom', `${bottomPx}px`, 'important');
      if (progress < 1) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });
  knight.style.visibility = 'hidden';
}

function getCastleUltimateElementCenterPercent(element, layer = document.getElementById('castleUltimateLayer')) {
  if (!element || !layer) return { x: 50, y: 29 };
  const layerRect = layer.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  if (!layerRect.width || !layerRect.height) return { x: 50, y: 29 };
  return {
    x: ((rect.left + rect.width / 2 - layerRect.left) / layerRect.width) * 100,
    y: ((rect.top + rect.height / 2 - layerRect.top) / layerRect.height) * 100
  };
}

function spawnCastleUltimateExplosion(xPercent = 50, yPercent = 29) {
  const layer = document.getElementById('castleUltimateLayer');
  if (!layer) return null;
  const explosion = document.createElement('div');
  explosion.className = 'castle-ultimate-explosion';
  explosion.style.left = `${xPercent}%`;
  explosion.style.top = `${yPercent}%`;
  layer.appendChild(explosion);
  return explosion;
}

async function completeCastleUltimateSuccess() {
  const state = activeQuiz?.castleUltimate;
  const panel = document.getElementById('castleUltimatePanel');
  const orb = document.getElementById('castleUltimateOrb');
  const enemy = document.getElementById('quizEnemy');
  if (!state || !state.running || state.finished || !orb || !enemy) return;
  state.finished = true;
  state.locked = true;
  if (state.rafId) cancelAnimationFrame(state.rafId);
  setCastleUltimateAnswersEnabled(false);
  setCastleUltimateFeedback('Alle Aussagen geschafft! Zerstöre die Kugel!', 'correct');
  panel?.classList.add('castle-ultimate-success');
  clearCastleUltimateQuestionOverlay();
  orb.classList.add('castle-ultimate-orb-stabilized');
  alignCastleUltimateColumn();
  await wait(460);
  panel?.classList.add('hidden');
  panel?.classList.remove('castle-ultimate-panel-fading');

  await animateCastleUltimateKnightIntoOrb();
  if (!activeQuiz?.castleUltimate?.running) return;
  playSfx(sfxMageHit);
  const explosionPoint = getCastleUltimateElementCenterPercent(orb);
  orb.classList.add('castle-ultimate-orb-exploding');
  spawnCastleUltimateExplosion(explosionPoint.x, explosionPoint.y);
  enemy.src = castleEnemyAsset('surprised');
  enemy.classList.remove('castle-ultimate-casting');
  enemy.classList.add('castle-final-damage-blink', 'castle-ultimate-defeated');
  keepBossMusicThroughCastleVictory();
  await wait(1700);

  if (!activeQuiz) return;
  activeQuiz.hearts = Math.max(1, activeQuiz.hearts);
  activeQuiz.correct = activeQuizQuestions().length;
  activeQuiz.finished = true;
  cleanupCastleUltimateGame();
  keepBossMusicThroughCastleVictory();
  showQuizResult();
}

async function animateCastleUltimateOrbStrike() {
  const state = activeQuiz?.castleUltimate;
  const layer = document.getElementById('castleUltimateLayer');
  const orb = document.getElementById('castleUltimateOrb');
  const knight = document.getElementById('quizKnight');
  if (!state || !layer || !orb || !knight) return;
  const layerRect = layer.getBoundingClientRect();
  const knightRect = knight.getBoundingClientRect();
  const startPoint = getCastleUltimateElementCenterPercent(orb, layer);
  const startX = startPoint.x;
  const startY = startPoint.y;
  const endX = ((knightRect.left + knightRect.width / 2 - layerRect.left) / layerRect.width) * 100;
  const endY = ((knightRect.top + knightRect.height / 2 - layerRect.top) / layerRect.height) * 100;
  const startTime = performance.now();
  orb.classList.add('castle-ultimate-orb-launched');

  await new Promise(resolve => {
    function frame(now) {
      const progress = Math.min(1, (now - startTime) / 760);
      const eased = progress * progress;
      orb.style.left = `${startX + (endX - startX) * eased}%`;
      orb.style.top = `${startY + (endY - startY) * eased}%`;
      layer.style.setProperty('--ultimate-orb-scale', String(2.65 + progress * 0.8));
      if (progress < 1) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });
}

async function retryCastleUltimatePhase() {
  const retryButton = document.getElementById('castleUltimateRetryButton');
  if (retryButton) retryButton.disabled = true;
  cleanupCastleUltimateGame();
  if (!activeQuiz) return;
  activeQuiz.finished = false;
  activeQuiz.castleUltimateFailed = false;
  activeQuiz.hearts = Math.max(1, activeQuiz.hearts || 1);
  document.getElementById('quizBattleZone')?.classList.remove('castle-victory-result-mode');
  setCastleStandardBattlePoseVisual();
  await wait(260);
  await flyCastleMageOutBeforePhase('left');
  if (activeQuiz && !activeQuiz.finished) await startCastleUltimateSequence();
}

function showCastleUltimateRetryPopup() {
  const panel = document.getElementById('castleUltimatePanel');
  if (!panel) return;
  panel.className = 'quiz-panel castle-ultimate-panel castle-ultimate-retry-panel';
  panel.innerHTML = `
    <div class="castle-ultimate-retry-card" role="dialog" aria-modal="true" aria-labelledby="castleUltimateRetryTitle">
      <h2 id="castleUltimateRetryTitle">Du warst zu langsam</h2>
      <p>Versuche es noch einmal.</p>
      <button id="castleUltimateRetryButton" class="primary-button" type="button">Letzte Phase wiederholen</button>
    </div>
  `;
  panel.classList.remove('hidden', 'castle-ultimate-panel-fading', 'castle-ultimate-success');
  document.getElementById('castleUltimateRetryButton')?.addEventListener('click', retryCastleUltimatePhase, { once: true });
}

async function failCastleUltimateByTimeout() {
  const state = activeQuiz?.castleUltimate;
  const panel = document.getElementById('castleUltimatePanel');
  const enemy = document.getElementById('quizEnemy');
  const knight = document.getElementById('quizKnight');
  if (!state || !state.running || state.finished || !enemy || !knight) return;

  state.failureCinematic = true;
  state.finished = true;
  state.locked = true;
  if (state.rafId) cancelAnimationFrame(state.rafId);
  state.rafId = null;
  setCastleUltimateAnswersEnabled(false);
  clearCastleUltimateQuestionOverlay();
  alignCastleUltimateColumn();
  stabilizeCastleUltimateBossMusic();
  await wait(520);
  panel?.classList.add('hidden');
  panel?.classList.remove('castle-ultimate-panel-fading');
  enemy.src = castleEnemyAsset('laugh');
  showCastleSpeech('<strong>Zu langsam!</strong>');
  await wait(1500);
  hideCastleSpeech();
  alignCastleUltimateColumn();
  stabilizeCastleUltimateBossMusic();

  enemy.classList.remove('castle-ultimate-casting');
  await animateCastleUltimateOrbStrike();
  playSfx(sfxWrong);
  scheduleCastleUltimateMusicRestore();
  const impactX = Number.parseFloat(document.getElementById('castleUltimateOrb')?.style.left) || 50;
  const impactY = Number.parseFloat(document.getElementById('castleUltimateOrb')?.style.top) || 78;
  spawnCastleUltimateExplosion(impactX, impactY);
  knight.classList.add('castle-ultimate-knight-hit');
  await wait(1050);
  knight.classList.remove('castle-ultimate-knight-hit');

  if (!activeQuiz?.castleUltimate) return;
  activeQuiz.castleUltimateFailed = true;
  showCastleUltimateRetryPopup();
}

async function startCastleUltimateSequence() {
  cleanupCastleUltimateGame();
  setBossMusicMode('full');
  const modal = ensureQuizModal();
  const zone = document.getElementById('quizBattleZone');
  const knight = document.getElementById('quizKnight');
  const enemy = document.getElementById('quizEnemy');
  const layer = document.getElementById('castleUltimateLayer');
  const panel = document.getElementById('castleUltimatePanel');
  if (!activeQuiz || !zone || !knight || !enemy || !layer || !panel) return;

  modal.querySelector('#quizGame')?.classList.add('hidden');
  modal.querySelector('#quizIntro')?.classList.add('hidden');
  modal.querySelector('#quizResult')?.classList.add('hidden');
  modal.querySelector('#castleDodgePanel')?.classList.add('hidden');
  modal.querySelector('#castleClonePanel')?.classList.add('hidden');
  modal.querySelector('#castleSmellPanel')?.classList.add('hidden');
  modal.querySelector('#castleHearingPanel')?.classList.add('hidden');
  modal.querySelector('#castleFinalQuestionPanel')?.classList.add('hidden');

  activeQuiz.castleUltimate = {
    running: true,
    finished: false,
    locked: true,
    completing: false,
    failureCinematic: false,
    questions: createCastleUltimateQuestions(),
    index: 0,
    deadline: 0,
    rafId: null,
    timers: []
  };

  zone.classList.remove('castle-stand-off-mode', 'castle-hearing-mode', 'castle-final-hit-mode');
  zone.classList.add('castle-ultimate-mode');
  zone.style.setProperty('--ultimate-knight-x', '50%');
  zone.style.setProperty('--ultimate-knight-bottom', '1.5%');
  zone.style.setProperty('--ultimate-mage-x', '118%');
  zone.style.setProperty('--ultimate-mage-top', '10%');
  knight.src = castleKnightAsset('normal');
  knight.className = 'battle-sprite knight-battle';
  enemy.className = 'battle-sprite enemy-battle';
  enemy.src = castleEnemyAsset('flyLeft');
  layer.innerHTML = `
    <div id="castleUltimateOrb" class="castle-ultimate-orb" aria-hidden="true">
      <span class="castle-ultimate-orb-core"></span>
      <span class="castle-ultimate-orb-ring ring-one"></span>
      <span class="castle-ultimate-orb-ring ring-two"></span>
    </div>
  `;
  layer.classList.remove('hidden');
  layer.style.setProperty('--ultimate-orb-scale', '.72');
  layer.style.setProperty('--ultimate-orb-progress', '0');
  layer.style.setProperty('--ultimate-glow-a', '18px');
  layer.style.setProperty('--ultimate-glow-b', '44px');
  layer.style.setProperty('--ultimate-saturation', '1');
  layer.style.setProperty('--ultimate-brightness', '1');
  panel.classList.add('hidden');

  const entered = await animateCastleUltimateMageEntry();
  if (!entered || !activeQuiz?.castleUltimate?.running) return;
  alignCastleUltimateColumn();
  stabilizeCastleUltimateBossMusic();
  await showCastleUltimateIntro();
  if (!activeQuiz?.castleUltimate?.running) return;
  buildCastleUltimatePanel();
  document.getElementById('castleUltimateOrb')?.classList.add('visible');
  const finalState = activeQuiz.castleUltimate;
  finalState.locked = false;
  setCastleUltimateAnswersEnabled(true);
  startCastleUltimateCountdown();
}

function hideCastleVictoryScene() {
  const scene = document.getElementById('castleVictoryScene');
  if (!scene) return;
  scene.classList.add('hidden');
  scene.style.removeProperty('--castle-victory-bottom');
  scene.style.removeProperty('--castle-victory-size');
}

function positionCastleVictoryScene() {
  const scene = document.getElementById('castleVictoryScene');
  const card = scene?.closest('.quiz-card');
  if (!scene || !card || scene.classList.contains('hidden')) return;

  const cardRect = card.getBoundingClientRect();
  if (!cardRect.height || !cardRect.width) return;

  const size = Math.max(112, Math.min(158, cardRect.width * 0.21));
  const bottom = Math.max(260, Math.min(cardRect.height * 0.42, cardRect.height - size - 70));

  scene.style.setProperty('--castle-victory-bottom', `${bottom}px`);
  scene.style.setProperty('--castle-victory-size', `${size}px`);
}

function showCastleVictoryScene(knightSrc, mageSrc) {
  const scene = document.getElementById('castleVictoryScene');
  const knight = document.getElementById('castleVictoryKnight');
  const mage = document.getElementById('castleVictoryMage');
  if (!scene || !knight || !mage) return;

  knight.src = knightSrc;
  mage.src = mageSrc;
  scene.classList.remove('hidden');
  requestAnimationFrame(() => {
    positionCastleVictoryScene();
    requestAnimationFrame(positionCastleVictoryScene);
  });
}

function keepBossMusicThroughCastleVictory() {
  pauseCastleUltimateMusic();
  bossMusicWanted = true;
  bossMusicMode = 'full';
  try {
    bossMusic.loop = false;
    if (bossMusic.currentTime >= BOSS_MUSIC_LOOP_END_SECONDS) {
      bossMusic.currentTime = BOSS_MUSIC_LOOP_START_SECONDS;
    }
    bossMusic.volume = currentVolume();
    if (bossMusic.paused) bossMusic.play().catch(() => {});
  } catch {}
}

window.addEventListener('resize', positionCastleVictoryScene);

function showQuizEndPanel() {
  if (activeQuiz && activeQuiz.hearts <= 0) playGameOverSound();
  activeQuiz.finished = true;
  setBossMusicMode('full');
  clearInterval(quizTimer);
  const modal = ensureQuizModal();
  modal.querySelector('#quizGame').classList.add('hidden');
  document.getElementById('battleFeedback').classList.add('hidden');
  showQuizResult();
}

function showQuizResult() {
  window.SinnesScore?.setGameplayActive(false);
  const won = activeQuiz.hearts > 0;
  const modal = ensureQuizModal();
  const quizGame = modal.querySelector('#quizGame');
  quizGame.classList.add('hidden');
  quizGame.style.display = 'none';
  modal.querySelector('#quizIntro').classList.add('hidden');
  document.getElementById('battleFeedback').classList.add('hidden');
  const knight = document.getElementById('quizKnight');
  const enemy = document.getElementById('quizEnemy');
  const battleZone = document.getElementById('quizBattleZone');
  document.getElementById('castleUltimatePanel')?.classList.add('hidden');
  hideCastleSenseQuestionPanel();
  const castleVictory = won && isCastleBossQuiz();
  battleZone?.classList.toggle('castle-victory-result-mode', castleVictory);
  hideCastleVictoryScene();
  knight.classList.remove('sprite-pop', 'sprite-shake', 'knight-strike', 'knight-damaged', 'knight-attack-pose');
  enemy.classList.remove('sprite-shake', 'enemy-hit', 'enemy-attack-strike');
  knight.src = won ? knightAsset('victory') : knightAsset('defeated');
  enemy.src = won
    ? (castleVictory ? castleDefeatedMageAsset() : enemyAsset(activeQuiz.data.enemy, 'defeated'))
    : enemyAsset(activeQuiz.data.enemy, 'normal');

  let fragmentStatus = { gained: false, reward: null, total: readFragments().size, allCollected: false };
  if (won) {
    const quizMax = castleVictory ? 5000 : 1000;
    const activityId = castleVictory ? 'boss_zauberschloss_final' : `quiz_${activeQuiz.quizId}`;
    const earnedScore = Math.max(0, Math.min(quizMax, Math.round(activeQuiz.scorePoints || 0)));
    window.SinnesScore?.setSession(activityId, earnedScore, quizMax);
    window.SinnesScore?.finishSession(activityId, earnedScore, quizMax);
    setAreaProgress({ level2Completed: true });
    applyMarkerStates();
    fragmentStatus = awardFragment(activeQuiz.quizId);
    if (isCastleBossQuiz()) {
      writePendingNotice({ type: 'castleBossComplete', area: 'zauberschloss' });
    } else {
      writePendingNotice({ type: 'fragment', area: activeQuiz.quizId, gained: fragmentStatus.gained, allCollected: fragmentStatus.allCollected });
    }
  }

  const result = modal.querySelector('#quizResult');
  result.className = 'quiz-result quiz-panel quiz-final-result';

  if (won) {
    const resultFollowUp = castleVictory
      ? 'Das nächste Level wird gleich freigeschaltet.'
      : 'Deine Belohnung erscheint gleich auf der Weltkarte.';
    result.innerHTML = `
      <h2>Boss besiegt!</h2>
      <div class="visual-notice compact-final-notice">
        <p>${activeQuiz.correct}/${activeQuizQuestions().length} Fragen richtig beantwortet.</p>
        <p>${resultFollowUp}</p>
      </div>
      <div class="quiz-result-actions single-action">
        <button id="closeQuizButton" class="primary-button" type="button">${castleVictory ? 'Zurück zum Zauberschloss' : 'Zur Weltkarte'}</button>
      </div>
    `;
    // Dasselbe Siegeslied wird nach jeder erfolgreich abgeschlossenen
    // Bossbegegnung gespielt – nicht nur beim Magier im Zauberschloss.
    if (castleVictory) {
      showCastleVictoryScene(knight.src, enemy.src);
    }
    playCastleWinMusic();
    document.getElementById('closeQuizButton').addEventListener('click', castleVictory ? returnToCastleLevel : returnToOverworld);
    return;
  }

  const lossMessage = activeQuiz.castleUltimateFailed
    ? 'Der Energieball hat den Ritter getroffen. Beantworte die letzte Prüfung beim nächsten Versuch rechtzeitig.'
    : `Du hast ${activeQuiz.correct} von ${activeQuizQuestions().length} Fragen richtig beantwortet.`;
  result.innerHTML = `
    <h2>Verloren!</h2>
    <p>${lossMessage}</p>
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

async function returnToCastleLevel() {
  hideCastleVictoryScene();
  cleanupCastleDodgeGame();
  cleanupCastleCloneSearch();
  cleanupCastleBushGame();
  cleanupCastleSmellGame();
  cleanupCastleHearingGame();
  cleanupCastleUltimateGame();
  const modal = ensureQuizModal();
  modal.classList.add('hidden');
  saveCurrentNode('level2');
  writePendingNotice({ type: 'castleNextLevelUnlocked', area: 'zauberschloss' });
  pauseBossMusic();
  pauseCastleUltimateMusic();
  pauseCastleWinMusic();
  window.location.href = 'zauberschloss.html?nextLevelUnlocked=1';
}

async function returnToOverworld() {
  hideCastleVictoryScene();
  cleanupCastleDodgeGame();
  cleanupCastleCloneSearch();
  cleanupCastleBushGame();
  cleanupCastleSmellGame();
  cleanupCastleHearingGame();
  cleanupCastleUltimateGame();
  const modal = ensureQuizModal();
  modal.classList.add('hidden');
  saveCurrentNode('level2');
  await moveToNode('start');
  pauseBossMusic();
  pauseCastleUltimateMusic();
  pauseCastleWinMusic();
  window.location.href = `../game.html?fromLevel=1&completedArea=${encodeURIComponent(activeQuiz?.quizId || currentArea)}`;
}

async function exitLevel() {
  cleanupCastleDodgeGame();
  cleanupCastleCloneSearch();
  cleanupCastleBushGame();
  cleanupCastleSmellGame();
  cleanupCastleHearingGame();
  cleanupCastleUltimateGame();
  pauseBossMusic();
  pauseCastleWinMusic();
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



function showAreaIntroductionIfNeeded() {
  const content = AREA_INTRO_CONTENT[currentArea];
  if (!content) return false;
  let seen = {};
  try {
    seen = JSON.parse(localStorage.getItem(STORAGE_AREA_INTROS_SEEN) || '{}') || {};
  } catch {
    seen = {};
  }
  if (seen[currentArea]) return false;
  seen[currentArea] = true;
  localStorage.setItem(STORAGE_AREA_INTROS_SEEN, JSON.stringify(seen));
  pauseLevelMusic();
  window.setTimeout(() => {
    showLevelPopup(content.title, content.html, 'OK', () => startLevelMusic());
  }, 220);
  return true;
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
const areaIntroShown = showAreaIntroductionIfNeeded();
if (!areaIntroShown && pendingNotice?.type === 'minigameComplete' && pendingNotice.area === currentArea) {
  clearPendingNotice();
  window.setTimeout(() => showBossUnlockedNotice(currentArea), 260);
} else if (!areaIntroShown && pendingNotice?.type === 'castleNextLevelUnlocked' && currentArea === 'zauberschloss') {
  clearPendingNotice();
  startLevelMusic();
  window.setTimeout(() => {
    showLevelPopup(
      'Du hast den Magier besiegt!',
      '<div class="visual-notice"><div class="visual-notice-icon">🏰✨</div><p>Begebe dich schnell ins Schloss und hol die Magie der Sinne zurück.</p></div>',
      'Weiter'
    );
  }, 320);
} else if (!areaIntroShown) {
  startLevelMusic();
}


(function handleMinigameAbortReturn(){
  const params=new URLSearchParams(location.search);
  if(params.get('minigameAborted')!=='1') return;
  history.replaceState({},'',location.pathname);
  setTimeout(()=>showLevelPopup('Hinweis','Du kannst das Level jederzeit neu starten.','OK',()=>startLevelMusic()),300);
})();
