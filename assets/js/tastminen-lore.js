(() => {
  const STORAGE_VOLUME = 'sinnesmagie-volume';
  const STORAGE_LEVEL_PROGRESS = 'sinnesmagie-level-progress';
  const STORAGE_PENDING_NOTICE = 'sinnesmagie-pending-notice';
  const LANES = [0.23, 0.5, 0.77];
  const PLAYER_Y = 0.8;
  const MAX_HEARTS = 3;
  const RACE_SECONDS = 10;
  const BUILD_SECONDS = 20;
  const TOTAL_SECTIONS = 4;
  const FINAL_RACE_SECONDS = 10;
  const TOTAL_PROGRESS_UNITS = TOTAL_SECTIONS * 2 + 1;
  const RAIL_SPEED = 0.42;
  const BIG_GAP_LENGTH = 0.36;
  const BIG_GAP_INITIAL_CENTER = -0.26;
  const BIG_GAP_STOP_CENTER = 0.54;
  const BIG_GAP_APPROACH_SECONDS = 2.4;
  const BRIDGE_WAIT_MS = 1000;
  const RESPAWN_BLINK_MS = 2000;

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
  const musicLoop = null;

  const images = {
    background: new Image(),
    cart: new Image(),
  };
  images.background.src = '../assets/images/minigame/mine_chasm_bg.webp';
  images.cart.src = '../assets/images/minigame/cart_normal.png';

  const materials = [
    { id: 'stein', label: 'Backstein', emoji: '🧱', kind: 'hart', color: '#cfa28f' },
    { id: 'metall', label: 'Metallschiene', emoji: '🔩', kind: 'hart', color: '#bcc7d6' },
    { id: 'holz', label: 'Holzbrett', emoji: '🪵', kind: 'hart', color: '#c58b48' },
    { id: 'seil', label: 'Seil', emoji: '🪢', kind: 'weich', color: '#d5b06b' },
    { id: 'lehm', label: 'Lehmklumpen', emoji: '🟤', kind: 'weich', color: '#b9794c' },
    { id: 'gras', label: 'Grasbüschel', emoji: '🌿', kind: 'weich', color: '#8bc45a' },
    { id: 'heu', label: 'Heu', emoji: '🌾', kind: 'weich', color: '#dfca65' },
    { id: 'moos', label: 'Moos', emoji: '🍃', kind: 'weich', color: '#79a35b' },
    { id: 'papier', label: 'Papier', emoji: '📄', kind: 'weich', color: '#f2ead4' },
    { id: 'feder', label: 'Feder', emoji: '🪶', kind: 'weich', color: '#e7d3b4' },
    { id: 'schwamm', label: 'Schwamm', emoji: '🧽', kind: 'weich', color: '#edd16b' },
    { id: 'pilz', label: 'Pilz', emoji: '🍄', kind: 'weich', color: '#d79384' },
    { id: 'blatt', label: 'Blatt', emoji: '🍂', kind: 'weich', color: '#87b96b' },
    { id: 'wolle', label: 'Wolle', emoji: '☁️', kind: 'weich', color: '#efe6d4' },
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
    bridgeApproachStart: 0,
    bridgeWaitStart: 0,
    bridgeClosed: false,
    bridgeDriveStart: 0,
    bigGapCenter: BIG_GAP_INITIAL_CENTER,
    pendingCrashReason: '',
    finalPlatformCenter: -0.22,
    finalPlatformStopAt: 0,
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
      if (musicElement.ended) { try { musicElement.currentTime = 0; } catch {} }
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

  function completeMineLevelOne() {
    const progress = readProgress();
    progress.tastminen = {
      level1Completed: true,
      level2Completed: !!progress.tastminen?.level2Completed,
    };
    localStorage.setItem(STORAGE_LEVEL_PROGRESS, JSON.stringify(progress));
    writeMinigamePendingNotice('tastminen');
  }

  function miniGuideEmojiRow(emojis = []) {
    const tightClass = emojis.length >= 3 ? ' tight' : '';
    return `<span class="mini-guide-emoji-row${tightClass}">${emojis.map((emoji) => `<span class="mini-guide-emoji" data-emoji="${emoji}">${emoji}</span>`).join('')}</span>`;
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
          <div class="mini-guide-wrap">
            <p class="mini-guide-hint">Fahren, ausweichen, Brücken bauen.</p>
            <div class="mini-guide-slider" aria-label="Tastminen Anleitung">
              <article class="mini-guide-card">
                <div class="mini-guide-icon"><img src="../assets/images/minigame/cart_normal.png" alt="Lore"></div>
                <p class="mini-guide-title">Fahren</p>
                <p class="mini-guide-text">Wechsle die Spur bei Schienenlücken.</p>
              </article>
              <article class="mini-guide-card">
                <div class="mini-guide-icon">${miniGuideEmojiRow(['⬅️','➡️'])}</div>
                <p class="mini-guide-title">Steuern</p>
                <p class="mini-guide-text">Tippe links/rechts oder wische.</p>
              </article>
              <article class="mini-guide-card">
                <div class="mini-guide-icon">${miniGuideEmojiRow(['🧱','🪵','⛓️'])}</div>
                <p class="mini-guide-title">Brücke</p>
                <p class="mini-guide-text">Ziehe passende Materialien in die Felder.</p>
              </article>
              <article class="mini-guide-card">
                <div class="mini-guide-icon">${miniGuideEmojiRow(['🧽','🍄','🌿'])}</div>
                <p class="mini-guide-title">Ablenkung</p>
                <p class="mini-guide-text">Nicht alles eignet sich zum Bauen.</p>
              </article>
              <article class="mini-guide-card">
                <div class="mini-guide-icon">${miniGuideEmojiRow(['❤️','❤️','❤️'])}</div>
                <p class="mini-guide-title">Leben</p>
                <p class="mini-guide-text">Absturz oder falsche Brücke kostet ein Herz.</p>
              </article>
            </div>
          </div>
          <div class="mine-popup-actions">
            <button id="startMineGame" class="mine-button" type="button">Starten</button>
            <button id="leaveMineGame" class="mine-button secondary" type="button">Zurück</button>
          </div>
        </div>`;
      document.getElementById('startMineGame').addEventListener('click', startGame);
      document.getElementById('leaveMineGame').addEventListener('click', () => { window.location.href = 'tastminen.html?minigameAborted=1'; });
      return;
    }

    if (type === 'won') {
      popup.innerHTML = `
        <div>
          <h2>Geschafft!</h2>
          <div class="mini-guide-icon"><img src="../assets/images/minigame/cart_normal.png" alt="Lore"></div>
          <p>Alle Schienenbrüche überwunden.</p>
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
        <div class="mini-guide-icon">💥</div>
        <p>Wechsle früher die Spur.</p>
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
    game.scorePenalty = 0;
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
    game.bridgeApproachStart = 0;
    game.bridgeWaitStart = 0;
    game.bridgeClosed = false;
    game.bridgeDriveStart = 0;
    game.bigGapCenter = BIG_GAP_INITIAL_CENTER;
    game.pendingCrashReason = '';
    game.finalPlatformCenter = -0.22;
    game.finalPlatformStopAt = 0;
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
    window.SinnesScore?.startSession('game_tastminen', 1000, 1000);
    window.SinnesScore?.setGameplayActive(true);
    startMusic();
    requestAnimationFrame(loop);
  }

  function endGame(won) {
    if (game.finished) return;
    game.running = false;
    game.finished = true;
    pauseMusic();
    bridgeOverlay.classList.add('hidden');
    if (won) { completeMineLevelOne(); const score = Math.max(0, 1000 - (game.scorePenalty || 0)); window.SinnesScore?.setSession('game_tastminen', score, 1000); window.SinnesScore?.finishSession('game_tastminen', score, 1000); }
    if (!won) window.SinnesGameOver?.play?.();
    window.SinnesScore?.setGameplayActive(false);
    setTimeout(() => (!won && window.SinnesGameOver?.play?.(), showPopup(won ? 'won' : 'lost')), 420);
  }

  function setMessage(text, ms = 1200) {
    game.message = text;
    game.messageUntil = performance.now() + ms;
  }

  function updateHud(force = false) {
    const now = performance.now();
    if (!force && now - game.lastHudAt < 160) return;
    game.lastHudAt = now;

    let progress = 0;
    if (game.state === 'race') {
      const raceElapsed = Math.min(RACE_SECONDS, (now - game.stateStart) / 1000);
      progress = (((game.section - 1) * 2) + raceElapsed / RACE_SECONDS) / TOTAL_PROGRESS_UNITS;
    } else if (game.state === 'approachBridge') {
      const approachProgress = BIG_GAP_STOP_CENTER > BIG_GAP_INITIAL_CENTER
        ? Math.max(0, Math.min(1, (game.bigGapCenter - BIG_GAP_INITIAL_CENTER) / (BIG_GAP_STOP_CENTER - BIG_GAP_INITIAL_CENTER)))
        : 0;
      progress = (((game.section - 1) * 2) + 1 + approachProgress * 0.12) / TOTAL_PROGRESS_UNITS;
    } else if (game.state === 'build') {
      const buildElapsed = Math.max(0, Math.min(BUILD_SECONDS, (BUILD_SECONDS * 1000 - (game.bridgeDeadline - now)) / 1000));
      progress = (((game.section - 1) * 2) + 1 + buildElapsed / BUILD_SECONDS) / TOTAL_PROGRESS_UNITS;
    } else if (game.state === 'bridgeDrive' || game.state === 'bridgeFailDrive') {
      progress = (game.section * 2) / TOTAL_PROGRESS_UNITS;
    } else if (game.state === 'finalRace') {
      const raceElapsed = Math.min(FINAL_RACE_SECONDS, (now - game.stateStart) / 1000);
      progress = ((TOTAL_SECTIONS * 2) + raceElapsed / FINAL_RACE_SECONDS) / TOTAL_PROGRESS_UNITS;
    } else if (game.state === 'finalPlatform') {
      const platformProgress = Math.max(0, Math.min(1, (game.finalPlatformCenter + 0.22) / (PLAYER_Y + 0.22)));
      progress = ((TOTAL_SECTIONS * 2) + platformProgress) / TOTAL_PROGRESS_UNITS;
    } else if (game.state === 'crash' || game.state === 'respawnWait') {
      progress = Math.max(0, ((game.section - 1) * 2) / TOTAL_PROGRESS_UNITS);
    }

    const progressValue = Math.round(Math.min(100, Math.max(0, progress * 100)));
    const heartsValue = `${game.hearts > 0 ? '♥'.repeat(game.hearts) : ''}${game.hearts < MAX_HEARTS ? '♡'.repeat(MAX_HEARTS - game.hearts) : ''}`;

    if (progressValue !== game.lastHudProgress) {
      progressFill.style.width = `${progressValue}%`;
      game.lastHudProgress = progressValue;
    }
    if (heartsValue !== game.lastHudHearts) {
      heartsText.textContent = heartsValue;
      game.lastHudHearts = heartsValue;
    }
  }

  function canSteerNow() {
    if (!game.running) return false;
    if (['race', 'finalRace'].includes(game.state)) return true;
    if (game.state === 'approachBridge') {
      const remaining = Math.max(0, BIG_GAP_STOP_CENTER - game.bigGapCenter);
      return remaining > 0.105;
    }
    if (game.state === 'finalPlatform') {
      const remaining = Math.max(0, PLAYER_Y - game.finalPlatformCenter);
      return remaining > 0.10;
    }
    return false;
  }

  function setLane(direction) {
    if (!canSteerNow()) return;
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
      game.gaps.push({ lane, y: -0.22, length: 0.145, speed: RAIL_SPEED });
    }
  }

  function loseHeartAndRespawn(reason) {
    if (!['race', 'finalRace', 'build', 'approachBridge', 'bridgeFailDrive'].includes(game.state)) return;
    const now = performance.now();
    if (now < game.invulnerableUntil && ['race', 'finalRace'].includes(game.state)) return;
    game.hearts -= 1;
    game.scorePenalty = (game.scorePenalty || 0) + 250;
    window.SinnesScore?.setSession('game_tastminen', Math.max(0, 1000 - game.scorePenalty), 1000);
    game.pendingCrashReason = reason;
    game.invulnerableUntil = now + 2700;
    game.blinkUntil = 0;
    game.crashAnim = { start: now, duration: 720, kind: reason };
    game.state = 'crash';
    game.message = reason === 'bridge' ? 'Brücke nicht gebaut: 1 Leben verloren!' : 'Schienenlücke: 1 Leben verloren!';
    game.messageUntil = now + 1400;
    if (navigator.vibrate) navigator.vibrate([70, 35, 70]);
    bridgeOverlay.classList.add('hidden');
    updateHud(true);
    if (game.hearts <= 0) { window.SinnesGameOver?.play?.();
      setTimeout(() => endGame(false), 760);
    }
  }

  function finishCrashRecovery() {
    if (game.hearts <= 0) return;
    const now = performance.now();
    game.crashAnim = null;
    game.gaps = [];
    game.lane = Math.max(0, Math.min(2, game.targetLane));
    game.playerX = LANES[game.lane];
    game.spawnTimer = 0.95;
    game.state = 'respawnWait';
    game.blinkUntil = now + RESPAWN_BLINK_MS;
    game.bridgeWaitStart = now;
    setMessage('Lore wieder eingesetzt …', RESPAWN_BLINK_MS);
    updateHud(true);
  }

  function finishRespawnWait() {
    if (game.pendingCrashReason === 'railFinal') {
      startFinalRace();
      return;
    }
    if (game.pendingCrashReason === 'bridge') {
      if (game.section >= TOTAL_SECTIONS) {
        startFinalRace();
        return;
      }
      game.section += 1;
    }
    game.pendingCrashReason = '';
    game.state = 'race';
    game.stateStart = performance.now();
    game.gaps = [];
    game.spawnTimer = 1.0;
    game.blinkUntil = 0;
    setMessage('Weiter geht’s!', 850);
    updateHud(true);
  }

  function startFinalRace() {
    game.pendingCrashReason = '';
    game.state = 'finalRace';
    game.stateStart = performance.now();
    game.gaps = [];
    game.spawnTimer = 1.0;
    game.blinkUntil = 0;
    game.bridgeClosed = false;
    game.finalPlatformCenter = -0.22;
    game.finalPlatformStopAt = 0;
    setMessage('Letzte Strecke bis zum Ziel!', 1200);
    updateHud(true);
  }

  function startFinalPlatformApproach(now) {
    game.state = 'finalPlatform';
    game.stateStart = now;
    game.finalPlatformCenter = -0.22;
    game.finalPlatformStopAt = 0;
    game.targetLane = 1;
    setMessage('Zielplattform voraus!', 1100);
    updateHud(true);
  }

  function startBridgeApproach() {
    game.state = 'approachBridge';
    game.bridgeApproachStart = performance.now();
    game.bigGapCenter = BIG_GAP_INITIAL_CENTER;
    game.bridgeWaitStart = 0;
    game.bridgeClosed = false;
    setMessage('Große Lücke voraus!', 1000);
    updateHud(true);
  }

  function startBridgePhase() {
    game.state = 'build';
    game.gaps = game.gaps.filter((gap) => gap.y < 1.25);
    game.bridgeResolved = false;
    game.bridgeClosed = false;
    game.bigGapCenter = BIG_GAP_STOP_CENTER;
    game.bridgeDeadline = performance.now() + BUILD_SECONDS * 1000;
    setupBridgePuzzle();
    bridgeOverlay.classList.remove('hidden');
    updateHud(true);
  }

  function materialById(id) {
    return materials.find((m) => m.id === id);
  }

  function materialIconHtml(id, extraClass = '') {
    const mat = materialById(id);
    if (!mat) return '';
    return `<span class="material-icon emoji-material ${extraClass}" title="${mat.label}" aria-label="${mat.label}">${mat.emoji}</span>`;
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
    const recipeIcons = game.bridgeRecipe.map((id) => materialIconHtml(id, 'recipe-icon')).join('<span class="recipe-plus">+</span>');
    bridgeRecipeText.innerHTML = `Bauplan: ${recipeIcons}`;

    for (let i = 0; i < 3; i += 1) {
      const slot = document.createElement('div');
      slot.className = 'bridge-slot';
      slot.dataset.slot = String(i);
      slot.innerHTML = '<span class="slot-placeholder">?</span>';
      bridgeSlots.appendChild(slot);
    }

    const chipIds = game.bridgeRecipe.slice();
    const distractors = shuffled(materials.map((m) => m.id).filter((id) => !game.bridgeRecipe.includes(id))).slice(0, 9);
    chipIds.push(...distractors);
    while (chipIds.length < 13) chipIds.push(shuffled(materials)[0].id);

    const placed = shuffled(chipIds).slice(0, 13);
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
    chip.innerHTML = materialIconHtml(id, 'chip-icon');
    chip.style.background = `linear-gradient(145deg, ${mat.color}, #fff2bf)`;

    const chipSize = 70;
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
    if (!isBigGapVisible()) return;
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
        slot.innerHTML = '<span class="slot-placeholder">?</span>';
        return;
      }
      const chip = bridgeMaterials.querySelector(`[data-chip-id="${chipId}"]`);
      const mat = chip ? materialById(chip.dataset.material) : null;
      slot.innerHTML = mat ? materialIconHtml(chip.dataset.material, 'slot-icon') : '<span class="slot-placeholder">?</span>';
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
      game.bridgeClosed = true;
      game.bridgeDriveStart = performance.now();
      game.state = 'bridgeDrive';
      game.gaps = [];
      setMessage('Brücke gebaut!', 1200);
      updateHud(true);
      return;
    }
    game.bridgeClosed = false;
    game.bigGapCenter = BIG_GAP_STOP_CENTER;
    game.state = 'bridgeFailDrive';
    game.bridgeDriveStart = performance.now();
    setMessage('Die Brücke hält nicht!', 900);
    updateHud(true);
  }

  bridgeBuildButton.addEventListener('click', () => {
    if (bridgeBuildButton.disabled) return;
    const success = recipeMatches(selectedMaterials(), game.bridgeRecipe);
    finishBridge(success);
  });

  function update(dt, now) {
    if (game.message && now > game.messageUntil) game.message = '';

    if (game.state === 'race' || game.state === 'finalRace') {
      const isFinalRace = game.state === 'finalRace';
      const raceLimit = isFinalRace ? FINAL_RACE_SECONDS : RACE_SECONDS;
      const raceElapsed = (now - game.stateStart) / 1000;
      game.railOffset += dt * RAIL_SPEED;

      const targetX = LANES[game.targetLane];
      game.playerX += (targetX - game.playerX) * Math.min(1, dt * 11);
      if (Math.abs(game.playerX - targetX) < 0.006) game.lane = game.targetLane;

      game.spawnTimer -= dt;
      if (game.spawnTimer <= 0 && raceElapsed < raceLimit - 1.3) {
        spawnRailGap();
        game.spawnTimer = 1.0 + Math.random() * 0.45;
      }

      for (const gap of game.gaps) gap.y += RAIL_SPEED * dt;
      game.gaps = game.gaps.filter((gap) => gap.y < 1.25);
      checkGapCollision(now);

      if (raceElapsed >= raceLimit) {
        const unresolvedGapAhead = game.gaps.some((gap) => {
          const gapRear = gap.y - gap.length / 2;
          return gapRear < PLAYER_Y + 0.08;
        });
        if (!unresolvedGapAhead) {
          if (isFinalRace) startFinalPlatformApproach(now);
          else startBridgeApproach();
        }
      }
    } else if (game.state === 'approachBridge') {
      if (!game.bridgeWaitStart) {
        const remaining = Math.max(0, BIG_GAP_STOP_CENTER - game.bigGapCenter);
        const slowZone = 0.20;
        const visualSpeed = remaining > slowZone ? RAIL_SPEED : Math.max(0.035, RAIL_SPEED * (remaining / slowZone));
        const step = Math.min(remaining, visualSpeed * dt);
        game.bigGapCenter += step;
        game.railOffset += step;
        for (const gap of game.gaps) gap.y += step;
        game.gaps = game.gaps.filter((gap) => gap.y < 1.25);
        if (game.bigGapCenter >= BIG_GAP_STOP_CENTER - 0.0001) {
          game.bigGapCenter = BIG_GAP_STOP_CENTER;
          game.bridgeWaitStart = now;
          setMessage('Stopp vor der Lücke …', 1000);
        }
      }
      if (game.bridgeWaitStart && now - game.bridgeWaitStart >= BRIDGE_WAIT_MS) startBridgePhase();
    } else if (game.state === 'build') {
      bridgeTimer.textContent = String(Math.max(0, Math.ceil((game.bridgeDeadline - now) / 1000)));
      if (now >= game.bridgeDeadline) finishBridge(false);
    } else if (game.state === 'bridgeDrive') {
      game.railOffset += dt * RAIL_SPEED;
      if (now - game.bridgeDriveStart >= 1250) {
        if (game.section >= TOTAL_SECTIONS) {
          startFinalRace();
          return;
        }
        game.section += 1;
        game.bridgeClosed = false;
        game.state = 'race';
        game.stateStart = now;
        game.gaps = [];
        game.spawnTimer = 1.0;
        updateHud(true);
      }
    } else if (game.state === 'bridgeFailDrive') {
      const step = RAIL_SPEED * dt;
      game.railOffset += step;
      game.bigGapCenter += step;
      const [gapStart, gapEnd] = currentBigGapRange();
      if (PLAYER_Y >= gapStart && PLAYER_Y <= gapEnd) loseHeartAndRespawn('bridge');
    } else if (game.state === 'finalPlatform') {
      const remaining = Math.max(0, PLAYER_Y - game.finalPlatformCenter);
      const slowZone = 0.22;
      const visualSpeed = remaining > slowZone ? RAIL_SPEED : Math.max(0.025, RAIL_SPEED * (remaining / slowZone));
      const step = Math.min(remaining, visualSpeed * dt);
      game.finalPlatformCenter += step;
      game.railOffset += step;
      for (const gap of game.gaps) gap.y += step;
      game.gaps = game.gaps.filter((gap) => gap.y < 1.25);
      const targetX = LANES[1];
      game.playerX += (targetX - game.playerX) * Math.min(1, dt * 6);
      if (remaining <= 0.003) {
        if (!game.finalPlatformStopAt) game.finalPlatformStopAt = now;
        if (now - game.finalPlatformStopAt >= 900) endGame(true);
      }
    } else if (game.state === 'crash') {
      if (game.crashAnim && now >= game.crashAnim.start + game.crashAnim.duration) finishCrashRecovery();
    } else if (game.state === 'respawnWait') {
      if (now >= game.blinkUntil) finishRespawnWait();
    }

    updateHud();
  }

  function checkGapCollision(now) {
    if (now < game.invulnerableUntil) return;
    const currentLane = Math.round(game.lane);
    for (const gap of game.gaps) {
      if (gap.lane !== currentLane) continue;
      const gapStart = gap.y - gap.length / 2;
      const gapEnd = gap.y + gap.length / 2;
      // Erst abstürzen, wenn die Mitte der Lore wirklich in der Lücke liegt.
      if (PLAYER_Y >= gapStart && PLAYER_Y <= gapEnd) {
        loseHeartAndRespawn(game.state === 'finalRace' ? 'railFinal' : 'rail');
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
    // Breiter als vorher: Die Schienenbahn entspricht optisch eher der Lorebreite.
    return Math.max(w * 0.027, Math.min(w * 0.036, w * (0.031 + y * 0.0015)));
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

  function isBigGapVisible() {
    if (game.bridgeClosed) return false;
    return game.state === 'approachBridge'
      || game.state === 'build'
      || game.state === 'bridgeFailDrive'
      || (game.state === 'crash' && game.pendingCrashReason === 'bridge');
  }

  function currentBigGapRange() {
    const center = game.bigGapCenter || BIG_GAP_STOP_CENTER;
    return [center - BIG_GAP_LENGTH / 2, center + BIG_GAP_LENGTH / 2];
  }

  function drawRails(w, h) {
    for (let lane = 0; lane < LANES.length; lane += 1) {
      const laneGaps = game.gaps.filter((gap) => gap.lane === lane).map((gap) => [gap.y - gap.length / 2, gap.y + gap.length / 2]);
      if (isBigGapVisible()) laneGaps.push(currentBigGapRange());
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
    if (isBigGapVisible()) {
      const [bigStart, bigEnd] = currentBigGapRange();
      if (y >= bigStart - tieHalf && y <= bigEnd + tieHalf) return true;
    }
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
    // Die große Schlucht wird grafisch durch fehlende Schienen und gebrochene Schienenenden gezeigt.
    // Keine zusätzliche schwarze Fläche, damit der normale Minenboden sichtbar bleibt.
  }

  function drawFinalPlatform(w, h) {
    if (game.state !== 'finalPlatform') return;
    const y = game.finalPlatformCenter * h;
    const platformW = w * 0.62;
    const platformH = Math.max(70, h * 0.11);
    ctx.save();
    ctx.translate(w / 2, y);
    ctx.fillStyle = 'rgba(35, 24, 16, 0.34)';
    ctx.beginPath();
    ctx.ellipse(0, platformH * 0.35, platformW * 0.54, platformH * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8a5a2b';
    ctx.strokeStyle = '#2a180d';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.rect(-platformW / 2, -platformH / 2, platformW, platformH);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#c5904b';
    for (let i = -2; i <= 2; i += 1) {
      ctx.fillRect(i * platformW * 0.18 - 8, -platformH / 2 + 8, 16, platformH - 16);
    }
    ctx.fillStyle = '#ffe28a';
    ctx.font = `900 ${Math.round(Math.min(30, w * 0.06))}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ZIEL', 0, 0);
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
      y += h * 0.16 * t;
      scale = Math.max(0.02, 1 - t);
      alpha = Math.max(0, 1 - t * 1.15);
    } else if (now < game.blinkUntil && Math.floor(now / 120) % 2 === 0) {
      alpha = 0.32;
    }

    const targetSize = Math.min(w, h) * 0.25 * scale;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
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
    drawFinalPlatform(w, h);
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
    if (!canSteerNow()) return;
    pointerStartX = event.clientX;
  }

  function handlePointerUp(event) {
    if (pointerStartX == null || !canSteerNow()) return;
    const dx = event.clientX - pointerStartX;
    pointerStartX = null;
    if (Math.abs(dx) > 35) {
      setLane(dx > 0 ? 1 : -1);
      return;
    }
    if (event.clientX < window.innerWidth * 0.45) setLane(-1);
    else if (event.clientX > window.innerWidth * 0.55) setLane(1);
  }


  if (musicElement) {
    musicElement.loop = true;
    musicElement.addEventListener('ended', () => {
      if (!game.running) return;
      try { musicElement.currentTime = 0; } catch {}
      musicElement.play().catch(() => {});
    });
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
