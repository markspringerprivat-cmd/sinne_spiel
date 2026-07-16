(() => {
  const STORAGE_VOLUME = 'sinnesmagie-volume';
  const STORAGE_LEVEL_PROGRESS = 'sinnesmagie-level-progress';
  const STORAGE_PENDING_NOTICE = 'sinnesmagie-pending-notice';

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
  background.src = '../assets/images/level-backgrounds/klangwald.webp';

  const BEATMAP = [{"time":1.509,"lane":0},{"time":2.879,"lane":1},{"time":4.551,"lane":2},{"time":5.828,"lane":3},{"time":7.082,"lane":0},{"time":8.313,"lane":1},{"time":9.683,"lane":3},{"time":11.006,"lane":0},{"time":12.469,"lane":2},{"time":13.816,"lane":3},{"time":15.186,"lane":1},{"time":16.718,"lane":0},{"time":17.972,"lane":3},{"time":19.505,"lane":2},{"time":20.921,"lane":0},{"time":22.152,"lane":1},{"time":23.684,"lane":2},{"time":25.054,"lane":1},{"time":26.331,"lane":3},{"time":28.003,"lane":2},{"time":29.234,"lane":1},{"time":30.65,"lane":2},{"time":32.415,"lane":0},{"time":34.04,"lane":3},{"time":35.666,"lane":0},{"time":36.966,"lane":3},{"time":38.452,"lane":1},{"time":39.729,"lane":2},{"time":41.192,"lane":2},{"time":42.284,"lane":0},{"time":43.282,"lane":3},{"time":44.188,"lane":0},{"time":45.581,"lane":3},{"time":46.44,"lane":0},{"time":47.763,"lane":3},{"time":48.924,"lane":1},{"time":49.923,"lane":0},{"time":51.13,"lane":2},{"time":52.291,"lane":1},{"time":53.29,"lane":1},{"time":54.544,"lane":2},{"time":55.658,"lane":3},{"time":56.75,"lane":0},{"time":57.794,"lane":1},{"time":58.886,"lane":2},{"time":59.954,"lane":2},{"time":60.813,"lane":1},{"time":61.858,"lane":1},{"time":62.903,"lane":3},{"time":63.785,"lane":0},{"time":64.83,"lane":2},{"time":65.921,"lane":3},{"time":66.966,"lane":0},{"time":67.895,"lane":1},{"time":69.01,"lane":2},{"time":70.217,"lane":1},{"time":71.308,"lane":2},{"time":72.26,"lane":1},{"time":73.329,"lane":2},{"time":74.304,"lane":3},{"time":75.14,"lane":0},{"time":76.208,"lane":3},{"time":77.206,"lane":0},{"time":78.321,"lane":3},{"time":79.319,"lane":0},{"time":80.155,"lane":3},{"time":81.107,"lane":0},{"time":81.943,"lane":3},{"time":83.035,"lane":2},{"time":83.731,"lane":1},{"time":84.614,"lane":1},{"time":85.682,"lane":2},{"time":86.332,"lane":2},{"time":87.423,"lane":1},{"time":88.073,"lane":0},{"time":88.793,"lane":3},{"time":89.606,"lane":2},{"time":90.395,"lane":0},{"time":91.231,"lane":1},{"time":92.206,"lane":3},{"time":92.857,"lane":0},{"time":93.948,"lane":1},{"time":94.552,"lane":2},{"time":95.62,"lane":3},{"time":96.34,"lane":0},{"time":97.268,"lane":2},{"time":97.965,"lane":3},{"time":98.847,"lane":1},{"time":99.59,"lane":0},{"time":100.171,"lane":3},{"time":100.844,"lane":0},{"time":101.518,"lane":3},{"time":102.145,"lane":0},{"time":103.166,"lane":3},{"time":104.025,"lane":1},{"time":104.768,"lane":0},{"time":105.349,"lane":2},{"time":106.092,"lane":3},{"time":106.998,"lane":1},{"time":107.741,"lane":0},{"time":108.414,"lane":3},{"time":109.018,"lane":0},{"time":109.761,"lane":3},{"time":110.852,"lane":2},{"time":111.851,"lane":0},{"time":112.524,"lane":2},{"time":113.638,"lane":1},{"time":114.219,"lane":2},{"time":114.823,"lane":3},{"time":115.426,"lane":1},{"time":116.03,"lane":2},{"time":116.657,"lane":1},{"time":117.284,"lane":0},{"time":117.864,"lane":3},{"time":118.491,"lane":1},{"time":119.443,"lane":0},{"time":120.233,"lane":3},{"time":120.883,"lane":0},{"time":121.905,"lane":2},{"time":122.81,"lane":1},{"time":124.134,"lane":3},{"time":124.947,"lane":0},{"time":125.759,"lane":3},{"time":126.99,"lane":0},{"time":127.919,"lane":3},{"time":128.755,"lane":0},{"time":130.218,"lane":3},{"time":131.007,"lane":0}];
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

  function completeKlangwaldLevelOne() {
    const progress = readProgress();
    progress.klangwald = {
      level1Completed: true,
      level2Completed: !!progress.klangwald?.level2Completed
    };
    localStorage.setItem(STORAGE_LEVEL_PROGRESS, JSON.stringify(progress));
    writeMinigamePendingNotice('klangwald');
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
    game.early = 0;
    game.combo = 0;
    game.maxCombo = 0;
    game.energy = 100;
    game.lastHudUpdate = 0;
    game.feedback = [];
    window.SinnesScore?.startSession('game_klangwald', 1000, 0);
    window.SinnesScore?.setGameplayActive(true);
    game.laneFlash = [0, 0, 0, 0];
  }

  function showPopup(type) {
    overlay.classList.remove('hidden');

    if (type === 'intro') {
      popup.innerHTML = `
        <div>
          <h1>Klangwald</h1>
          <div class="mini-guide-wrap">
            <p class="mini-guide-hint">Triff die Töne im Zielkreis.</p>
            <div class="mini-guide-slider" aria-label="Klangwald Anleitung">
              <article class="mini-guide-card">
                <div class="mini-guide-icon">🎵</div>
                <p class="mini-guide-title">Noten fallen</p>
                <p class="mini-guide-text">Beobachte die vier Spuren.</p>
              </article>
              <article class="mini-guide-card">
                <div class="mini-guide-icon">⭕</div>
                <p class="mini-guide-title">Zielkreis</p>
                <p class="mini-guide-text">Drücke erst, wenn die Note im Kreis ist.</p>
              </article>
              <article class="mini-guide-card">
                <div class="mini-guide-icon"><span class="mini-guide-inline-row tight"><span class="mini-guide-inline-item keycap">A</span><span class="mini-guide-inline-item keycap">S</span><span class="mini-guide-inline-item keycap">D</span><span class="mini-guide-inline-item keycap">F</span></span></div>
                <p class="mini-guide-title">Tasten</p>
                <p class="mini-guide-text">Am Handy nutzt du die vier Knöpfe unten.</p>
              </article>
              <article class="mini-guide-card">
                <div class="mini-guide-icon">⚡</div>
                <p class="mini-guide-title">Energie</p>
                <p class="mini-guide-text">Zu viele Fehler leeren die Leiste.</p>
              </article>
            </div>
          </div>
          <div class="rhythm-popup-actions">
            <button id="startRhythmGame" class="rhythm-button" type="button">Starten</button>
            <button id="leaveRhythmGame" class="rhythm-button secondary" type="button">Zurück</button>
          </div>
        </div>`;
      document.getElementById('startRhythmGame').addEventListener('click', startGame);
      document.getElementById('leaveRhythmGame').addEventListener('click', () => {
        window.location.href = 'klangwald.html?minigameAborted=1';
      });
      return;
    }

    if (type === 'won') {
      const hitRate = Math.round((game.hits / game.notes.length) * 100);
      popup.innerHTML = `
        <div>
          <h2>Klangfolge geschafft!</h2>
          <div class="mini-guide-icon">🎵</div>
          <p>${game.hits}/${game.notes.length} Töne getroffen.</p>
          <p class="small-note">Beste Serie: ${game.maxCombo}</p>
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
        <div class="mini-guide-icon">⭕</div>
        <p>Drücke näher am Zielkreis.</p>
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
    popup.innerHTML = `
      <div>
        <h1>Bereit?</h1>
        <div id="rhythmCountdown" class="rhythm-countdown">3</div>
        <p>Gleich starten die Töne.</p>
      </div>`;
    overlay.classList.remove('hidden');

    music.pause();
    music.currentTime = 0;
    music.volume = currentVolume();

    let count = 3;
    const countdown = document.getElementById('rhythmCountdown');
    const tick = window.setInterval(() => {
      count -= 1;
      if (countdown) countdown.textContent = count > 0 ? String(count) : 'Los!';
      if (count > 0) return;
      window.clearInterval(tick);
      window.setTimeout(() => {
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
      }, 420);
    }, 1000);
  }

  function endGame(won) {
    if (game.finished) return;
    game.running = false;
    game.finished = true;
    music.pause();

    if (won) { completeKlangwaldLevelOne(); window.SinnesScore?.finishSession('game_klangwald', game.score, 1000); } else { window.SinnesGameOver?.play?.(); }
    if (!won) window.SinnesGameOver?.play?.();
    window.SinnesScore?.setGameplayActive(false);
    window.setTimeout(() => (!won && window.SinnesGameOver?.play?.(), showPopup(won ? 'won' : 'lost')), 360);
  }

  function songTime() {
    return music.currentTime || 0;
  }

  function updateHud(force = false) {
    const now = performance.now();
    if (!force && now - game.lastHudUpdate < 120) return;
    game.lastHudUpdate = now;

    if(scoreText) scoreText.textContent = '';
    if(energyFill) energyFill.style.width = `${Math.max(0, Math.min(100, game.energy))}%`;
    if(comboText) comboText.textContent = '';
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
    window.SinnesScore?.addPoints('game_klangwald', -50, 1000);
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
      game.early = (game.early || 0) + 1;
      window.SinnesScore?.addPoints('game_klangwald', -25, 1000);
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
      game.score += 6;
      window.SinnesScore?.addPoints('game_klangwald', 6, 1000);
      game.energy = Math.min(100, game.energy + 1.2);
      addFeedback('Perfekt', lane, 'perfect');
    } else if (bestDistance <= HIT_WINDOWS.good) {
      game.good += 1;
      game.score += 3;
      window.SinnesScore?.addPoints('game_klangwald', 3, 1000);
      game.energy = Math.min(100, game.energy + 0.6);
      addFeedback('Gut', lane, 'good');
    } else {
      game.ok += 1;
      game.score = Math.max(0, game.score - 50);
      window.SinnesScore?.addPoints('game_klangwald', -50, 1000);
      addFeedback('Falsch −50', lane, 'miss');
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

    const audioEnd = Number.isFinite(music.duration) && music.duration > 0
      ? music.duration
      : Math.max(BEATMAP[BEATMAP.length - 1].time + 4.0, 132);
    if ((music.ended && t > 0) || t >= audioEnd - 0.15) {
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

    const finalTime = Number.isFinite(music.duration) && music.duration > 0 ? music.duration : Math.max(BEATMAP[BEATMAP.length - 1].time + 4, 132);
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
