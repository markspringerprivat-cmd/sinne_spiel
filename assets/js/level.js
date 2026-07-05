const levelKnight = document.getElementById('levelKnight');
const levelMarkers = document.querySelectorAll('.level-marker');
const levelPopup = document.getElementById('levelPopup');
const levelPopupTitle = document.getElementById('levelPopupTitle');
const levelPopupText = document.getElementById('levelPopupText');
const levelPopupClose = document.getElementById('levelPopupClose');
const levelMusic = document.getElementById('levelMusic');

const STORAGE_VOLUME = 'sinnesmagie-volume';
const QUIZ_SECONDS = 30;

let activeQuiz = null;
let quizTimer = null;

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

function enemyAsset(enemy, state) {
  if (state === 'damage') return `../assets/images/enemies/${enemy}_damage.png`;
  if (state === 'defeated') return `../assets/images/enemies/${enemy}_defeated.png`;
  return `../assets/images/enemies/${enemy}.png`;
}

function knightAsset(state) {
  if (state === 'attack') return '../assets/images/characters/ritter_attack.png';
  if (state === 'damage') return '../assets/images/characters/ritter_damage.png';
  if (state === 'defeated') return '../assets/images/characters/ritter_defeated.png';
  return '../assets/images/characters/knight.png';
}

function ensureQuizModal() {
  let modal = document.getElementById('quizModal');
  if (modal) return modal;
  modal = document.createElement('div');
  modal.id = 'quizModal';
  modal.className = 'quiz-modal hidden';
  modal.innerHTML = `
    <div class="quiz-card" role="dialog" aria-modal="true" aria-labelledby="quizTitle">
      <div id="quizIntro" class="quiz-intro"></div>
      <div id="quizGame" class="quiz-game hidden">
        <div class="quiz-topbar">
          <div id="quizHearts" class="quiz-hearts" aria-label="Lebenspunkte"></div>
          <div id="quizCounter" class="quiz-counter"></div>
          <div id="quizTimer" class="quiz-timer">30</div>
        </div>
        <div class="battle-row">
          <img id="quizKnight" class="battle-sprite knight-battle" alt="Ritter">
          <span id="battleFeedback" class="battle-feedback hidden"></span>
          <img id="quizEnemy" class="battle-sprite enemy-battle" alt="Gegner">
        </div>
        <h2 id="quizTitle"></h2>
        <p id="quizQuestion" class="quiz-question"></p>
        <div id="quizAnswers" class="quiz-answers"></div>
      </div>
      <div id="quizResult" class="quiz-result hidden"></div>
    </div>`;
  document.body.appendChild(modal);
  return modal;
}

function openQuizIntro(quizId) {
  const data = window.SINNESMAGIE_QUIZZES?.[quizId];
  if (!data) {
    showLevelPopup('Quiz', 'Quizdaten fehlen noch.');
    return;
  }
  startLevelMusic();
  const modal = ensureQuizModal();
  clearInterval(quizTimer);
  modal.classList.remove('hidden');
  modal.querySelector('#quizGame').classList.add('hidden');
  modal.querySelector('#quizResult').classList.add('hidden');
  const intro = modal.querySelector('#quizIntro');
  intro.classList.remove('hidden');
  intro.innerHTML = `
    <h2>${data.title}</h2>
    <img class="quiz-intro-enemy" src="${enemyAsset(data.enemy)}" alt="${data.enemyName}">
    <p>${data.enemyName} bewacht diesen Bereich. Beantworte sieben Fragen. Für jede falsche Antwort oder abgelaufene Zeit verlierst du ein Herz.</p>
    <button id="startQuizButton" class="primary-button" type="button">Quiz starten</button>
  `;
  modal.querySelector('#startQuizButton').addEventListener('click', () => startQuiz(quizId));
}

function startQuiz(quizId) {
  const data = window.SINNESMAGIE_QUIZZES[quizId];
  activeQuiz = {
    quizId,
    data,
    index: 0,
    hearts: 3,
    correct: 0,
    answered: false,
    seconds: QUIZ_SECONDS,
    finished: false
  };
  const modal = ensureQuizModal();
  modal.querySelector('#quizIntro').classList.add('hidden');
  modal.querySelector('#quizResult').classList.add('hidden');
  modal.querySelector('#quizGame').classList.remove('hidden');
  renderQuestion();
}

