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
  const turboSound = document.getElementById('mineTurboSound');
  const glassBreakSound = document.getElementById('mineGlassBreak');
  const musicLoop = window.createCrossfadeLoop ? window.createCrossfadeLoop(musicElement, { fadeSeconds: 0.025 }) : null;

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
    lastHudUpdateAt: 0,
    lastHudText: '',
    lastHudProgress: -1,
    lastHudHearts: '',
    lastLaneInputAt: 0,
  };

  function currentVolume() {
    const saved = Number(localStorage.getItem(STORAGE_VOLUME));
    return Number.isFinite(saved) ? Math.min(1, Math.max(0, saved)) : 0.5;
  }

  function setAudioVolume(element, factor = 1) {
    if (!element) return;
    element.volume = Math.min(1, Math.max(0, currentVolume() * factor));
  }

  function playOneShot(element, factor = 0.45) {
    if (!element) return;
    try {
      element.pause();
      element.currentTime = 0;
      setAudioVolume(element, factor);
      element.play().catch(() => {});
    } catch {}
  }

  function startLoopAudio(element, loopController, factor = 1) {
    if (!element) return;
    const volume = currentVolume() * factor;
    if (loopController) {
      loopController.setVolume(volume);
      loopController.play();
    } else {
      element.volume = Math.min(1, Math.max(0, volume));
      element.loop = true;
      element.play().catch(() => {});
    }
  }

  function pauseLoopAudio(element, loopController) {
    if (loopController) loopController.pause();
    else if (element) element.pause();
  }

  function startMusic() {
    startLoopAudio(musicElement, musicLoop, 0.72);
  }

  function pauseMusic() {
    pauseLoopAudio(musicElement, musicLoop);
    if (turboSound) {
      turboSound.pause();
      turboSound.currentTime = 0;
    }
  }

  function startTurboSound() {
    if (!turboSound) return;
    try {
      turboSound.pause();
      turboSound.currentTime = 0;
      turboSound.loop = true;
      setAudioVolume(turboSound, 0.58);
      turboSound.play().catch(() => {});
    } catch {}
  }

  function updateTurboSound(now) {
    if (!turboSound) return;
    const remainingMs = game.turboUntil - now;
    if (remainingMs <= 0) {
      if (!turboSound.paused) {
        turboSound.pause();
        turboSound.currentTime = 0;
      }
      return;
    }
    const fadeFactor = Math.min(1, Math.max(0, remainingMs / 1000));
    setAudioVolume(turboSound, 0.58 * fadeFactor);
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
    const dpr = 1;
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

  function railProgressFromY(y) {
    return Math.min(1.08, Math.max(-0.08, y));
  }

  function laneWorldX(lane, y) {
    const t = railProgressFromY(y);
    const topX = 0.5 + (LANES[lane] - 0.5) * 0.26;
    const bottomX = LANES[lane];
    return topX + (bottomX - topX) * t;
  }

  function syncObjectToRail(item) {
    item.x = laneWorldX(item.lane, item.y);
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
    game.lastLaneInputAt = 0;
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
    updateHud(true);
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

  function updateHud(force = false) {
    const now = performance.now();
    if (!force && now - game.lastHudUpdateAt < 220) return;
    game.lastHudUpdateAt = now;

    const remaining = Math.max(0, Math.ceil(GAME_DURATION - game.elapsed));
    const turboLeft = Math.max(0, (game.turboUntil - now) / 1000);
    const timerValue = turboLeft > 0
      ? `Zeit: ${remaining} s · Turbo: ${Math.ceil(turboLeft)} s`
      : `Zeit: ${remaining} s`;
    const progressValue = Math.round(Math.min(100, (game.elapsed / GAME_DURATION) * 100));
    const heartsValue = `${game.hearts > 0 ? '♥'.repeat(game.hearts) : ''}${game.hearts < 3 ? '♡'.repeat(3 - game.hearts) : ''}`;

    if (timerValue !== game.lastHudText) {
      timerText.textContent = timerValue;
      game.lastHudText = timerValue;
    }
    if (progressValue !== game.lastHudProgress) {
      progressFill.style.width = `${progressValue}%`;
      game.lastHudProgress = progressValue;
    }
    if (heartsValue !== game.lastHudHearts) {
      heartsText.textContent = heartsValue;
      game.lastHudHearts = heartsValue;
    }
  }

  function setLane(direction) {
    if (!game.running) return;
    const now = performance.now();
    if (now - game.lastLaneInputAt < 85) return;
    const nextLane = Math.max(0, Math.min(LANES.length - 1, game.targetLane + direction));
    if (nextLane !== game.targetLane) {
      game.targetLane = nextLane;
      game.lastLaneInputAt = now;
    }
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
    return 0.33;
  }

  function spawnWave() {
    let count = 1;
    if (game.elapsed >= 50) count = game.waveIndex % 4 === 0 ? 2 : 1;
    else if (game.elapsed >= 25) count = game.waveIndex % 5 === 0 ? 2 : 1;

    const lanes = chooseDistinctLanes(count);
    const speed = crystalSpeed();
    lanes.forEach((lane, index) => {
      game.obstacles.push({
        type: 'crystal',
        lane,
        x: laneWorldX(lane, -0.2 - index * 0.1),
        y: -0.2 - index * 0.1,
        size: 0.084,
        rotation: (Math.random() - 0.5) * 0.14,
        spin: 0,
        speed,
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
      x: laneWorldX(lane, -0.18),
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
    playOneShot(glassBreakSound, 0.62);
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

  function compactActive(list, keepFn) {
    let write = 0;
    for (let read = 0; read < list.length; read += 1) {
      const item = list[read];
      if (keepFn(item)) {
        list[write] = item;
        write += 1;
      }
    }
    list.length = write;
  }

  function update(dt, now) {
    game.elapsed = (now - game.startTime) / 1000;
    game.railOffset += dt * 0.85;

    const targetX = LANES[game.targetLane];
    game.playerX += (targetX - game.playerX) * Math.min(1, dt * 10.5);
    if (Math.abs(game.playerX - targetX) < 0.005) game.lane = game.targetLane;

    const spawnEvery = game.elapsed < 25 ? 1.75 : game.elapsed < 50 ? 1.58 : 1.48;
    game.spawnTimer -= dt;
    if (game.spawnTimer <= 0) {
      spawnWave();
      game.spawnTimer = spawnEvery;
    }
    maybeSpawnPowerup();

    for (const obstacle of game.obstacles) {
      obstacle.y += obstacle.speed * dt;
      syncObjectToRail(obstacle);
      obstacle.rotation += obstacle.spin * dt;
    }
    compactActive(game.obstacles, obstacle => obstacle.y < 1.22 && !obstacle.hit);

    for (const powerup of game.powerups) {
      powerup.y += powerup.speed * dt;
      syncObjectToRail(powerup);
      powerup.rotation += dt * 1.2;
      powerup.bob += dt * 3.2;
    }
    compactActive(game.powerups, powerup => powerup.y < 1.18);

    for (const burst of game.bursts) {
      burst.age += dt;
      burst.scale += dt * 0.45;
    }
    compactActive(game.bursts, burst => burst.age < burst.life);

    for (const p of game.particles) {
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    compactActive(game.particles, p => p.age < p.life);

    checkCollisions(now);
    updateHud();
    updateTurboSound(now);

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
        startTurboSound();
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
        playOneShot(glassBreakSound, 0.62);
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
    const centerTop = w * 0.5;

    for (let i = 0; i < LANES.length; i += 1) {
      const xTop = centerTop + (LANES[i] - 0.5) * w * 0.26;
      const xBottom = laneX(i, w);
      const railWidthTop = w * 0.008;
      const railWidthBottom = w * 0.016;
      drawRailLine(xTop - railWidthTop, topY, xBottom - railWidthBottom, bottomY);
      drawRailLine(xTop + railWidthTop, topY, xBottom + railWidthBottom, bottomY);
    }
  }

  function drawRailLine(x1, y1, x2, y2) {
    ctx.save();
    ctx.strokeStyle = '#281a12';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.strokeStyle = '#9f6a31';
    ctx.lineWidth = 2;
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
    const size = Math.min(w, h) * 0.255;
    const activeImg = isTurboActive(now) ? images.cartTurbo : images.cartNormal;

    ctx.save();
    if (flicker) ctx.globalAlpha = 0.58;
    if (now < game.shakeUntil) ctx.translate((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 4);

    const maxTilt = Math.PI / 12;
    const normalizedLaneOffset = Math.max(-1, Math.min(1, (0.5 - game.playerX) / (0.5 - LANES[0])));
    ctx.translate(x, y);
    ctx.rotate(normalizedLaneOffset * maxTilt);
    drawSprite(activeImg, 0, 0, size);
    ctx.restore();
  }

  function drawObstacle(obstacle, w, h) {
    const perspective = 0.45 + obstacle.y * 0.88;
    const size = obstacle.size * Math.min(w, h) * perspective;
    const x = obstacle.x * w;
    const y = obstacle.y * h;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(obstacle.rotation);
    drawSprite(images.crystalIntact, 0, 0, size * 1.25);
    ctx.restore();
  }

  function drawPowerup(powerup, w, h) {
    const perspective = 0.48 + powerup.y * 0.86;
    const size = powerup.size * Math.min(w, h) * perspective;
    const x = powerup.x * w;
    const y = powerup.y * h + Math.sin(powerup.bob) * 3;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(powerup.rotation) * 0.05);
    drawSprite(images.turboIcon, 0, 0, size * 1.15);
    ctx.restore();
  }

  function drawBursts(w, h) {
    for (const burst of game.bursts) {
      const alpha = 1 - burst.age / burst.life;
      const size = Math.min(w, h) * 0.14 * burst.scale;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(burst.x * w, burst.y * h);
      ctx.rotate(burst.rotation + burst.age * 1.4);
      drawSprite(images.crystalBroken, 0, 0, size);
      ctx.restore();
    }
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
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = 'rgba(93, 212, 255, 0.55)';
    ctx.beginPath();
    ctx.ellipse(x, y, Math.min(w, h) * 0.14, Math.min(w, h) * 0.08, 0, 0, Math.PI * 2);
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
  updateHud(true);
  showPopup('intro');
  draw();
})();
