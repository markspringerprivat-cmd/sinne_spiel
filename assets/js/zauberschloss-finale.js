const STORAGE_LEVEL_PROGRESS = 'sinnesmagie-level-progress';
const STORAGE_LEVEL_NODE = 'sinnesmagie-level-node';
const STORAGE_VOLUME = 'masterVolume';
const OUTRO_PANEL_SECONDS = 10;
const LAST_PANEL_HOLD_SECONDS = 5;
const AUTO_SCROLL_DELAY_MS = LAST_PANEL_HOLD_SECONDS * 1000;
const AUTO_SCROLL_DURATION_MS = 74000;

const orbFrames = [
  '../assets/images/finale/orb_stage_1.png',
  '../assets/images/finale/orb_stage_2.png',
  '../assets/images/finale/orb_stage_3.png',
  '../assets/images/finale/orb_stage_4.png',
  '../assets/images/finale/orb_stage_5.png'
];

const hitTexts = [
  'Der Ritter betritt den Thronsaal. Vor ihm ruht die Glaskugel, in der die Magie der Sinne gefangen ist.',
  'Der erste Schlag trifft die Kugel. Feine Risse flimmern über ihre Oberfläche.',
  'Mit dem zweiten Treffer wird die Glaskugel instabil und beginnt unruhig zu leuchten.',
  'Ein weiterer Hieb erschüttert die Kugel. Sie hält kaum noch stand.',
  'Die Glaskugel zerbricht! Die Magie der Sinne bricht mit gewaltiger Kraft hervor.'
];

