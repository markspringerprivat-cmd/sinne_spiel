(() => {
  const STORAGE_VOLUME = 'sinnesmagie-volume';
  const STORAGE_LEVEL_PROGRESS = 'sinnesmagie-level-progress';
  const GAME_DURATION = 60;
  const TURBO_DURATION = 5;
  const LANES = [0.23, 0.5, 0.77];
  const PLAYER_Y = 0.8;

  const canvas = document.getElementById('mineCanvas');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('mineOverlay');
  const popup = document.getElementById('minePopup');
  const timerText = document.getElementById('mineTimerText');
  const progressFill = document.getElementById('mineProgressFill');
  const heartsText = document.getElementById('mineHearts');
  const musicElement = document.getElementById('mineMusic');
  const musicLoop = window.createCrossfadeLoop ? window.createCrossfadeLoop(musicElement, { fadeSeconds: 1.35 }) : null;

  const images = {
    background: new Image(),
    cartNormal: new Image(),
    cartTurbo: new Image(),
    crystalIntact: new Image(),
    crystalBroken: new Image(),
    turboIcon: new Image(),
  };
  images.background.src = '../assets/images/minigame/mine_chasm_bg.png';
  images.cartNormal.src = '../assets/images/minigame/cart_normal.png';
  images.cartTurbo.src = '../assets/images/minigame/cart_turbo.png';
  images.crystalIntact.src = '../assets/images/minigame/crystal_intact.png';
  images.crystalBroken.src = '../assets/images/minigame/crystal_broken.png';
  images.turboIcon.src = '../assets/images/minigame/turbo_icon.png';

  const game = {
    running: false,
    finished: false,
    won: false,
    startTime: 0,
    lastTime: 0,
    elapsed: 0,
    hearts: 3,
    lane: 1,
    targetLane: 1,
    playerX: LANES[1],
    obstacles: [],
    powerups: [],
    bursts: [],
    particles: [],
    spawnTimer: 0,
    waveIndex: 0,
    nextPickupAt: 8,
    invulnerableUntil: 0,
    shakeUntil: 0,
    railOffset: 0,
    turboUntil: 0,
  };

  function currentVolume() {
    const saved = Number(localStorage.getItem(STORAGE_VOLUME));
    return Number.isFinite(saved) ? Math.min(1, Math.max(0, saved)) : 0.5;
  }

  function startMusic() {
    if (!musicElement) return;
    const volume = currentVolume();
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

  function readProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_LEVEL_PROGRESS) || '{}');
      return saved && typeof saved === 'object' ? saved : {};
    } catch {
      return {};
    }
  }

  function completeMineLevelOne() {
    const progress = readProgress();
    progress.tastminen = {
      level1Completed: true,
      level2Completed: !!progress.tastminen?.level2Completed,
    };
    localStorage.setItem(STORAGE_LEVEL_PROGRESS, JSON.stringify(progress));
  }

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(320, window.innerWidth);
    const h = Math.max(520, window.innerHeight);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function isTurboActive(now = performance.now()) {
    return now < game.turboUntil;
  }

  function resetState() {
    game.running = true;
    game.finished = false;
    game.won = false;
    game.startTime = performance.now();
    game.lastTime = game.startTime;
    game.elapsed = 0;
    game.hearts = 3;
    game.lane = 1;
    game.targetLane = 1;
    game.playerX = LANES[1];
    game.obstacles = [];
    game.powerups = [];
    game.bursts = [];
    game.particles = [];
    game.spawnTimer = 0.6;
    game.waveIndex = 0;
    game.nextPickupAt = 8 + Math.random() * 4;
    game.invulnerableUntil = 0;
    game.shakeUntil = 0;
    game.railOffset = 0;
    game.turboUntil = 0;
  }

  function showPopup(type) {
    overlay.classList.remove('hidden');
    if (type === 'intro') {
      popup.innerHTML = `
        <div>
          <h1>Loren-Minispiel</h1>
          <p>Fahre mit dem Ritter durch die Tastminen und weiche den Kristallen aus.</p>
          <p>Sammle Blitzsymbole ein, um 5 Sekunden Turbo zu aktivieren und Kristalle zu zerschmettern.</p>
          <p class="small-note">Steuerung: Pfeiltasten, A/D oder Wischen nach links und rechts.</p>
          <div class="mine-popup-actions">
            <button id="startMineGame" class="mine-button" type="button">Starten</button>
            <button id="leaveMineGame" class="mine-button secondary" type="button">Zurück</button>
          </div>
        </div>`;
      document.getElementById('startMineGame').addEventListener('click', startGame);
      document.getElementById('leaveMineGame').addEventListener('click', () => {
        window.location.href = 'tastminen.html';
      });
      return;
    }

    if (type === 'won') {
      popup.innerHTML = `
        <div>
          <h2>Geschafft!</h2>
          <p>Du hast die wilde Lorenfahrt gemeistert.</p>
          <p>Level 1 in den Tastminen ist abgeschlossen.</p>
          <div class="mine-popup-actions">
            <button id="returnToMine" class="mine-button" type="button">Zurück zu den Tastminen</button>
          </div>
        </div>`;
      document.getElementById('returnToMine').addEventListener('click', () => {
        window.location.href = 'tastminen.html';
      });
      return;
    }

    popup.innerHTML = `
      <div>
        <h2>Getroffen!</h2>
        <p>Die Lore wurde zu oft von den Kristallen erwischt.</p>
        <p class="small-note">Versuche früher die Spur zu wechseln oder schnapp dir das Blitzsymbol.</p>
        <div class="mine-popup-actions">
          <button id="retryMineGame" class="mine-button" type="button">Nochmal spielen</button>
          <button id="returnToMine" class="mine-button secondary" type="button">Zurück</button>
        </div>
      </div>`;
    document.getElementById('retryMineGame').addEventListener('click', startGame);
    document.getElementById('returnToMine').addEventListener('click', () => {
      window.location.href = 'tastminen.html';
    });
  }

  function hidePopup() {
    overlay.classList.add('hidden');
  }

  function startGame() {
    resetState();
    updateHud();
    hidePopup();
    startMusic();
    requestAnimationFrame(loop);
  }

  function endGame(won) {
    game.running = false;
    game.finished = true;
    game.won = won;
    pauseMusic();
    if (won) completeMineLevelOne();
    setTimeout(() => showPopup(won ? 'won' : 'lost'), 420);
  }

  function updateHud() {
    const remaining = Math.max(0, Math.ceil(GAME_DURATION - game.elapsed));
    const turboLeft = Math.max(0, (game.turboUntil - performance.now()) / 1000);
    timerText.textContent = turboLeft > 0
      ? `Zeit: ${remaining} s · Turbo: ${turboLeft.toFixed(1)} s`
      : `Zeit: ${remaining} s`;
    progressFill.style.width = `${Math.min(100, (game.elapsed / GAME_DURATION) * 100)}%`;
    heartsText.textContent = `${game.hearts > 0 ? '♥'.repeat(game.hearts) : ''}${game.hearts < 3 ? '♡'.repeat(3 - game.hearts) : ''}`;
  }

  function setLane(direction) {
    if (!game.running) return;
    game.targetLane = Math.max(0, Math.min(LANES.length - 1, game.targetLane + direction));
  }

  function chooseDistinctLanes(count) {
    const lanes = [0, 1, 2];
    for (let i = lanes.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [lanes[i], lanes[j]] = [lanes[j], lanes[i]];
    }
    return lanes.slice(0, count);
  }

  function crystalSpeed() {
    const base = 0.34 + Math.min(0.16, game.elapsed / 150);
    return base * (isTurboActive() ? 1.42 : 1);
  }

  function spawnWave() {
    let count;
    if (game.elapsed < 10) count = 1;
    else if (game.elapsed >= 50) count = 2;
    else count = game.waveIndex % 2 === 0 ? 1 : 2;

    const lanes = chooseDistinctLanes(count);
    const speed = crystalSpeed();
    lanes.forEach((lane, index) => {
      game.obstacles.push({
        type: 'crystal',
        lane,
        x: LANES[lane],
        y: -0.2 - index * 0.12,
        size: 0.092,
        rotation: (Math.random() - 0.5) * 0.22,
        spin: (Math.random() - 0.5) * 0.22,
        speed: speed + Math.random() * 0.025,
        hit: false,
      });
    });
    game.waveIndex += 1;
  }

  function maybeSpawnPowerup() {
    if (game.elapsed < game.nextPickupAt || isTurboActive() || game.powerups.length > 0) return;
    const lane = Math.floor(Math.random() * LANES.length);
    game.powerups.push({
      lane,
      x: LANES[lane],
      y: -0.18,
      size: 0.072,
      rotation: 0,
      speed: 0.28,
      bob: Math.random() * Math.PI * 2,
    });
    game.nextPickupAt = game.elapsed + 8 + Math.random() * 7;
  }

  function addSpark(x, y, color = '#d9efff', amount = 12) {
    for (let i = 0; i < amount; i += 1) {
      game.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 0.42,
        vy: (Math.random() - 0.5) * 0.36 - 0.03,
        life: 0.42 + Math.random() * 0.35,
        age: 0,
        color,
      });
    }
  }

  function shatterCrystal(obstacle) {
    obstacle.hit = true;
    game.bursts.push({
      x: obstacle.x,
      y: obstacle.y,
      age: 0,
      life: 0.42,
      rotation: (Math.random() - 0.5) * 0.5,
      scale: 0.8,
    });
    addSpark(obstacle.x, obstacle.y, '#c6b0ff', 18);
  }

  function update(dt, now) {
    game.elapsed = (now - game.startTime) / 1000;
    game.railOffset += dt * (isTurboActive(now) ? 2.6 : 1.65);

    const targetX = LANES[game.targetLane];
    game.playerX += (targetX - game.playerX) * Math.min(1, dt * 11.5);
    if (Math.abs(game.playerX - targetX) < 0.005) game.lane = game.targetLane;

    const spawnEveryBase = game.elapsed < 10 ? 1.1 : game.elapsed < 50 ? 0.88 : 0.72;
    const spawnEvery = spawnEveryBase * (isTurboActive(now) ? 0.7 : 1);
    game.spawnTimer -= dt;
    if (game.spawnTimer <= 0) {
      spawnWave();
      game.spawnTimer = spawnEvery;
    }
    maybeSpawnPowerup();

    game.obstacles.forEach((obstacle) => {
      obstacle.y += obstacle.speed * dt * (isTurboActive(now) ? 1.15 : 1);
      obstacle.rotation += obstacle.spin * dt;
    });
    game.obstacles = game.obstacles.filter((obstacle) => obstacle.y < 1.22 && !obstacle.hit);

    game.powerups.forEach((powerup) => {
      powerup.y += powerup.speed * dt * (isTurboActive(now) ? 1.1 : 1);
      powerup.rotation += dt * 1.8;
      powerup.bob += dt * 5;
    });
    game.powerups = game.powerups.filter((powerup) => powerup.y < 1.18);

    game.bursts.forEach((burst) => { burst.age += dt; burst.scale += dt * 0.6; });
    game.bursts = game.bursts.filter((burst) => burst.age < burst.life);

    game.particles.forEach((p) => {
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    });
    game.particles = game.particles.filter((p) => p.age < p.life);

    checkCollisions(now);
    updateHud();

    if (game.elapsed >= GAME_DURATION && game.hearts > 0) endGame(true);
  }

  function checkCollisions(now) {
    const playerY = PLAYER_Y;

    for (let i = game.powerups.length - 1; i >= 0; i -= 1) {
      const powerup = game.powerups[i];
      const dx = Math.abs(powerup.x - game.playerX);
      const dy = Math.abs(powerup.y - playerY);
      if (dx < 0.085 && dy < 0.075) {
        game.powerups.splice(i, 1);
        game.turboUntil = now + TURBO_DURATION * 1000;
        addSpark(game.playerX, playerY, '#5ed2ff', 22);
      }
    }

    for (const obstacle of game.obstacles) {
      if (obstacle.hit) continue;
      const dx = Math.abs(obstacle.x - game.playerX);
      const dy = Math.abs(obstacle.y - playerY);
      if (dx < 0.1 && dy < 0.082) {
        if (isTurboActive(now)) {
          shatterCrystal(obstacle);
          continue;
        }
        if (now < game.invulnerableUntil) return;
        obstacle.hit = true;
        game.hearts -= 1;
        game.invulnerableUntil = now + 1050;
        game.shakeUntil = now + 360;
        addSpark(game.playerX, playerY, '#fff4b0', 16);
        if (navigator.vibrate) navigator.vibrate(70);
        if (game.hearts <= 0) endGame(false);
        break;
      }
    }
  }

  function drawCoverImage(img, x, y, w, h) {
    if (!img.complete || !img.naturalWidth) return false;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const scale = Math.max(w / iw, h / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    return true;
  }

  function drawBackground(w, h) {
    if (!drawCoverImage(images.background, 0, 0, w, h)) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#132744');
      g.addColorStop(1, '#07101b');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    const vignette = ctx.createLinearGradient(0, 0, 0, h);
    vignette.addColorStop(0, 'rgba(0,0,0,0.18)');
    vignette.addColorStop(1, 'rgba(2,5,12,0.38)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  }

  function laneX(lane, w) {
    return LANES[lane] * w;
  }

  function drawRails(w, h) {
    const topY = h * -0.04;
    const bottomY = h * 1.04;
    const centerBottom = w * 0.5;
    const centerTop = w * 0.5;

    for (let i = 0; i < LANES.length; i += 1) {
      const xTop = centerTop + (LANES[i] - 0.5) * w * 0.26;
      const xBottom = laneX(i, w);
      const railWidthTop = w * 0.008;
      const railWidthBottom = w * 0.016;
      drawRailLine(xTop - railWidthTop, topY, xBottom - railWidthBottom, bottomY);
      drawRailLine(xTop + railWidthTop, topY, xBottom + railWidthBottom, bottomY);
    }

    for (let t = -0.12 + (game.railOffset % 0.14); t < 1.08; t += 0.14) {
      const y = topY + (bottomY - topY) * t;
      const spread = w * (0.055 + t * 0.2);
      ctx.save();
      ctx.globalAlpha = Math.max(0.2, Math.min(0.72, t + 0.12));
      ctx.strokeStyle = 'rgba(66, 41, 27, 0.95)';
      ctx.lineWidth = Math.max(2, w * 0.008 + t * 3);
      ctx.beginPath();
      ctx.moveTo(centerBottom - spread, y);
      ctx.lineTo(centerBottom + spread, y);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawRailLine(x1, y1, x2, y2) {
    ctx.save();
    ctx.strokeStyle = '#281a12';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.strokeStyle = '#9f6a31';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }

  function drawSprite(img, x, y, targetH) {
    if (!img.complete || !img.naturalWidth) return;
    const ratio = img.naturalWidth / img.naturalHeight;
    const w = targetH * ratio;
    ctx.drawImage(img, x - w / 2, y - targetH / 2, w, targetH);
  }

  function drawMineCart(w, h, now) {
    const x = game.playerX * w;
    const y = PLAYER_Y * h;
    const invulnerable = now < game.invulnerableUntil;
    const flicker = invulnerable && Math.floor(now / 90) % 2 === 0;
    const size = Math.min(w, h) * 0.26;
    const activeImg = isTurboActive(now) ? images.cartTurbo : images.cartNormal;

    ctx.save();
    if (flicker) ctx.globalAlpha = 0.58;
    if (now < game.shakeUntil) ctx.translate((Math.random() - 0.5) * 7, (Math.random() - 0.5) * 5);
    if (isTurboActive(now)) {
      ctx.shadowColor = 'rgba(55, 195, 255, 0.9)';
      ctx.shadowBlur = 22;
    } else {
      ctx.shadowColor = 'rgba(0,0,0,0.38)';
      ctx.shadowBlur = 16;
    }
    ctx.shadowOffsetY = 10;

    drawSprite(activeImg, x, y, size);
    ctx.restore();
  }

  function drawObstacle(obstacle, w, h) {
    const perspective = 0.45 + obstacle.y * 0.92;
    const size = obstacle.size * Math.min(w, h) * perspective * 1.05;
    const x = obstacle.x * w;
    const y = obstacle.y * h;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(obstacle.rotation);
    ctx.shadowColor = 'rgba(92, 156, 255, 0.7)';
    ctx.shadowBlur = size * 0.16;
    drawSprite(images.crystalIntact, 0, 0, size * 1.34);
    ctx.restore();
  }

  function drawPowerup(powerup, w, h) {
    const perspective = 0.48 + powerup.y * 0.9;
    const size = powerup.size * Math.min(w, h) * perspective;
    const x = powerup.x * w;
    const y = powerup.y * h + Math.sin(powerup.bob) * 5;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(powerup.rotation) * 0.08);
    ctx.shadowColor = 'rgba(55, 195, 255, 0.82)';
    ctx.shadowBlur = size * 0.2;
    drawSprite(images.turboIcon, 0, 0, size * 1.25);
    ctx.restore();
  }

  function drawBursts(w, h) {
    game.bursts.forEach((burst) => {
      const alpha = 1 - burst.age / burst.life;
      const size = Math.min(w, h) * 0.17 * burst.scale;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(burst.x * w, burst.y * h);
      ctx.rotate(burst.rotation + burst.age * 2);
      ctx.shadowColor = 'rgba(200, 160, 255, 0.8)';
      ctx.shadowBlur = 18;
      drawSprite(images.crystalBroken, 0, 0, size);
      ctx.restore();
    });
  }

  function drawParticles(w, h) {
    for (const p of game.particles) {
      const alpha = 1 - p.age / p.life;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, Math.max(2, w * 0.006 * alpha), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawTurboAura(w, h, now) {
    if (!isTurboActive(now)) return;
    const x = game.playerX * w;
    const y = PLAYER_Y * h;
    ctx.save();
    ctx.globalAlpha = 0.18 + Math.sin(now / 120) * 0.04;
    const g = ctx.createRadialGradient(x, y, 10, x, y, Math.min(w, h) * 0.16);
    g.addColorStop(0, 'rgba(93, 212, 255, 0.85)');
    g.addColorStop(1, 'rgba(93, 212, 255, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, Math.min(w, h) * 0.17, Math.min(w, h) * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function draw() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const now = performance.now();
    ctx.clearRect(0, 0, w, h);
    drawBackground(w, h);
    drawRails(w, h);
    game.obstacles.forEach((obstacle) => drawObstacle(obstacle, w, h));
    game.powerups.forEach((powerup) => drawPowerup(powerup, w, h));
    drawTurboAura(w, h, now);
    drawMineCart(w, h, now);
    drawBursts(w, h);
    drawParticles(w, h);
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

  function handleKey(event) {
    const key = event.key.toLowerCase();
    if (event.key === 'ArrowLeft' || key === 'a') {
      event.preventDefault();
      setLane(-1);
    }
    if (event.key === 'ArrowRight' || key === 'd') {
      event.preventDefault();
      setLane(1);
    }
  }

  let pointerStartX = null;
  function handlePointerDown(event) {
    pointerStartX = event.clientX;
  }

  function handlePointerUp(event) {
    if (pointerStartX == null) return;
    const dx = event.clientX - pointerStartX;
    pointerStartX = null;
    if (Math.abs(dx) > 35) {
      setLane(dx > 0 ? 1 : -1);
      return;
    }
    if (event.clientX < window.innerWidth * 0.45) setLane(-1);
    else if (event.clientX > window.innerWidth * 0.55) setLane(1);
  }

  window.addEventListener('resize', () => {
    resizeCanvas();
    draw();
  });
  window.addEventListener('keydown', handleKey);
  canvas.addEventListener('pointerdown', handlePointerDown);
  canvas.addEventListener('pointerup', handlePointerUp);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseMusic();
    else if (game.running) startMusic();
  });

  resizeCanvas();
  updateHud();
  showPopup('intro');
  draw();
})();
