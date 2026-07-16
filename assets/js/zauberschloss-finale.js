const STORAGE_LEVEL_PROGRESS = 'sinnesmagie-level-progress';
const STORAGE_LEVEL_NODE = 'sinnesmagie-level-node';
const STORAGE_VOLUME = 'masterVolume';
const OUTRO_PANEL_SECONDS = 10;
const LAST_PANEL_HOLD_SECONDS = 5;
const AUTO_SCROLL_DELAY_MS = LAST_PANEL_HOLD_SECONDS * 1000;
const AUTO_SCROLL_DURATION_MS = 111000;
const OUTRO_STORY_TOTAL_MS = OUTRO_PANEL_SECONDS * 1000 * 6;

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
    img: '../assets/images/finale/out_1.webp',
    title: 'Die Kugel zerbricht',
    text: 'Mit dem letzten Schlag des Ritters zersprang die Glaskugel. Ein mächtiger Strom aus Farben, Licht und Sinnesmagie schoss aus dem dunklen Schloss hinaus und suchte den Weg zurück ins Königreich.'
  },
  {
    img: '../assets/images/finale/out_2.webp',
    title: 'Der Ritter kehrt zurück',
    text: 'Am Schlosstor lief die Prinzessin dem Ritter erleichtert entgegen. Sein Mut hatte das Königreich gerettet, und endlich konnten beide wieder hoffnungsvoll in die Zukunft blicken.'
  },
  {
    img: '../assets/images/finale/out_3.webp',
    title: 'Die Magie erreicht das Königreich',
    text: 'Bunte Ströme zogen über Türme, Mauern und Höfe. Farben leuchteten wieder, vertraute Geräusche kehrten zurück und das ganze Königreich erwachte aus seiner stillen Dunkelheit.'
  },
  {
    img: '../assets/images/finale/out_4.webp',
    title: 'Die Sinne erwachen',
    text: 'Blumen dufteten, Brot schmeckte frisch und Musik erfüllte die Luft. Die Menschen konnten wieder sehen, hören, riechen, schmecken und fühlen – und freuten sich über jeden Eindruck.'
  },
  {
    img: '../assets/images/finale/out_5.webp',
    title: 'Ein gemeinsames Fest',
    text: 'Am Abend kamen alle an einem Tisch zusammen. Sie aßen, lachten und erzählten von ihrem Abenteuer. Aus Angst und Stille waren wieder Nähe, Freude und Gemeinschaft geworden.'
  },
  {
    img: '../assets/images/finale/out_6.webp',
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
const creditsFinalScene = document.getElementById('castleCreditsFinalScene');
let creditRevealObserver = null;

let orbIndex = 0;
let busy = true;
let finished = false;
let outroStarted = false;
let outroPanelIndex = -1;
let panelTimer = null;
let autoScrollTimer = null;
let autoScrollStarted = false;
let autoScrollRaf = 0;
let outroProgressRaf = 0;
let outroStoryStartedAt = 0;

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

function clearStoryTimers(options = {}) {
  if (panelTimer) { clearTimeout(panelTimer); panelTimer = null; }
  if (autoScrollTimer) { clearTimeout(autoScrollTimer); autoScrollTimer = null; }
  if (autoScrollRaf) { cancelAnimationFrame(autoScrollRaf); autoScrollRaf = 0; }
  if (!options.keepProgress && outroProgressRaf) {
    cancelAnimationFrame(outroProgressRaf);
    outroProgressRaf = 0;
  }
}

function startOutroProgress() {
  if (!outroProgress) return;
  if (outroProgressRaf) cancelAnimationFrame(outroProgressRaf);
  outroStoryStartedAt = performance.now();
  outroProgress.style.width = '0%';

  const frame = now => {
    const elapsed = Math.max(0, now - outroStoryStartedAt);
    const ratio = Math.min(1, elapsed / OUTRO_STORY_TOTAL_MS);
    outroProgress.style.width = `${ratio * 100}%`;
    if (ratio < 1 && outroStarted) {
      outroProgressRaf = requestAnimationFrame(frame);
    } else {
      outroProgress.style.width = '100%';
      outroProgressRaf = 0;
    }
  };
  outroProgressRaf = requestAnimationFrame(frame);
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
  showWords(panel.text, index === outroPanels.length - 1 ? 8 : 8.6);
}

function prepareCreditWordReveals() {
  const scenes = [...document.querySelectorAll('[data-credit-reveal]')];
  scenes.forEach(scene => {
    const paragraph = scene.querySelector('[data-credit-text]');
    if (!paragraph || paragraph.dataset.prepared === '1') return;
    paragraph.dataset.prepared = '1';
    const words = paragraph.textContent.trim().split(/\s+/);
    paragraph.innerHTML = '';
    words.forEach((word, index) => {
      const span = document.createElement('span');
      span.className = 'castle-credit-word';
      span.style.setProperty('--credit-word-index', index);
      span.textContent = `${word}${index < words.length - 1 ? ' ' : ''}`;
      paragraph.appendChild(span);
    });
  });

  creditRevealObserver?.disconnect();
  creditRevealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('credit-copy-visible');
      creditRevealObserver?.unobserve(entry.target);
    });
  }, {
    root: outroOverlay,
    rootMargin: '0px 0px -18% 0px',
    threshold: 0.22
  });
  scenes.forEach(scene => creditRevealObserver.observe(scene));
}

