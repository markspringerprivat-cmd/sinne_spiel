(() => {
  const STORAGE_VOLUME = 'sinnesmagie-volume';
  const STORAGE_LEVEL_PROGRESS = 'sinnesmagie-level-progress';
  const STORAGE_PENDING_NOTICE = 'sinnesmagie-pending-notice';
  const MEMORIZE_SECONDS = 5;
  const DRAW_SECONDS = 20;
  const TOTAL_ROUNDS = 4;
  const HIT_RADIUS = 26;

  const COLOR_VALUES = {
    blue: '#2388ff',
    red: '#ff3d45',
    yellow: '#ffd63b',
    green: '#31c95b'
  };

  const canvas = document.getElementById('paintCanvas');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('paintOverlay');
  const popup = document.getElementById('paintPopup');
  const roundText = document.getElementById('paintRound');
  const timerText = document.getElementById('paintTimer');
  const livesText = document.getElementById('paintLives');
  const scoreText = document.getElementById('paintScore');
  const statusText = document.getElementById('paintStatus');
  const clearButton = document.getElementById('paintClear');
  const finishButton = document.getElementById('paintFinish');
  const colorButtons = [...document.querySelectorAll('.paint-color')];
  const musicElement = document.getElementById('paintMusic');
  const musicLoop = window.createCrossfadeLoop ? window.createCrossfadeLoop(musicElement, { fadeSeconds: 0.025 }) : null;

  function circlePoints(cx, cy, r, steps = 36) {
    const points = [];
    for (let i = 0; i <= steps; i += 1) {
      const angle = (i / steps) * Math.PI * 2 - Math.PI / 2;
      points.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
    }
    return points;
  }

  const patterns = [
    {
      name: 'Viereck',
      lines: [
        { color: 'blue', points: [[0.34,0.38],[0.66,0.38],[0.66,0.70],[0.34,0.70],[0.34,0.38]] }
      ]
    },
    {
      name: 'Viereck mit Dreieck',
      lines: [
        { color: 'blue', points: [[0.34,0.48],[0.66,0.48],[0.66,0.76],[0.34,0.76],[0.34,0.48]] },
        { color: 'red', points: [[0.30,0.48],[0.50,0.25],[0.70,0.48],[0.30,0.48]] }
      ]
    },
    {
      name: 'Viereck, Dreieck und Rechteck',
      lines: [
        { color: 'blue', points: [[0.34,0.54],[0.66,0.54],[0.66,0.80],[0.34,0.80],[0.34,0.54]] },
        { color: 'red', points: [[0.30,0.54],[0.50,0.35],[0.70,0.54],[0.30,0.54]] },
        { color: 'green', points: [[0.40,0.22],[0.60,0.22],[0.60,0.35],[0.40,0.35],[0.40,0.22]] }
      ]
    },
    {
      name: 'Viereck, Dreieck, Rechteck und Kreis',
      lines: [
        { color: 'blue', points: [[0.34,0.60],[0.66,0.60],[0.66,0.84],[0.34,0.84],[0.34,0.60]] },
        { color: 'red', points: [[0.30,0.60],[0.50,0.43],[0.70,0.60],[0.30,0.60]] },
        { color: 'green', points: [[0.40,0.31],[0.60,0.31],[0.60,0.43],[0.40,0.43],[0.40,0.31]] },
        { color: 'yellow', points: circlePoints(0.50, 0.20, 0.085, 40) }
      ]
    }
  ];

  const game = {
    phase: 'idle',
    round: 0,
    points: 0,
    lives: 3,
    selectedColor: 'blue',
    phaseStartedAt: 0,
    timeLeft: MEMORIZE_SECONDS,
    strokes: [],
    currentStroke: null,
    targetSamples: [],
    resultOverlay: null,
    timerFrame: 0,
    lastHudTime: 0
  };

  function currentVolume() {
    const saved = Number(localStorage.getItem(STORAGE_VOLUME));
    return Number.isFinite(saved) ? Math.min(1, Math.max(0, saved)) : 0.5;
  }

  function startMusic() {
    if (!musicElement) return;
    const volume = currentVolume() * 0.65;
    if (musicLoop) {
      musicLoop.setVolume(volume);
      musicLoop.play();
    } else {
      musicElement.volume = volume;
      musicElement.loop = true;
      musicElement.play().catch(() => {});
    }
  }

  function pauseMusic() {
    if (musicLoop) musicLoop.pause();
    else if (musicElement) musicElement.pause();
  }


  function writeMinigamePendingNotice(area) {
    try {
      localStorage.setItem(STORAGE_PENDING_NOTICE, JSON.stringify({ type: 'minigameComplete', area }));
    } catch {}
  }

  function readProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_LEVEL_PROGRESS) || '{}');
      return saved && typeof saved === 'object' ? saved : {};
    } catch {
      return {};
    }
  }

  function completeColorLevelOne() {
    const progress = readProgress();
    progress.farbenreich = {
      level1Completed: true,
      level2Completed: !!progress.farbenreich?.level2Completed
    };
    localStorage.setItem(STORAGE_LEVEL_PROGRESS, JSON.stringify(progress));
    writeMinigamePendingNotice('farbenreich');
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.35);
    canvas.width = Math.max(320, Math.round(rect.width * dpr));
    canvas.height = Math.max(320, Math.round(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function boardSize() {
    return { w: canvas.clientWidth, h: canvas.clientHeight };
  }

  function showPopup(type, data = {}) {
    overlay.classList.remove('hidden');
    if (type === 'intro') {
      popup.innerHTML = `
        <div class="minigame-intro-content">
          <h1>Farbenreich</h1>
          <p class="minigame-intro-lead">Merke dir das Farbmuster und zeichne es anschließend möglichst genau nach.</p>
          <div class="minigame-intro-icons" aria-hidden="true"><span>👀</span><span>🎨</span><span>✅</span></div>
          <p class="minigame-intro-note">Jede Runde bringt abhängig von deiner Genauigkeit bis zu 250 Highscore-Punkte.</p>
          <div class="paint-actions">
            <button id="startPaintGame" class="paint-button" type="button">Starten</button>
            <button id="leavePaintGame" class="paint-button secondary" type="button">Zurück</button>
          </div>
        </div>`;
      document.getElementById('startPaintGame').addEventListener('click', startGame);
      document.getElementById('leavePaintGame').addEventListener('click', () => { window.location.href = 'farbenreich.html?minigameAborted=1'; });
      return;
    }

    if (type === 'round') {
      popup.innerHTML = `
        <div>
          <h2>Runde ${data.round} Ergebnis</h2>
          <p>Genauigkeit: <strong>${data.percent}%</strong></p>
          <p>${data.success ? 'Gut getroffen. Du bekommst einen Punkt.' : 'Unter 50 Prozent. Du verlierst ein Leben.'}</p>
          <div class="paint-actions">
            <button id="nextPaintRound" class="paint-button" type="button">Weiter</button>
          </div>
        </div>`;
      document.getElementById('nextPaintRound').addEventListener('click', () => {
        overlay.classList.add('hidden');
        if (game.round >= TOTAL_ROUNDS) finishGame();
        else beginRound();
      });
      return;
    }

    if (type === 'won') {
      popup.innerHTML = `
        <div>
          <h2>Geschafft!</h2>
          <div class="mini-guide-icon">🎨</div>
          <p>Highscore-Punkte: ${game.scorePoints}</p>
          <div class="paint-actions">
            <button id="returnColorMap" class="paint-button" type="button">Zurück zum Farbenreich</button>
          </div>
        </div>`;
      document.getElementById('returnColorMap').addEventListener('click', () => { window.location.href = 'farbenreich.html'; });
      return;
    }

    popup.innerHTML = `
      <div>
        <h2>Verloren</h2>
        <p>Du hast alle Leben verloren.</p>
        <p>Versuche, zuerst die Farben grob an die richtigen Stellen zu setzen.</p>
        <div class="paint-actions">
          <button id="retryPaintGame" class="paint-button" type="button">Nochmal spielen</button>
          <button id="returnColorMap" class="paint-button secondary" type="button">Zurück</button>
        </div>
      </div>`;
    document.getElementById('retryPaintGame').addEventListener('click', startGame);
    document.getElementById('returnColorMap').addEventListener('click', () => { window.location.href = 'farbenreich.html'; });
  }

  function updateHud(force = false) {
    const now = performance.now();
    if (!force && now - game.lastHudTime < 120) return;
    game.lastHudTime = now;
    roundText.textContent = `Runde ${Math.min(game.round + 1, TOTAL_ROUNDS)} / ${TOTAL_ROUNDS}`;
    const label = game.phase === 'memorize' ? 'Merken' : game.phase === 'draw' ? 'Zeichnen' : 'Zeit';
    timerText.textContent = `${label}: ${Math.max(0, Math.ceil(game.timeLeft))} s`;
    if(livesText) livesText.textContent='';
    if (scoreText) scoreText.textContent = `Highscore-Punkte: ${game.scorePoints || 0}`;
  }

  function startGame() {
    overlay.classList.add('hidden');
    game.phase = 'idle';
    game.round = 0;
    game.points = 0;
    game.scorePoints = 0;
    game.lives = 999;
    window.SinnesScore?.startSession('game_farbenreich', 1000, 0);
    window.SinnesScore?.setGameplayActive(true);
    game.strokes = [];
    game.currentStroke = null;
    game.resultOverlay = null;
    startMusic();
    beginRound();
  }

  function beginRound() {
    game.phase = 'memorize';
    game.phaseStartedAt = performance.now();
    game.timeLeft = MEMORIZE_SECONDS;
    game.strokes = [];
    game.currentStroke = null;
    game.resultOverlay = null;
    game.targetSamples = buildTargetSamples(patterns[game.round]);
    statusText.textContent = `Merke dir das Muster: ${patterns[game.round].name}`;
    updateHud(true);
    cancelAnimationFrame(game.timerFrame);
    game.timerFrame = requestAnimationFrame(tick);
    draw();
  }

  function beginDrawingPhase() {
    game.phase = 'draw';
    game.phaseStartedAt = performance.now();
    game.timeLeft = DRAW_SECONDS;
    statusText.textContent = 'Zeichne das Muster jetzt aus dem Gedächtnis nach oder schließe die Runde manuell ab.';
    updateHud(true);
    draw();
    cancelAnimationFrame(game.timerFrame);
    game.timerFrame = requestAnimationFrame(tick);
  }

  function tick(now) {
    if (game.phase !== 'memorize' && game.phase !== 'draw') return;
    const limit = game.phase === 'memorize' ? MEMORIZE_SECONDS : DRAW_SECONDS;
    game.timeLeft = limit - (now - game.phaseStartedAt) / 1000;
    if (game.timeLeft <= 0) {
      if (game.phase === 'memorize') beginDrawingPhase();
      else evaluateRound();
      return;
    }
    updateHud();
    game.timerFrame = requestAnimationFrame(tick);
  }

  function finishGame() {
    pauseMusic();
    game.phase = 'finished';
    if (game.lives > 0) {
      completeColorLevelOne();
      window.SinnesScore?.setSession('game_farbenreich', game.scorePoints, 1000);
      window.SinnesScore?.finishSession('game_farbenreich', game.scorePoints, 1000);
      window.SinnesScore?.setGameplayActive(false);
      showPopup('won');
    } else {
      window.SinnesScore?.setGameplayActive(false);
      showPopup('lost');
    }
  }

  function evaluateRound() {
    if (game.phase === 'result' || game.phase === 'finished') return;
    game.phase = 'result';
    cancelAnimationFrame(game.timerFrame);
    const percent = scoreRound();
    const success = percent >= 50;
    const roundPoints = Math.round(Math.max(0, Math.min(100, percent)) * 5);
    game.scorePoints = Math.max(0, Math.min(1000, (game.scorePoints || 0) + roundPoints));
    if (success) game.points += 1;
    else { /* kein Lebensabzug: die Runde wird mit ihrem Prozentwert gewertet */ }
    window.SinnesScore?.setSession('game_farbenreich', game.scorePoints, 1000);
    game.resultOverlay = { percent, success };
    statusText.textContent = success ? `Runde geschafft: ${percent}%` : `Zu ungenau: ${percent}%`;
    updateHud(true);
    draw();
    game.round += 1;
    setTimeout(() => showPopup('round', { round: game.round, percent, success }), 650);
  }

  function sampleLine(a, b, color, out) {
    const { w, h } = boardSize();
    const x1 = a[0] * w;
    const y1 = a[1] * h;
    const x2 = b[0] * w;
    const y2 = b[1] * h;
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.max(5, Math.ceil(dist / 12));
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      out.push({ x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t, color });
    }
  }

  function buildTargetSamples(pattern) {
    const samples = [];
    pattern.lines.forEach(line => {
      for (let i = 1; i < line.points.length; i += 1) {
        sampleLine(line.points[i - 1], line.points[i], line.color, samples);
      }
    });
    return samples;
  }

  function userSamples() {
    const samples = [];
    game.strokes.forEach(stroke => {
      for (let i = 0; i < stroke.points.length; i += 1) {
        const p = stroke.points[i];
        samples.push({ x: p.x, y: p.y, color: stroke.color });
      }
    });
    return samples;
  }

  function scoreRound() {
    const user = userSamples();
    if (!user.length || !game.targetSamples.length) return 0;
    let matched = 0;
    let closeWrongColor = 0;

    game.targetSamples.forEach(target => {
      let bestSame = Infinity;
      let bestAny = Infinity;
      for (const p of user) {
        const d = Math.hypot(p.x - target.x, p.y - target.y);
        if (d < bestAny) bestAny = d;
        if (p.color === target.color && d < bestSame) bestSame = d;
      }
      if (bestSame <= HIT_RADIUS) matched += Math.max(0.35, 1 - bestSame / HIT_RADIUS * 0.65);
      else if (bestAny <= HIT_RADIUS) closeWrongColor += 0.25;
    });

    const base = (matched / game.targetSamples.length) * 100;
    const colorNearBonus = Math.min(8, (closeWrongColor / game.targetSamples.length) * 100);
    return Math.max(0, Math.min(100, Math.round(base + colorNearBonus)));
  }

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(rect.width, event.clientX - rect.left)),
      y: Math.max(0, Math.min(rect.height, event.clientY - rect.top))
    };
  }

  function startStroke(event) {
    if (game.phase !== 'draw') return;
    event.preventDefault();
    canvas.setPointerCapture?.(event.pointerId);
    const p = canvasPoint(event);
    game.currentStroke = { color: game.selectedColor, points: [p] };
    game.strokes.push(game.currentStroke);
    draw();
  }

  function moveStroke(event) {
    if (game.phase !== 'draw' || !game.currentStroke) return;
    event.preventDefault();
    const p = canvasPoint(event);
    const last = game.currentStroke.points[game.currentStroke.points.length - 1];
    if (!last || Math.hypot(last.x - p.x, last.y - p.y) >= 3) {
      game.currentStroke.points.push(p);
      draw();
    }
  }

  function endStroke(event) {
    if (event) canvas.releasePointerCapture?.(event.pointerId);
    game.currentStroke = null;
  }

  function setColor(color) {
    if (!COLOR_VALUES[color]) return;
    game.selectedColor = color;
    colorButtons.forEach(button => button.classList.toggle('active', button.dataset.color === color));
  }

  function clearLastStroke() {
    if (game.phase !== 'draw') return;
    game.strokes.pop();
    game.currentStroke = null;
    draw();
  }

  function drawSoftPaper(w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255, 250, 232, 0.92)';
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.globalAlpha = 0.12;
    for (let x = 40; x < w; x += 80) {
      ctx.strokeStyle = '#f59d35';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 80, h);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPattern(pattern, alpha = 1, dashed = false) {
    const { w, h } = boardSize();
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(10, Math.min(w, h) * 0.025);
    if (dashed) ctx.setLineDash([12, 14]);

    pattern.lines.forEach(line => {
      ctx.strokeStyle = COLOR_VALUES[line.color];
      ctx.beginPath();
      line.points.forEach((p, index) => {
        const x = p[0] * w;
        const y = p[1] * h;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawUserStrokes() {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(12, Math.min(canvas.clientWidth, canvas.clientHeight) * 0.028);
    game.strokes.forEach(stroke => {
      if (!stroke.points.length) return;
      ctx.strokeStyle = COLOR_VALUES[stroke.color];
      ctx.beginPath();
      stroke.points.forEach((p, index) => {
        if (index === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawResultOverlay() {
    if (!game.resultOverlay) return;
    drawPattern(patterns[Math.max(0, game.round)], 0.28, true);
  }

  function draw() {
    const { w, h } = boardSize();
    if (!w || !h) return;
    drawSoftPaper(w, h);
    if (game.phase === 'memorize') drawPattern(patterns[game.round], 1, false);
    if (game.phase === 'draw') {
      ctx.save();
      ctx.globalAlpha = 0.14;
      ctx.fillStyle = '#5c391a';
      ctx.font = `900 ${Math.max(18, Math.min(w, h) * 0.038)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('Zeichne das gemerkte Muster hier nach', w / 2, h * 0.5);
      ctx.restore();
    }
    drawUserStrokes();
    drawResultOverlay();
  }

  colorButtons.forEach(button => {
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      setColor(button.dataset.color);
    });
    button.addEventListener('click', () => setColor(button.dataset.color));
  });

  clearButton.addEventListener('pointerdown', event => {
    event.preventDefault();
    clearLastStroke();
  });

  finishButton.addEventListener('pointerdown', event => {
    event.preventDefault();
    if (game.phase === 'draw') evaluateRound();
  });

  finishButton.addEventListener('click', event => {
    event.preventDefault();
    if (game.phase === 'draw') evaluateRound();
  });

  canvas.addEventListener('pointerdown', startStroke);
  canvas.addEventListener('pointermove', moveStroke);
  canvas.addEventListener('pointerup', endStroke);
  canvas.addEventListener('pointercancel', endStroke);
  canvas.addEventListener('pointerleave', endStroke);

  window.addEventListener('keydown', event => {
    const key = event.key.toLowerCase();
    const map = { '1': 'blue', '2': 'red', '3': 'yellow', '4': 'green', b: 'blue', r: 'red', g: 'green', y: 'yellow' };
    if (map[key]) setColor(map[key]);
    if (key === 'backspace' || key === 'z') clearLastStroke();
    if (key === 'enter' && game.phase === 'draw') evaluateRound();
  });

  window.addEventListener('resize', resizeCanvas);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseMusic();
    else if (game.phase !== 'idle' && game.phase !== 'finished') startMusic();
  });

  resizeCanvas();
  updateHud(true);
  draw();
  showPopup('intro');
})();
