(() => {
  const STORAGE_VOLUME = 'sinnesmagie-volume';
  const STORAGE_LEVEL_PROGRESS = 'sinnesmagie-level-progress';
  const STORAGE_PENDING_NOTICE = 'sinnesmagie-pending-notice';
  const FIELD_COUNT = 100;
  const PLAYER_START = 0;
  const TARGET_INDEX = FIELD_COUNT - 1;
  const BEETLE_HEADSTART_MS = 3000;
  const BEETLE_STEP_MS = 820;
  const BEETLE_CATCHUP_STEP_MS = 160;
  const BEETLE_HOP_MS = 260;

  const canvas = document.getElementById('duftHopCanvas');
  const ctx = canvas.getContext('2d', { alpha: true });
  const overlay = document.getElementById('duftOverlay');
  const popup = document.getElementById('duftPopup');
  const statusText = document.getElementById('duftStatusText');
  const progressFill = document.getElementById('duftProgressFill');
  const infoText = document.getElementById('duftInfoText');
  const jumpOne = document.getElementById('jumpOne');
  const jumpTwo = document.getElementById('jumpTwo');
  const musicElement = document.getElementById('duftMusic');
  const musicLoop = window.createCrossfadeLoop ? window.createCrossfadeLoop(musicElement, { fadeSeconds: 0.12 }) : null;

  const images = {
    background: new Image(),
    flowerNormal: new Image(),
    flowerSlime: new Image(),
    flowerRotten: new Image(),
    flowerGold: new Image(),
    cloudStink: new Image(),
    knight: new Image(),
    beetle: new Image(),
  };
  images.background.src = '../assets/images/level-backgrounds/duftgarten.webp';
  images.flowerNormal.src = '../assets/images/minigame/duftgarten/flower_normal.png';
  images.flowerSlime.src = '../assets/images/minigame/duftgarten/flower_slime.png';
  images.flowerRotten.src = '../assets/images/minigame/duftgarten/flower_rotten.png';
  images.flowerGold.src = '../assets/images/minigame/duftgarten/flower_gold.png';
  images.cloudStink.src = '../assets/images/minigame/duftgarten/cloud_stink.png';
  images.knight.src = '../assets/images/minigame/duftgarten/knight_top.png';
  images.beetle.src = '../assets/images/minigame/duftgarten/beetle_stink.png';

  const hazardPattern = [
    3, 7, 11, 16, 21, 26, 31, 36, 41, 46, 52, 57, 62, 67, 72, 77, 83, 88, 93, 97,
  ];
  const hazardTypes = ['slime', 'cloud', 'rotten', 'slime', 'cloud'];

  function fieldTypeForIndex(index) {
    if (index === 0) return 'start';
    if (index === TARGET_INDEX) return 'goal';

    // Kein schädliches Feld liegt direkt vor oder hinter einem anderen schädlichen Feld.
    // Dadurch ist immer mindestens ein normales Ausweichfeld erreichbar.
    const hazardSlot = hazardPattern.indexOf(index);
    if (hazardSlot !== -1) return hazardTypes[hazardSlot % hazardTypes.length];
    return 'normal';
  }


  const game = {
    running: false,
    finished: false,
    fields: [],
    playerIndex: PLAYER_START,
    lastTime: 0,
    jumpAnim: null,
    jumpLockUntil: 0,
    stunUntil: 0,
    slowUntil: 0,
    rottenAnim: null,
    beetleStartAt: 0,
    beetleNextStepAt: 0,
    beetleIndex: -3,
    beetleHop: null,
    message: '',
    messageUntil: 0,
    camera: 0,
    particles: [],
  };

  function currentVolume() {
    const saved = Number(localStorage.getItem(STORAGE_VOLUME));
    return Number.isFinite(saved) ? Math.min(1, Math.max(0, saved)) : 0.5;
  }

  function startMusic() {
    if (!musicElement) return;
    const volume = currentVolume() * 0.42;
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

  function completeLevelOne() {
    const progress = readProgress();
    progress.duftgarten = {
      level1Completed: true,
      level2Completed: !!progress.duftgarten?.level2Completed,
    };
    localStorage.setItem(STORAGE_LEVEL_PROGRESS, JSON.stringify(progress));
    writeMinigamePendingNotice('duftgarten');
  }

  function resizeCanvas() {
    const dpr = Math.min(1.5, Math.max(1, window.devicePixelRatio || 1));
    const w = Math.max(320, window.innerWidth);
    const h = Math.max(520, window.innerHeight);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }

  function makeFields() {
    return Array.from({ length: FIELD_COUNT }, (_, index) => ({
      index,
      type: fieldTypeForIndex(index),
      visited: index === 0,
    }));
  }

  function resetGame() {
    const now = performance.now();
    game.running = true;
    game.finished = false;
    game.fields = makeFields();
    game.playerIndex = PLAYER_START;
    game.lastTime = now;
    game.jumpAnim = null;
    game.jumpLockUntil = 0;
    game.stunUntil = 0;
    game.slowUntil = 0;
    game.rottenAnim = null;
    game.beetleStartAt = now + BEETLE_HEADSTART_MS;
    game.beetleNextStepAt = now + BEETLE_HEADSTART_MS;
    game.beetleIndex = -3;
    game.beetleHop = null;
    game.message = '';
    game.messageUntil = 0;
    game.camera = 0;
    game.particles = [];
    game.obstacleHits = 0;
    updateHud(now);
  }

  function showPopup(type) {
    overlay.classList.remove('hidden');
    jumpOne.disabled = true;
    jumpTwo.disabled = true;

    if (type === 'intro') {
      popup.innerHTML = `
        <div>
          <h1>Blütensprung</h1>
          <div class="mini-guide-wrap">
            <p class="mini-guide-hint">Wische durch die Karten.</p>
            <div class="mini-guide-slider" aria-label="Blumentypen">
              <article class="mini-guide-card">
                <div class="mini-guide-icon"><img src="../assets/images/minigame/duftgarten/flower_normal.png" alt="Normale Blüte"></div>
                <p class="mini-guide-title">Springen</p>
                <p class="mini-guide-text">Wähle 1 oder 2 Felder nach vorne.</p>
              </article>
              <article class="mini-guide-card">
                <div class="mini-guide-icon"><img src="../assets/images/minigame/duftgarten/beetle_stink.png" alt="Käfer"></div>
                <p class="mini-guide-title">Käfer</p>
                <p class="mini-guide-text">Er läuft hinterher. Bleib höchstens 5 Felder vor ihm.</p>
              </article>
              <article class="mini-guide-card">
                <div class="mini-guide-icon"><img src="../assets/images/minigame/duftgarten/flower_rotten.png" alt="Faule Blüte"></div>
                <p class="mini-guide-title">Faule Blüte</p>
                <p class="mini-guide-text">Du schrumpfst und fällst 1 Feld zurück.</p>
              </article>
              <article class="mini-guide-card">
                <div class="mini-guide-icon"><img src="../assets/images/minigame/duftgarten/flower_slime.png" alt="Klebrige Blüte"></div>
                <p class="mini-guide-title">Klebrig</p>
                <p class="mini-guide-text">3 Sekunden lang springst du langsamer.</p>
              </article>
              <article class="mini-guide-card">
                <div class="mini-guide-icon"><img src="../assets/images/minigame/duftgarten/cloud_stink.png" alt="Gestankwolke"></div>
                <p class="mini-guide-title">Nebel</p>
                <p class="mini-guide-text">2 Sekunden betäubt.</p>
              </article>
              <article class="mini-guide-card">
                <div class="mini-guide-icon"><img src="../assets/images/minigame/duftgarten/flower_gold.png" alt="Goldene Blüte"></div>
                <p class="mini-guide-title">Ziel</p>
                <p class="mini-guide-text">Erreiche die goldene Blüte.</p>
              </article>
            </div>
          </div>
          <div class="duft-popup-actions">
            <button id="startDuftGame" class="duft-button" type="button">Starten</button>
            <button id="leaveDuftGame" class="duft-button secondary" type="button">Zurück</button>
          </div>
        </div>`;
      document.getElementById('startDuftGame').addEventListener('click', startGame);
      document.getElementById('leaveDuftGame').addEventListener('click', () => { window.location.href = 'duftgarten.html?minigameAborted=1'; });
      return;
    }

    if (type === 'won') {
      popup.innerHTML = `
        <div>
          <h2>Geschafft!</h2>
          <div class="mini-guide-icon"><img src="../assets/images/minigame/duftgarten/flower_gold.png" alt="Goldene Blüte"></div>
          <p>Goldene Blüte erreicht.</p>
          <div class="duft-popup-actions">
            <button id="returnDuft" class="duft-button" type="button">Zurück zum Duftgarten</button>
          </div>
        </div>`;
      document.getElementById('returnDuft').addEventListener('click', () => { window.location.href = 'duftgarten.html'; });
      return;
    }

    popup.innerHTML = `
      <div>
        <h2>Erwischt!</h2>
        <div class="mini-guide-icon"><img src="../assets/images/minigame/duftgarten/beetle_stink.png" alt="Käfer"></div>
        <p>Der Käfer war zu nah.</p>
        <div class="duft-popup-actions">
          <button id="retryDuft" class="duft-button" type="button">Nochmal spielen</button>
          <button id="returnDuft" class="duft-button secondary" type="button">Zurück</button>
        </div>
      </div>`;
    document.getElementById('retryDuft').addEventListener('click', startGame);
    document.getElementById('returnDuft').addEventListener('click', () => { window.location.href = 'duftgarten.html'; });
  }

  function hidePopup() {
    overlay.classList.add('hidden');
  }

  function startGame() {
    resetGame();
    hidePopup();
    jumpOne.disabled = false;
    jumpTwo.disabled = false;
    window.SinnesScore?.startSession('game_duftgarten', 1000, 0);
    window.SinnesScore?.setGameplayActive(true);
    startMusic();
    requestAnimationFrame(loop);
  }

  function endGame(won) {
    if (game.finished) return;
    game.running = false;
    game.finished = true;
    jumpOne.disabled = true;
    jumpTwo.disabled = true;
    pauseMusic();
    if (won) { completeLevelOne(); const points = window.SinnesScore?.sessionValue?.('game_duftgarten') ?? 0; window.SinnesScore?.setSession('game_duftgarten', points, 1000); window.SinnesScore?.finishSession('game_duftgarten', points, 1000); }
    if (!won) window.SinnesGameOver?.play?.();
    window.SinnesScore?.setGameplayActive(false);
    setTimeout(() => showPopup(won ? 'won' : 'lost'), 420);
  }

  function setMessage(text, ms = 1300) {
    game.message = text;
    game.messageUntil = performance.now() + ms;
  }

  function updateHud(now = performance.now()) {
    const progress = Math.max(0, Math.min(100, (game.playerIndex / TARGET_INDEX) * 100));
    if(progressFill) progressFill.style.width = `${progress}%`;

    if (game.message) {
      if(statusText) statusText.textContent = game.message;
    } else if (now < game.slowUntil) {
      const sec = Math.max(0, (game.slowUntil - now) / 1000).toFixed(1);
      if(statusText) statusText.textContent = `Verlangsamt: noch ${sec} s`; 
    } else {
      if(statusText) statusText.textContent = 'Ziel: Die goldene Blüte erreichen';
    }

    if (now < game.beetleStartAt) {
      const sec = Math.max(0, (game.beetleStartAt - now) / 1000).toFixed(1);
      if(infoText) infoText.textContent = `Startet in ${sec} s`;
    } else {
      const distance = Math.max(0, game.playerIndex - Math.floor(game.beetleIndex));
      if(infoText) infoText.textContent = `${distance} Felder Abstand`;
    }
  }

  function fieldWorld(index, w, h) {
    const rowGap = Math.min(132, Math.max(92, h * 0.13));
    const bottom = h * 0.77;
    const x = w * 0.5;
    return {
      x,
      y: bottom - index * rowGap,
      rowGap,
    };
  }

  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function currentPlayerPos(w, h, now) {
    if (!game.jumpAnim) return fieldWorld(game.playerIndex, w, h);
    const t = Math.min(1, (now - game.jumpAnim.start) / game.jumpAnim.duration);
    const ease = easeOutCubic(t);
    const from = fieldWorld(game.jumpAnim.from, w, h);
    const to = fieldWorld(game.jumpAnim.to, w, h);
    const jumpHeight = Math.sin(Math.PI * ease) * Math.min(72, h * 0.10) * (game.jumpAnim.stepCount === 2 ? 1.14 : 1);
    return {
      x: lerp(from.x, to.x, ease),
      y: lerp(from.y, to.y, ease) - jumpHeight,
      rowGap: from.rowGap,
    };
  }

  function currentBeetlePos(w, h, now) {
    if (!game.beetleHop) return fieldWorld(game.beetleIndex, w, h);
    const t = Math.min(1, (now - game.beetleHop.start) / game.beetleHop.duration);
    const ease = easeOutCubic(t);
    const from = fieldWorld(game.beetleHop.from, w, h);
    const to = fieldWorld(game.beetleHop.to, w, h);
    const hopHeight = Math.sin(Math.PI * ease) * Math.min(38, h * 0.055);
    return {
      x: lerp(from.x, to.x, ease),
      y: lerp(from.y, to.y, ease) - hopHeight,
      rowGap: from.rowGap,
    };
  }

  function addParticles(index, colors) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const pos = fieldWorld(index, w, h);
    const colorList = Array.isArray(colors) ? colors : [colors];
    for (let i = 0; i < 14; i += 1) {
      const color = colorList[i % colorList.length];
      game.particles.push({
        x: pos.x / w,
        y: (pos.y - game.camera) / h,
        vx: (Math.random() - 0.5) * 0.26,
        vy: (Math.random() - 0.85) * 0.24,
        age: 0,
        life: 0.42 + Math.random() * 0.34,
        size: 3 + Math.random() * 6,
        color,
      });
    }
  }

  function applyFieldEffect(index) {
    const field = game.fields[index];
    if (!field || field.visited || index === 0) return;
    field.visited = true;
    if (!['slime','rotten','cloud'].includes(field.type)) window.SinnesScore?.addPoints('game_duftgarten', 20, 1000);
    const now = performance.now();
    if (field.type === 'cloud' || field.type === 'slime' || field.type === 'rotten') {
      game.obstacleHits = (game.obstacleHits || 0) + 1;
      window.SinnesScore?.addPoints('game_duftgarten', -50, 1000);
    }

    if (field.type === 'cloud') {
      game.stunUntil = Math.max(game.stunUntil, now + 2000);
      game.jumpLockUntil = Math.max(game.jumpLockUntil, now + 2000);
      setMessage('Gestankwolke: 2 Sekunden betäubt!', 2000);
      addParticles(index, ['#a6cc54', '#79963a', '#d7e78d']);
      return;
    }

    if (field.type === 'slime') {
      game.slowUntil = Math.max(game.slowUntil, now + 3000);
      setMessage('Klebrige Blüte: 3 Sekunden langsamer!', 1800);
      addParticles(index, ['#8cc64d', '#5a9a2f', '#d7e78d']);
      return;
    }

    if (field.type === 'rotten') {
      const backTo = Math.max(0, game.playerIndex - 1);
      game.rottenAnim = { start: now, duration: 1000, from: game.playerIndex, backTo };
      game.jumpLockUntil = Math.max(game.jumpLockUntil, now + 1100);
      setMessage('Vergammelte Blüte: Du wirst zurückgeworfen!', 1500);
      addParticles(index, ['#7d5638', '#b38666', '#4f3829']);
      return;
    }

    if (field.type === 'goal') {
      endGame(true);
    }
  }

  function startJumpTo(target, duration = 340, applyEffect = true, stepCount = 1) {
    const from = game.playerIndex;
    const to = Math.max(0, Math.min(TARGET_INDEX, target));
    game.jumpAnim = { from, to, start: performance.now(), duration, applyEffect, stepCount };
    game.jumpLockUntil = performance.now() + duration + 50;
  }

  function requestJump(count) {
    const now = performance.now();
    if (!game.running || game.jumpAnim || game.rottenAnim || now < game.stunUntil || now < game.jumpLockUntil) return;
    const slowMultiplier = now < game.slowUntil ? 1.5 : 1;
    const duration = (count === 2 ? 420 : 320) * slowMultiplier;
    startJumpTo(game.playerIndex + count, duration, true, count);
    updateHud(now);
  }

  function updateBeetle(now) {
    if (now < game.beetleStartAt) return;

    // Der Käfer soll den Ritter nie weit abhängen lassen:
    // ab mehr als 5 Feldern Abstand schaltet er in einen sehr schnellen Aufholmodus.
    const distance = game.playerIndex - game.beetleIndex;
    if (distance > 5 && game.beetleNextStepAt > now + BEETLE_CATCHUP_STEP_MS) {
      game.beetleNextStepAt = now + BEETLE_CATCHUP_STEP_MS;
    }

    while (now >= game.beetleNextStepAt && game.running) {
      const from = game.beetleIndex;
      const to = Math.min(game.playerIndex, from + 1);
      game.beetleIndex = to;
      game.beetleHop = { from, to, start: game.beetleNextStepAt, duration: BEETLE_HOP_MS };

      const nextDistance = game.playerIndex - game.beetleIndex;
      const interval = nextDistance > 5 ? BEETLE_CATCHUP_STEP_MS : BEETLE_STEP_MS;
      game.beetleNextStepAt += interval;

      if (game.beetleIndex >= game.playerIndex) break;
    }

    if (game.beetleHop && now >= game.beetleHop.start + game.beetleHop.duration) {
      game.beetleHop = null;
    }
  }

  function update(dt, now) {
    if (game.message && now > game.messageUntil) {
      game.message = '';
    }

    if (game.jumpAnim) {
      const t = (now - game.jumpAnim.start) / game.jumpAnim.duration;
      if (t >= 1) {
        const to = game.jumpAnim.to;
        const shouldApply = game.jumpAnim.applyEffect;
        game.playerIndex = to;
        game.jumpAnim = null;
        if (shouldApply) applyFieldEffect(to);
      }
    }

    if (game.rottenAnim) {
      const t = (now - game.rottenAnim.start) / game.rottenAnim.duration;
      if (t >= 1) {
        game.playerIndex = game.rottenAnim.backTo;
        game.rottenAnim = null;
        game.jumpLockUntil = now + 180;
        addParticles(game.playerIndex, ['#f0d5a8', '#8f6a3f']);
      }
    }

    updateBeetle(now);

    if (Math.floor(game.beetleIndex) >= game.playerIndex && !game.finished) {
      endGame(false);
      return;
    }

    game.particles.forEach((p) => {
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    });
    for (let i = game.particles.length - 1; i >= 0; i -= 1) {
      if (game.particles[i].age >= game.particles[i].life) game.particles.splice(i, 1);
    }

    updateHud(now);
  }

  function drawCoverImage(img, x, y, w, h) {
    if (!img.complete || !img.naturalWidth) return false;
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    return true;
  }

  function drawSprite(img, x, y, w, h) {
    if (!img.complete || !img.naturalWidth) return;
    ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
  }

  function drawBackground(w, h) {
    if (!drawCoverImage(images.background, 0, 0, w, h)) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#82d07b');
      g.addColorStop(1, '#244f27');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.fillStyle = 'rgba(32, 82, 30, 0.18)';
    ctx.fillRect(0, 0, w, h);
  }

  function fieldImage(type) {
    switch (type) {
      case 'slime': return images.flowerSlime;
      case 'rotten': return images.flowerRotten;
      case 'cloud': return images.cloudStink;
      case 'goal': return images.flowerGold;
      case 'start':
      case 'normal':
      default: return images.flowerNormal;
    }
  }

  function drawField(field, x, y, size) {
    const img = fieldImage(field.type);
    ctx.save();
    ctx.translate(x, y);

    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(0, size * 0.30, size * 0.34, size * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    const scale = field.type === 'cloud' ? 1.00 : (field.type === 'goal' ? 1.18 : 1.08);
    drawSprite(img, 0, 0, size * scale, size * scale * (img.naturalHeight && img.naturalWidth ? img.naturalHeight / img.naturalWidth : 1));

    if (field.visited && field.type !== 'start') {
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.28, size * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawPathLine(x1, y1, x2, y2, width) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,.30)';
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.setLineDash([10, 12]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  function drawKnight(x, y, size, now) {
    ctx.save();
    ctx.translate(x, y + Math.sin(now / 120) * 1.5);
    ctx.shadowColor = 'rgba(0,0,0,.32)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 6;
    drawSprite(images.knight, 0, -size * 0.02, size, size * (images.knight.naturalHeight && images.knight.naturalWidth ? images.knight.naturalHeight / images.knight.naturalWidth : 1));
    ctx.restore();
  }

  function drawBeetle(x, y, size, now) {
    ctx.save();
    ctx.translate(x, y + Math.sin(now / 140) * 1.2);
    ctx.shadowColor = 'rgba(0,0,0,.28)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 5;
    drawSprite(images.beetle, 0, 0, size, size * (images.beetle.naturalHeight && images.beetle.naturalWidth ? images.beetle.naturalHeight / images.beetle.naturalWidth : 1));
    ctx.restore();
  }

  function drawParticles(w, h) {
    for (const p of game.particles) {
      const a = 1 - p.age / p.life;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, p.size * a, 0, Math.PI * 2);
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

    const playerPos = currentPlayerPos(w, h, now);
    const desiredCamera = playerPos.y - h * 0.57;
    game.camera += (desiredCamera - game.camera) * 0.10;

    const flowerSize = Math.min(100, Math.max(72, Math.min(w, h) * 0.18));

    for (let i = 0; i < game.fields.length; i += 1) {
      const pos = fieldWorld(i, w, h);
      const sy = pos.y - game.camera;
      if (sy < -140 || sy > h + 160) continue;
      if (i > 0) {
        const prev = fieldWorld(i - 1, w, h);
        drawPathLine(prev.x, prev.y - game.camera, pos.x, sy, 6);
      }
      drawField(game.fields[i], pos.x, sy, flowerSize);
    }

    const beetlePos = currentBeetlePos(w, h, now);
    const beetleY = beetlePos.y - game.camera;
    if (beetleY > -160 && beetleY < h + 180) drawBeetle(beetlePos.x, beetleY + flowerSize * 0.03, flowerSize * 0.60, now);

    let knightScale = 1;
    if (game.rottenAnim) {
      const t = Math.max(0, Math.min(1, (now - game.rottenAnim.start) / game.rottenAnim.duration));
      knightScale = Math.max(0, 1 - t);
    }
    if (knightScale > 0.02) {
      drawKnight(playerPos.x, playerPos.y - game.camera - flowerSize * 0.03, flowerSize * 0.70 * knightScale, now);
    }
    drawParticles(w, h);

    if (now < game.stunUntil && game.running) {
      ctx.save();
      ctx.fillStyle = 'rgba(111, 137, 55, .18)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff7c8';
      ctx.font = `900 ${Math.round(Math.min(30, w * 0.07))}px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Betäubt!', w / 2, h * 0.24);
      ctx.restore();
    }
  }

  function loop(now) {
    if (!game.running) { draw(); return; }
    const dt = Math.min(0.05, (now - game.lastTime) / 1000 || 0.016);
    game.lastTime = now;
    update(dt, now);
    draw();
    if (game.running) requestAnimationFrame(loop);
  }

  function addButtonPressFx(button) {
    button.classList.add('pressed');
    setTimeout(() => button.classList.remove('pressed'), 120);
  }

  jumpOne.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    addButtonPressFx(jumpOne);
    requestJump(1);
  }, { passive: false });

  jumpTwo.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    addButtonPressFx(jumpTwo);
    requestJump(2);
  }, { passive: false });

  window.addEventListener('keydown', (event) => {
    if (event.key === '1' || event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
      event.preventDefault();
      requestJump(1);
    }
    if (event.key === '2' || event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
      event.preventDefault();
      requestJump(2);
    }
  });

  window.addEventListener('resize', () => { resizeCanvas(); draw(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseMusic();
    else if (game.running) startMusic();
  });

  resizeCanvas();
  updateHud();
  showPopup('intro');
  draw();
})();
