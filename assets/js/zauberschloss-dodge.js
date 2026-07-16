(() => {
  const STORAGE_VOLUME = 'sinnesmagie-volume';
  const STORAGE_LEVEL_PROGRESS = 'sinnesmagie-level-progress';
  const STORAGE_LEVEL_NODE = 'sinnesmagie-level-node';

  const stage = document.getElementById('castleDodgeStage');
  const loader = document.getElementById('dodgeLoader');
  const startButton = document.getElementById('startDodgeButton');
  const timeEl = document.getElementById('dodgeTime');
  const mage = document.getElementById('dodgeMage');
  const knight = document.getElementById('dodgeKnight');
  const layer = document.getElementById('dodgeProjectiles');
  const leftButton = document.getElementById('dodgeLeft');
  const rightButton = document.getElementById('dodgeRight');
  const popup = document.getElementById('dodgePopup');
  const continueButton = document.getElementById('dodgeContinue');
  const music = document.getElementById('castleDodgeMusic');

  const GAME_MS = 30000;
  const SPAWN_MS = 3400;
  const PLAYER_SPEED = 56; // Prozentpunkte pro Sekunde
  const PROJECTILE_SPEED = 31; // Prozentpunkte pro Sekunde
  const STUN_MS = 700;

  const state = {
    running: false,
    finished: false,
    startTime: 0,
    lastFrame: 0,
    playerX: 50,
    moveDir: 0,
    mageX: -18,
    mageDir: 1,
    projectiles: [],
    spawnTimer: null,
    raf: null,
    stunnedUntil: 0,
    hitsTaken: 0
  };

  function currentVolume() {
    const saved = Number(localStorage.getItem(STORAGE_VOLUME));
    if (Number.isFinite(saved)) return Math.min(1, Math.max(0, saved));
    return 0.5;
  }

  function readProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_LEVEL_PROGRESS) || '{}');
      return saved && typeof saved === 'object' ? saved : {};
    } catch {
      return {};
    }
  }

  function writeProgress(progress) {
    localStorage.setItem(STORAGE_LEVEL_PROGRESS, JSON.stringify(progress));
  }

  function completeZauberschlossQuizStep() {
    const progress = readProgress();
    const area = progress.zauberschloss || {};
    progress.zauberschloss = {
      level1Completed: !!area.level1Completed || true,
      level2Completed: true,
      level3Completed: !!area.level3Completed,
      level4Completed: !!area.level4Completed
    };
    writeProgress(progress);
    try {
      const nodes = JSON.parse(localStorage.getItem(STORAGE_LEVEL_NODE) || '{}');
      nodes.zauberschloss = 'level2';
      localStorage.setItem(STORAGE_LEVEL_NODE, JSON.stringify(nodes));
    } catch {}
  }

  function preload(src) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = resolve;
      img.src = src;
      if (img.decode) img.decode().then(resolve).catch(resolve);
    });
  }

  async function preloadAll() {
    const images = [
      '../assets/images/battle-backgrounds/zauberschloss.webp',
      '../assets/images/characters/knight.png',
      '../assets/images/enemies/zauberer_fly_left.png',
      '../assets/images/enemies/zauberer_fly_right.png'
    ];
    await Promise.race([
      Promise.all(images.map(preload)),
      new Promise(resolve => setTimeout(resolve, 1600))
    ]);
    startButton.disabled = false;
    startButton.textContent = 'Kampf starten';
  }

  function setKnightX() {
    knight.style.left = `${state.playerX}%`;
  }

  function setMageX() {
    mage.style.left = `${state.mageX}%`;
    mage.src = state.mageDir > 0
      ? '../assets/images/enemies/zauberer_fly_right.png'
      : '../assets/images/enemies/zauberer_fly_left.png';
  }

  function startMusic() {
    try {
      music.volume = currentVolume();
      music.currentTime = 0;
      music.play().catch(() => {});
    } catch {}
  }

  function stopMusic() {
    try { music.pause(); } catch {}
  }

  function spawnProjectile() {
    if (!state.running) return;
    const el = document.createElement('div');
    el.className = 'dodge-projectile';
    const x = Math.max(10, Math.min(90, state.mageX + 18 + (Math.random() * 16 - 8)));
    el.style.left = `${x}%`;
    el.style.top = `11%`;
    layer.appendChild(el);
    state.projectiles.push({ el, x, y: 11 });
  }

  function clearProjectiles() {
    state.projectiles.forEach(p => p.el.remove());
    state.projectiles = [];
  }

  function setMoveDir(dir) {
    if (performance.now() < state.stunnedUntil) return;
    state.moveDir = dir;
  }

  function stopMoveDir(dir) {
    if (state.moveDir === dir) state.moveDir = 0;
  }

  function addHoldListeners(button, dir) {
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      button.setPointerCapture?.(event.pointerId);
      setMoveDir(dir);
    });
    button.addEventListener('pointerup', event => {
      event.preventDefault();
      stopMoveDir(dir);
    });
    button.addEventListener('pointercancel', () => stopMoveDir(dir));
    button.addEventListener('pointerleave', () => stopMoveDir(dir));
  }

  addHoldListeners(leftButton, -1);
  addHoldListeners(rightButton, 1);

  function hitKnight() {
    const now = performance.now();
    if (now < state.stunnedUntil) return;
    state.stunnedUntil = now + STUN_MS;
    state.hitsTaken += 1;
    window.SinnesScore?.addPoints('game_zauberschloss_dodge', -150, 1000);
    state.moveDir = 0;
    knight.classList.add('dodge-knight-hit');
    setTimeout(() => knight.classList.remove('dodge-knight-hit'), STUN_MS);
  }

  function updateProjectiles(delta) {
    const knightRect = knight.getBoundingClientRect();
    state.projectiles = state.projectiles.filter(p => {
      p.y += PROJECTILE_SPEED * delta;
      p.el.style.top = `${p.y}%`;
      if (p.y > 102) {
        p.el.remove();
        return false;
      }
      const rect = p.el.getBoundingClientRect();
      const overlaps = !(rect.right < knightRect.left || rect.left > knightRect.right || rect.bottom < knightRect.top || rect.top > knightRect.bottom);
      if (overlaps) {
        p.el.remove();
        hitKnight();
        return false;
      }
      return true;
    });
  }

  function finish() {
    if (state.finished) return;
    state.running = false;
    state.finished = true;
    clearInterval(state.spawnTimer);
    cancelAnimationFrame(state.raf);
    clearProjectiles();
    stopMusic();
    completeZauberschlossQuizStep();
    const points = Math.max(0, 1000 - state.hitsTaken * 150);
    window.SinnesScore?.setSession('game_zauberschloss_dodge', points, 1000);
    window.SinnesScore?.finishSession('game_zauberschloss_dodge', points, 1000);
    if (!won) window.SinnesGameOver?.play?.();
    window.SinnesScore?.setGameplayActive(false);
    popup.classList.remove('hidden');
  }

  function frame(now) {
    if (!state.running) return;
    const delta = Math.min(0.05, (now - state.lastFrame) / 1000 || 0);
    state.lastFrame = now;

    const elapsed = now - state.startTime;
    const remaining = Math.max(0, GAME_MS - elapsed);
    timeEl.textContent = (remaining / 1000).toFixed(1);

    if (now >= state.stunnedUntil) {
      state.playerX += state.moveDir * PLAYER_SPEED * delta;
      state.playerX = Math.max(11, Math.min(89, state.playerX));
      setKnightX();
    }

    state.mageX += state.mageDir * 18 * delta;
    if (state.mageX > 86) {
      state.mageX = 86;
      state.mageDir = -1;
    } else if (state.mageX < -8) {
      state.mageX = -8;
      state.mageDir = 1;
    }
    setMageX();
    updateProjectiles(delta);

    if (remaining <= 0) {
      finish();
      return;
    }
    state.raf = requestAnimationFrame(frame);
  }

  function startGame() {
    loader.classList.add('hidden');
    window.SinnesScore?.startSession('game_zauberschloss_dodge', 1000, 1000);
    window.SinnesScore?.setGameplayActive(true);
    startMusic();
    state.running = true;
    state.finished = false;
    state.startTime = performance.now();
    state.lastFrame = state.startTime;
    state.playerX = 50;
    state.mageX = -8;
    state.mageDir = 1;
    state.moveDir = 0;
    state.stunnedUntil = 0;
    state.hitsTaken = 0;
    clearProjectiles();
    setKnightX();
    setMageX();
    timeEl.textContent = '30.0';
    state.spawnTimer = setInterval(spawnProjectile, SPAWN_MS);
    setTimeout(spawnProjectile, 900);
    state.raf = requestAnimationFrame(frame);
  }

  startButton.addEventListener('click', startGame);
  continueButton.addEventListener('click', () => {
    window.location.href = 'zauberschloss.html';
  });

  preloadAll();
})();
