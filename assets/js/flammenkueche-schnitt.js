(() => {
  const STORAGE_VOLUME = 'sinnesmagie-volume';
  const STORAGE_LEVEL_PROGRESS = 'sinnesmagie-level-progress';
  const STORAGE_PENDING_NOTICE = 'sinnesmagie-pending-notice';
  const GAME_DURATION = 60;
  const MAX_LIVES = 999999;
  const MISS_DAMAGE = 0.25;
  const BAD_DAMAGE = 1;
  const MAX_OBJECTS = 6;
  const MAX_PARTICLES = 42;

  const canvas = document.getElementById('sliceCanvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('sliceOverlay');
  const popup = document.getElementById('slicePopup');
  const scoreEl = document.getElementById('sliceScore');
  const timerEl = document.getElementById('sliceTimer');
  const badEl = document.getElementById('sliceBad');
  const progressFill = document.getElementById('sliceProgressFill');
  const musicElement = document.getElementById('sliceMusic');
  const cutSoundElement = document.getElementById('sliceCutSound');
  const slimeSoundElement = document.getElementById('sliceSlimeSound');
  const cutSoundPool = [];
  const slimeSoundPool = [];
  let musicStarted = false;

  const background = new Image();
  background.src = '../assets/images/battle-backgrounds/flammenkueche.webp';

  const iconSpriteCache = new Map();

  const goodItems = [
    { label: 'Paprika', kind: 'paprika', color: '#e53631', radiusFactor: 0.118, points: 1 },
    { label: 'Zwiebel', kind: 'onion', color: '#e9c9dd', radiusFactor: 0.105, points: 2 },
    { label: 'Karotte', kind: 'carrot', color: '#f28a20', radiusFactor: 0.090, points: 3 },
    { label: 'Tomate', kind: 'tomato', color: '#f34838', radiusFactor: 0.075, points: 5 },
  ];

  const badItems = [
    { label: 'Käfer', kind: 'beetle', color: '#3e8f57' },
    { label: 'Socke', kind: 'sock', color: '#8b6fbb' },
    { label: 'Fliegenpilz', kind: 'toadstool', color: '#d83b2e' },
  ];

  const game = {
    running: false,
    finished: false,
    startTime: 0,
    lastTime: 0,
    elapsed: 0,
    score: 0,
    combo: 0,
    lives: MAX_LIVES,
    badHits: 0,
    spawnTimer: 0.4,
    objects: [],
    particles: [],
    trail: [],
    pointerDown: false,
    lastHudUpdate: 0,
    feedback: '',
    feedbackUntil: 0,
    feedbackColor: '#ffe36d',
  };

  function currentVolume() {
    const saved = Number(localStorage.getItem(STORAGE_VOLUME));
    return Number.isFinite(saved) ? Math.min(1, Math.max(0, saved)) : 0.5;
  }

  function startMusic(restart = false) {
    if (!musicElement) return;
    try {
      musicElement.loop = true;
      musicElement.volume = currentVolume() * 0.62;
      if (restart || !musicStarted) musicElement.currentTime = 0;
      musicStarted = true;
      musicElement.play().catch(() => {});
    } catch {}
  }

  function pauseMusic() {
    if (!musicElement) return;
    try { musicElement.pause(); } catch {}
  }

  function prepareAudioPool(sourceElement, pool, size = 3, volumeFactor = 0.72) {
    if (!sourceElement || pool.length) return;
    for (let i = 0; i < size; i += 1) {
      const audio = i === 0 ? sourceElement : sourceElement.cloneNode(true);
      audio.volume = currentVolume() * volumeFactor;
      audio.preload = 'auto';
      pool.push(audio);
    }
  }

  function playPooledSound(pool, volumeFactor = 0.72) {
    const volume = currentVolume() * volumeFactor;
    const sound = pool.find((audio) => audio.paused || audio.ended) || pool[0];
    if (!sound) return;
    try {
      sound.volume = volume;
      sound.currentTime = 0;
      sound.play().catch(() => {});
    } catch {}
  }

  function prepareCutSounds() {
    prepareAudioPool(cutSoundElement, cutSoundPool, 4, 0.7);
    prepareAudioPool(slimeSoundElement, slimeSoundPool, 3, 0.78);
  }

  function playCutSound() {
    prepareCutSounds();
    playPooledSound(cutSoundPool, 0.7);
  }

  function playSlimeSound() {
    prepareCutSounds();
    playPooledSound(slimeSoundPool, 0.78);
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

  function completeFlameLevelOne() {
    const progress = readProgress();
    progress.flammenkueche = {
      level1Completed: true,
      level2Completed: !!progress.flammenkueche?.level2Completed,
    };
    localStorage.setItem(STORAGE_LEVEL_PROGRESS, JSON.stringify(progress));
    writeMinigamePendingNotice('flammenkueche');
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
    iconSpriteCache.clear();
  }

  function showPopup(type) {
    overlay.classList.remove('hidden');
    if (type === 'intro') {
      popup.innerHTML = `
        <div class="minigame-intro-content">
          <h1>Schnippelchaos</h1>
          <p class="minigame-intro-lead">Schneide das frische Gemüse mit einer Wischbewegung und lass ungenießbare Dinge vorbeifliegen.</p>
          <div class="slice-guide-grid" aria-label="Spielanleitung">
            <article class="slice-guide-card">
              <div class="slice-guide-icons" aria-hidden="true"><span>🥕</span><span>🍅</span><span>🧅</span></div>
              <strong>Gemüse schneiden</strong>
              <p>Wische mit dem Finger direkt durch gutes Gemüse.</p>
            </article>
            <article class="slice-guide-card">
              <div class="slice-guide-icons" aria-hidden="true"><span>🧦</span><span>🐞</span><span>🍄</span></div>
              <strong>Nicht berühren</strong>
              <p>Lass ungenießbare Gegenstände einfach vorbeifliegen.</p>
            </article>
          </div>
          <div class="slice-popup-actions">
            <button id="startSliceGame" class="slice-button" type="button">Starten</button>
            <button id="leaveSliceGame" class="slice-button secondary" type="button">Zurück</button>
          </div>
        </div>`;
      document.getElementById('startSliceGame').addEventListener('click', startGame);
      document.getElementById('leaveSliceGame').addEventListener('click', () => {
        window.location.href = 'flammenkueche.html?minigameAborted=1';
      });
      return;
    }

    if (type === 'won') {
      popup.innerHTML = `
        <div>
          <h2>Geschafft!</h2>
          <div class="mini-guide-icon">🥕</div>
          <p>Highscore-Punkte: ${Math.max(0, Math.min(1000, (game.goodCuts || 0) * 10 - (game.badHits || 0) * 50 - (game.missedGood || 0) * 20))}</p>
          <div class="slice-popup-actions">
            <button id="returnToFlame" class="slice-button" type="button">Zur Flammenküche</button>
          </div>
        </div>`;
      document.getElementById('returnToFlame').addEventListener('click', () => {
        window.location.href = 'flammenkueche.html';
      });
      return;
    }

    popup.innerHTML = `
      <div>
        <h2>Verloren!</h2>
        <div class="mini-guide-icon">🧦</div>
        <p>Lass Ungenießbares vorbeifliegen.</p>
        <div class="slice-popup-actions">
          <button id="retrySliceGame" class="slice-button" type="button">Nochmal spielen</button>
          <button id="returnToFlame" class="slice-button secondary" type="button">Zurück</button>
        </div>
      </div>`;
    document.getElementById('retrySliceGame').addEventListener('click', startGame);
    document.getElementById('returnToFlame').addEventListener('click', () => {
      window.location.href = 'flammenkueche.html';
    });
  }

  function hidePopup() {
    overlay.classList.add('hidden');
  }

  function startGame() {
    game.running = true;
    game.finished = false;
    game.startTime = performance.now();
    game.lastTime = game.startTime;
    game.elapsed = 0;
    game.score = 0;
    game.combo = 0;
    game.lives = MAX_LIVES;
    game.badHits = 0;
    game.goodCuts = 0;
    game.missedGood = 0;
    game.spawnTimer = 0.45;
    game.objects.length = 0;
    game.particles.length = 0;
    game.trail.length = 0;
    game.pointerDown = false;
    game.lastHudUpdate = 0;
    game.feedback = '';
    game.feedbackUntil = 0;
    updateHud(true);
    hidePopup();
    window.SinnesScore?.startSession('game_flammenkueche', 1000, 0);
    window.SinnesScore?.setGameplayActive(true);
    startMusic(true);
    prepareCutSounds();
    requestAnimationFrame(loop);
  }

  function endGame(won) {
    if (!game.running) return;
    game.running = false;
    game.finished = true;
    pauseMusic();
    if (won) { completeFlameLevelOne(); const points = Math.max(0, Math.min(1000, (game.goodCuts || 0) * 10 - (game.badHits || 0) * 50 - (game.missedGood || 0) * 20)); window.SinnesScore?.setSession('game_flammenkueche', points, 1000); window.SinnesScore?.finishSession('game_flammenkueche', points, 1000); }
    window.SinnesScore?.setGameplayActive(false);
    setTimeout(() => showPopup(won ? 'won' : 'lost'), 360);
  }

  function formatLives(value) {
    return Math.max(0, value).toFixed(2).replace('.', ',');
  }

  function updateHud(force = false) {
    const now = performance.now();
    if (!force && now - game.lastHudUpdate < 160) return;
    game.lastHudUpdate = now;
    const remaining = Math.max(0, Math.ceil(GAME_DURATION - game.elapsed));
    if (scoreEl) scoreEl.textContent = `Highscore: ${window.SinnesScore?.sessionValue?.('game_flammenkueche') || 0}`;
    timerEl.textContent = `Zeit: ${remaining} s`;
    if (badEl) badEl.textContent = `Leben: ${formatLives(game.lives)}/${MAX_LIVES}`;
    progressFill.style.width = `${Math.min(100, (game.elapsed / GAME_DURATION) * 100)}%`;
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function createObject() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const elapsedRatio = Math.min(1, game.elapsed / GAME_DURATION);
    const isBad = Math.random() < (0.31 + elapsedRatio * 0.08);
    const template = isBad
      ? badItems[Math.floor(Math.random() * badItems.length)]
      : goodItems[Math.floor(Math.random() * goodItems.length)];

    const fromLeft = Math.random() < 0.5;
    const startX = fromLeft ? randomBetween(-120, w * 0.18) : randomBetween(w * 0.82, w + 120);
    const startY = h + randomBetween(70, 160);
    const targetX = randomBetween(w * 0.12, w * 0.88);
    // Einige Objekte fliegen sehr hoch, andere mittelhoch.
    // Die alte Formel erreichte den Apex nicht wirklich; diese Parabel nutzt den ganzen Bildschirm.
    const highFlight = Math.random() < 0.42;
    const apexY = highFlight ? randomBetween(h * 0.015, h * 0.18) : randomBetween(h * 0.20, h * 0.58);
    const timeToApex = randomBetween(1.05, 1.48);
    const gravity = (2 * (startY - apexY)) / (timeToApex * timeToApex);
    const vy = -gravity * timeToApex;
    const vx = (targetX - startX) / timeToApex;
    const minSide = Math.min(w, h);
    const radius = isBad
      ? minSide * 0.10
      : minSide * template.radiusFactor;

    game.objects.push({
      x: startX,
      y: startY,
      vx,
      vy,
      gravity,
      radius,
      rot: randomBetween(-0.28, 0.28),
      spin: randomBetween(-1.7, 1.7),
      isBad,
      sliced: false,
      kind: template.kind,
      color: template.color,
      label: template.label,
      points: template.points || 0,
      age: 0,
      remove: false,
      resolved: false,
      missedPenaltyApplied: false,
      hasEnteredScreen: false,
    });
  }

  function addParticles(x, y, color, count = 8) {
    const available = Math.max(0, MAX_PARTICLES - game.particles.length);
    const actualCount = Math.min(count, available);
    for (let i = 0; i < actualCount; i += 1) {
      game.particles.push({
        x,
        y,
        vx: randomBetween(-190, 190),
        vy: randomBetween(-190, 120),
        gravity: 420,
        radius: randomBetween(3, 8),
        color,
        age: 0,
        life: randomBetween(0.32, 0.58),
        remove: false,
      });
    }
  }

  function markFeedback(text, color) {
    game.feedback = text;
    game.feedbackColor = color;
    game.feedbackUntil = performance.now() + 720;
  }

  function loseLife(amount, message, color = '#ffb14f') {
    // Lebenssystem entfernt: nur neutrales Highscore-Feedback bleibt erhalten.
    game.combo = 0;
    markFeedback(message, color);
    updateHud(true);
  }


  function sliceObject(obj) {
    if (obj.sliced || obj.remove || obj.resolved) return;
    obj.sliced = true;
    obj.resolved = true;
    obj.missedPenaltyApplied = true;
    obj.remove = true;
    addParticles(obj.x, obj.y, obj.color, obj.isBad ? 9 : 7);
    playCutSound();

    if (obj.isBad) {
      playSlimeSound();
      game.badHits += 1;
      window.SinnesScore?.addPoints('game_flammenkueche', -50, 1000);
      game.combo = 0;
      markFeedback('Falsches Objekt: −50', '#ff7b7b');
      updateHud(true);
      if (navigator.vibrate) navigator.vibrate(70);
      return;
    }

    game.goodCuts = (game.goodCuts || 0) + 1;
    window.SinnesScore?.addPoints('game_flammenkueche', 10, 1000);
    game.combo += 1;
    const comboBonus = game.combo >= 8 ? 3 : game.combo >= 4 ? 2 : 0;
    game.score += obj.points + comboBonus;
    markFeedback(game.combo >= 4 ? `${obj.label}: +${obj.points + comboBonus} · Combo x${game.combo}` : `${obj.label}: +${obj.points}`, '#ffe36d');
  }

  function compactArray(arr) {
    let write = 0;
    for (let read = 0; read < arr.length; read += 1) {
      const item = arr[read];
      if (!item.remove) {
        arr[write] = item;
        write += 1;
      }
    }
    arr.length = write;
  }

  function update(dt, now) {
    game.elapsed = (now - game.startTime) / 1000;

    const spawnEvery = Math.max(1.02, 1.34 - game.elapsed / 210);
    game.spawnTimer -= dt;
    if (game.spawnTimer <= 0) {
      if (game.objects.length < MAX_OBJECTS) createObject();
      if (game.elapsed > 34 && game.objects.length < MAX_OBJECTS - 1 && Math.random() < 0.06) {
        setTimeout(() => { if (game.running && game.objects.length < MAX_OBJECTS) createObject(); }, 190);
      }
      game.spawnTimer = spawnEvery + randomBetween(0.08, 0.32);
    }

    const h = window.innerHeight;
    const w = window.innerWidth;
    for (const obj of game.objects) {
      obj.age += dt;
      obj.x += obj.vx * dt;
      obj.y += obj.vy * dt;
      obj.vy += obj.gravity * dt;
      obj.rot += obj.spin * dt;
      // Objekte starten unterhalb des Bildschirms und fliegen zuerst hinein.
      // Deshalb darf ein Objekt erst als „verpasst“ zählen, nachdem es sichtbar im Spielfeld war
      // und anschließend wieder vollständig unten herausfällt.
      if (!obj.hasEnteredScreen && obj.y + obj.radius < h - 8) {
        obj.hasEnteredScreen = true;
      }

      const completelyBelowScreen = obj.hasEnteredScreen && obj.y - obj.radius > h + 10;
      if (!obj.resolved && !obj.sliced && !obj.remove && completelyBelowScreen && !obj.missedPenaltyApplied) {
        obj.resolved = true;
        obj.missedPenaltyApplied = true;
        if (!obj.isBad) {
          game.missedGood = (game.missedGood || 0) + 1;
          window.SinnesScore?.addPoints('game_flammenkueche', -20, 1000);
          game.combo = 0;
          markFeedback('Gemüse verpasst: −20', '#ffcf5d');
          updateHud(true);
        }
      }
      if (obj.sliced || completelyBelowScreen || obj.y > h + obj.radius + 220 || obj.x < -obj.radius - 180 || obj.x > w + obj.radius + 180) {
        obj.remove = true;
      }
    }
    compactArray(game.objects);

    for (const p of game.particles) {
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      if (p.age >= p.life) p.remove = true;
    }
    compactArray(game.particles);

    const cutoff = now - 170;
    while (game.trail.length && game.trail[0].t < cutoff) game.trail.shift();

    updateHud();
    if (game.elapsed >= GAME_DURATION) endGame(true);
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
      g.addColorStop(0, '#3a1007');
      g.addColorStop(0.55, '#86230e');
      g.addColorStop(1, '#210905');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(0, 0, w, h);

    const potY = h * 0.92;
    ctx.save();
    ctx.fillStyle = 'rgba(72, 24, 13, 0.82)';
    ctx.beginPath();
    ctx.ellipse(w * 0.5, potY, w * 0.24, h * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 110, 31, 0.62)';
    ctx.beginPath();
    ctx.ellipse(w * 0.5, potY - h * 0.02, w * 0.2, h * 0.035, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function symbolFor(kind) {
    return {
      paprika: '🫑',
      onion: '🧅',
      carrot: '🥕',
      tomato: '🍅',
      beetle: '🐞',
      sock: '🧦',
      toadstool: '🍄',
    }[kind] || '🥕';
  }

  function spriteScaleFor(kind) {
    return {
      paprika: 1.72,
      onion: 1.68,
      carrot: 1.76,
      tomato: 1.72,
      beetle: 1.72,
      sock: 1.76,
      toadstool: 1.72,
    }[kind] || 1.7;
  }

  function getIconSprite(kind, radius) {
    const roundedRadius = Math.max(18, Math.round(radius));
    const key = `${kind}:${roundedRadius}`;
    if (iconSpriteCache.has(key)) return iconSpriteCache.get(key);

    const c = document.createElement('canvas');
    const size = Math.ceil(roundedRadius * 2.65);
    c.width = size;
    c.height = size;
    const g = c.getContext('2d');
    const symbol = symbolFor(kind);
    const fontSize = Math.round(roundedRadius * spriteScaleFor(kind));
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `${fontSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", system-ui, sans-serif`;
    g.globalAlpha = 0.28;
    g.fillStyle = 'rgba(70, 24, 8, 0.95)';
    g.fillText(symbol, size / 2 + 2, size / 2 + 3);
    g.globalAlpha = 1;
    g.fillText(symbol, size / 2, size / 2);

    iconSpriteCache.set(key, c);
    return c;
  }

  function drawObject(obj) {
    ctx.save();
    ctx.translate(obj.x, obj.y);
    ctx.rotate(obj.rot);

    // Emojis werden nicht mehr jedes Frame als Text gerendert.
    // Sie liegen als vorberechnete kleine Canvas-Sprites im Cache und werden nur noch gezeichnet.
    const sprite = getIconSprite(obj.kind, obj.radius);
    ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2, sprite.width, sprite.height);

    ctx.restore();
  }

  function drawParticles() {
    for (const p of game.particles) {
      const alpha = 1 - p.age / p.life;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawTrail(now) {
    if (game.trail.length < 2) return;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 1; i < game.trail.length; i += 1) {
      const a = game.trail[i - 1];
      const b = game.trail[i];
      const alpha = Math.max(0, Math.min(1, (b.t - (now - 170)) / 170));
      ctx.strokeStyle = `rgba(255, 242, 155, ${alpha})`;
      ctx.lineWidth = 7 * alpha + 2;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFeedback(now, w, h) {
    if (now > game.feedbackUntil || !game.feedback) return;
    const alpha = Math.min(1, (game.feedbackUntil - now) / 260);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${Math.round(Math.min(w, h) * 0.052)}px system-ui, sans-serif`;
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(61, 20, 8, 0.85)';
    ctx.fillStyle = game.feedbackColor || '#ffe36d';
    ctx.strokeText(game.feedback, w / 2, h * 0.22);
    ctx.fillText(game.feedback, w / 2, h * 0.22);
    ctx.restore();
  }

  function draw() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const now = performance.now();
    drawBackground(w, h);
    for (const obj of game.objects) drawObject(obj);
    drawParticles();
    drawTrail(now);
    drawFeedback(now, w, h);
  }

  function distancePointToSegment(px, py, ax, ay, bx, by) {
    const vx = bx - ax;
    const vy = by - ay;
    const wx = px - ax;
    const wy = py - ay;
    const c1 = vx * wx + vy * wy;
    if (c1 <= 0) return Math.hypot(px - ax, py - ay);
    const c2 = vx * vx + vy * vy;
    if (c2 <= c1) return Math.hypot(px - bx, py - by);
    const t = c1 / c2;
    const projX = ax + t * vx;
    const projY = ay + t * vy;
    return Math.hypot(px - projX, py - projY);
  }

  function testSliceSegment(a, b) {
    if (!game.running) return;
    for (const obj of game.objects) {
      if (obj.sliced || obj.remove || obj.resolved) continue;
      const dist = distancePointToSegment(obj.x, obj.y, a.x, a.y, b.x, b.y);
      if (dist <= obj.radius * 1.08) sliceObject(obj);
    }
    updateHud(true);
  }

  function pointerPosition(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      t: performance.now(),
    };
  }

  function handlePointerDown(event) {
    if (!game.running) return;
    event.preventDefault();
    game.pointerDown = true;
    const p = pointerPosition(event);
    game.trail.length = 0;
    game.trail.push(p);
    try { canvas.setPointerCapture(event.pointerId); } catch {}
  }

  function handlePointerMove(event) {
    if (!game.running || !game.pointerDown) return;
    event.preventDefault();
    const p = pointerPosition(event);
    const last = game.trail[game.trail.length - 1];
    if (last && Math.hypot(p.x - last.x, p.y - last.y) > 2) {
      testSliceSegment(last, p);
      game.trail.push(p);
      if (game.trail.length > 12) game.trail.shift();
    }
  }

  function handlePointerUp(event) {
    if (!game.pointerDown) return;
    event.preventDefault();
    game.pointerDown = false;
    try { canvas.releasePointerCapture(event.pointerId); } catch {}
  }

  function loop(now) {
    if (!game.running) {
      draw();
      return;
    }
    const dt = Math.min(0.033, (now - game.lastTime) / 1000 || 0.016);
    game.lastTime = now;
    update(dt, now);
    draw();
    if (game.running) requestAnimationFrame(loop);
  }

  window.addEventListener('resize', () => {
    resizeCanvas();
    draw();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseMusic();
    else if (game.running) startMusic();
  });
  canvas.addEventListener('pointerdown', handlePointerDown, { passive: false });
  canvas.addEventListener('pointermove', handlePointerMove, { passive: false });
  canvas.addEventListener('pointerup', handlePointerUp, { passive: false });
  canvas.addEventListener('pointercancel', handlePointerUp, { passive: false });

  resizeCanvas();
  updateHud(true);
  showPopup('intro');
  draw();
})();
