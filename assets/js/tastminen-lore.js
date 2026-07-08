(() => {
  const STORAGE_VOLUME = 'sinnesmagie-volume';
  const STORAGE_LEVEL_PROGRESS = 'sinnesmagie-level-progress';
  const LANES = [0.23, 0.5, 0.77];
  const PLAYER_Y = 0.8;
  const MAX_HEARTS = 3;
  const RACE_SECONDS = 10;
  const BUILD_SECONDS = 20;
  const TOTAL_SECTIONS = 3;

  const canvas = document.getElementById('mineCanvas');
  const ctx = canvas.getContext('2d', { alpha: true });
  const overlay = document.getElementById('mineOverlay');
  const popup = document.getElementById('minePopup');
  const timerText = document.getElementById('mineTimerText');
  const progressFill = document.getElementById('mineProgressFill');
  const heartsText = document.getElementById('mineHearts');
  const musicElement = document.getElementById('mineMusic');
  const bridgeOverlay = document.getElementById('bridgeOverlay');
  const bridgeRecipeText = document.getElementById('bridgeRecipeText');
  const bridgeTimer = document.getElementById('bridgeTimer');
  const bridgeSlots = document.getElementById('bridgeSlots');
  const bridgeMaterials = document.getElementById('bridgeMaterials');
  const bridgeBuildButton = document.getElementById('bridgeBuildButton');
  const musicLoop = window.createCrossfadeLoop ? window.createCrossfadeLoop(musicElement, { fadeSeconds: 0.025 }) : null;

  const images = {
    background: new Image(),
    cart: new Image(),
  };
  images.background.src = '../assets/images/minigame/mine_chasm_bg.png';
  images.cart.src = '../assets/images/minigame/cart_normal.png';

  const materials = [
    { id: 'stein', label: 'Stein', kind: 'hart', color: '#b9aea1' },
    { id: 'metall', label: 'Metall', kind: 'hart', color: '#bcc7d6' },
    { id: 'holz', label: 'Holz', kind: 'hart', color: '#c58b48' },
    { id: 'seil', label: 'Seil', kind: 'weich', color: '#d5b06b' },
    { id: 'lehm', label: 'Lehm', kind: 'weich', color: '#b9794c' },
    { id: 'gras', label: 'Gras', kind: 'weich', color: '#8bc45a' },
    { id: 'heu', label: 'Heu', kind: 'weich', color: '#dfca65' },
    { id: 'moos', label: 'Moos', kind: 'weich', color: '#79a35b' },
  ];

  const bridgeRecipes = [
    ['stein', 'holz', 'metall'],
    ['holz', 'seil', 'stein'],
    ['metall', 'holz', 'seil'],
    ['stein', 'lehm', 'holz'],
    ['metall', 'stein', 'seil'],
    ['holz', 'holz', 'seil'],
  ];

  const game = {
    running: false,
    finished: false,
    state: 'idle',
    section: 1,
    hearts: MAX_HEARTS,
    stateStart: 0,
    lastTime: 0,
    lane: 1,
    targetLane: 1,
    playerX: LANES[1],
    railOffset: 0,
    gaps: [],
    spawnTimer: 0,
    bridgeVisible: false,
    bridgeResolved: false,
    bridgeDeadline: 0,
    bridgeRecipe: [],
    slotValues: [null, null, null],
    chipCounter: 0,
    activeDrag: null,
    invulnerableUntil: 0,
    blinkUntil: 0,
    crashAnim: null,
    message: '',
    messageUntil: 0,
    lastHudAt: 0,
    lastHudText: '',
    lastHudProgress: -1,
    lastHudHearts: '',
    lastLaneInputAt: 0,
  };

  function currentVolume() {
    const saved = Number(localStorage.getItem(STORAGE_VOLUME));
    return Number.isFinite(saved) ? Math.min(1, Math.max(0, saved)) : 0.5;
  }

  function startMusic() {
    if (!musicElement) return;
    const volume = currentVolume() * 0.72;
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

  function showPopup(type) {
    overlay.classList.remove('hidden');
    bridgeOverlay.classList.add('hidden');

    if (type === 'intro') {
      popup.innerHTML = `
        <div>
          <h1>Schienenbruch</h1>
          <p>Fahre mit der Lore durch die Tastminen und weiche Lücken in den Schienen aus.</p>
          <p>Nach jedem Abschnitt stoppt die Lore vor einer Schlucht. Ziehe die richtigen Materialien in den Baukasten und baue rechtzeitig eine Brücke.</p>
          <p class="small-note">Steuerung: Pfeiltasten, A/D oder Wischen. In der Bauphase: Materialien ziehen.</p>
          <div class="mine-popup-actions">
            <button id="startMineGame" class="mine-button" type="button">Starten</button>
            <button id="leaveMineGame" class="mine-button secondary" type="button">Zurück</button>
          </div>
        </div>`;
      document.getElementById('startMineGame').addEventListener('click', startGame);
      document.getElementById('leaveMineGame').addEventListener('click', () => { window.location.href = 'tastminen.html'; });
      return;
    }

    if (type === 'won') {
      popup.innerHTML = `
        <div>
          <h2>Geschafft!</h2>
          <p>Du hast alle Schienenbrüche überwunden und die Brücken rechtzeitig gebaut.</p>
          <p>Level 1 in den Tastminen ist abgeschlossen.</p>
          <div class="mine-popup-actions">
            <button id="returnToMine" class="mine-button" type="button">Zurück zu den Tastminen</button>
          </div>
        </div>`;
      document.getElementById('returnToMine').addEventListener('click', () => { window.location.href = 'tastminen.html'; });
      return;
    }

    popup.innerHTML = `
      <div>
        <h2>Abgestürzt!</h2>
        <p>Die Lore ist zu oft in die Schienenlücken geraten.</p>
        <p class="small-note">Wechsle früher die Spur und baue die Brücken zügig.</p>
        <div class="mine-popup-actions">
          <button id="retryMineGame" class="mine-button" type="button">Nochmal spielen</button>
          <button id="returnToMine" class="mine-button secondary" type="button">Zurück</button>
        </div>
      </div>`;
    document.getElementById('retryMineGame').addEventListener('click', startGame);
    document.getElementById('returnToMine').addEventListener('click', () => { window.location.href = 'tastminen.html'; });
  }

  function hidePopup() {
    overlay.classList.add('hidden');
  }

  function resetState() {
    const now = performance.now();
    game.running = true;
    game.finished = false;
    game.state = 'race';
    game.section = 1;
    game.hearts = MAX_HEARTS;
    game.stateStart = now;
    game.lastTime = now;
    game.lane = 1;
    game.targetLane = 1;
    game.playerX = LANES[1];
    game.railOffset = 0;
    game.gaps = [];
    game.spawnTimer = 0.75;
    game.bridgeVisible = false;
    game.bridgeResolved = false;
    game.bridgeDeadline = 0;
    game.bridgeRecipe = [];
    game.slotValues = [null, null, null];
    game.chipCounter = 0;
    game.activeDrag = null;
    game.invulnerableUntil = 0;
    game.blinkUntil = 0;
    game.crashAnim = null;
    game.message = '';
    game.messageUntil = 0;
    game.lastHudAt = 0;
    game.lastHudText = '';
    game.lastHudProgress = -1;
    game.lastHudHearts = '';
  }

  function startGame() {
    resetState();
    hidePopup();
    bridgeOverlay.classList.add('hidden');
    updateHud(true);
    startMusic();
    requestAnimationFrame(loop);
  }

  function endGame(won) {
    if (game.finished) return;
    game.running = false;
    game.finished = true;
    pauseMusic();
    bridgeOverlay.classList.add('hidden');
    if (won) completeMineLevelOne();
    setTimeout(() => showPopup(won ? 'won' : 'lost'), 420);
  }

  function setMessage(text, ms = 1200) {
    game.message = text;
    game.messageUntil = performance.now() + ms;
  }

  function updateHud(force = false) {
    const now = performance.now();
    if (!force && now - game.lastHudAt < 160) return;
    game.lastHudAt = now;

    let label = '';
    let progress = 0;
    if (game.state === 'race') {
      const raceElapsed = Math.min(RACE_SECONDS, (now - game.stateStart) / 1000);
      const left = Math.max(0, Math.ceil(RACE_SECONDS - raceElapsed));
      label = game.message || `Abschnitt ${game.section}/${TOTAL_SECTIONS}: ${left} s bis zur Schlucht`;
      progress = ((game.section - 1) + raceElapsed / RACE_SECONDS) / TOTAL_SECTIONS;
    } else if (game.state === 'build') {
      const left = Math.max(0, Math.ceil((game.bridgeDeadline - now) / 1000));
      label = game.message || `Brückenbau ${game.section}/${TOTAL_SECTIONS}: ${left} s`;
      progress = ((game.section - 1) + 0.5) / TOTAL_SECTIONS;
    } else if (game.state === 'crash') {
      label = game.message || 'Lore wird wieder eingesetzt …';
      progress = (game.section - 1) / TOTAL_SECTIONS;
    } else {
      label = game.message || 'Tastminen';
      progress = 0;
    }

    if (game.message && now > game.messageUntil) game.message = '';

    const progressValue = Math.round(Math.min(100, Math.max(0, progress * 100)));
    const heartsValue = `${game.hearts > 0 ? '♥'.repeat(game.hearts) : ''}${game.hearts < MAX_HEARTS ? '♡'.repeat(MAX_HEARTS - game.hearts) : ''}`;

    if (label !== game.lastHudText) {
      timerText.textContent = label;
      game.lastHudText = label;
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
    if (!game.running || game.state !== 'race') return;
    const now = performance.now();
    if (now - game.lastLaneInputAt < 80) return;
    const next = Math.max(0, Math.min(LANES.length - 1, game.targetLane + direction));
    if (next !== game.targetLane) {
      game.targetLane = next;
      game.lastLaneInputAt = now;
    }
  }

  function laneWorldX(lane, y) {
    // Exakt parallele Bahnen: keine perspektivische Verjüngung, damit die Darstellung stabil bleibt.
    return LANES[lane];
  }

  function spawnRailGap() {
    const count = Math.random() < 0.28 ? 2 : 1;
    const lanes = [0, 1, 2];
    for (let i = lanes.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [lanes[i], lanes[j]] = [lanes[j], lanes[i]];
    }
    for (const lane of lanes.slice(0, count)) {
      game.gaps.push({ lane, y: -0.22, length: 0.145, speed: 0.52 });
    }
  }

  function loseHeartAndRespawn(reason) {
    if (game.state !== 'race' && game.state !== 'build') return;
    const now = performance.now();
    if (now < game.invulnerableUntil && game.state === 'race') return;
    game.hearts -= 1;
    game.invulnerableUntil = now + 1300;
    game.blinkUntil = now + 1350;
    game.crashAnim = { start: now, duration: 900, kind: reason };
    game.state = 'crash';
    game.message = reason === 'bridge' ? 'Brücke nicht gebaut: 1 Leben verloren!' : 'Schienenlücke: 1 Leben verloren!';
    game.messageUntil = now + 1200;
    if (navigator.vibrate) navigator.vibrate([70, 35, 70]);
    bridgeOverlay.classList.add('hidden');
    updateHud(true);
    if (game.hearts <= 0) {
      setTimeout(() => endGame(false), 900);
    }
  }

  function finishCrashRecovery() {
    if (game.hearts <= 0) return;
    game.crashAnim = null;
    game.gaps = [];
    game.lane = Math.max(0, Math.min(2, game.targetLane));
    game.playerX = LANES[game.lane];
    game.spawnTimer = 0.85;
    game.state = 'race';
    game.stateStart = performance.now();
    setMessage('Weiter geht’s!', 850);
  }

  function startBridgePhase() {
    game.state = 'build';
    game.gaps = [];
    game.bridgeResolved = false;
    game.bridgeDeadline = performance.now() + BUILD_SECONDS * 1000;
    setupBridgePuzzle();
    bridgeOverlay.classList.remove('hidden');
    updateHud(true);
  }

  function materialById(id) {
    return materials.find((m) => m.id === id);
  }

  function shuffled(items) {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function setupBridgePuzzle() {
    bridgeSlots.innerHTML = '';
    bridgeMaterials.innerHTML = '';
    game.slotValues = [null, null, null];
    game.activeDrag = null;
    game.chipCounter = 0;

    game.bridgeRecipe = shuffled(bridgeRecipes)[0].slice();
    const recipeLabels = game.bridgeRecipe.map((id) => materialById(id).label).join(' + ');
    bridgeRecipeText.textContent = `Bauplan: ${recipeLabels}`;

    for (let i = 0; i < 3; i += 1) {
      const slot = document.createElement('div');
      slot.className = 'bridge-slot';
      slot.dataset.slot = String(i);
      slot.textContent = `Teil ${i + 1}`;
      bridgeSlots.appendChild(slot);
    }

    const chipIds = game.bridgeRecipe.slice();
    const distractors = shuffled(materials.map((m) => m.id).filter((id) => !game.bridgeRecipe.includes(id))).slice(0, 6);
    chipIds.push(...distractors);
    while (chipIds.length < 10) chipIds.push(shuffled(materials)[0].id);

    const placed = shuffled(chipIds).slice(0, 10);
    requestAnimationFrame(() => {
      const rect = bridgeMaterials.getBoundingClientRect();
      placed.forEach((id, index) => createChip(id, index, rect));
      updateBuildButton();
    });
  }

  function createChip(id, index, areaRect) {
    const mat = materialById(id);
    const chip = document.createElement('div');
    chip.className = 'material-chip';
    chip.dataset.material = id;
    chip.dataset.chipId = `chip-${game.chipCounter++}`;
    chip.dataset.slot = '';
    chip.innerHTML = `<span>${mat.label}</span>`;
    chip.style.background = `linear-gradient(145deg, ${mat.color}, #fff2bf)`;

    const chipSize = 80;
    const maxX = Math.max(10, areaRect.width - chipSize - 10);
    const maxY = Math.max(10, areaRect.height - chipSize - 10);
    const x = 12 + ((index * 67) % maxX);
    const y = 16 + ((index * 49 + Math.floor(index / 2) * 21) % maxY);
    chip.style.left = `${x}px`;
    chip.style.top = `${y}px`;

    chip.addEventListener('pointerdown', startChipDrag);
    bridgeMaterials.appendChild(chip);
  }

  function startChipDrag(event) {
    if (game.state !== 'build') return;
    event.preventDefault();
    const chip = event.currentTarget;
    chip.setPointerCapture(event.pointerId);
    chip.classList.add('dragging');
    const rect = chip.getBoundingClientRect();
    const parent = bridgeMaterials.getBoundingClientRect();
    game.activeDrag = {
      chip,
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      parentLeft: parent.left,
      parentTop: parent.top,
    };
    if (chip.dataset.slot !== '') {
      game.slotValues[Number(chip.dataset.slot)] = null;
      chip.dataset.slot = '';
      updateSlots();
    }
    chip.addEventListener('pointermove', moveChipDrag);
    chip.addEventListener('pointerup', endChipDrag, { once: true });
    chip.addEventListener('pointercancel', endChipDrag, { once: true });
  }

  function moveChipDrag(event) {
    if (!game.activeDrag) return;
    const drag = game.activeDrag;
    const parent = bridgeMaterials.getBoundingClientRect();
    const x = event.clientX - parent.left - drag.offsetX;
    const y = event.clientY - parent.top - drag.offsetY;
    drag.chip.style.left = `${x}px`;
    drag.chip.style.top = `${y}px`;
  }

  function endChipDrag(event) {
    if (!game.activeDrag) return;
    const drag = game.activeDrag;
    const chip = drag.chip;
    chip.classList.remove('dragging');
    chip.releasePointerCapture?.(drag.pointerId);
    chip.removeEventListener('pointermove', moveChipDrag);

    const chipRect = chip.getBoundingClientRect();
    const chipCenterX = chipRect.left + chipRect.width / 2;
    const chipCenterY = chipRect.top + chipRect.height / 2;
    let targetSlot = null;
    [...bridgeSlots.children].forEach((slot) => {
      const rect = slot.getBoundingClientRect();
      if (chipCenterX >= rect.left && chipCenterX <= rect.right && chipCenterY >= rect.top && chipCenterY <= rect.bottom) {
        targetSlot = Number(slot.dataset.slot);
      }
    });

    if (targetSlot !== null) {
      const oldChipId = game.slotValues[targetSlot];
      if (oldChipId && oldChipId !== chip.dataset.chipId) {
        const oldChip = bridgeMaterials.querySelector(`[data-chip-id="${oldChipId}"]`);
        if (oldChip) oldChip.dataset.slot = '';
      }
      game.slotValues[targetSlot] = chip.dataset.chipId;
      chip.dataset.slot = String(targetSlot);
      snapChipToSlot(chip, targetSlot);
    } else {
      constrainChipToMaterialArea(chip);
    }

    game.activeDrag = null;
    updateSlots();
    updateBuildButton();
  }

  function snapChipToSlot(chip, slotIndex) {
    const slot = bridgeSlots.children[slotIndex];
    const slotRect = slot.getBoundingClientRect();
    const parent = bridgeMaterials.getBoundingClientRect();
    const chipRect = chip.getBoundingClientRect();
    const left = slotRect.left + slotRect.width / 2 - parent.left - chipRect.width / 2;
    const top = slotRect.top + slotRect.height / 2 - parent.top - chipRect.height / 2;
    chip.style.left = `${left}px`;
    chip.style.top = `${top}px`;
  }

  function constrainChipToMaterialArea(chip) {
    const parent = bridgeMaterials.getBoundingClientRect();
    const rect = chip.getBoundingClientRect();
    const currentLeft = parseFloat(chip.style.left || '0');
    const currentTop = parseFloat(chip.style.top || '0');
    const maxLeft = parent.width - rect.width;
    const maxTop = parent.height - rect.height;
    chip.style.left = `${Math.max(0, Math.min(maxLeft, currentLeft))}px`;
    chip.style.top = `${Math.max(0, Math.min(maxTop, currentTop))}px`;
  }

  function updateSlots() {
    [...bridgeSlots.children].forEach((slot, index) => {
      const chipId = game.slotValues[index];
      if (!chipId) {
        slot.textContent = `Teil ${index + 1}`;
        return;
      }
      const chip = bridgeMaterials.querySelector(`[data-chip-id="${chipId}"]`);
      slot.textContent = chip ? chip.dataset.material : `Teil ${index + 1}`;
    });
  }

  function updateBuildButton() {
    bridgeBuildButton.disabled = game.slotValues.some((value) => !value);
  }

  function selectedMaterials() {
    return game.slotValues.map((chipId) => {
      const chip = bridgeMaterials.querySelector(`[data-chip-id="${chipId}"]`);
      return chip ? chip.dataset.material : null;
    }).filter(Boolean);
  }

  function recipeMatches(selected, recipe) {
    const a = selected.slice().sort().join('|');
    const b = recipe.slice().sort().join('|');
    return a === b;
  }

  function finishBridge(success) {
    if (game.bridgeResolved || game.state !== 'build') return;
    game.bridgeResolved = true;
    bridgeOverlay.classList.add('hidden');
    if (success) {
      setMessage('Brücke gebaut!', 1100);
      if (game.section >= TOTAL_SECTIONS) {
        endGame(true);
        return;
      }
      game.section += 1;
      game.state = 'race';
      game.stateStart = performance.now();
      game.gaps = [];
      game.spawnTimer = 1.0;
      updateHud(true);
      return;
    }
    loseHeartAndRespawn('bridge');
  }

  bridgeBuildButton.addEventListener('click', () => {
    if (bridgeBuildButton.disabled) return;
    const success = recipeMatches(selectedMaterials(), game.bridgeRecipe);
    finishBridge(success);
  });

  function update(dt, now) {
    if (game.message && now > game.messageUntil) game.message = '';

    if (game.state === 'race') {
      const raceElapsed = (now - game.stateStart) / 1000;
      game.railOffset += dt * 0.38;

      const targetX = LANES[game.targetLane];
      game.playerX += (targetX - game.playerX) * Math.min(1, dt * 11);
      if (Math.abs(game.playerX - targetX) < 0.006) game.lane = game.targetLane;

      game.spawnTimer -= dt;
      if (game.spawnTimer <= 0 && raceElapsed < RACE_SECONDS - 1.3) {
        spawnRailGap();
        game.spawnTimer = 1.0 + Math.random() * 0.45;
      }

      for (const gap of game.gaps) gap.y += gap.speed * dt;
      game.gaps = game.gaps.filter((gap) => gap.y < 1.25);
      checkGapCollision(now);

      if (raceElapsed >= RACE_SECONDS) startBridgePhase();
    } else if (game.state === 'build') {
      bridgeTimer.textContent = String(Math.max(0, Math.ceil((game.bridgeDeadline - now) / 1000)));
      if (now >= game.bridgeDeadline) finishBridge(false);
    } else if (game.state === 'crash') {
      if (game.crashAnim && now >= game.crashAnim.start + game.crashAnim.duration) finishCrashRecovery();
    }

    updateHud();
  }

  function checkGapCollision(now) {
    if (now < game.invulnerableUntil) return;
    const currentLane = Math.round(game.lane);
    for (const gap of game.gaps) {
      if (gap.lane !== currentLane) continue;
      if (Math.abs(gap.y - PLAYER_Y) < gap.length * 0.52) {
        loseHeartAndRespawn('rail');
        break;
      }
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
      g.addColorStop(0, '#132744');
      g.addColorStop(1, '#07101b');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    const vignette = ctx.createLinearGradient(0, 0, 0, h);
    vignette.addColorStop(0, 'rgba(0,0,0,0.18)');
    vignette.addColorStop(1, 'rgba(2,5,12,0.42)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  }

  function railPoint(lane, y, w, h) {
    return { x: laneWorldX(lane, y) * w, y: y * h };
  }

  function laneRailHalfWidth(y, w) {
    return Math.max(w * 0.0165, Math.min(w * 0.021, w * (0.018 + y * 0.0015)));
  }

  function drawRailSegment(lane, y1, y2, w, h) {
    const p1 = railPoint(lane, y1, w, h);
    const p2 = railPoint(lane, y2, w, h);
    const width1 = laneRailHalfWidth(y1, w);
    const width2 = laneRailHalfWidth(y2, w);
    drawRailLine(p1.x - width1, p1.y, p2.x - width2, p2.y);
    drawRailLine(p1.x + width1, p1.y, p2.x + width2, p2.y);
  }

  function drawRailLine(x1, y1, x2, y2) {
    ctx.save();
    ctx.strokeStyle = '#241710';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.strokeStyle = '#a46d33';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  }

  function drawRails(w, h) {
    for (let lane = 0; lane < LANES.length; lane += 1) {
      const laneGaps = game.gaps.filter((gap) => gap.lane === lane).map((gap) => [gap.y - gap.length / 2, gap.y + gap.length / 2]);
      if (game.state === 'build') laneGaps.push([0.45, 1.08]);
      laneGaps.sort((a, b) => a[0] - b[0]);

      let start = -0.08;
      for (const [gapStart, gapEnd] of laneGaps) {
        const end = Math.max(start, gapStart);
        if (end > start) drawRailSegment(lane, start, end, w, h);
        drawBrokenRailEnds(lane, gapStart, gapEnd, w, h);
        start = Math.max(start, gapEnd);
      }
      if (start < 1.08) drawRailSegment(lane, start, 1.08, w, h);
    }

    drawTies(w, h);
  }

  function drawBrokenRailEnds(lane, gapStart, gapEnd, w, h) {
    ctx.save();
    ctx.strokeStyle = '#f0b24a';
    ctx.lineWidth = 3;
    [gapStart, gapEnd].forEach((gy) => {
      if (gy < -0.05 || gy > 1.1) return;
      const p = railPoint(lane, gy, w, h);
      const half = laneRailHalfWidth(gy, w) + w * 0.01;
      ctx.beginPath();
      ctx.moveTo(p.x - half, p.y - 8);
      ctx.lineTo(p.x + half, p.y + 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(p.x - half, p.y + 8);
      ctx.lineTo(p.x + half, p.y - 8);
      ctx.stroke();
    });
    ctx.restore();
  }

  function tieIntersectsLaneGap(lane, y) {
    const tieHalf = 0.018;
    for (const gap of game.gaps) {
      if (gap.lane !== lane) continue;
      const start = gap.y - gap.length / 2;
      const end = gap.y + gap.length / 2;
      if (y >= start - tieHalf && y <= end + tieHalf) return true;
    }
    if (game.state === 'build' && y >= 0.45 - tieHalf && y <= 1.08 + tieHalf) return true;
    return false;
  }

  function drawSingleLaneTies(lane, w, h) {
    const spacing = 0.115;
    const offset = game.railOffset % spacing;
    for (let y = -0.14 + offset; y < 1.12; y += spacing) {
      if (tieIntersectsLaneGap(lane, y)) continue;
      const center = railPoint(lane, y, w, h);
      const halfWidth = laneRailHalfWidth(y, w);
      const overhang = Math.max(5, w * 0.008);
      const tieThickness = Math.max(5, Math.min(10, 6.5 + y * 1.2));
      ctx.strokeStyle = '#3a2113';
      ctx.lineWidth = tieThickness;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(center.x - halfWidth - overhang, center.y);
      ctx.lineTo(center.x + halfWidth + overhang, center.y);
      ctx.stroke();
      ctx.strokeStyle = '#8c5b2e';
      ctx.lineWidth = Math.max(2, tieThickness * 0.32);
      ctx.stroke();
    }
  }

  function drawTies(w, h) {
    ctx.save();
    for (let lane = 0; lane < LANES.length; lane += 1) {
      drawSingleLaneTies(lane, w, h);
    }
    ctx.restore();
  }

  function drawBigChasm(w, h) {
    if (game.state !== 'build') return;
    ctx.save();
    const y = h * 0.58;
    const grd = ctx.createRadialGradient(w / 2, y, 20, w / 2, y, w * 0.55);
    grd.addColorStop(0, 'rgba(0,0,0,0.85)');
    grd.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.ellipse(w / 2, y, w * 0.48, h * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d49b45';
    ctx.lineWidth = 5;
    ctx.setLineDash([16, 12]);
    ctx.beginPath();
    ctx.ellipse(w / 2, y, w * 0.44, h * 0.12, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawSprite(img, x, y, targetH) {
    if (!img.complete || !img.naturalWidth) return;
    const ratio = img.naturalWidth / img.naturalHeight;
    const dw = targetH * ratio;
    ctx.drawImage(img, x - dw / 2, y - targetH / 2, dw, targetH);
  }

  function drawMineCart(w, h, now) {
    let x = game.playerX * w;
    let y = PLAYER_Y * h;
    let scale = 1;
    let alpha = 1;

    if (game.crashAnim) {
      const t = Math.min(1, (now - game.crashAnim.start) / game.crashAnim.duration);
      if (t < 0.58) {
        y += h * 0.18 * t;
        scale = 1 - t * 0.92;
        alpha = 1 - t * 0.65;
      } else {
        const rt = (t - 0.58) / 0.42;
        y = PLAYER_Y * h - h * 0.04 * (1 - rt);
        scale = 0.36 + rt * 0.64;
        alpha = 0.2 + rt * 0.8;
      }
    } else if (now < game.blinkUntil && Math.floor(now / 90) % 2 === 0) {
      alpha = 0.38;
    }

    const targetSize = Math.min(w, h) * 0.25 * scale;
    const normalizedLaneOffset = Math.max(-1, Math.min(1, (0.5 - game.playerX) / (0.5 - LANES[0])));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(normalizedLaneOffset * Math.PI / 13);
    drawSprite(images.cart, 0, 0, targetSize);
    ctx.restore();
  }

  function draw() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const now = performance.now();
    ctx.clearRect(0, 0, w, h);
    drawBackground(w, h);
    drawRails(w, h);
    drawBigChasm(w, h);
    drawMineCart(w, h, now);
  }

  function loop(now) {
    if (!game.running) {
      draw();
      return;
    }
    const dt = Math.min(0.035, (now - game.lastTime) / 1000 || 0.016);
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
    if (game.state !== 'race') return;
    pointerStartX = event.clientX;
  }

  function handlePointerUp(event) {
    if (pointerStartX == null || game.state !== 'race') return;
    const dx = event.clientX - pointerStartX;
    pointerStartX = null;
    if (Math.abs(dx) > 35) {
      setLane(dx > 0 ? 1 : -1);
      return;
    }
    if (event.clientX < window.innerWidth * 0.45) setLane(-1);
    else if (event.clientX > window.innerWidth * 0.55) setLane(1);
  }

  window.addEventListener('resize', () => { resizeCanvas(); draw(); });
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
