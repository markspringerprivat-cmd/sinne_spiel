const STORAGE_VOLUME = 'sinnesmagie-volume';
const STORAGE_LEVEL_PROGRESS = 'sinnesmagie-level-progress';
const STORAGE_LEVEL_NODE = 'sinnesmagie-level-node';
const OUTRO_PANEL_SECONDS = 10;
const OUTRO_STORY_SECONDS = 60;

const orbFrames = [
  '../assets/images/finale/orb_stage_1.png',
  '../assets/images/finale/orb_stage_2.png',
  '../assets/images/finale/orb_stage_3.png',
  '../assets/images/finale/orb_stage_4.png',
  '../assets/images/finale/orb_stage_5.png'
];

const hitTexts = [
  'Der Ritter betritt den Thronsaal. Vor ihm ruht die Glaskugel, in der die Magie der Sinne gefangen ist.',
  'Ein erster Schlag! Feine Risse laufen über die Glaskugel.',
  'Noch ein Treffer – die Kugel wird instabil und die Magie beginnt zu flackern.',
  'Die Hülle hält kaum noch stand. Ein letzter kräftiger Angriff wird sie sprengen.',
  'Die Glaskugel zerbricht! Die Magie der Sinne bricht mit gewaltiger Kraft hervor.'
];

const outroPanels = [
  {
    img: '../assets/images/finale/out_1.png',
    title: 'Die Magie ist frei',
    text: 'Mit dem letzten Schlag zersprang die Glaskugel. Wie ein leuchtender Regenbogen schoss die befreite Sinnesmagie aus dem finsteren Schloss und machte sich auf den Weg zurück.'
  },
  {
    img: '../assets/images/finale/out_2.png',
    title: 'Der Ritter kehrt zurück',
    text: 'Am Schlosstor lief die Prinzessin dem Ritter erleichtert entgegen. Sein Mut hatte das Königreich gerettet, und endlich konnten beide wieder hoffnungsvoll in die Zukunft blicken.'
  },
  {
    img: '../assets/images/finale/out_3.png',
    title: 'Die Magie erreicht das Königreich',
    text: 'Bunte Ströme zogen über Türme, Mauern und Höfe. Farben leuchteten wieder, vertraute Geräusche kehrten zurück und das ganze Königreich erwachte aus seiner stillen Dunkelheit.'
  },
  {
    img: '../assets/images/finale/out_4.png',
    title: 'Die Sinne erwachen',
    text: 'Blumen dufteten, Brot schmeckte frisch und Musik erfüllte die Luft. Die Menschen konnten wieder sehen, hören, riechen, schmecken und fühlen – und freuten sich über jeden Eindruck.'
  },
  {
    img: '../assets/images/finale/out_5.png',
    title: 'Ein gemeinsames Fest',
    text: 'Am Abend kamen alle an einem Tisch zusammen. Sie aßen, lachten und erzählten von ihrem Abenteuer. Aus Angst und Stille waren wieder Nähe, Freude und Gemeinschaft geworden.'
  },
  {
    img: '../assets/images/finale/out_6.png',
    title: 'Unsere Sinne begleiten und schützen uns',
    text: 'Unsere Sinne verbinden uns mit der Welt. Sie wecken Gefühle, weisen uns den Weg und warnen vor Rauch, Lärm, Hitze oder verdorbenem Essen. Wer aufmerksam sieht, hört, riecht, schmeckt und fühlt, lebt sicherer und bewusster.'
  }
];

const finaleShell = document.getElementById('castleFinaleShell');
const stage = document.getElementById('castleFinaleStage');
const knight = document.getElementById('castleFinaleKnight');
const orb = document.getElementById('castleFinaleOrb');
const caption = document.getElementById('castleFinaleCaption');
const attackButton = document.getElementById('castleFinaleAttack');
const hitSfx = document.getElementById('castleFinaleHitSfx');
const crashSfx = document.getElementById('castleFinaleCrashSfx');
const hopefulMusic = document.getElementById('castleHopefulMusic');

const outroOverlay = document.getElementById('castleOutroOverlay');
const outroImage = document.getElementById('castleOutroImage');
const outroTitle = document.getElementById('castleOutroTitle');
const outroText = document.getElementById('castleOutroText');
const outroCounter = document.getElementById('castleOutroCounter');
const outroProgress = document.getElementById('castleOutroProgress');
const outroStatus = document.getElementById('castleOutroStatus');
const outroMusicStart = document.getElementById('castleOutroMusicStart');
const outroFinish = document.getElementById('castleOutroFinish');