const outroPanels = [
  {
    img: '../assets/images/finale/out_1.png',
    title: 'Die Kugel zerbricht',
    text: 'Mit dem letzten Schlag des Ritters zersprang die Glaskugel. Ein mächtiger Strom aus Farben, Licht und Sinnesmagie schoss aus dem dunklen Schloss hinaus und suchte den Weg zurück ins Königreich.'
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
const storyStage = document.querySelector('.castle-outro-story-stage');
const storyCard = document.querySelector('.castle-outro-story-card');
const imageWrap = document.querySelector('.castle-outro-story-image-wrap');
const creditsSection = document.getElementById('castleCreditsSection');
const outroFinish = document.getElementById('castleOutroFinish');

let orbIndex = 0;
let busy = true;
let finished = false;
let outroStarted = false;
let outroPanelIndex = -1;
let panelTimer = null;
let autoScrollTimer = null;
let autoScrollStarted = false;
let autoScrollRaf = 0;

function currentVolume() {
  const saved = Number(localStorage.getItem(STORAGE_VOLUME));
  if (Number.isFinite(saved)) return Math.min(1, Math.max(0, saved));
  return 0.5;
}

function getProgress() {
  try { return JSON.parse(localStorage.getItem(STORAGE_LEVEL_PROGRESS) || '{}'); }
  catch { return {}; }
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

function fadeHopefulMusic(targetVolume, duration = 900) {
  if (!hopefulMusic) return;
  const startVolume = Number.isFinite(hopefulMusic.volume) ? hopefulMusic.volume : 0;
  const start = performance.now();
  function frame(now) {
    const progress = Math.min(1, (now - start) / duration);
    hopefulMusic.volume = startVolume + (targetVolume - startVolume) * progress;
    if (progress < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function setCaption(index) {
  if (caption) caption.textContent = hitTexts[Math.max(0, Math.min(hitTexts.length - 1, index))];
}

function enterKnight() {
  setCaption(0);
  requestAnimationFrame(() => requestAnimationFrame(() => knight.classList.add('entered')));
  window.setTimeout(() => {
    busy = false;
    attackButton.disabled = false;
  }, 1220);
}

function clearStoryTimers() {
  if (panelTimer) { clearTimeout(panelTimer); panelTimer = null; }
  if (autoScrollTimer) { clearTimeout(autoScrollTimer); autoScrollTimer = null; }
  if (autoScrollRaf) { cancelAnimationFrame(autoScrollRaf); autoScrollRaf = 0; }
}

function showWords(sentence, revealSeconds = 8.2) {
  outroText.innerHTML = '';
  const words = sentence.trim().split(/\s+/);
  const interval = Math.max(95, Math.min(240, (revealSeconds * 1000) / Math.max(1, words.length)));
  words.forEach((word, index) => {
    const span = document.createElement('span');
    span.className = 'castle-outro-word';
    span.style.animationDelay = `${index * interval}ms`;
    span.textContent = `${word}${index < words.length - 1 ? ' ' : ''}`;
    outroText.appendChild(span);
  });
}

function syncStoryCardHeight() {
  if (!storyCard || !imageWrap || !outroOverlay) return;
  if (window.innerWidth <= 900) {
    const viewport = window.innerHeight;
    const imageHeight = imageWrap.getBoundingClientRect().height;
    const desired = Math.max(320, viewport - imageHeight);
    storyCard.style.minHeight = `${desired}px`;
  } else {
    storyCard.style.minHeight = '';
  }
}

function renderOutroPanel(index) {
  const panel = outroPanels[index];
  if (!panel) return;
  outroPanelIndex = index;
  outroImage.classList.remove('is-visible');
  window.setTimeout(() => {
    outroImage.src = panel.img;
    outroImage.alt = `Endgeschichte Bild ${index + 1}`;
    outroImage.classList.add('is-visible');
    syncStoryCardHeight();
  }, 60);
  outroTitle.textContent = panel.title;
  outroCounter.textContent = `${index + 1} / ${outroPanels.length}`;
  outroProgress.style.width = `${((index + 1) / outroPanels.length) * 100}%`;
  showWords(panel.text, index === outroPanels.length - 1 ? 8 : 8.6);
}

function showFinishButton() {
  outroFinish?.classList.remove('hidden');
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function startAutoScrollThroughCredits() {
  if (autoScrollStarted || !outroOverlay) return;
  autoScrollStarted = true;
  syncStoryCardHeight();
  const startTop = outroOverlay.scrollTop;
  const endTop = Math.max(0, outroOverlay.scrollHeight - outroOverlay.clientHeight);
  const startTime = performance.now();

  function step(now) {
    const progress = Math.min(1, (now - startTime) / AUTO_SCROLL_DURATION_MS);
    const eased = easeInOut(progress);
    outroOverlay.scrollTop = startTop + (endTop - startTop) * eased;
    if (progress < 1) {
      autoScrollRaf = requestAnimationFrame(step);
    } else {
      autoScrollRaf = 0;
      showFinishButton();
    }
  }

  autoScrollRaf = requestAnimationFrame(step);
}

function queueNextPanel() {
  clearStoryTimers();
  if (outroPanelIndex >= outroPanels.length - 1) {
    autoScrollTimer = window.setTimeout(startAutoScrollThroughCredits, AUTO_SCROLL_DELAY_MS);
    return;
  }
  panelTimer = window.setTimeout(() => {
    renderOutroPanel(outroPanelIndex + 1);
    queueNextPanel();
  }, OUTRO_PANEL_SECONDS * 1000);
}

async function startOutro() {
  if (outroStarted) return;
  outroStarted = true;
  finaleShell.classList.add('hidden');
  outroOverlay.classList.remove('hidden');
  outroOverlay.scrollTop = 0;
  renderOutroPanel(0);
  queueNextPanel();

  try {
    hopefulMusic.currentTime = 0;
    hopefulMusic.volume = 0;
    await hopefulMusic.play();
    fadeHopefulMusic(currentVolume(), 1200);
  } catch {
    // Falls Autoplay blockiert ist, startet die Musik meist nach dem nächsten Tap.
  }

  syncStoryCardHeight();
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
  }, 1700);
}

function performStrike() {
  if (busy || finished) return;
  busy = true;
  attackButton.disabled = true;
  knight.src = '../assets/images/finale/knight_attack_finale.png';
  knight.classList.remove('attacking');
  void knight.offsetWidth;
  knight.classList.add('attacking');
  playAudio(hitSfx);

  window.setTimeout(() => {
    orbIndex = Math.min(orbFrames.length - 1, orbIndex + 1);
    orb.src = orbFrames[orbIndex];
    orb.classList.add('hit');
    setCaption(orbIndex);
  }, 330);

  window.setTimeout(() => {
    orb.classList.remove('hit');
    knight.classList.remove('attacking');
    knight.src = '../assets/images/finale/knight_idle_finale.png';

    if (orbIndex === orbFrames.length - 1) {
      finishFinale();
      return;
    }

    busy = false;
    attackButton.disabled = false;
  }, 780);
}

attackButton?.addEventListener('click', performStrike);
window.addEventListener('resize', syncStoryCardHeight);
outroImage?.addEventListener('load', syncStoryCardHeight);
hopefulMusic?.addEventListener('ended', showFinishButton);


['../assets/images/finale/knight_idle_finale.png', '../assets/images/finale/knight_attack_finale.png'].forEach(src => { const img = new Image(); img.src = src; });
orbFrames.forEach(src => { const img = new Image(); img.src = src; });
outroPanels.forEach(panel => { const img = new Image(); img.src = panel.img; });
enterKnight();