function showFinishButton() {
  const modal=document.createElement('div'); modal.className='score-modal'; modal.innerHTML='<div class="score-modal-card"><h2>Das Abenteuer ist beendet</h2><p>Du kannst jetzt zur Weltkarte zurückkehren.</p><a class="primary-button" href="../game.html?fromLevel=1">Zur Weltkarte</a></div>'; document.body.appendChild(modal);
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function startAutoScrollThroughCredits() {
  if (autoScrollStarted || !outroOverlay) return;
  autoScrollStarted = true;
  syncStoryCardHeight();
  prepareCreditWordReveals();
  const startTop = outroOverlay.scrollTop;
  const finalImage = creditsFinalScene?.querySelector('img');
  const overlayRect = outroOverlay.getBoundingClientRect();
  const finalImageRect = finalImage?.getBoundingClientRect();
  const finalImageTop = finalImageRect
    ? outroOverlay.scrollTop + finalImageRect.top - overlayRect.top
    : outroOverlay.scrollHeight - outroOverlay.clientHeight;
  const endTop = Math.max(startTop, Math.min(
    Math.max(0, outroOverlay.scrollHeight - outroOverlay.clientHeight),
    finalImageTop
  ));
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
  clearStoryTimers({ keepProgress: true });
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
  document.body.classList.add('castle-outro-active');
  outroOverlay.classList.remove('hidden');
  outroOverlay.scrollTop = 0;
  prepareCreditWordReveals();
  renderOutroPanel(0);
  startOutroProgress();
  queueNextPanel();

  try {
    hopefulMusic.currentTime = 0;
    hopefulMusic.volume = 0;
    hopefulMusic.loop = true;
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



['../assets/images/finale/knight_idle_finale.png', '../assets/images/finale/knight_attack_finale.png'].forEach(src => { const img = new Image(); img.src = src; });
orbFrames.forEach(src => { const img = new Image(); img.src = src; });
outroPanels.forEach(panel => { const img = new Image(); img.src = panel.img; });
[
  '../assets/images/finale/credits/credits_01_waldgeist.webp',
  '../assets/images/finale/credits/credits_02_maulwurf.webp',
  '../assets/images/finale/credits/credits_03_feuergolem.webp',
  '../assets/images/finale/credits/credits_04_farbgolem.webp',
  '../assets/images/finale/credits/credits_05_duftgeist.webp',
  '../assets/images/finale/credits/credits_06_stuermen.webp',
  '../assets/images/finale/credits/credits_07_handreichen.webp',
  '../assets/images/finale/credits/credits_08_feier.webp',
  '../assets/images/finale/credits/credits_09_danke.webp'
].forEach(src => { const img = new Image(); img.src = src; });
document.getElementById('globalScoreHud')?.remove(); document.getElementById('unifiedGameHud')?.remove();
enterKnight();