let orbIndex = 0;
let busy = true;
let finished = false;
let hopefulPrimed = false;
let outroStarted = false;
let outroPanelIndex = -1;
let outroRaf = null;

function currentVolume() {
  const saved = Number(localStorage.getItem(STORAGE_VOLUME));
  if (Number.isFinite(saved)) return Math.min(1, Math.max(0, saved));
  return 0.5;
}

function getProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_LEVEL_PROGRESS) || '{}');
  } catch {
    return {};
  }
}

function saveProgress(patch) {
  const progress = getProgress();
  const area = progress.zauberschloss || {};
  progress.zauberschloss = { ...area, ...patch };
  localStorage.setItem(STORAGE_LEVEL_PROGRESS, JSON.stringify(progress));
}

function saveFinalNode() {
  try {
    const nodes = JSON.parse(localStorage.getItem(STORAGE_LEVEL_NODE) || '{}');
    nodes.zauberschloss = 'level3';
    localStorage.setItem(STORAGE_LEVEL_NODE, JSON.stringify(nodes));
  } catch {
    localStorage.setItem(STORAGE_LEVEL_NODE, JSON.stringify({ zauberschloss: 'level3' }));
  }
}

function playAudio(audio) {
  if (!audio) return;
  try {
    audio.currentTime = 0;
    audio.volume = currentVolume();
    audio.play().catch(() => {});
  } catch {}
}

function setCaption(index) {
  caption.textContent = hitTexts[Math.max(0, Math.min(hitTexts.length - 1, index))];
}

function enterKnight() {
  setCaption(0);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => knight.classList.add('entered'));
  });
  window.setTimeout(() => {
    busy = false;
    attackButton.disabled = false;
  }, 1220);
}

function primeHopefulMusic() {
  if (!hopefulMusic || hopefulPrimed) return;
  try {
    hopefulMusic.pause();
    hopefulMusic.currentTime = 0;
    hopefulMusic.volume = 0;
    const playPromise = hopefulMusic.play();
    hopefulPrimed = true;
    playPromise?.catch?.(() => {
      hopefulPrimed = false;
    });
  } catch {
    hopefulPrimed = false;
  }
}

