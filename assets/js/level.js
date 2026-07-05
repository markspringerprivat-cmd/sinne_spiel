const levelKnight = document.getElementById('levelKnight');
const levelMarkers = document.querySelectorAll('.level-marker');
const levelPopup = document.getElementById('levelPopup');
const levelPopupTitle = document.getElementById('levelPopupTitle');
const levelPopupText = document.getElementById('levelPopupText');
const levelPopupClose = document.getElementById('levelPopupClose');
const levelMusic = document.getElementById('levelMusic');

const STORAGE_VOLUME = 'sinnesmagie-volume';
const STORAGE_FRAGMENTS = 'sinnesmagie-fragments';
const QUIZ_SECONDS = 30;
const QUIZ_TRANSITION_MS = 560;
const BATTLE_ANIMATION_MS = 1500;
const STRIKE_RESET_MS = 760;
const DAMAGE_RESET_MS = 760;
const ATTACK_IMPACT_MS = 320;
const ENEMY_IMPACT_MS = 320;

const FRAGMENT_REWARDS = {
  farbenreich: { name: 'Seh-Fragment', color: '#ff6b6b', icon: '◈' },
  klangwald: { name: 'Hör-Fragment', color: '#ffd166', icon: '◈' },
  tastminen: { name: 'Tast-Fragment', color: '#8d99ae', icon: '◈' },
  duftgarten: { name: 'Duft-Fragment', color: '#b388ff', icon: '◈' },
  flammenkueche: { name: 'Geschmacks-Fragment', color: '#ff7b54', icon: '◈' }
};

const ENEMIES_WITH_ATTACK_ASSET = new Set(['farbgolem', 'waldgeist', 'maulwurf', 'duftgeist', 'feuergolem']);

let activeQuiz = null;
let quizTimer = null;
const sfxCorrect = new Audio('../assets/audio/richtig_1.mp3');
const sfxWrong = new Audio('../assets/audio/falsch_3.mp3');

function playSfx(audio) {
  if (!audio) return;
  try {
    audio.pause();
    audio.currentTime = 0;
    audio.volume = currentVolume();
    audio.play().catch(() => {});
  } catch (err) {
    // Ignorieren
  }
}

function currentVolume() {
  const saved = Number(localStorage.getItem(STORAGE_VOLUME));
  if (Number.isFinite(saved)) return Math.min(1, Math.max(0, saved));
  return 0.6;
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
  levelMusic.volume = currentVolume();
  levelMusic.play().catch(() => {
    // Browser erlaubt Musik erst nach Nutzerinteraktion.
  });
}

function pauseLevelMusic() {
  if (!levelMusic) return;
  levelMusic.pause();
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
    if (marker.dataset.quizId) {
      openQuizIntro(marker.dataset.quizId);
    } else {
      showLevelPopup(marker.dataset.title || 'Level', marker.dataset.text || 'Inhalt folgt später.');
    }
  }, 950);
}

levelMarkers.forEach(marker => {
  marker.addEventListener('click', () => moveLevelKnightTo(marker));
});

if (levelPopupClose) {
  levelPopupClose.addEventListener('click', () => {
    levelPopup.classList.add('hidden');
    startLevelMusic();
  });
}

