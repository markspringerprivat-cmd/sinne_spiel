(() => {
  const STORAGE_VOLUME = 'sinnesmagie-volume';
  const STORAGE_LEVEL_PROGRESS = 'sinnesmagie-level-progress';
  const GAME_DURATION = 60;
  const MAX_LIVES = 5;
  const MISS_DAMAGE = 0.25;
  const BAD_DAMAGE = 1;

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
          <p>Schneide Gemüse mit einer Wischbewegung. Ungenießbare Sachen dürfen nicht getroffen werden.</p>
          <p class="small-note"><strong>Punkte nach Größe:</strong><br>
            Paprika: groß, 1 Punkt · Zwiebel: groß, 2 Punkte · Karotte: mittel, 3 Punkte · Tomate: klein, 5 Punkte
          </p>
          <p class="small-note"><strong>Leben:</strong><br>
            Du hast 5 Leben. Verpasstes Gemüse kostet ¼ Leben. Ungenießbar getroffen kostet 1 Leben.
          </p>
          <p class="small-note"><strong>Ungenießbar:</strong> Käfer, Socke und Fliegenpilz. Alle sind gleich groß.</p>
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
        <p>Du hast keine Leben mehr übrig.</p>
        <p class="small-note">Schneide Gemüse und lass Käfer, Socke und Fliegenpilz vorbeifliegen.</p>
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

  function formatLives(value) {
    return Math.max(0, value).toFixed(2).replace('.', ',');
  }

  function updateHud(force = false) {
    const now = performance.now();
    if (!force && now - game.lastHudUpdate < 160) return;
    game.lastHudUpdate = now;
    const remaining = Math.max(0, Math.ceil(GAME_DURATION - game.elapsed));
    scoreEl.textContent = `Punkte: ${game.score}`;
    timerEl.textContent = `Zeit: ${remaining} s`;
    badEl.textContent = `Leben: ${formatLives(game.lives)}/${MAX_LIVES}`;
    progressFill.style.width = `${Math.min(100, (game.elapsed / GAME_DURATION) * 100)}%`;
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function createObject() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const elapsedRatio = Math.min(1, game.elapsed / GAME_DURATION);
    const isBad = Math.random() < (0.15 + elapsedRatio * 0.04);
    const template = isBad
      ? badItems[Math.floor(Math.random() * badItems.length)]
      : goodItems[Math.floor(Math.random() * goodItems.length)];

    const fromLeft = Math.random() < 0.5;
    const startX = fromLeft ? randomBetween(-90, w * 0.22) : randomBetween(w * 0.78, w + 90);
    const startY = h + randomBetween(55, 150);
    const targetX = randomBetween(w * 0.18, w * 0.82);
    const timeToApex = randomBetween(0.78, 1.05);
    const vx = (targetX - startX) / (timeToApex * 1.15);
    const vy = -randomBetween(h * 0.82, h * 1.0) * (1 + elapsedRatio * 0.04);
    const gravity = h * randomBetween(0.84, 0.98);
    const minSide = Math.min(w, h);
    const radius = isBad
      ? minSide * 0.095
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
      missedPenaltyApplied: false,
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
    game.lives = Math.max(0, Math.round((game.lives - amount) * 100) / 100);
    game.combo = 0;
    markFeedback(message, color);
    updateHud(true);
    if (game.lives <= 0) endGame(false);
  }

  function sliceObject(obj) {
    if (obj.sliced || obj.remove) return;
    obj.sliced = true;
    obj.remove = true;
    addParticles(obj.x, obj.y, obj.color, obj.isBad ? 16 : 12);

    if (obj.isBad) {
      game.badHits += 1;
      loseLife(BAD_DAMAGE, 'Ungenießbar erwischt! -1 Leben', '#98ec65');
      if (navigator.vibrate) navigator.vibrate(70);
      return;
    }

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

    const spawnEvery = Math.max(0.86, 1.18 - game.elapsed / 150);
    game.spawnTimer -= dt;
    if (game.spawnTimer <= 0) {
      createObject();
      if (game.elapsed > 28 && Math.random() < 0.13) {
        setTimeout(() => { if (game.running) createObject(); }, 170);
      }
      game.spawnTimer = spawnEvery + randomBetween(0.02, 0.25);
    }

    const h = window.innerHeight;
    const w = window.innerWidth;
    for (const obj of game.objects) {
      obj.age += dt;
      obj.x += obj.vx * dt;
      obj.y += obj.vy * dt;
      obj.vy += obj.gravity * dt;
      obj.rot += obj.spin * dt;
      if (!obj.sliced && obj.y > h + obj.radius + 35 && !obj.missedPenaltyApplied) {
        obj.missedPenaltyApplied = true;
        if (!obj.isBad) {
          loseLife(MISS_DAMAGE, 'Gemüse verpasst! -¼ Leben', '#ffcf5d');
        }
      }
      if (obj.sliced || obj.y > h + obj.radius + 180 || obj.x < -obj.radius - 180 || obj.x > w + obj.radius + 180) {
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

  function drawObject(obj) {
    ctx.save();
    ctx.translate(obj.x, obj.y);
    ctx.rotate(obj.rot);

    ctx.fillStyle = obj.isBad ? 'rgba(194, 236, 150, 0.9)' : 'rgba(255, 236, 173, 0.9)';
    ctx.strokeStyle = obj.isBad ? '#285420' : '#7c2a12';
    ctx.lineWidth = Math.max(3, obj.radius * 0.06);
    ctx.beginPath();
    ctx.arc(0, 0, obj.radius * 1.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (obj.isBad) {
      drawBadIcon(obj.kind, obj.radius);
      ctx.fillStyle = '#fff5a8';
      ctx.font = `900 ${Math.round(obj.radius * 0.45)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', obj.radius * 0.72, -obj.radius * 0.72);
    } else {
      drawGoodIcon(obj.kind, obj.radius);
    }

    ctx.restore();
  }

  function drawGoodIcon(kind, r) {
    if (kind === 'tomato') {
      ctx.fillStyle = '#ed352c';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.58, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2faa44';
      for (let i = 0; i < 5; i += 1) {
        ctx.save();
        ctx.rotate((Math.PI * 2 / 5) * i);
        ctx.beginPath();
        ctx.ellipse(0, -r * 0.42, r * 0.12, r * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    } else if (kind === 'carrot') {
      ctx.fillStyle = '#f28a20';
      ctx.beginPath();
      ctx.moveTo(-r * 0.34, -r * 0.35);
      ctx.lineTo(r * 0.52, -r * 0.05);
      ctx.lineTo(-r * 0.28, r * 0.43);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(120, 55, 12, 0.45)';
      ctx.lineWidth = r * 0.055;
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(-r * 0.06 + i * r * 0.09, -r * 0.17 + i * r * 0.1);
        ctx.lineTo(r * 0.17 + i * r * 0.08, -r * 0.1 + i * r * 0.09);
        ctx.stroke();
      }
      ctx.fillStyle = '#40b84a';
      ctx.beginPath();
      ctx.ellipse(-r * 0.43, -r * 0.38, r * 0.13, r * 0.34, -0.7, 0, Math.PI * 2);
      ctx.ellipse(-r * 0.3, -r * 0.48, r * 0.12, r * 0.33, 0.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === 'onion') {
      const g = ctx.createRadialGradient(-r * 0.15, -r * 0.18, r * 0.08, 0, 0, r * 0.65);
      g.addColorStop(0, '#fff7fb');
      g.addColorStop(1, '#d7a2cf');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, r * 0.05, r * 0.58, r * 0.66, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(113, 52, 111, 0.55)';
      ctx.lineWidth = r * 0.045;
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(i * r * 0.18, -r * 0.48);
        ctx.quadraticCurveTo(i * r * 0.12, r * 0.05, i * r * 0.08, r * 0.55);
        ctx.stroke();
      }
      ctx.fillStyle = '#69b657';
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.6, r * 0.12, r * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === 'paprika') {
      const g = ctx.createRadialGradient(-r * 0.2, -r * 0.25, r * 0.12, 0, 0, r * 0.72);
      g.addColorStop(0, '#ff8275');
      g.addColorStop(1, '#d92724');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(-r * 0.22, r * 0.02, r * 0.37, r * 0.54, -0.15, 0, Math.PI * 2);
      ctx.ellipse(r * 0.18, r * 0.03, r * 0.38, r * 0.55, 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#37a344';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(-r * 0.1, -r * 0.65, r * 0.2, r * 0.3, r * 0.08) : ctx.rect(-r * 0.1, -r * 0.65, r * 0.2, r * 0.3);
      ctx.fill();
    }
  }

  function drawBadIcon(kind, r) {
    if (kind === 'beetle') {
      ctx.fillStyle = '#294d2e';
      ctx.beginPath();
      ctx.ellipse(0, r * 0.08, r * 0.43, r * 0.58, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1b2c1e';
      ctx.lineWidth = r * 0.06;
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.38);
      ctx.lineTo(0, r * 0.54);
      ctx.stroke();
      for (let side of [-1, 1]) {
        for (let y of [-0.22, 0.02, 0.26]) {
          ctx.beginPath();
          ctx.moveTo(side * r * 0.28, r * y);
          ctx.lineTo(side * r * 0.62, r * (y - 0.1));
          ctx.stroke();
        }
      }
      ctx.fillStyle = '#96e274';
      ctx.beginPath();
      ctx.arc(-r * 0.15, -r * 0.22, r * 0.08, 0, Math.PI * 2);
      ctx.arc(r * 0.15, -r * 0.22, r * 0.08, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === 'sock') {
      ctx.fillStyle = '#8d74c4';
      ctx.beginPath();
      ctx.moveTo(-r * 0.25, -r * 0.55);
      ctx.lineTo(r * 0.24, -r * 0.55);
      ctx.lineTo(r * 0.18, r * 0.12);
      ctx.quadraticCurveTo(r * 0.5, r * 0.2, r * 0.46, r * 0.46);
      ctx.quadraticCurveTo(r * 0.38, r * 0.72, r * 0.05, r * 0.6);
      ctx.lineTo(-r * 0.18, r * 0.47);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#58438b';
      ctx.lineWidth = r * 0.07;
      ctx.stroke();
      ctx.strokeStyle = '#ddd1ff';
      ctx.lineWidth = r * 0.06;
      for (let y of [-0.38, -0.18]) {
        ctx.beginPath();
        ctx.moveTo(-r * 0.21, r * y);
        ctx.lineTo(r * 0.21, r * y);
        ctx.stroke();
      }
    } else if (kind === 'toadstool') {
      ctx.fillStyle = '#d8342b';
      ctx.beginPath();
      ctx.arc(0, -r * 0.08, r * 0.55, Math.PI, 0);
      ctx.quadraticCurveTo(r * 0.48, r * 0.18, 0, r * 0.18);
      ctx.quadraticCurveTo(-r * 0.48, r * 0.18, -r * 0.55, -r * 0.08);
      ctx.fill();
      ctx.fillStyle = '#fff6df';
      for (let [x, y, s] of [[-0.28, -0.2, 0.1], [0.05, -0.32, 0.09], [0.28, -0.16, 0.08]]) {
        ctx.beginPath();
        ctx.arc(r * x, r * y, r * s, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#f0d5b9';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(-r * 0.17, r * 0.05, r * 0.34, r * 0.55, r * 0.12) : ctx.rect(-r * 0.17, r * 0.05, r * 0.34, r * 0.55);
      ctx.fill();
    }
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
      if (obj.sliced || obj.remove) continue;
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
