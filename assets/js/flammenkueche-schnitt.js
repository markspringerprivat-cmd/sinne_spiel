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
  const musicElement = null; // Hintergrundmusik in diesem Minispiel bewusst deaktiviert.
  const cutSoundElement = document.getElementById('sliceCutSound');
  const slimeSoundElement = document.getElementById('sliceSlimeSound');
  const cutSoundPool = [];
  const slimeSoundPool = [];
  const musicLoop = null;

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
    // Keine Hintergrundmusik: reduziert Audiolast und hält das Fruit-Ninja-Minispiel stabiler.
  }

  function pauseMusic() {
    // Keine Hintergrundmusik aktiv.
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
    prepareCutSounds();
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
    const isBad = Math.random() < (0.24 + elapsedRatio * 0.08);
    const template = isBad
      ? badItems[Math.floor(Math.random() * badItems.length)]
      : goodItems[Math.floor(Math.random() * goodItems.length)];

    const fromLeft = Math.random() < 0.5;
    const startX = fromLeft ? randomBetween(-90, w * 0.22) : randomBetween(w * 0.78, w + 90);
    const startY = h + randomBetween(60, 130);
    const targetX = randomBetween(w * 0.16, w * 0.84);
    const apexY = randomBetween(h * 0.11, h * 0.43);
    const timeToApex = randomBetween(0.95, 1.22);
    const vx = (targetX - startX) / timeToApex;
    const vy = (apexY - startY) / timeToApex;
    const gravity = Math.abs(vy) / timeToApex;
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
      resolved: false,
      missedPenaltyApplied: false,
      hasEnteredScreen: false,
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
    if (obj.sliced || obj.remove || obj.resolved) return;
    obj.sliced = true;
    obj.resolved = true;
    obj.missedPenaltyApplied = true;
    obj.remove = true;
    addParticles(obj.x, obj.y, obj.color, obj.isBad ? 16 : 12);
    playCutSound();

    if (obj.isBad) {
      playSlimeSound();
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

    const spawnEvery = Math.max(0.9, 1.2 - game.elapsed / 170);
    game.spawnTimer -= dt;
    if (game.spawnTimer <= 0) {
      if (game.objects.length < 9) createObject();
      if (game.elapsed > 28 && game.objects.length < 8 && Math.random() < 0.10) {
        setTimeout(() => { if (game.running && game.objects.length < 9) createObject(); }, 170);
      }
      game.spawnTimer = spawnEvery + randomBetween(0.04, 0.26);
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
          loseLife(MISS_DAMAGE, 'Gemüse verpasst! -¼ Leben', '#ffcf5d');
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

  function drawObject(obj) {
    ctx.save();
    ctx.translate(obj.x, obj.y);
    ctx.rotate(obj.rot);

    // Optisch fliegen nur noch die Emoji-Objekte.
    // Der unsichtbare Radius bleibt als zuverlässige Hitbox erhalten.
    ctx.shadowColor = obj.isBad ? 'rgba(70, 18, 9, 0.72)' : 'rgba(80, 28, 6, 0.58)';
    ctx.shadowBlur = Math.max(8, obj.radius * 0.16);
    ctx.shadowOffsetY = Math.max(3, obj.radius * 0.07);

    if (obj.isBad) drawBadIcon(obj.kind, obj.radius);
    else drawGoodIcon(obj.kind, obj.radius);

    ctx.restore();
  }

  function drawEmojiIcon(symbol, r, options = {}) {
    const fontSize = Math.round(r * (options.scale || 1.55));
    const y = r * (options.yOffset || 0.03);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${fontSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", system-ui, sans-serif`;
    // kleine dunkle Kontur/Schattenpunkte, damit die Emojis auf hellem Hintergrund lesbar bleiben
    ctx.globalAlpha = 0.32;
    ctx.fillStyle = 'rgba(70, 24, 8, 0.95)';
    ctx.fillText(symbol, 2, y + 3);
    ctx.globalAlpha = 1;
    ctx.fillText(symbol, 0, y);
    ctx.restore();
  }

  function drawGoodIcon(kind, r) {
    const map = {
      paprika: { symbol: '🫑', scale: 1.75, yOffset: 0.03 },
      onion: { symbol: '🧅', scale: 1.72, yOffset: 0.03 },
      carrot: { symbol: '🥕', scale: 1.75, yOffset: 0.02 },
      tomato: { symbol: '🍅', scale: 1.76, yOffset: 0.03 },
    };
    const icon = map[kind] || { symbol: '🥕', scale: 1.15, yOffset: 0.04 };
    drawEmojiIcon(icon.symbol, r, icon);
  }

  function drawBadIcon(kind, r) {
    const map = {
      beetle: { symbol: '🐞', scale: 1.75, yOffset: 0.03 },
      sock: { symbol: '🧦', scale: 1.75, yOffset: 0.02 },
      toadstool: { symbol: '🍄', scale: 1.76, yOffset: 0.03 },
    };
    const icon = map[kind] || { symbol: '🍄', scale: 1.15, yOffset: 0.05 };
    drawEmojiIcon(icon.symbol, r, icon);
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
