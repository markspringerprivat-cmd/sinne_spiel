(() => {
  const STORAGE_VOLUME = 'sinnesmagie-volume';
  const STORAGE_LEVEL_PROGRESS = 'sinnesmagie-level-progress';

  const canvas = document.getElementById('rhythmCanvas');
  const ctx = canvas.getContext('2d');
  const music = document.getElementById('rhythmMusic');
  const overlay = document.getElementById('rhythmOverlay');
  const popup = document.getElementById('rhythmPopup');
  const scoreText = document.getElementById('rhythmScoreText');
  const energyFill = document.getElementById('rhythmEnergyFill');
  const comboText = document.getElementById('rhythmCombo');
  const keyButtons = [...document.querySelectorAll('.rhythm-key')];

  const background = new Image();
  background.src = '../assets/images/level-backgrounds/klangwald.png';

  const BEATMAP = [{"time":0.768,"lane":2},{"time":1.104,"lane":3},{"time":1.424,"lane":3},{"time":1.728,"lane":3},{"time":2.048,"lane":3},{"time":2.384,"lane":3},{"time":2.704,"lane":2},{"time":3.696,"lane":1},{"time":4.0,"lane":2},{"time":4.336,"lane":2},{"time":4.656,"lane":3},{"time":5.616,"lane":2},{"time":5.952,"lane":2},{"time":6.592,"lane":0},{"time":7.568,"lane":2},{"time":9.184,"lane":1},{"time":9.52,"lane":3},{"time":9.84,"lane":3},{"time":10.16,"lane":3},{"time":10.48,"lane":2},{"time":11.456,"lane":1},{"time":11.776,"lane":2},{"time":12.112,"lane":2},{"time":12.432,"lane":3},{"time":13.392,"lane":2},{"time":14.352,"lane":2},{"time":16.32,"lane":1},{"time":16.64,"lane":1},{"time":16.976,"lane":1},{"time":17.28,"lane":3},{"time":17.616,"lane":3},{"time":17.936,"lane":3},{"time":18.24,"lane":0},{"time":18.912,"lane":1},{"time":19.232,"lane":1},{"time":19.568,"lane":2},{"time":19.888,"lane":2},{"time":20.208,"lane":3},{"time":21.184,"lane":2},{"time":21.52,"lane":2},{"time":22.144,"lane":0},{"time":23.12,"lane":2},{"time":24.416,"lane":1},{"time":24.752,"lane":1},{"time":25.072,"lane":3},{"time":25.392,"lane":3},{"time":25.712,"lane":3},{"time":26.016,"lane":0},{"time":27.008,"lane":1},{"time":27.328,"lane":2},{"time":27.984,"lane":0},{"time":28.96,"lane":2},{"time":29.92,"lane":0},{"time":31.856,"lane":0},{"time":32.192,"lane":0},{"time":32.512,"lane":1},{"time":33.808,"lane":0},{"time":34.144,"lane":0},{"time":34.464,"lane":1},{"time":34.784,"lane":2},{"time":35.76,"lane":0},{"time":36.736,"lane":2},{"time":37.712,"lane":3},{"time":38.368,"lane":2},{"time":38.656,"lane":2},{"time":39.328,"lane":2},{"time":40.624,"lane":2},{"time":40.944,"lane":2},{"time":41.264,"lane":3},{"time":41.584,"lane":3},{"time":41.904,"lane":3},{"time":42.24,"lane":3},{"time":42.56,"lane":3},{"time":42.88,"lane":3},{"time":43.2,"lane":3},{"time":43.52,"lane":2},{"time":44.512,"lane":1},{"time":44.832,"lane":2},{"time":45.168,"lane":2},{"time":45.472,"lane":0},{"time":46.464,"lane":2},{"time":46.784,"lane":2},{"time":47.12,"lane":3},{"time":47.424,"lane":0},{"time":48.08,"lane":1},{"time":48.4,"lane":2},{"time":49.712,"lane":1},{"time":50.016,"lane":1},{"time":50.352,"lane":3},{"time":50.688,"lane":3},{"time":50.992,"lane":3},{"time":51.296,"lane":0},{"time":52.304,"lane":1},{"time":52.624,"lane":2},{"time":53.28,"lane":0},{"time":55.2,"lane":3}];
  const LANE_KEYS = ['a', 's', 'd', 'f'];
  const LANE_LABELS = ['A', 'S', 'D', 'F'];
  const LEAD_TIME = 2.15;
  const HIT_WINDOWS = {
    perfect: 0.11,
    good: 0.22,
    ok: 0.34,
    miss: 0.42
  };

  const game = {
    running: false,
    finished: false,
    startedAt: 0,
    notes: [],
    score: 0,
    hits: 0,
    perfect: 0,
    good: 0,
    ok: 0,
    misses: 0,
    combo: 0,
    maxCombo: 0,
    energy: 100,
    lastHudUpdate: 0,
    feedback: [],
    laneFlash: [0, 0, 0, 0],
    audioUnlocked: false,
    lastLanePressAt: [0, 0, 0, 0]
  };

  function currentVolume() {
    const saved = Number(localStorage.getItem(STORAGE_VOLUME));
    return Number.isFinite(saved) ? Math.min(1, Math.max(0, saved)) : 0.5;
  }

  function resizeCanvas() {
    const dpr = 1;
    const w = Math.max(320, window.innerWidth);
    const h = Math.max(520, window.innerHeight);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function readProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_LEVEL_PROGRESS) || '{}');
      return saved && typeof saved === 'object' ? saved : {};
    } catch {
      return {};
    }
  }

  function completeKlangwaldLevelOne() {
    const progress = readProgress();
    progress.klangwald = {
      level1Completed: true,
      level2Completed: !!progress.klangwald?.level2Completed
    };
    localStorage.setItem(STORAGE_LEVEL_PROGRESS, JSON.stringify(progress));
  }

  function resetGame() {
    game.running = true;
    game.finished = false;
    game.notes = BEATMAP.map((note, index) => ({
      id: index,
      time: note.time,
      lane: note.lane,
      state: 'upcoming'
    }));
    game.score = 0;
    game.hits = 0;
    game.perfect = 0;
    game.good = 0;
    game.ok = 0;
    game.misses = 0;
    game.combo = 0;
    game.maxCombo = 0;
    game.energy = 100;
    game.lastHudUpdate = 0;
    game.feedback = [];
    game.laneFlash = [0, 0, 0, 0];
  }

  function showPopup(type) {
    overlay.classList.remove('hidden');

    if (type === 'intro') {
      popup.innerHTML = `
        <div>
          <h1>Klangwald-Minispiel</h1>
          <p>Spiele die Musikbox-Melodie nach. Drücke die passende Klangtaste, wenn eine Note den goldenen Zielkreis erreicht.</p>
          <p class="small-note">Tastatur: A, S, D, F. Auf dem Handy nutzt du die vier großen Tasten unten.</p>
          <div class="rhythm-popup-actions">
            <button id="startRhythmGame" class="rhythm-button" type="button">Starten</button>
            <button id="leaveRhythmGame" class="rhythm-button secondary" type="button">Zurück</button>
          </div>
        </div>`;
      document.getElementById('startRhythmGame').addEventListener('click', startGame);
      document.getElementById('leaveRhythmGame').addEventListener('click', () => {
        window.location.href = 'klangwald.html';
      });
      return;
    }

    if (type === 'won') {
      const hitRate = Math.round((game.hits / game.notes.length) * 100);
      popup.innerHTML = `
        <div>
          <h2>Klangfolge geschafft!</h2>
          <p>Du hast ${game.hits} von ${game.notes.length} Tönen getroffen.</p>
          <p class="small-note">Trefferquote: ${hitRate} %. Beste Serie: ${game.maxCombo}.</p>
          <div class="rhythm-popup-actions">
            <button id="returnToKlangwald" class="rhythm-button" type="button">Zurück zum Klangwald</button>
          </div>
        </div>`;
      document.getElementById('returnToKlangwald').addEventListener('click', () => {
        window.location.href = 'klangwald.html';
      });
      return;
    }

    popup.innerHTML = `
      <div>
        <h2>Klangfolge verpasst</h2>
        <p>Die Melodie ist aus dem Takt geraten.</p>
        <p class="small-note">Drücke die Taste erst, wenn die Note genau am Zielkreis ankommt.</p>
        <div class="rhythm-popup-actions">
          <button id="retryRhythmGame" class="rhythm-button" type="button">Nochmal spielen</button>
          <button id="returnToKlangwald" class="rhythm-button secondary" type="button">Zurück</button>
        </div>
      </div>`;
    document.getElementById('retryRhythmGame').addEventListener('click', startGame);
    document.getElementById('returnToKlangwald').addEventListener('click', () => {
      window.location.href = 'klangwald.html';
    });
  }

  function hidePopup() {
    overlay.classList.add('hidden');
  }

  function startGame() {
    resetGame();
    hidePopup();
    music.pause();
    music.currentTime = 0;
    music.volume = currentVolume();
    music.play().then(() => {
      game.startedAt = performance.now();
      requestAnimationFrame(loop);
    }).catch(() => {
      game.startedAt = performance.now();
      requestAnimationFrame(loop);
    });
    updateHud(true);
  }

  function endGame(won) {
    if (game.finished) return;
    game.running = false;
    game.finished = true;
    music.pause();

    if (won) completeKlangwaldLevelOne();
    window.setTimeout(() => showPopup(won ? 'won' : 'lost'), 360);
  }

  function songTime() {
    return music.currentTime || 0;
  }

  function updateHud(force = false) {
    const now = performance.now();
    if (!force && now - game.lastHudUpdate < 120) return;
    game.lastHudUpdate = now;

    scoreText.textContent = `Treffer: ${game.hits} · Verpasst: ${game.misses} · Punkte: ${game.score}`;
    energyFill.style.width = `${Math.max(0, Math.min(100, game.energy))}%`;
    comboText.textContent = `${game.combo}×`;
  }

  function addFeedback(text, lane, kind) {
    game.feedback.push({
      text,
      lane,
      kind,
      time: performance.now(),
      life: 620
    });
  }

  function markMiss(note) {
    if (note.state !== 'upcoming') return;
    note.state = 'missed';
    game.misses += 1;
    game.combo = 0;
    game.energy -= 3;
    addFeedback('Verpasst', note.lane, 'miss');
  }

  function hitLane(lane) {
    if (!game.running) return;
    const t = songTime();
    let candidate = null;
    let bestDistance = Infinity;

    for (const note of game.notes) {
      if (note.state !== 'upcoming' || note.lane !== lane) continue;
      const distance = Math.abs(note.time - t);
      if (distance < bestDistance && distance <= HIT_WINDOWS.ok) {
        candidate = note;
        bestDistance = distance;
      }
    }

    game.laneFlash[lane] = performance.now() + 130;

    if (!candidate) {
      game.energy = Math.max(0, game.energy - 1);
      game.combo = 0;
      addFeedback('Zu früh', lane, 'miss');
      if (game.energy <= 0) endGame(false);
      updateHud(true);
      return;
    }

    candidate.state = 'hit';
    game.hits += 1;
    game.combo += 1;
    game.maxCombo = Math.max(game.maxCombo, game.combo);

    if (bestDistance <= HIT_WINDOWS.perfect) {
      game.perfect += 1;
      game.score += 100 + Math.min(50, game.combo);
      game.energy = Math.min(100, game.energy + 1.2);
      addFeedback('Perfekt', lane, 'perfect');
    } else if (bestDistance <= HIT_WINDOWS.good) {
      game.good += 1;
      game.score += 70 + Math.min(35, Math.floor(game.combo / 2));
      game.energy = Math.min(100, game.energy + 0.6);
      addFeedback('Gut', lane, 'good');
    } else {
      game.ok += 1;
      game.score += 40;
      addFeedback('Okay', lane, 'ok');
    }

    updateHud(true);
  }

  function update() {
    const t = songTime();

    for (const note of game.notes) {
      if (note.state === 'upcoming' && t - note.time > HIT_WINDOWS.miss) {
        markMiss(note);
      }
    }

    game.feedback = game.feedback.filter(item => performance.now() - item.time < item.life);

    if (game.energy <= 0) {
      endGame(false);
      return;
    }

    const finalNote = game.notes[game.notes.length - 1];
    if (t > finalNote.time + 2.0 || (music.ended && t > 0)) {
      const hitRate = game.hits / game.notes.length;
      endGame(hitRate >= 0.5 && game.energy > 0);
    }

    updateHud();
  }

  function laneGeometry(w, h) {
    const playableW = Math.min(w * 0.92, 650);
    const left = (w - playableW) / 2;
    const laneW = playableW / 4;
    const topY = h * 0.13;
    const targetY = h * 0.78;
    return { left, laneW, topY, targetY, playableW };
  }

  function drawCoverImage(img, x, y, w, h) {
    if (!img.complete || !img.naturalWidth) return false;
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    return true;
  }

  function drawBackground(w, h) {
    if (!drawCoverImage(background, 0, 0, w, h)) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#244d2b');
      g.addColorStop(1, '#0d1c10');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.fillStyle = 'rgba(4, 16, 8, 0.42)';
    ctx.fillRect(0, 0, w, h);
  }

  function drawLanes(w, h, geo, now) {
    ctx.save();
    ctx.lineCap = 'round';

    for (let lane = 0; lane < 4; lane += 1) {
      const x = geo.left + geo.laneW * (lane + 0.5);
      const active = now < game.laneFlash[lane];

      ctx.globalAlpha = active ? 0.95 : 0.55;
      ctx.strokeStyle = active ? '#fff3a2' : 'rgba(193, 232, 153, 0.78)';
      ctx.lineWidth = active ? 7 : 4;
      ctx.beginPath();
      ctx.moveTo(x, geo.topY);
      ctx.lineTo(x, geo.targetY + 28);
      ctx.stroke();

      ctx.globalAlpha = 0.22;
      ctx.fillStyle = lane % 2 === 0 ? '#7bdc7b' : '#f0cf65';
      ctx.fillRect(x - geo.laneW * 0.42, geo.topY, geo.laneW * 0.84, geo.targetY - geo.topY + 32);

      ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff6bd';
      ctx.strokeStyle = '#6e4d1e';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x, geo.targetY, Math.min(34, geo.laneW * 0.28), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#473018';
      ctx.font = `900 ${Math.min(28, geo.laneW * 0.28)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(LANE_LABELS[lane], x, geo.targetY);
    }

    ctx.restore();
  }

  function drawNote(note, w, h, geo, t) {
    if (note.state !== 'upcoming') return;
    const untilHit = note.time - t;
    if (untilHit > LEAD_TIME || untilHit < -HIT_WINDOWS.miss) return;

    const progress = 1 - (untilHit / LEAD_TIME);
    const y = geo.topY + (geo.targetY - geo.topY) * progress;
    const x = geo.left + geo.laneW * (note.lane + 0.5);
    const radius = Math.min(28, geo.laneW * 0.24) * (0.78 + progress * 0.2);

    ctx.save();
    ctx.globalAlpha = Math.max(0.1, Math.min(1, progress + 0.12));

    ctx.fillStyle = note.lane % 2 === 0 ? '#7ef2a0' : '#ffe177';
    ctx.strokeStyle = '#432b16';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#322010';
    ctx.font = `900 ${radius * 1.05}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('♪', x, y + 1);

    ctx.restore();
  }

  function drawFeedback(w, h, geo) {
    const now = performance.now();
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${Math.max(18, Math.min(28, w * 0.045))}px system-ui, sans-serif`;

    for (const item of game.feedback) {
      const age = now - item.time;
      const alpha = 1 - age / item.life;
      const x = geo.left + geo.laneW * (item.lane + 0.5);
      const y = geo.targetY - 78 - age * 0.035;

      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = item.kind === 'miss' ? '#ffdad0' : '#fff2a8';
      ctx.strokeStyle = 'rgba(50, 31, 12, 0.85)';
      ctx.lineWidth = 4;
      ctx.strokeText(item.text, x, y);
      ctx.fillText(item.text, x, y);
    }
    ctx.restore();
  }

  function draw() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const now = performance.now();
    const t = songTime();
    const geo = laneGeometry(w, h);

    ctx.clearRect(0, 0, w, h);
    drawBackground(w, h);
    drawLanes(w, h, geo, now);

    for (const note of game.notes) drawNote(note, w, h, geo, t);
    drawFeedback(w, h, geo);

    ctx.save();
    ctx.fillStyle = 'rgba(255, 249, 223, 0.88)';
    ctx.strokeStyle = 'rgba(74, 50, 19, 0.55)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(geo.left, geo.topY - 52, geo.playableW, 36, 18);
    ctx.fill();
    ctx.stroke();

    const finalTime = Math.max(BEATMAP[BEATMAP.length - 1].time + 2, music.duration || 58);
    const progress = Math.max(0, Math.min(1, t / finalTime));
    ctx.fillStyle = '#7edb6e';
    ctx.beginPath();
    ctx.roundRect(geo.left + 5, geo.topY - 47, (geo.playableW - 10) * progress, 26, 13);
    ctx.fill();
    ctx.restore();
  }

  function loop() {
    if (!game.running) {
      draw();
      return;
    }
    update();
    draw();
    if (game.running) requestAnimationFrame(loop);
  }

  function handleKeydown(event) {
    const lane = LANE_KEYS.indexOf(event.key.toLowerCase());
    if (lane !== -1) {
      event.preventDefault();
      pressLane(lane);
    }
  }

  function pressLane(lane) {
    const now = performance.now();
    if (now - game.lastLanePressAt[lane] < 55) return;
    game.lastLanePressAt[lane] = now;

    const button = keyButtons[lane];
    if (button) {
      button.classList.add('active');
      window.clearTimeout(button._rhythmActiveTimer);
      button._rhythmActiveTimer = window.setTimeout(() => button.classList.remove('active'), 120);
    }
    hitLane(lane);
  }

  keyButtons.forEach((button) => {
    const lane = Number(button.dataset.lane);

    const handlePress = (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (event.pointerId && button.setPointerCapture) {
        try { button.setPointerCapture(event.pointerId); } catch {}
      }
      pressLane(lane);
    };

    button.addEventListener('pointerdown', handlePress, { passive: false });
    button.addEventListener('touchstart', handlePress, { passive: false });
    button.addEventListener('mousedown', handlePress);
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
  });

  window.addEventListener('keydown', handleKeydown);
  window.addEventListener('resize', () => {
    resizeCanvas();
    draw();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && game.running) music.pause();
    else if (!document.hidden && game.running) music.play().catch(() => {});
  });

  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
      this.beginPath();
      this.moveTo(x + r, y);
      this.lineTo(x + w - r, y);
      this.quadraticCurveTo(x + w, y, x + w, y + r);
      this.lineTo(x + w, y + h - r);
      this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      this.lineTo(x + r, y + h);
      this.quadraticCurveTo(x, y + h, x, y + h - r);
      this.lineTo(x, y + r);
      this.quadraticCurveTo(x, y, x + r, y);
      return this;
    };
  }

  resizeCanvas();
  showPopup('intro');
  updateHud(true);
  draw();
})();