function renderHearts() {
  const hearts = document.getElementById('quizHearts');
  hearts.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const span = document.createElement('span');
    span.textContent = i < activeQuiz.hearts ? '♥' : '♡';
    hearts.appendChild(span);
  }
}

function renderQuestion() {
  clearInterval(quizTimer);
  if (!activeQuiz || activeQuiz.finished) return;
  const q = activeQuiz.data.questions[activeQuiz.index];
  activeQuiz.answered = false;
  activeQuiz.seconds = QUIZ_SECONDS;
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
    if (!activeQuiz || activeQuiz.answered) return;
    activeQuiz.seconds -= 1;
    document.getElementById('quizTimer').textContent = activeQuiz.seconds;
    if (activeQuiz.seconds <= 0) {
      answerQuestion(-1);
    }
  }, 1000);
}

function answerQuestion(idx) {
  if (!activeQuiz || activeQuiz.answered || activeQuiz.finished) return;
  activeQuiz.answered = true;
  clearInterval(quizTimer);
  const q = activeQuiz.data.questions[activeQuiz.index];
  const correct = idx === q[2];
  const answerButtons = document.querySelectorAll('.quiz-answer');
  answerButtons.forEach((btn, i) => {
    btn.disabled = true;
    if (i === q[2]) btn.classList.add('correct-answer');
    if (i === idx && !correct) btn.classList.add('wrong-answer');
  });
  const feedback = document.getElementById('battleFeedback');
  feedback.classList.remove('hidden');
  if (correct) {
    activeQuiz.correct += 1;
    feedback.textContent = 'Treffer!';
    document.getElementById('quizKnight').src = knightAsset('attack');
    document.getElementById('quizKnight').classList.add('sprite-pop');
    document.getElementById('quizEnemy').src = enemyAsset(activeQuiz.data.enemy, 'damage');
    document.getElementById('quizEnemy').classList.add('sprite-shake');
  } else {
    activeQuiz.hearts -= 1;
    feedback.textContent = idx === -1 ? 'Zeit abgelaufen!' : 'Falsch!';
    document.getElementById('quizKnight').src = knightAsset('damage');
    document.getElementById('quizKnight').classList.add('sprite-shake');
  }
  renderHearts();
  setTimeout(() => {
    document.getElementById('quizKnight').classList.remove('sprite-pop','sprite-shake');
    document.getElementById('quizEnemy').classList.remove('sprite-shake');
    if (activeQuiz.hearts <= 0) {
      showQuizEndButton();
    } else if (activeQuiz.index >= activeQuiz.data.questions.length - 1) {
      showQuizEndButton();
    } else {
      activeQuiz.index += 1;
      renderQuestion();
    }
  }, 1150);
}

function showQuizEndButton() {
  activeQuiz.finished = true;
  clearInterval(quizTimer);
  const answers = document.getElementById('quizAnswers');
  answers.innerHTML = '';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'primary-button';
  btn.textContent = 'Quiz beenden';
  btn.addEventListener('click', showQuizResult);
  answers.appendChild(btn);
}

function showQuizResult() {
  const won = activeQuiz.hearts > 0;
  const modal = ensureQuizModal();
  modal.querySelector('#quizGame').classList.add('hidden');
  const result = modal.querySelector('#quizResult');
  result.classList.remove('hidden');
  const img = won ? knightAsset('normal') : enemyAsset(activeQuiz.data.enemy, 'normal');
  const defeatedImg = won ? enemyAsset(activeQuiz.data.enemy, 'defeated') : knightAsset('defeated');
  result.innerHTML = `
    <h2>${won ? 'Gewonnen!' : 'Verloren!'}</h2>
    <div class="result-images">
      <img src="${img}" alt="${won ? 'Ritter' : activeQuiz.data.enemyName}">
      <img src="${defeatedImg}" alt="Besiegt">
    </div>
    <p>${won ? `Du hast ${activeQuiz.correct} von ${activeQuiz.data.questions.length} Fragen richtig beantwortet.` : 'Der Gegner hat gewonnen. Versuche es noch einmal.'}</p>
    <div class="quiz-result-actions">
      <button id="retryQuizButton" class="ghost-button" type="button">Nochmal spielen</button>
      <button id="closeQuizButton" class="primary-button" type="button">Zur Karte</button>
    </div>
  `;
  document.getElementById('retryQuizButton').addEventListener('click', () => startQuiz(activeQuiz.quizId));
  document.getElementById('closeQuizButton').addEventListener('click', closeQuiz);
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
