(() => {
  const STORAGE_VOLUME = 'sinnesmagie-volume';
  const STORAGE_LEVEL_PROGRESS = 'sinnesmagie-level-progress';
  const GAME_DURATION = 60;
  const BAD_LIMIT = 3;

  const canvas = document.getElementById('sliceCanvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('sliceOverlay');
  const popup = document.getElementById('slicePopup');
  const scoreEl = document.getElementById('sliceScore');
  const timerEl = document.getElementById('sliceTimer');
  const badEl = document.getElementById('sliceBad');
  const progressFill = document.getElementById('sliceProgressFill');
  const musicElement = document.getElementById('sliceMusic');
  const musicLoop = window.createCrossfadeLoop ? window.createCrossfadeLoop(musicElement, { fadeSeconds: 0.08 }) : null;

  const background = new Image();
  background.src = '../assets/images/battle-backgrounds/flammenkueche.png';

  const goodItems = [
    { label: 'Tomate', emoji: '🍅', color: '#f34838' },
    { label: 'Paprika', emoji: '🫑', color: '#49b84a' },
    { label: 'Karotte', emoji: '🥕', color: '#f28a20' },
    { label: 'Pilz', emoji: '🍄', color: '#d98b5b' },
    { label: 'Kartoffel', emoji: '🥔', color: '#c99751' },
    { label: 'Zwiebel', emoji: '🧅', color: '#e9c9dd' },
    { label: 'Kräuter', emoji: '🌿', color: '#4ec15b' },
  ];

  const badItems = [
    { label: 'Schleim', emoji: '🟢', color: '#66d14d' },
    { label: 'Müll', emoji: '🗑️', color: '#707070' },
    { label: 'Socke', emoji: '🧦', color: '#8b6fbb' },
    { label: 'Käfer', emoji: '🪲', color: '#3e8f57' },
    { label: 'Gift', emoji: '☠️', color: '#6acb5a' },
  ];

  const game = {
    running: false,
    finished: false,
    startTime: 0,
    lastTime: 0,
    elapsed: 0,
    score: 0,
    combo: 0,
    badHits: 0,
    spawnTimer: 0.4,
    objects: [],
    particles: [],
    trail: [],
    pointerDown: false,
    lastHudUpdate: 0,
    feedback: '',
    feedbackUntil: 0,
  };

  function currentVolume() {
    const saved = Number(localStorage.getItem(STORAGE_VOLUME));
    return Number.isFinite(saved) ? Math.min(1, Math.max(0, saved)) : 0.5;
  }

  function startMusic() {
    const volume = currentVolume() * 0.65;
    if (musicLoop) {
      musicLoop.setVolume(volume);
      musicLoop.play();
    } else if (musicElement) {
      musicElement.volume = volume;
      musicElement.loop = true;
      musicElement.play().catch(() => {});
    }
  }

  function pauseMusic() {
    if (musicLoop) musicLoop.pause();
    else if (musicElement) musicElement.pause();
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

  function showPopup(type) {
    overlay.classList.remove('hidden');
    if (type === 'intro') {
      popup.innerHTML = `
        <div>
          <h1>Flammenküchen-Schnippelchaos</h1>
          <p>Schneide gutes Gemüse mit einer Wischbewegung.</p>
          <p>Eklige Sachen müssen vorbeifliegen. Bei drei ekligen Treffern ist die Runde verloren.</p>
          <p class="small-note">Halte Finger oder Maus gedrückt und wische durch die Zutaten.</p>
          <div class="slice-popup-actions">
            <button id="startSliceGame" class="slice-button" type="button">Starten</button>
            <button id="leaveSliceGame" class="slice-button secondary" type="button">Zurück</button>
          </div>
        </div>`;
      document.getElementById('startSliceGame').addEventListener('click', startGame);
      document.getElementById('leaveSliceGame').addEventListener('click', () => {
        window.location.href = 'flammenkueche.html';
      });
      return;
    }

    if (type === 'won') {
      popup.innerHTML = `
        <div>
          <h2>Geschafft!</h2>
          <p>Du hast genug gute Zutaten geschnitten und die Flammenküche gerettet.</p>
          <p>Punkte: ${game.score}</p>
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
        <p>Du hast drei eklige Sachen erwischt.</p>
        <p class="small-note">Schneide nur Gemüse und lass Schleim, Müll und andere eklige Dinge vorbeifliegen.</p>
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
    game.badHits = 0;
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
    startMusic();
    requestAnimationFrame(loop);
  }

  function endGame(won) {
    if (!game.running) return;
    game.running = false;
    game.finished = true;
    pauseMusic();
    if (won) completeFlameLevelOne();
    setTimeout(() => showPopup(won ? 'won' : 'lost'), 360);
  }

  function updateHud(force = false) {
    const now = performance.now();
    if (!force && now - game.lastHudUpdate < 160) return;
    game.lastHudUpdate = now;
    const remaining = Math.max(0, Math.ceil(GAME_DURATION - game.elapsed));
    scoreEl.textContent = `Punkte: ${game.score}`;
    timerEl.textContent = `Zeit: ${remaining} s`;
    badEl.textContent = `Ekel: ${game.badHits}/${BAD_LIMIT}`;
    progressFill.style.width = `${Math.min(100, (game.elapsed / GAME_DURATION) * 100)}%`;
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function createObject() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const elapsedRatio = Math.min(1, game.elapsed / GAME_DURATION);
    const isBad = Math.random() < (0.16 + elapsedRatio * 0.05);
    const template = isBad
      ? badItems[Math.floor(Math.random() * badItems.length)]
      : goodItems[Math.floor(Math.random() * goodItems.length)];

    const fromLeft = Math.random() < 0.5;
    const startX = fromLeft ? randomBetween(-60, w * 0.25) : randomBetween(w * 0.75, w + 60);
    const startY = h + randomBetween(38, 120);
    const targetX = randomBetween(w * 0.2, w * 0.8);
    const timeToApex = randomBetween(0.72, 0.95);
    const vx = (targetX - startX) / (timeToApex * 1.15);
    const vy = -randomBetween(h * 0.82, h * 1.02) * (1 + elapsedRatio * 0.06);
    const gravity = h * randomBetween(0.88, 1.02);
    const radius = Math.min(w, h) * randomBetween(0.04, 0.052);

    game.objects.push({
      x: startX,
      y: startY,
      vx,
      vy,
      gravity,
      radius,
      rot: randomBetween(-0.35, 0.35),
      spin: randomBetween(-2.2, 2.2),
      isBad,
      sliced: false,
      emoji: template.emoji,
      color: template.color,
      label: template.label,
      age: 0,
    });
  }

  function addParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i += 1) {
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
      });
    }
  }

  function markFeedback(text, color) {
    game.feedback = text;
    game.feedbackColor = color;
    game.feedbackUntil = performance.now() + 650;
  }

  function sliceObject(obj) {
    if (obj.sliced) return;
    obj.sliced = true;
    addParticles(obj.x, obj.y, obj.color, obj.isBad ? 16 : 12);

    if (obj.isBad) {
      game.badHits += 1;
      game.combo = 0;
      markFeedback('Ekelig erwischt!', '#78e05a');
      if (navigator.vibrate) navigator.vibrate(70);
      if (game.badHits >= BAD_LIMIT) {
        updateHud(true);
        endGame(false);
      }
      return;
    }

    game.combo += 1;
    const comboBonus = game.combo >= 8 ? 3 : game.combo >= 4 ? 2 : 1;
    game.score += 1 + comboBonus;
    markFeedback(game.combo >= 4 ? `Combo x${game.combo}` : 'Geschnitten!', '#ffe36d');
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

    const spawnEvery = Math.max(0.74, 1.08 - game.elapsed / 120);
    game.spawnTimer -= dt;
    if (game.spawnTimer <= 0) {
      createObject();
      if (game.elapsed > 24 && Math.random() < 0.18) {
        setTimeout(() => { if (game.running) createObject(); }, 140);
      }
      game.spawnTimer = spawnEvery + randomBetween(0.0, 0.24);
    }

    const h = window.innerHeight;
    for (const obj of game.objects) {
      obj.age += dt;
      obj.x += obj.vx * dt;
      obj.y += obj.vy * dt;
      obj.vy += obj.gravity * dt;
      obj.rot += obj.spin * dt;
      if (obj.sliced || obj.y > h + 160 || obj.x < -180 || obj.x > window.innerWidth + 180) {
        obj.remove = true;
        if (!obj.sliced && !obj.isBad) game.combo = 0;
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

  function drawObject(obj) {
    ctx.save();
    ctx.translate(obj.x, obj.y);
    ctx.rotate(obj.rot);

    ctx.fillStyle = obj.isBad ? 'rgba(103, 205, 69, 0.82)' : 'rgba(255, 235, 168, 0.82)';
    ctx.strokeStyle = obj.isBad ? '#24551d' : '#7c2a12';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, obj.radius * 1.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.font = `${Math.round(obj.radius * 1.35)}px system-ui, Apple Color Emoji, Segoe UI Emoji`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(obj.emoji, 0, obj.radius * 0.02);

    if (obj.isBad) {
      ctx.fillStyle = '#fff5a8';
      ctx.font = `${Math.round(obj.radius * 0.54)}px system-ui, sans-serif`;
      ctx.fillText('!', obj.radius * 0.72, -obj.radius * 0.76);
    }
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
    ctx.font = `900 ${Math.round(Math.min(w, h) * 0.06)}px system-ui, sans-serif`;
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
      if (obj.sliced) continue;
      const dist = distancePointToSegment(obj.x, obj.y, a.x, a.y, b.x, b.y);
      if (dist <= obj.radius * 1.12) sliceObject(obj);
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
