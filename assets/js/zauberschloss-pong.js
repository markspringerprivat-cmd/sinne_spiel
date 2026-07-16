(() => {
  const STORAGE_VOLUME = 'sinnesmagie-volume';
  const STORAGE_LEVEL_PROGRESS = 'sinnesmagie-level-progress';
  const STORAGE_PENDING_NOTICE = 'sinnesmagie-pending-notice';
  const AREA = 'zauberschloss';

  const stage = document.getElementById('pongStage');
  const wall = document.getElementById('pongWall');
  const mage = document.getElementById('pongMage');
  const knight = document.getElementById('pongKnight');
  const ballEl = document.getElementById('pongBall');
  const obstacleLeft = document.getElementById('obstacleLeft');
  const obstacleRight = document.getElementById('obstacleRight');
  const redBallLayer = document.getElementById('redBallLayer');
  const overlay = document.getElementById('pongOverlay');
  const card = document.getElementById('pongOverlayCard');
  const loader = document.getElementById('pongLoader');
  const loaderBar = document.getElementById('pongLoaderBar');
  const wallText = document.getElementById('pongWallText');
  const speedText = document.getElementById('pongSpeedText');
  const pongMusic = document.getElementById('pongMusic');
  const restartButton = document.getElementById('pongRestart');
  let pongMusicStarted = false;

  const preloadFiles = [
    '../assets/images/minigame/zauberschloss-pong/background.jpg',
    '../assets/images/minigame/zauberschloss-pong/ritter_paddle.png',
    '../assets/images/minigame/zauberschloss-pong/magier_paddle.png',
    '../assets/images/minigame/zauberschloss-pong/wall1.png'
  ];

  let running = false;
  let finished = false;
  let raf = 0;
  let last = 0;
  let damage = 0;
  let playerHits = 0;
  let playerConceded = 0;
  let dragging = false;
  let knightX = 0.5;
  let mageX = 0.5;
  let ballVisible = true;
  let respawning = false;
  let redSpawnTimer = 0;
  let stunTimer = 0;
  let redBalls = [];
  let ball = { x: 0.5, y: 0.29, vx: 0.09, vy: 0.23, speed: 1 };
  const BASE_BALL_VECTOR_SPEED = Math.hypot(0.09, 0.23);
  const INITIAL_BALL_SPEED_MULTIPLIER = 1.35;
  let lastObstacleHit = null;
  let obstacleCooldown = 0;

  function currentVolume() {
    const saved = Number(localStorage.getItem(STORAGE_VOLUME));
    return Number.isFinite(saved) ? Math.min(1, Math.max(0, saved)) : 0.5;
  }

  function startPongMusic(restart = false) {
    if (!pongMusic) return;
    try {
      pongMusic.loop = true;
      pongMusic.volume = currentVolume() * 0.62;
      if (restart || !pongMusicStarted) pongMusic.currentTime = 0;
      pongMusicStarted = true;
      pongMusic.play().catch(() => {});
    } catch {}
  }

  function pausePongMusic() {
    if (!pongMusic) return;
    try { pongMusic.pause(); } catch {}
  }

  function playImpact(frequency = 520, duration = 0.08) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = frequency;
      gain.gain.value = Math.max(0.02, currentVolume() * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + duration);
      setTimeout(() => ctx.close().catch(() => {}), 300);
    } catch {}
  }


  function restartPongLevel() {
    cancelAnimationFrame(raf);
    running = false;
    finished = false;
    fullReset();
    window.SinnesScore?.startSession('game_zauberschloss_pong', 1000, 0);
    window.SinnesScore?.setGameplayActive(true);
    startPongMusic(true);
    hideOverlay();
    restartButton?.classList.remove('hidden');
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }

  function preloadImage(src, index) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = img.onerror = () => {
        if (loaderBar) loaderBar.style.width = `${Math.round(((index + 1) / preloadFiles.length) * 100)}%`;
        resolve();
      };
      img.src = src;
    });
  }

  async function preloadAll() {
    for (let i = 0; i < preloadFiles.length; i++) await preloadImage(preloadFiles[i], i);
    await new Promise(resolve => setTimeout(resolve, 250));
    loader.classList.add('hidden');
    showIntro();
  }

  function showOverlay(html) {
    card.innerHTML = html;
    overlay.classList.remove('hidden');
  }

  function hideOverlay() { overlay.classList.add('hidden'); }

  function showIntro() {
    showOverlay(`
      <div>
        <h1>Magische Barriere</h1>
        <p>Der Magier schützt das erste Tor.</p>
        <p>Ziehe den Ritter unten nach links und rechts. Nur der grüne Ball darf mit dem Schild zurückgespielt werden. Rote Kugeln machen dich kurz bewegungsunfähig.</p>
        <div class="pong-actions">
          <button id="pongBack" class="pong-button secondary" type="button">Zurück</button>
          <button id="pongStart" class="pong-button" type="button">Starten</button>
        </div>
      </div>
    `);
    document.getElementById('pongBack').addEventListener('click', () => { window.location.href = 'zauberschloss.html?minigameAborted=1'; });
    document.getElementById('pongStart').addEventListener('click', () => {
      restartPongLevel();
    });
  }

  function showFinished() {
    running = false;
    finished = true;
    cancelAnimationFrame(raf);
    pausePongMusic();
    restartButton?.classList.add('hidden');
    saveCompletion();
    const points = Math.max(0, Math.min(1000, damage * 300 - playerConceded * 250));
    window.SinnesScore?.setSession('game_zauberschloss_pong', points, 1000);
    window.SinnesScore?.finishSession('game_zauberschloss_pong', points, 1000);
    window.SinnesScore?.setGameplayActive(false);
    showOverlay(`
      <div>
        <h2>Barriere geschwächt!</h2>
        <p>Der Weg tiefer ins Zauberschloss ist frei.</p>
        <p>Als Nächstes wartet die Bossbegegnung am Kristallbrunnen.</p>
        <div class="pong-actions"><button id="pongContinue" class="pong-button" type="button">Weiter</button></div>
      </div>
    `);
    document.getElementById('pongContinue').addEventListener('click', () => { window.location.href = 'zauberschloss.html'; });
  }

  function saveCompletion() {
    try {
      const progress = JSON.parse(localStorage.getItem(STORAGE_LEVEL_PROGRESS) || '{}');
      progress[AREA] = { ...(progress[AREA] || {}), level1Completed: true };
      localStorage.setItem(STORAGE_LEVEL_PROGRESS, JSON.stringify(progress));
      localStorage.setItem(STORAGE_PENDING_NOTICE, JSON.stringify({ type: 'minigameComplete', area: AREA }));
    } catch {}
  }

  function fullReset() {
    damage = 0;
    playerHits = 0;
    playerConceded = 0;
    redSpawnTimer = 0;
    stunTimer = 0;
    clearRedBalls();
    obstacleLeft.classList.add('hidden');
    obstacleRight.classList.add('hidden');
    resetGreenBall(true);
    updateSprites();
  }

  function setWallBlink() {
    wallText.textContent = `Barriere: ${damage}/3`;
    wall.classList.remove('hit');
    void wall.offsetWidth;
    wall.classList.add('hit');
  }

  function resetGreenBall(first = false) {
    ballVisible = true;
    respawning = false;
    ballEl.classList.remove('hidden');
    ball.x = mageX;
    ball.y = 0.29;
    ball.speed = INITIAL_BALL_SPEED_MULTIPLIER;
    const side = first ? (Math.random() < 0.5 ? -1 : 1) : (knightX < 0.5 ? 1 : -1);
    setBallVector(side * (0.085 + Math.random() * 0.045), 0.26, BASE_BALL_VECTOR_SPEED * INITIAL_BALL_SPEED_MULTIPLIER);
    lastObstacleHit = null;
    obstacleCooldown = 0;
    updateSprites();
  }

  function scheduleGreenRespawn() {
    if (respawning) return;
    respawning = true;
    ballVisible = false;
    ballEl.classList.add('hidden');
    setTimeout(() => {
      if (!running || finished) return;
      resetGreenBall(false);
    }, 3000);
  }

  function stageRect() { return stage.getBoundingClientRect(); }
  function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

  function actualBallSpeed() {
    return Math.hypot(ball.vx, ball.vy) * ball.speed;
  }

  function setBallVector(rawVx, rawVy, actualSpeed = actualBallSpeed()) {
    const len = Math.hypot(rawVx, rawVy) || BASE_BALL_VECTOR_SPEED;
    ball.vx = (rawVx / len) * BASE_BALL_VECTOR_SPEED;
    ball.vy = (rawVy / len) * BASE_BALL_VECTOR_SPEED;
    ball.speed = Math.max(0.25, actualSpeed / BASE_BALL_VECTOR_SPEED);
  }

  function bounceGreenBall(rawVx, rawVy) {
    const nextActualSpeed = actualBallSpeed() * 1.05;
    setBallVector(rawVx, rawVy, nextActualSpeed);
  }

  function rect01(el) {
    const s = stageRect();
    const r = el.getBoundingClientRect();
    return { left:(r.left-s.left)/s.width, right:(r.right-s.left)/s.width, top:(r.top-s.top)/s.height, bottom:(r.bottom-s.top)/s.height, width:r.width/s.width, height:r.height/s.height };
  }

  function updateSprites() {
    mage.style.left = `${mageX * 100}%`;
    knight.style.left = `${knightX * 100}%`;
    ballEl.style.left = `${ball.x * 100}%`;
    ballEl.style.top = `${ball.y * 100}%`;
    speedText.textContent = `Tempo: ${Math.round(ball.speed * 100)}%`;
    wallText.textContent = `Barriere: ${damage}/3`;
    knight.classList.toggle('stunned', stunTimer > 0);
    redBalls.forEach(red => {
      red.el.style.left = `${red.x * 100}%`;
      red.el.style.top = `${red.y * 100}%`;
    });
  }

  function hitPaddle(r, fromTop) {
    const radiusX = 0.018;
    const radiusY = 0.012;
    return ball.x + radiusX > r.left && ball.x - radiusX < r.right && ball.y + radiusY > r.top && ball.y - radiusY < r.bottom && (fromTop ? ball.vy < 0 : ball.vy > 0);
  }

  function circleCollision(cx, cy, cr, bx, by, br) {
    return Math.hypot(cx - bx, cy - by) < cr + br;
  }

  function bounceFromObstacle(rect, obstacleId) {
    if (!ballVisible || damage < 1) return;
    if (obstacleCooldown > 0 && lastObstacleHit === obstacleId) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const cr = Math.min(rect.width, rect.height) * 0.48;
    const ballRadius = 0.018;
    if (!circleCollision(cx, cy, cr, ball.x, ball.y, ballRadius)) return;
    const dx = ball.x - cx;
    const dy = ball.y - cy;
    const len = Math.hypot(dx, dy) || 1;
    const nx = dx / len;
    const ny = dy / len;
    const dot = ball.vx * nx + ball.vy * ny;
    const reflectedVx = ball.vx - 2 * dot * nx;
    const reflectedVy = ball.vy - 2 * dot * ny;

    ball.x = cx + nx * (cr + ballRadius + 0.012);
    ball.y = cy + ny * (cr + ballRadius + 0.012);
    bounceGreenBall(reflectedVx, reflectedVy);
    lastObstacleHit = obstacleId;
    obstacleCooldown = 0.08;
    playImpact(540, .045);
  }

  function spawnRedBall() {
    const el = document.createElement('div');
    el.className = 'pong-red-ball';
    redBallLayer.appendChild(el);
    const startX = clamp(mageX, 0.08, 0.92);
    const direction = Math.random() < 0.5 ? -1 : 1;
    const redSpeed = 0.198; // 40 % langsamer als vorher und im 45°-Winkel
    redBalls.push({ el, x: startX, y: 0.29, vx: direction * redSpeed, vy: redSpeed });
  }

  function clearRedBalls() {
    redBalls.forEach(red => red.el.remove());
    redBalls = [];
  }

  function updateRedBalls(dt, knightRect) {
    if (playerHits > 0) {
      redSpawnTimer += dt;
      if (redSpawnTimer >= 3) {
        redSpawnTimer = 0;
        spawnRedBall();
      }
    }

    redBalls.forEach(red => {
      red.x += red.vx * dt;
      red.y += red.vy * dt;
      if (red.x < 0.035 || red.x > 0.965) red.vx *= -1;
      red.x = clamp(red.x, 0.035, 0.965);
      if (red.x > knightRect.left && red.x < knightRect.right && red.y > knightRect.top && red.y < knightRect.bottom) {
        stunTimer = 2;
        playImpact(130, .14);
        red.remove = true;
      }
      if (red.y > 1.08) red.remove = true;
    });

    redBalls = redBalls.filter(red => {
      if (!red.remove) return true;
      red.el.remove();
      return false;
    });
  }

  function loop(now) {
    if (!running || finished) return;
    const dt = Math.min(0.033, (now - last) / 1000 || 0.016);
    last = now;

    if (stunTimer > 0) stunTimer = Math.max(0, stunTimer - dt);
    if (obstacleCooldown > 0) obstacleCooldown = Math.max(0, obstacleCooldown - dt);

    const targetX = clamp(ballVisible ? ball.x : 0.5, 0.13, 0.87);
    const diff = targetX - mageX;
    const mageBaseSpeed = (0.175 + Math.min(playerHits, 14) * 0.0035) * 0.8;
    const maxStep = mageBaseSpeed * dt;
    mageX += clamp(diff, -maxStep, maxStep);
    mageX = clamp(mageX, 0.13, 0.87);

    const knightRect = rect01(knight);
    const mageRect = rect01(mage);
    updateRedBalls(dt, knightRect);

    if (ballVisible) {
      ball.x += ball.vx * ball.speed * dt;
      ball.y += ball.vy * ball.speed * dt;

      if (ball.x < 0.035) { ball.x = 0.035; ball.vx = Math.abs(ball.vx); playImpact(360, .045); }
      if (ball.x > 0.965) { ball.x = 0.965; ball.vx = -Math.abs(ball.vx); playImpact(360, .045); }

      if (damage >= 1) {
        bounceFromObstacle(rect01(obstacleLeft), 'left');
        bounceFromObstacle(rect01(obstacleRight), 'right');
      }

      if (hitPaddle(knightRect, false)) {
        ball.y = knightRect.top - 0.015;
        const offset = clamp((ball.x - knightX) / 0.105, -1, 1);
        bounceGreenBall(offset * 0.22, -Math.abs(ball.vy || 0.23));
        lastObstacleHit = null;
        playerHits += 1;
      }

      if (hitPaddle(mageRect, true)) {
        ball.y = mageRect.bottom + 0.014;
        const offset = clamp((ball.x - mageX) / 0.14, -1, 1);
        bounceGreenBall(offset * 0.18, Math.abs(ball.vy || 0.23));
        lastObstacleHit = null;
        playImpact(420, .055);
      }

      if (ball.y < 0.135) {
        damage += 1;
        window.SinnesScore?.addPoints('game_zauberschloss_pong', 300, 1000);
        playImpact(170, .16);
        setWallBlink();
        if (damage >= 1) {
          obstacleLeft.classList.remove('hidden');
          obstacleRight.classList.remove('hidden');
        }
        if (damage >= 3) {
          ballVisible = false;
          ballEl.classList.add('hidden');
          setTimeout(showFinished, 760);
          updateSprites();
          return;
        }
        scheduleGreenRespawn();
      }

      if (ball.y > 1.05) {
        playerConceded += 1;
        window.SinnesScore?.addPoints('game_zauberschloss_pong', -250, 1000);
        playImpact(210, .09);
        scheduleGreenRespawn();
      }
    }

    updateSprites();
    raf = requestAnimationFrame(loop);
  }

  function pointerToX(clientX) {
    const r = stageRect();
    return clamp((clientX - r.left) / r.width, 0.12, 0.88);
  }

  knight.addEventListener('pointerdown', event => {
    event.preventDefault();
    if (stunTimer > 0) return;
    dragging = true;
    knight.classList.add('dragging');
    knight.setPointerCapture?.(event.pointerId);
    knightX = pointerToX(event.clientX);
    updateSprites();
  });
  knight.addEventListener('pointermove', event => {
    if (!dragging || stunTimer > 0) return;
    event.preventDefault();
    knightX = pointerToX(event.clientX);
    updateSprites();
  });
  function stopDrag() { dragging = false; knight.classList.remove('dragging'); }
  knight.addEventListener('pointerup', stopDrag);
  knight.addEventListener('pointercancel', stopDrag);
  window.addEventListener('resize', updateSprites);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pausePongMusic();
    else if (running && !finished) startPongMusic(false);
  });

  restartButton?.addEventListener('click', restartPongLevel);

  updateSprites();
  preloadAll();
})();
