(() => {
  const STORAGE_VOLUME = 'sinnesmagie-volume';
  const STORAGE_LEVEL_PROGRESS = 'sinnesmagie-level-progress';
  const FIELD_COUNT = 34;
  const PLAYER_START = 0;
  const TARGET_INDEX = FIELD_COUNT - 1;
  const MAX_LIVES = 3;

  const canvas = document.getElementById('duftHopCanvas');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('duftOverlay');
  const popup = document.getElementById('duftPopup');
  const statusText = document.getElementById('duftStatusText');
  const progressFill = document.getElementById('duftProgressFill');
  const livesText = document.getElementById('duftLives');
  const jumpOne = document.getElementById('jumpOne');
  const jumpTwo = document.getElementById('jumpTwo');
  const musicElement = document.getElementById('duftMusic');
  const musicLoop = window.createCrossfadeLoop ? window.createCrossfadeLoop(musicElement, { fadeSeconds: 0.15 }) : null;

  const images = {
    background: new Image(),
    knight: new Image(),
  };
  images.background.src = '../assets/images/level-backgrounds/duftgarten.png';
  images.knight.src = '../assets/images/characters/knight.png';

  const game = {
    running: false,
    finished: false,
    fields: [],
    playerIndex: PLAYER_START,
    beetleIndex: -4,
    lives: MAX_LIVES,
    lastTime: 0,
    beetleMeter: 0,
    beetleSpeed: 0.64,
    stunUntil: 0,
    jumpLockUntil: 0,
    jumpAnim: null,
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
    const volume = currentVolume() * 0.45;
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

  function completeLevelOne() {
    const progress = readProgress();
    progress.duftgarten = {
      level1Completed: true,
      level2Completed: !!progress.duftgarten?.level2Completed,
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

  function makeFields() {
    const types = new Array(FIELD_COUNT).fill('flower');
    // fest gesetzte Felder, damit 1/2-Feld-Entscheidungen sinnvoll und fair bleiben
    const swamp = [5, 12, 18, 25, 30];
    const gas = [4, 9, 15, 21, 28, 32];
    const bonus = [7, 14, 23, 29];
    swamp.forEach(i => { if (i > 0 && i < TARGET_INDEX) types[i] = 'swamp'; });
    gas.forEach(i => { if (i > 0 && i < TARGET_INDEX) types[i] = 'gas'; });
    bonus.forEach(i => { if (i > 0 && i < TARGET_INDEX) types[i] = 'bonus'; });
    types[0] = 'start';
    types[TARGET_INDEX] = 'goal';

    const columns = [0.22, 0.42, 0.61, 0.79];
    return types.map((type, index) => ({
      index,
      type,
      col: columns[(index * 2 + Math.floor(index / 3)) % columns.length] + (Math.sin(index * 1.7) * 0.025),
      visited: false,
    }));
  }

  function resetGame() {
    game.running = true;
    game.finished = false;
    game.fields = makeFields();
    game.playerIndex = PLAYER_START;
    game.beetleIndex = -4;
    game.lives = MAX_LIVES;
    game.lastTime = performance.now();
    game.beetleMeter = 0;
    game.beetleSpeed = 0.64;
    game.stunUntil = 0;
    game.jumpLockUntil = 0;
    game.jumpAnim = null;
    game.message = '';
    game.messageUntil = 0;
    game.camera = 0;
    game.particles = [];
    game.fields[0].visited = true;
    updateHud();
  }

  function showPopup(type) {
    overlay.classList.remove('hidden');
    jumpOne.disabled = true;
    jumpTwo.disabled = true;

    if (type === 'intro') {
      popup.innerHTML = `
        <div>
          <h1>Blütensprung</h1>
          <p>Der Ritter springt im Duftgarten von Blume zu Blume. Hinter ihm krabbelt ein Käfer heran.</p>
          <ul>
            <li><strong>1 Feld</strong> oder <strong>2 Felder</strong> springen.</li>
            <li><strong>Gestankwolke:</strong> 1 Sekunde betäubt.</li>
            <li><strong>Sumpf:</strong> wirft dich 1 Feld zurück.</li>
            <li><strong>Duftblume:</strong> bremst den Käfer kurz aus.</li>
          </ul>
          <p>Erreiche die große Duftblume, bevor der Käfer dich einholt.</p>
          <div class="duft-popup-actions">
            <button id="startDuftGame" class="duft-button" type="button">Starten</button>
            <button id="leaveDuftGame" class="duft-button secondary" type="button">Zurück</button>
          </div>
        </div>`;
      document.getElementById('startDuftGame').addEventListener('click', startGame);
      document.getElementById('leaveDuftGame').addEventListener('click', () => { window.location.href = 'duftgarten.html'; });
      return;
    }

    if (type === 'won') {
      popup.innerHTML = `
        <div>
          <h2>Geschafft!</h2>
          <p>Der Ritter hat die Duftblume erreicht und den Käfer abgehängt.</p>
          <p>Level 1 im Duftgarten ist abgeschlossen.</p>
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
        <p>Der Käfer hat den Ritter eingeholt.</p>
        <p>Entscheide schneller, ob 1 oder 2 Felder besser sind.</p>
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
    if (won) completeLevelOne();
    setTimeout(() => showPopup(won ? 'won' : 'lost'), 420);
  }

  function updateHud() {
    const progress = Math.max(0, Math.min(100, (game.playerIndex / TARGET_INDEX) * 100));
    progressFill.style.width = `${progress}%`;
    const dist = Math.max(0, Math.ceil(game.playerIndex - game.beetleIndex));
    statusText.textContent = game.message || `Abstand zum Käfer: ${dist} Felder`;
    livesText.textContent = '♥'.repeat(game.lives) + '♡'.repeat(MAX_LIVES - game.lives);
  }

  function fieldWorld(index, w, h) {
    const rowGap = Math.min(96, Math.max(66, h * 0.105));
    const bottom = h * 0.73;
    const field = game.fields[Math.max(0, Math.min(TARGET_INDEX, index))];
    return {
      x: field.col * w,
      y: bottom - index * rowGap,
      rowGap,
    };
  }

  function currentPlayerPos(w, h, now) {
    if (!game.jumpAnim) return fieldWorld(game.playerIndex, w, h);
    const t = Math.min(1, (now - game.jumpAnim.start) / game.jumpAnim.duration);
    const ease = 1 - Math.pow(1 - t, 3);
    const from = fieldWorld(game.jumpAnim.from, w, h);
    const to = fieldWorld(game.jumpAnim.to, w, h);
    const arc = Math.sin(Math.PI * ease) * Math.min(72, h * 0.09);
    return {
      x: from.x + (to.x - from.x) * ease,
      y: from.y + (to.y - from.y) * ease - arc,
      rowGap: from.rowGap,
    };
  }

  function setMessage(text, ms = 1200) {
    game.message = text;
    game.messageUntil = performance.now() + ms;
    updateHud();
  }

  function addParticles(index, color) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const pos = fieldWorld(index, w, h);
    for (let i = 0; i < 10; i += 1) {
      game.particles.push({
        x: pos.x / w,
        y: (pos.y - game.camera) / h,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.75) * 0.24,
        age: 0,
        life: 0.45 + Math.random() * 0.28,
        color,
      });
    }
  }

  function applyFieldEffect(index) {
    const field = game.fields[index];
    if (!field || field.visited || index === 0) return;
    field.visited = true;
    const now = performance.now();

    if (field.type === 'gas') {
      game.stunUntil = Math.max(game.stunUntil, now + 1000);
      game.jumpLockUntil = Math.max(game.jumpLockUntil, now + 1000);
      setMessage('Gestankwolke: 1 Sekunde betäubt!', 1000);
      addParticles(index, '#9bd65b');
      return;
    }

    if (field.type === 'swamp') {
      setMessage('Stinkender Sumpf: 1 Feld zurück!', 1200);
      addParticles(index, '#7b5b2a');
      setTimeout(() => {
        if (!game.running || game.jumpAnim) return;
        const backTo = Math.max(0, game.playerIndex - 1);
        startJumpTo(backTo, 300, false);
      }, 220);
      return;
    }

    if (field.type === 'bonus') {
      game.beetleIndex = Math.max(-4, game.beetleIndex - 1);
      game.beetleMeter = 0;
      setMessage('Duftblume: Käfer gebremst!', 1100);
      addParticles(index, '#e88adb');
      return;
    }

    if (field.type === 'goal') {
      endGame(true);
    }
  }

  function startJumpTo(target, duration = 360, applyEffect = true) {
    const from = game.playerIndex;
    const to = Math.max(0, Math.min(TARGET_INDEX, target));
    game.jumpAnim = { from, to, start: performance.now(), duration, applyEffect };
    game.jumpLockUntil = performance.now() + duration + 40;
  }

  function requestJump(count) {
    const now = performance.now();
    if (!game.running || game.jumpAnim || now < game.stunUntil || now < game.jumpLockUntil) return;
    startJumpTo(game.playerIndex + count);
  }

  function update(dt, now) {
    if (game.message && now > game.messageUntil) {
      game.message = '';
      updateHud();
    }

    if (game.jumpAnim) {
      const t = (now - game.jumpAnim.start) / game.jumpAnim.duration;
      if (t >= 1) {
        const to = game.jumpAnim.to;
        const shouldApply = game.jumpAnim.applyEffect;
        game.playerIndex = to;
        game.jumpAnim = null;
        if (shouldApply) applyFieldEffect(to);
        updateHud();
      }
    }

    game.beetleMeter += dt * game.beetleSpeed;
    if (game.beetleMeter >= 1) {
      const steps = Math.floor(game.beetleMeter);
      game.beetleMeter -= steps;
      game.beetleIndex += steps;
      // Käfer wird im späteren Spielverlauf langsam aggressiver
      game.beetleSpeed = Math.min(0.86, 0.64 + game.playerIndex * 0.007);
      updateHud();
    }

    if (game.beetleIndex >= game.playerIndex) {
      game.lives -= 1;
      game.beetleIndex = game.playerIndex - 4;
      game.beetleMeter = 0;
      setMessage('Der Käfer hat zugeschnappt!', 1100);
      updateHud();
      if (game.lives <= 0) endGame(false);
    }

    game.particles.forEach(p => {
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    });
    for (let i = game.particles.length - 1; i >= 0; i -= 1) {
      if (game.particles[i].age >= game.particles[i].life) game.particles.splice(i, 1);
    }
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
    if (!drawCoverImage(images.background, 0, 0, w, h)) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#63ba5f');
      g.addColorStop(1, '#244f27');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.fillStyle = 'rgba(32, 82, 30, 0.30)';
    ctx.fillRect(0, 0, w, h);
  }

  function drawField(field, x, y, r) {
    ctx.save();
    ctx.translate(x, y);
    const type = field.type;
    if (type === 'swamp') {
      ctx.fillStyle = '#6b5128';
      ctx.strokeStyle = '#382516';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.1, r * 0.72, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(132, 92, 43, .75)';
      ctx.beginPath(); ctx.arc(-r * 0.35, -r * 0.05, r * 0.18, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.35, r * 0.1, r * 0.14, 0, Math.PI * 2); ctx.fill();
    } else if (type === 'gas') {
      drawFlowerBase(r, '#b2d96b', '#6a9b36');
      ctx.fillStyle = 'rgba(92, 157, 54, .74)';
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.arc((i - 1) * r * 0.36, -r * (0.25 + i * 0.05), r * 0.32, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (type === 'bonus') {
      drawFlowerBase(r, '#ff9eea', '#f5df79');
      ctx.fillStyle = '#fff7ba';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.36, 0, Math.PI * 2); ctx.fill();
    } else if (type === 'goal') {
      drawFlowerBase(r * 1.18, '#fff2a1', '#f27abd');
      ctx.fillStyle = '#fff';
      ctx.font = `${Math.round(r * 0.75)}px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✦', 0, 0);
    } else {
      drawFlowerBase(r, '#f7f0fb', '#ff9fc5');
    }

    if (field.visited && type !== 'start') {
      ctx.globalAlpha = 0.34;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.88, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawFlowerBase(r, center, petal) {
    ctx.strokeStyle = 'rgba(44, 52, 24, .45)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i += 1) {
      const a = (Math.PI * 2 * i) / 8;
      ctx.fillStyle = petal;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.42, r * 0.36, r * 0.22, a, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = center;
    ctx.beginPath(); ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }

  function drawKnight(x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    ctx.shadowColor = 'rgba(0,0,0,.35)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 6;
    if (images.knight.complete && images.knight.naturalWidth) {
      const ratio = images.knight.naturalWidth / images.knight.naturalHeight;
      const h = size;
      const w = h * ratio;
      ctx.drawImage(images.knight, -w / 2, -h * 0.82, w, h);
    } else {
      ctx.fillStyle = '#d9d9d9';
      ctx.beginPath(); ctx.arc(0, -size * .42, size * .22, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d82324';
      ctx.fillRect(-size * .22, -size * .18, size * .44, size * .44);
    }
    ctx.restore();
  }

  function drawBeetle(x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#362116';
    ctx.strokeStyle = '#120b08';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(0, 0, size * .42, size * .32, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5a3521';
    ctx.beginPath(); ctx.arc(0, -size * .28, size * .24, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#120b08';
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath(); ctx.moveTo(-size * .28, i * size * .12); ctx.lineTo(-size * .56, i * size * .2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(size * .28, i * size * .12); ctx.lineTo(size * .56, i * size * .2); ctx.stroke();
    }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(-size * .08, -size * .34, size * .045, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(size * .08, -size * .34, size * .045, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawParticles(w, h) {
    for (const p of game.particles) {
      const a = 1 - p.age / p.life;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, Math.max(2, w * 0.008 * a), 0, Math.PI * 2);
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
    const desiredCamera = playerPos.y - h * 0.56;
    game.camera += (desiredCamera - game.camera) * 0.12;

    const r = Math.min(42, Math.max(28, Math.min(w, h) * 0.055));
    for (let i = 0; i < game.fields.length; i += 1) {
      const pos = fieldWorld(i, w, h);
      const sy = pos.y - game.camera;
      if (sy < -90 || sy > h + 120) continue;
      // Verbindungslinien
      if (i > 0) {
        const prev = fieldWorld(i - 1, w, h);
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,.42)';
        ctx.lineWidth = 6;
        ctx.setLineDash([12, 12]);
        ctx.beginPath(); ctx.moveTo(prev.x, prev.y - game.camera); ctx.lineTo(pos.x, sy); ctx.stroke();
        ctx.restore();
      }
      drawField(game.fields[i], pos.x, sy, r);
    }

    const beetleBase = fieldWorld(Math.max(0, Math.min(TARGET_INDEX, Math.floor(game.beetleIndex))), w, h);
    const beetleY = beetleBase.y - game.camera + (game.beetleIndex < 0 ? Math.abs(game.beetleIndex) * r * 0.7 : 0);
    if (beetleY > -90 && beetleY < h + 130) drawBeetle(beetleBase.x, beetleY + r * 0.2, r * 1.35);

    drawKnight(playerPos.x, playerPos.y - game.camera, r * 2.45);
    drawParticles(w, h);

    if (now < game.stunUntil && game.running) {
      ctx.save();
      ctx.fillStyle = 'rgba(84, 140, 54, .18)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff7c8';
      ctx.font = `900 ${Math.round(Math.min(30, w * 0.07))}px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Betäubt!', w / 2, h * 0.22);
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
    event.preventDefault(); addButtonPressFx(jumpOne); requestJump(1);
  }, { passive: false });
  jumpTwo.addEventListener('pointerdown', (event) => {
    event.preventDefault(); addButtonPressFx(jumpTwo); requestJump(2);
  }, { passive: false });

  window.addEventListener('keydown', (event) => {
    if (event.key === '1' || event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') { event.preventDefault(); requestJump(1); }
    if (event.key === '2' || event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') { event.preventDefault(); requestJump(2); }
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
