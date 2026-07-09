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
  const overlay = document.getElementById('pongOverlay');
  const card = document.getElementById('pongOverlayCard');
  const loader = document.getElementById('pongLoader');
  const loaderBar = document.getElementById('pongLoaderBar');
  const wallText = document.getElementById('pongWallText');
  const speedText = document.getElementById('pongSpeedText');

  const wallFiles = [
    '../assets/images/minigame/zauberschloss-pong/wall1.png',
    '../assets/images/minigame/zauberschloss-pong/wall2.png',
    '../assets/images/minigame/zauberschloss-pong/wall3.png',
    '../assets/images/minigame/zauberschloss-pong/wall4.png'
  ];
  const preloadFiles = [
    '../assets/images/minigame/zauberschloss-pong/background.jpg',
    '../assets/images/minigame/zauberschloss-pong/ritter_paddle.png',
    '../assets/images/minigame/zauberschloss-pong/magier_paddle.png',
    ...wallFiles
  ];

  let running = false;
  let finished = false;
  let raf = 0;
  let last = 0;
  let damage = 0;
  let playerHits = 0;
  let dragging = false;
  let knightX = 0.5;
  let mageX = 0.5;
  let ball = { x: 0.5, y: 0.24, vx: 0.12, vy: 0.28, speed: 1 };

  function currentVolume() {
    const saved = Number(localStorage.getItem(STORAGE_VOLUME));
    return Number.isFinite(saved) ? Math.min(1, Math.max(0, saved)) : 0.5;
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

  function hideOverlay() {
    overlay.classList.add('hidden');
  }

  function showIntro() {
    showOverlay(`
      <div>
        <h1>Magische Barriere</h1>
        <p>Der Magier schützt das Schlosstor.</p>
        <p>Ziehe den Ritter unten nach links und rechts. Schlage den grünen Zauberball zurück, bis der Magier ihn nicht mehr hält.</p>
        <div class="pong-actions">
          <button id="pongBack" class="pong-button secondary" type="button">Zurück</button>
          <button id="pongStart" class="pong-button" type="button">Starten</button>
        </div>
      </div>
    `);
    document.getElementById('pongBack').addEventListener('click', () => { window.location.href = 'zauberschloss.html'; });
    document.getElementById('pongStart').addEventListener('click', () => {
      hideOverlay();
      resetRound(true);
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    });
  }

  function showFinished() {
    running = false;
    finished = true;
    cancelAnimationFrame(raf);
    saveCompletion();
    showOverlay(`
      <div>
        <h2>Barriere zerbrochen!</h2>
        <p>Der Weg tiefer ins Zauberschloss ist frei.</p>
        <p>Als Nächstes wartet die Bossbegegnung.</p>
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

  function setWallState() {
    const index = Math.min(3, damage);
    wall.src = wallFiles[index];
    wallText.textContent = ['Barriere: stabil', 'Barriere: beschädigt', 'Barriere: brüchig', 'Barriere: zerbrochen'][index];
    wall.classList.remove('hit');
    void wall.offsetWidth;
    wall.classList.add('hit');
  }

  function resetRound(first = false) {
    const angle = first ? 0.58 : 0.72;
    ball.x = mageX;
    ball.y = 0.29;
    ball.speed = first ? 1 : Math.max(1, ball.speed * 0.92);
    ball.vx = (Math.random() < 0.5 ? -1 : 1) * 0.13 * angle;
    ball.vy = 0.28;
    updateSprites();
  }

  function stageRect() { return stage.getBoundingClientRect(); }
  function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

  function rect01(el) {
    const s = stageRect();
    const r = el.getBoundingClientRect();
    return { left:(r.left-s.left)/s.width, right:(r.right-s.left)/s.width, top:(r.top-s.top)/s.height, bottom:(r.bottom-s.top)/s.height };
  }

  function updateSprites() {
    mage.style.left = `${mageX * 100}%`;
    knight.style.left = `${knightX * 100}%`;
    ballEl.style.left = `${ball.x * 100}%`;
    ballEl.style.top = `${ball.y * 100}%`;
    speedText.textContent = `Tempo: ${Math.round(ball.speed * 100)}%`;
  }

  function hitPaddle(r, fromTop) {
    const radiusX = 0.018;
    const radiusY = 0.012;
    return ball.x + radiusX > r.left && ball.x - radiusX < r.right && ball.y + radiusY > r.top && ball.y - radiusY < r.bottom && (fromTop ? ball.vy < 0 : ball.vy > 0);
  }

  function loop(now) {
    if (!running || finished) return;
    const dt = Math.min(0.033, (now - last) / 1000 || 0.016);
    last = now;

    const difficultySpeed = 0.25 + playerHits * 0.006;
    const targetX = clamp(ball.x, 0.13, 0.87);
    const diff = targetX - mageX;
    const maxStep = difficultySpeed * dt;
    mageX += clamp(diff, -maxStep, maxStep);
    mageX = clamp(mageX, 0.13, 0.87);

    ball.x += ball.vx * ball.speed * dt;
    ball.y += ball.vy * ball.speed * dt;

    if (ball.x < 0.035) { ball.x = 0.035; ball.vx = Math.abs(ball.vx); playImpact(360, .045); }
    if (ball.x > 0.965) { ball.x = 0.965; ball.vx = -Math.abs(ball.vx); playImpact(360, .045); }

    const knightRect = rect01(knight);
    const mageRect = rect01(mage);

    if (hitPaddle(knightRect, false)) {
      ball.y = knightRect.top - 0.015;
      const offset = clamp((ball.x - knightX) / 0.105, -1, 1);
      ball.vx = offset * 0.22;
      ball.vy = -Math.abs(ball.vy || 0.28);
      ball.speed *= 1.10;
      playerHits += 1;
      playImpact(620, .06);
    }

    if (hitPaddle(mageRect, true)) {
      ball.y = mageRect.bottom + 0.014;
      const offset = clamp((ball.x - mageX) / 0.14, -1, 1);
      ball.vx = offset * 0.18;
      ball.vy = Math.abs(ball.vy || 0.28);
      playImpact(420, .055);
    }

    if (ball.y < 0.135) {
      damage += 1;
      playImpact(170, .16);
      setWallState();
      if (damage >= 3) {
        setTimeout(showFinished, 760);
        updateSprites();
        return;
      }
      resetRound(false);
    }

    if (ball.y > 1.03) {
      playImpact(210, .09);
      ball.speed = Math.max(1, ball.speed * 0.82);
      resetRound(false);
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
    dragging = true;
    knight.classList.add('dragging');
    knight.setPointerCapture?.(event.pointerId);
    knightX = pointerToX(event.clientX);
    updateSprites();
  });
  knight.addEventListener('pointermove', event => {
    if (!dragging) return;
    event.preventDefault();
    knightX = pointerToX(event.clientX);
    updateSprites();
  });
  function stopDrag() { dragging = false; knight.classList.remove('dragging'); }
  knight.addEventListener('pointerup', stopDrag);
  knight.addEventListener('pointercancel', stopDrag);
  window.addEventListener('resize', updateSprites);

  updateSprites();
  preloadAll();
})();
