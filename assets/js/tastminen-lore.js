(() => {
  const STORAGE_VOLUME = 'sinnesmagie-volume';
  const STORAGE_LEVEL_PROGRESS = 'sinnesmagie-level-progress';
  const GAME_DURATION = 60;
  const LANES = [0.23, 0.5, 0.77];
  const PLAYER_Y = 0.79;

  const canvas = document.getElementById('mineCanvas');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('mineOverlay');
  const popup = document.getElementById('minePopup');
  const timerText = document.getElementById('mineTimerText');
  const progressFill = document.getElementById('mineProgressFill');
  const heartsText = document.getElementById('mineHearts');
  const musicElement = document.getElementById('mineMusic');
  const musicLoop = window.createCrossfadeLoop ? window.createCrossfadeLoop(musicElement, { fadeSeconds: 1.35 }) : null;

  const background = new Image();
  background.src = '../assets/images/level-backgrounds/tastminen.png';
  const knight = new Image();
  knight.src = '../assets/images/characters/knight.png';

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
    particles: [],
    spawnTimer: 0,
    invulnerableUntil: 0,
    shakeUntil: 0,
    railOffset: 0
  };

  function currentVolume() {
    const saved = Number(localStorage.getItem(STORAGE_VOLUME));
    if (Number.isFinite(saved)) return Math.min(1, Math.max(0, saved));
    return 0.5;
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
      level2Completed: !!progress.tastminen?.level2Completed
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

  function showPopup(type) {
    overlay.classList.remove('hidden');
    if (type === 'intro') {
      popup.innerHTML = `
        <div>
          <h1>Loren-Minispiel</h1>
          <p>Der Ritter fährt mit der Lore durch die Tastminen.</p>
          <p>Weiche den stacheligen Diamantformationen aus und halte etwa eine Minute durch.</p>
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
          <p>Du hast die Fahrt durch die Mine überstanden.</p>
          <p>Level 1 ist erledigt. Jetzt ist der zweite Punkt in den Tastminen freigeschaltet.</p>
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
        <p>Die Lore wurde zu oft von den Diamantstacheln erwischt.</p>
        <p class="small-note">Versuche, früher die Spur zu wechseln.</p>
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
    game.particles = [];
    game.spawnTimer = 0.35;
    game.invulnerableUntil = 0;
    game.shakeUntil = 0;
    game.railOffset = 0;
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
    timerText.textContent = `Zeit: ${remaining} s`;
    progressFill.style.width = `${Math.min(100, (game.elapsed / GAME_DURATION) * 100)}%`;
    heartsText.textContent = `${game.hearts > 0 ? '♥'.repeat(game.hearts) : ''}${game.hearts < 3 ? '♡'.repeat(3 - game.hearts) : ''}`;
  }

  function setLane(direction) {
    if (!game.running) return;
    game.targetLane = Math.max(0, Math.min(LANES.length - 1, game.targetLane + direction));
  }

  function spawnObstacle() {
    const freeLaneChance = Math.random();
    const lane = Math.floor(Math.random() * LANES.length);
    const size = 0.055 + Math.random() * 0.025;
    game.obstacles.push({
      lane,
      x: LANES[lane],
      y: -0.12,
      size,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 2.8,
      speed: 0.31 + Math.min(0.18, game.elapsed / 260),
      hit: false
    });

    if (freeLaneChance > 0.72 && game.elapsed > 10) {
      const secondLane = (lane + 1 + Math.floor(Math.random() * 2)) % LANES.length;
      game.obstacles.push({
        lane: secondLane,
        x: LANES[secondLane],
        y: -0.26,
        size: size * 0.88,
        rotation: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 2.6,
        speed: 0.31 + Math.min(0.18, game.elapsed / 260),
        hit: false
      });
    }
  }

  function addSpark(x, y, color = '#d9efff') {
    for (let i = 0; i < 12; i++) {
      game.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 0.34,
        vy: (Math.random() - 0.5) * 0.28 - 0.05,
        life: 0.45 + Math.random() * 0.35,
        age: 0,
        color
      });
    }
  }

  function update(dt, now) {
    game.elapsed = (now - game.startTime) / 1000;
    game.railOffset += dt * 1.7;

    const targetX = LANES[game.targetLane];
    game.playerX += (targetX - game.playerX) * Math.min(1, dt * 10);
    if (Math.abs(game.playerX - targetX) < 0.005) game.lane = game.targetLane;

    game.spawnTimer -= dt;
    const spawnEvery = Math.max(0.55, 1.05 - game.elapsed / 120);
    if (game.spawnTimer <= 0) {
      spawnObstacle();
      game.spawnTimer = spawnEvery + Math.random() * 0.32;
    }

    game.obstacles.forEach(obstacle => {
      obstacle.y += obstacle.speed * dt;
      obstacle.rotation += obstacle.spin * dt;
    });
    game.obstacles = game.obstacles.filter(obstacle => obstacle.y < 1.12);

    game.particles.forEach(p => {
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    });
    game.particles = game.particles.filter(p => p.age < p.life);

    checkCollisions(now);
    updateHud();

    if (game.elapsed >= GAME_DURATION && game.hearts > 0) endGame(true);
  }

  function checkCollisions(now) {
    if (now < game.invulnerableUntil) return;
    const playerY = PLAYER_Y;
    for (const obstacle of game.obstacles) {
      if (obstacle.hit) continue;
      const dx = Math.abs(obstacle.x - game.playerX);
      const dy = Math.abs(obstacle.y - playerY);
      if (dx < 0.095 && dy < 0.072) {
        obstacle.hit = true;
        game.hearts -= 1;
        game.invulnerableUntil = now + 1050;
        game.shakeUntil = now + 380;
        addSpark(game.playerX, playerY, '#fff4b0');
        if (navigator.vibrate) navigator.vibrate(80);
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
    if (!drawCoverImage(background, 0, 0, w, h)) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#15121b');
      g.addColorStop(0.44, '#3a2a20');
      g.addColorStop(1, '#6a4424');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(0, 0, w, h);
  }

  function laneX(lane, w) {
    return LANES[lane] * w;
  }

  function drawRails(w, h) {
    const topY = h * -0.05;
    const bottomY = h * 1.08;
    const centerBottom = w * 0.5;
    const centerTop = w * 0.5;

    for (let i = 0; i < LANES.length; i++) {
      const xTop = centerTop + (LANES[i] - 0.5) * w * 0.52;
      const xBottom = laneX(i, w);
      const railWidthTop = w * 0.012;
      const railWidthBottom = w * 0.025;
      drawRailLine(xTop - railWidthTop, topY, xBottom - railWidthBottom, bottomY);
      drawRailLine(xTop + railWidthTop, topY, xBottom + railWidthBottom, bottomY);
    }

    for (let t = -0.15 + (game.railOffset % 0.12); t < 1.12; t += 0.12) {
      const y = topY + (bottomY - topY) * t;
      const spread = w * (0.08 + t * 0.42);
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(0.75, t));
      ctx.strokeStyle = '#5a321c';
      ctx.lineWidth = Math.max(3, w * 0.012 * t);
      ctx.beginPath();
      ctx.moveTo(centerBottom - spread, y);
      ctx.lineTo(centerBottom + spread, y);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawRailLine(x1, y1, x2, y2) {
    ctx.save();
    ctx.strokeStyle = '#2c1c16';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.strokeStyle = '#9f6730';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
  }

  function drawMineCart(w, h, now) {
    const x = game.playerX * w;
    const y = PLAYER_Y * h;
    const invulnerable = now < game.invulnerableUntil;
    const flicker = invulnerable && Math.floor(now / 90) % 2 === 0;
    const size = Math.min(w, h) * 0.16;

    ctx.save();
    if (flicker) ctx.globalAlpha = 0.58;
    if (now < game.shakeUntil) ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 6);

    ctx.translate(x, y);
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 9;

    // Lore
    ctx.fillStyle = '#5b351d';
    ctx.strokeStyle = '#1e130d';
    ctx.lineWidth = 4;
    roundRect(-size * 0.62, size * 0.08, size * 1.24, size * 0.48, size * 0.11, true, true);
    ctx.fillStyle = '#8b5526';
    roundRect(-size * 0.52, size * 0.02, size * 1.04, size * 0.24, size * 0.08, true, false);
    ctx.fillStyle = '#2c1a12';
    ctx.beginPath();
    ctx.arc(-size * 0.42, size * 0.62, size * 0.12, 0, Math.PI * 2);
    ctx.arc(size * 0.42, size * 0.62, size * 0.12, 0, Math.PI * 2);
    ctx.fill();

    // Ritter in der Lore
    if (knight.complete && knight.naturalWidth) {
      const kH = size * 1.02;
      const kW = kH * (knight.naturalWidth / knight.naturalHeight);
      ctx.drawImage(knight, -kW / 2, -size * 0.78, kW, kH);
    } else {
      ctx.fillStyle = '#d5d5d5';
      ctx.beginPath();
      ctx.arc(0, -size * 0.38, size * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function roundRect(x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  function drawObstacle(obstacle, w, h) {
    const perspective = 0.45 + obstacle.y * 1.1;
    const size = obstacle.size * Math.min(w, h) * perspective;
    const x = obstacle.x * w;
    const y = obstacle.y * h;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(obstacle.rotation);
    ctx.shadowColor = 'rgba(75, 227, 255, 0.48)';
    ctx.shadowBlur = size * 0.18;

    drawCrystal(0, 0, size * 0.95, '#a8f4ff', '#3bc1f0');
    drawCrystal(-size * 0.56, size * 0.18, size * 0.58, '#f1fbff', '#9e70ff');
    drawCrystal(size * 0.52, size * 0.24, size * 0.54, '#fff2fe', '#d26cff');
    drawSpike(-size * 0.15, -size * 0.08, size * 1.3);

    ctx.restore();
  }

  function drawCrystal(x, y, size, light, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.strokeStyle = 'rgba(30, 20, 42, 0.9)';
    ctx.lineWidth = Math.max(2, size * 0.07);
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.46, -size * 0.15);
    ctx.lineTo(size * 0.32, size * 0.76);
    ctx.lineTo(-size * 0.32, size * 0.76);
    ctx.lineTo(-size * 0.46, -size * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = light;
    ctx.globalAlpha = 0.72;
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.86);
    ctx.lineTo(size * 0.17, -size * 0.08);
    ctx.lineTo(0, size * 0.58);
    ctx.lineTo(-size * 0.08, -size * 0.04);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawSpike(x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = 'rgba(20, 18, 22, 0.78)';
    ctx.lineWidth = Math.max(3, size * 0.05);
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * size * 0.16, size * 0.36);
      ctx.lineTo((i + 0.2) * size * 0.13, -size * 0.42);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawParticles(w, h) {
    for (const p of game.particles) {
      const alpha = 1 - p.age / p.life;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, Math.max(2, w * 0.008 * alpha), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function draw() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const now = performance.now();
    ctx.clearRect(0, 0, w, h);
    drawBackground(w, h);
    drawRails(w, h);
    game.obstacles.forEach(obstacle => drawObstacle(obstacle, w, h));
    drawMineCart(w, h, now);
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
    if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
      event.preventDefault();
      setLane(-1);
    }
    if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
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