function fadeHopefulMusic(targetVolume, duration = 900) {
  if (!hopefulMusic) return;
  const startVolume = hopefulMusic.volume || 0;
  const start = performance.now();
  function frame(now) {
    const progress = Math.min(1, (now - start) / duration);
    hopefulMusic.volume = startVolume + (targetVolume - startVolume) * progress;
    if (progress < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function showWords(sentence, revealSeconds = 7.2) {
  outroText.innerHTML = '';
  const words = sentence.trim().split(/\s+/);
  const interval = Math.max(105, Math.min(310, (revealSeconds * 1000) / Math.max(1, words.length)));
  words.forEach((word, index) => {
    const span = document.createElement('span');
    span.className = 'castle-outro-word';
    span.style.animationDelay = `${index * interval}ms`;
    span.textContent = `${word}${index < words.length - 1 ? ' ' : ''}`;
    outroText.appendChild(span);
  });
}

function renderOutroPanel(index) {
  if (index === outroPanelIndex || !outroPanels[index]) return;
  outroPanelIndex = index;
  const panel = outroPanels[index];
  outroImage.classList.remove('is-visible');
  window.setTimeout(() => {
    outroImage.src = panel.img;
    outroImage.alt = `Endgeschichte Bild ${index + 1}`;
    outroImage.classList.add('is-visible');
  }, 60);
  outroTitle.textContent = panel.title;
  outroCounter.textContent = `${index + 1} / ${outroPanels.length}`;
  showWords(panel.text, index === outroPanels.length - 1 ? 8.3 : 7.2);
}

function updateOutroTimeline() {
  if (!outroStarted || !hopefulMusic) return;
  const elapsed = Math.max(0, hopefulMusic.currentTime || 0);
  const panelIndex = Math.min(outroPanels.length - 1, Math.floor(elapsed / OUTRO_PANEL_SECONDS));
  renderOutroPanel(panelIndex);
  outroProgress.style.width = `${Math.min(100, (elapsed / OUTRO_STORY_SECONDS) * 100)}%`;
  if (elapsed >= OUTRO_STORY_SECONDS) {
    outroStatus.textContent = 'Die Endmusik klingt vollständig aus. Das letzte Bild bleibt als ruhiger Abschluss sichtbar.';
  } else {
    const remaining = Math.max(0, Math.ceil(OUTRO_PANEL_SECONDS - (elapsed % OUTRO_PANEL_SECONDS)));
    outroStatus.textContent = `Nächstes Bild in ${remaining} Sekunden`;
  }
  outroRaf = requestAnimationFrame(updateOutroTimeline);
}

function completeOutro() {
  if (outroRaf) cancelAnimationFrame(outroRaf);
  outroRaf = null;
  outroProgress.style.width = '100%';
  outroStatus.textContent = 'Die Magie der Sinne ist zurückgekehrt. Das Abenteuer ist beendet.';
  outroFinish.classList.remove('hidden');
}

function launchOutroTimeline() {
  if (outroStarted) return;
  outroStarted = true;
  outroMusicStart.classList.add('hidden');
  outroFinish.classList.add('hidden');
  try {
    hopefulMusic.currentTime = 0;
    hopefulMusic.volume = 0;
  } catch {}
  fadeHopefulMusic(currentVolume());
  renderOutroPanel(0);
  outroRaf = requestAnimationFrame(updateOutroTimeline);
}

async function startOutro() {
  finaleShell.classList.add('hidden');
  outroOverlay.classList.remove('hidden');
  outroPanelIndex = -1;
  renderOutroPanel(0);

  if (hopefulMusic && !hopefulMusic.paused) {
    launchOutroTimeline();
    return;
  }

  try {
    hopefulMusic.currentTime = 0;
    hopefulMusic.volume = 0;
    await hopefulMusic.play();
    hopefulPrimed = true;
    launchOutroTimeline();
  } catch {
    outroStatus.textContent = 'Tippe einmal, damit Musik und Endgeschichte starten können.';
    outroMusicStart.classList.remove('hidden');
  }
}

function finishFinale() {
  if (finished) return;
  finished = true;
  busy = true;
  attackButton.disabled = true;
  attackButton.textContent = 'Die Magie kehrt zurück …';
  saveProgress({ level3Completed: true, level4Completed: true, finaleCompleted: true });
  saveFinalNode();
  orb.classList.add('destroyed');
  stage.classList.add('shaking');
  playAudio(crashSfx);
  window.setTimeout(() => {
    stage.classList.remove('shaking');
    startOutro();
  }, 1800);
}

function performStrike() {
  if (busy || finished) return;
  const finalStrike = orbIndex === orbFrames.length - 2;
  if (finalStrike) primeHopefulMusic();

  busy = true;
  attackButton.disabled = true;
  knight.src = '../assets/images/characters/ritter_attack.png';
  knight.classList.add('attacking');
  playAudio(hitSfx);

  window.setTimeout(() => {
    orbIndex = Math.min(orbFrames.length - 1, orbIndex + 1);
    orb.src = orbFrames[orbIndex];
    orb.classList.add('hit');
    setCaption(orbIndex);
  }, 220);

  window.setTimeout(() => {
    orb.classList.remove('hit');
    knight.classList.remove('attacking');
    knight.src = '../assets/images/characters/knight.png';

    if (orbIndex === orbFrames.length - 1) {
      finishFinale();
      return;
    }

    busy = false;
    attackButton.disabled = false;
  }, 620);
}

attackButton?.addEventListener('click', performStrike);
outroMusicStart?.addEventListener('click', async () => {
  try {
    hopefulMusic.currentTime = 0;
    hopefulMusic.volume = 0;
    await hopefulMusic.play();
    hopefulPrimed = true;
    launchOutroTimeline();
  } catch {
    outroStatus.textContent = 'Der Ton konnte nicht gestartet werden. Prüfe die Medienlautstärke und tippe erneut.';
  }
});
hopefulMusic?.addEventListener('ended', completeOutro);

orbFrames.forEach(src => {
  const img = new Image();
  img.src = src;
});
outroPanels.forEach(panel => {
  const img = new Image();
  img.src = panel.img;
});

enterKnight();
