const STORY_END_SECONDS = 94;

const panels = [
  {
    img: 'assets/images/story/panel-01.jpg',
    start: 0,
    end: 25 / 3,
    text: 'Weit hinter den grünen Hügeln lag ein Königreich, in dem die Magie der Sinne jeden Tag hell und lebendig machte.'
  },
  {
    img: 'assets/images/story/panel-02.jpg',
    start: 25 / 3,
    end: 50 / 3,
    text: 'Beim großen Schlossfest duftete es nach Speisen, Musik erfüllte den Hof, Farben leuchteten und überall wurde gelacht, getanzt und gefeiert.'
  },
  {
    img: 'assets/images/story/panel-03.jpg',
    start: 50 / 3,
    end: 25,
    text: 'Doch draußen im Schatten stand ein Magier. Er war nicht eingeladen worden und sah verbittert zu, wie alle gemeinsam Freude empfanden.'
  },
  {
    img: 'assets/images/story/panel-04.jpg',
    start: 25,
    end: 25 + 33 / 7,
    text: 'Mit jeder Melodie wuchs sein Neid. Warum durften alle feiern, während er allein im Dunkeln blieb?'
  },
  {
    img: 'assets/images/story/panel-05.jpg',
    start: 25 + 33 / 7,
    end: 25 + 66 / 7,
    text: 'Wütend stürmte er auf den Festplatz. Ein dunkler Zauber fuhr durch die Menge, und alle wichen erschrocken zurück.'
  },
  {
    img: 'assets/images/story/panel-06.jpg',
    start: 25 + 66 / 7,
    end: 25 + 99 / 7,
    text: 'Dann riss er dem Königreich seine Sinnesfreude fort: Musik klang leer, Farben verblassten, Düfte verschwanden und nichts fühlte sich mehr lebendig an.'
  },
  {
    img: 'assets/images/story/panel-07.jpg',
    start: 25 + 99 / 7,
    end: 25 + 132 / 7,
    text: 'Mit der gestohlenen Magie zog sich der Magier in sein finsteres Schloss zurück.'
  },
  {
    img: 'assets/images/story/panel-08.jpg',
    start: 25 + 132 / 7,
    end: 25 + 165 / 7,
    text: 'Damit ihm niemand folgen konnte, zerbrach er den Schlüssel zu seinem Schloss in mehrere leuchtende Fragmente.'
  },
  {
    img: 'assets/images/story/panel-09.jpg',
    start: 25 + 165 / 7,
    end: 25 + 198 / 7,
    text: 'Die Fragmente verstreute er in fremde Gebiete. Dort bewachten seine Handlanger jedes einzelne Stück.'
  },
  {
    img: 'assets/images/story/panel-10.jpg',
    start: 25 + 198 / 7,
    end: 58,
    text: 'Zufrieden sperrte der Magier die Sinnesmagie in ein Gefäß und ließ das Königreich still und freudlos zurück.'
  },
  {
    img: 'assets/images/story/panel-11.jpg',
    start: 58,
    end: 67,
    text: 'Die Prinzessin war verzweifelt. Sie sorgte sich um alle Menschen im Königreich und gab sich die Schuld, sie nicht beschützt zu haben.'
  },
  {
    img: 'assets/images/story/panel-12.jpg',
    start: 67,
    end: 76,
    text: 'Sie bat den Ritter, die verstreuten Sinnesfragmente zu suchen und die Freude in das Königreich zurückzubringen.'
  },
  {
    img: 'assets/images/story/panel-13.jpg',
    start: 76,
    end: 85,
    text: 'Der Ritter trat entschlossen vor. Er versprach, jedes Fragment zu finden und die Magie der Sinne zu retten.'
  },
  {
    img: 'assets/images/story/panel-14.jpg',
    start: 85,
    end: 94,
    text: 'Die Prinzessin verabschiedete ihn am Tor. Vor ihm lagen fünf geheimnisvolle Gebiete, starke Wächter und der Weg zum Schloss des Magiers.'
  }
];

const img = document.getElementById('storyImage');
const text = document.getElementById('storyText');
const counter = document.getElementById('storyCounter');
const progressFill = document.getElementById('storyProgressFill');
const modal = document.getElementById('storyModal');
const playBtn = document.getElementById('playStory');
const actions = document.getElementById('storyActions');
const storyAudio = document.getElementById('storyAudio');

let current = -1;
let rafId = null;
let fallbackStart = 0;
let audioStarted = false;
let storyFinished = false;

function panelDuration(panel) {
  return Math.max(0.1, panel.end - panel.start);
}

function clearAnimation() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
}

function showWords(sentence, durationSeconds) {
  text.innerHTML = '';
  const words = sentence.split(/\s+/);
  const revealMs = Math.min(durationSeconds * 1000 * 0.62, Math.max(1700, words.length * 95));
  const interval = Math.max(42, revealMs / Math.max(1, words.length));

  words.forEach((word, i) => {
    const span = document.createElement('span');
    span.className = 'word';
    span.style.animationDelay = `${i * interval}ms`;
    span.textContent = word;
    text.appendChild(span);
  });
}

function showPanel(index) {
  if (index === current || !panels[index]) return;
  current = index;
  const panel = panels[index];
  img.classList.remove('is-visible');
  window.setTimeout(() => {
    img.src = panel.img;
    img.alt = `Vorgeschichte Bild ${index + 1}`;
    img.classList.add('is-visible');
  }, 40);
  counter.textContent = `${index + 1} / ${panels.length}`;
  actions.classList.add('hidden');
  showWords(panel.text, panelDuration(panel));
}

function currentTimeSeconds() {
  if (audioStarted && storyAudio && !Number.isNaN(storyAudio.currentTime)) {
    return storyAudio.currentTime;
  }
  return (performance.now() - fallbackStart) / 1000;
}

function updateStory() {
  const time = currentTimeSeconds();
  const clamped = Math.min(STORY_END_SECONDS, Math.max(0, time));
  const progress = (clamped / STORY_END_SECONDS) * 100;
  progressFill.style.width = `${progress}%`;

  const nextIndex = panels.findIndex((panel) => clamped >= panel.start && clamped < panel.end);
  if (nextIndex >= 0) showPanel(nextIndex);

  if (time >= STORY_END_SECONDS && !storyFinished) {
    finishStory();
    return;
  }

  rafId = requestAnimationFrame(updateStory);
}

function finishStory() {
  storyFinished = true;
  clearAnimation();
  progressFill.style.width = '100%';
  showPanel(panels.length - 1);
  actions.classList.remove('hidden');
  if (storyAudio) {
    storyAudio.pause();
    storyAudio.currentTime = Math.min(storyAudio.duration || STORY_END_SECONDS, STORY_END_SECONDS);
  }
}

function startStory() {
  modal.classList.add('hidden');
  storyFinished = false;
  current = -1;
  fallbackStart = performance.now();
  actions.classList.add('hidden');
  showPanel(0);

  if (storyAudio) {
    storyAudio.pause();
    storyAudio.currentTime = 0;
    storyAudio.volume = 0.65;
    const playPromise = storyAudio.play();
    audioStarted = true;
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        audioStarted = false;
        fallbackStart = performance.now();
      });
    }
  }

  clearAnimation();
  rafId = requestAnimationFrame(updateStory);
}

playBtn.addEventListener('click', startStory);

if (storyAudio) {
  storyAudio.addEventListener('ended', () => {
    if (!storyFinished) finishStory();
  });
}

panels.forEach((panel) => {
  const preload = new Image();
  preload.src = panel.img;
});