if (levelPopup) {
  levelPopup.addEventListener('click', event => {
    if (event.target === levelPopup) {
      levelPopup.classList.add('hidden');
      startLevelMusic();
    }
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
  knight.classList.remove('sprite-pop', 'sprite-shake', 'knight-strike', 'knight-damaged');
  enemy.classList.remove('sprite-shake', 'enemy-hit', 'enemy-attack-strike');

  if (correct) {
    activeQuiz.correct += 1;
    feedback.textContent = 'Richtig!';
    knight.src = knightAsset('attack');
    enemy.src = enemyAsset(activeQuiz.data.enemy, 'normal');
    void knight.offsetWidth;
    void enemy.offsetWidth;
    knight.classList.add('knight-strike');

    setTimeout(() => {
      if (!activeQuiz || activeQuiz.finished) return;
      playSfx(sfxCorrect);
      enemy.src = enemyAsset(activeQuiz.data.enemy, 'damage');
      enemy.classList.add('enemy-hit');
    }, ATTACK_IMPACT_MS);

    setTimeout(() => {
      if (!activeQuiz || activeQuiz.finished) return;
      knight.classList.remove('knight-strike');
      enemy.classList.remove('enemy-hit');
      knight.src = knightAsset('normal');
      enemy.src = enemyAsset(activeQuiz.data.enemy, 'normal');
    }, STRIKE_RESET_MS);
  } else {
    activeQuiz.hearts -= 1;
    feedback.textContent = idx === -1 ? 'Zeit abgelaufen!' : 'Falsch!';
    knight.src = knightAsset('normal');
    enemy.src = enemyAttackAsset(activeQuiz.data.enemy);
    void knight.offsetWidth;
    void enemy.offsetWidth;
    enemy.classList.add('enemy-attack-strike');

    setTimeout(() => {
      if (!activeQuiz || activeQuiz.finished) return;
      playSfx(sfxWrong);
      knight.src = knightAsset('damage');
      knight.classList.add('knight-damaged');
      renderHearts();
    }, ENEMY_IMPACT_MS);

    setTimeout(() => {
      if (!activeQuiz || activeQuiz.finished) return;
      knight.classList.remove('knight-damaged');
      enemy.classList.remove('enemy-attack-strike');
      knight.src = knightAsset('normal');
      enemy.src = enemyAsset(activeQuiz.data.enemy, 'normal');
    }, DAMAGE_RESET_MS);
  }

  if (correct) {
    renderHearts();
  }

  setTimeout(() => {
    knight.classList.remove('sprite-pop', 'sprite-shake', 'knight-strike', 'knight-damaged');
    enemy.classList.remove('sprite-shake', 'enemy-hit', 'enemy-attack-strike');

    if (activeQuiz.hearts <= 0 || activeQuiz.index >= activeQuiz.data.questions.length - 1) {
      showQuizEndPanel();
    } else {
      activeQuiz.index += 1;
      knight.src = knightAsset('normal');
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
  document.getElementById('quizKnight').src = knightAsset('normal');
  document.getElementById('quizEnemy').src = enemyAsset(activeQuiz.data.enemy, 'normal');

  const result = modal.querySelector('#quizResult');
  result.className = 'quiz-result quiz-panel slide-in-right';
  const couldWin = activeQuiz.hearts > 0;
  result.innerHTML = `
    <h2>Quiz abgeschlossen</h2>
    <p>${couldWin ? 'Du hast alle Fragen überstanden.' : 'Du hast keine Herzen mehr.'}</p>
    <p>Drücke auf „Quiz beenden“, damit das Ergebnis angezeigt wird.</p>
    <button id="finishQuizButton" class="primary-button" type="button">Quiz beenden</button>
  `;
  setTimeout(() => result.classList.remove('slide-in-right'), QUIZ_TRANSITION_MS + 80);
  document.getElementById('finishQuizButton').addEventListener('click', showQuizResult);
}

function showQuizResult() {
  const won = activeQuiz.hearts > 0;
  const modal = ensureQuizModal();
  modal.querySelector('#quizGame').classList.add('hidden');
  document.getElementById('quizKnight').src = won ? knightAsset('victory') : knightAsset('defeated');
  document.getElementById('quizEnemy').src = won ? enemyAsset(activeQuiz.data.enemy, 'defeated') : enemyAsset(activeQuiz.data.enemy, 'normal');

  const fragmentStatus = won ? awardFragment(activeQuiz.quizId) : { gained: false, reward: null, total: readFragments().size, allCollected: false };
  const result = modal.querySelector('#quizResult');
  result.className = 'quiz-result quiz-panel quiz-final-result';

  let extraBlock = '';
  if (won && fragmentStatus.reward) {
    const allText = fragmentStatus.allCollected
      ? '<p class="fragment-hint">Alle fünf Fragmente sind gesammelt. Auf der Overworld kannst du jetzt das Zauberschloss zerbrechen.</p>'
      : '';
    extraBlock = `
      <div class="fragment-reward-box">
        <span class="fragment-mini" style="--fragment-color:${fragmentStatus.reward.color}">${fragmentStatus.reward.icon}</span>
        <div>
          <strong>${fragmentStatus.gained ? 'Fragment freigeschaltet!' : 'Fragment bereits gesichert!'}</strong>
          <p>${fragmentStatus.reward.name} · Gesammelt: ${fragmentStatus.total} / ${Object.keys(FRAGMENT_REWARDS).length}</p>
        </div>
      </div>
      ${allText}
    `;
  } else if (won && activeQuiz.quizId === 'zauberschloss') {
    extraBlock = `
      <div class="fragment-reward-box finale-box">
        <div>
          <strong>Das Zauberschloss ist befreit!</strong>
          <p>Du hast den Zauberer besiegt und die Sinnesmagie zurückerobert.</p>
        </div>
      </div>
    `;
  }

  result.innerHTML = `
    <h2>${won ? 'Gewonnen!' : 'Verloren!'}</h2>
    <p>${won ? `Du hast ${activeQuiz.correct} von ${activeQuiz.data.questions.length} Fragen richtig beantwortet und den Gegner besiegt.` : 'Der Gegner hat gewonnen. Versuche es noch einmal.'}</p>
    ${extraBlock}
    <div class="quiz-result-actions">
      <button id="retryQuizButton" class="ghost-button" type="button">Nochmal spielen</button>
      <button id="closeQuizButton" class="primary-button" type="button">Zur Karte</button>
    </div>
  `;
  document.getElementById('retryQuizButton').addEventListener('click', () => startQuiz(activeQuiz.quizId));
  document.getElementById('closeQuizButton').addEventListener('click', returnToOverworld);
}

function returnToOverworld() {
  window.location.href = '../game.html?fromLevel=1';
}

function closeQuiz() {
  clearInterval(quizTimer);
  const modal = ensureQuizModal();
  modal.classList.add('hidden');
  activeQuiz = null;
  startLevelMusic();
}

window.addEventListener('load', () => {
  window.setTimeout(() => {
    showLevelPopup('Level betreten', 'Platzhalter: Hier wird später kurz erklärt, was in diesem Bereich zu tun ist.');
  }, 180);
});
