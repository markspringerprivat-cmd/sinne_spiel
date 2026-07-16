const STORY_END_SECONDS = 75;

const panels = [
  {
    img: 'assets/images/story/panel-01.jpg',
    start: 0,
    end: 5.4,
    text: 'Hinter grünen Hügeln lag ein Königreich, in dem die fünf Sinne den Alltag hell, sicher und lebendig machten.'
  },
  {
    img: 'assets/images/story/panel-02.jpg',
    start: 5.4,
    end: 10.8,
    text: 'Beim Schlossfest leuchteten Farben, Musik erfüllte den Hof und der Duft frischer Speisen zog durch die Menge.'
  },
  {
    img: 'assets/images/story/panel-03.jpg',
    start: 10.8,
    end: 16.2,
    text: 'Doch im Schatten stand ein einsamer Magier. Er sah die Freude der anderen und fühlte sich ausgeschlossen.'
  },
  {
    img: 'assets/images/story/panel-04.jpg',
    start: 16.2,
    end: 21.6,
    text: 'Aus seiner Traurigkeit wurde Neid. Er glaubte, nur ein mächtiger Zauber könne seinen Schmerz beenden.'
  },
  {
    img: 'assets/images/story/panel-05.jpg',
    start: 21.6,
    end: 27,
    text: 'Plötzlich stürmte er auf das Fest. Dunkle Magie fegte über den Platz und alle wichen erschrocken zurück.'
  },
  {
    img: 'assets/images/story/panel-06.jpg',
    start: 27,
    end: 32.4,
    text: 'Dann verschwanden die Sinne: Farben wurden blass, Musik verstummte, Düfte und Geschmack gingen verloren.'
  },
  {
    img: 'assets/images/story/panel-07.jpg',
    start: 32.4,
    end: 37.8,
    text: 'Ohne ihre Sinne fehlten den Menschen nicht nur Freude und Nähe. Auch Warnungen und Orientierung gingen verloren.'
  },
  {
    img: 'assets/images/story/panel-08.jpg',
    start: 37.8,
    end: 43.2,
    text: 'Der Magier floh in sein Schloss und zerbrach den Schlüssel in fünf leuchtende Fragmente.'
  },
  {
    img: 'assets/images/story/panel-09.jpg',
    start: 43.2,
    end: 48.6,
    text: 'Er verstreute die Fragmente in fünf Gebieten und setzte dort mächtige Wächter ein.'
  },
  {
    img: 'assets/images/story/panel-10.jpg',
    start: 48.6,
    end: 54,
    text: 'Die gestohlene Sinnesmagie sperrte er in eine Glaskugel. Das Königreich blieb still und farblos zurück.'
  },
  {
    img: 'assets/images/story/panel-11.jpg',
    start: 54,
    end: 59.25,
    text: 'Die Prinzessin erkannte, wie verletzlich ein Leben ohne Sehen, Hören, Riechen, Schmecken und Fühlen war.'
  },
  {
    img: 'assets/images/story/panel-12.jpg',
    start: 59.25,
    end: 64.5,
    text: 'Sie bat den Ritter, die Fragmente zu suchen und die verlorene Magie zurückzubringen.'
  },
  {
    img: 'assets/images/story/panel-13.jpg',
    start: 64.5,
    end: 69.75,
    text: 'Der Ritter versprach, jedes Gebiet zu durchqueren und sich allen Prüfungen zu stellen.'
  },
  {
    img: 'assets/images/story/panel-14.jpg',
    start: 69.75,
    end: 75,
    text: 'Nun beginnt deine Reise. Hilf dem Ritter, die Sinne zu retten und das Königreich wieder lebendig zu machen.'
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
  const revealMs = Math.min(durationSeconds * 1000 * 0.72, Math.max(1800, words.length * 90));
  const interval = Math.max(38, revealMs / Math.max(1, words.length));

  words.forEach((word, index) => {
    const span = document.createElement('span');
    span.className = 'word';
    span.style.animationDelay = `${index * interval}ms`;
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
  }, 45);
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
  progressFill.style.width = `${(clamped / STORY_END_SECONDS) * 100}%`;

  const nextIndex = panels.findIndex(panel => clamped >= panel.start && clamped < panel.end);
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
  // Die Intro-Musik läuft nach dem letzten Bild weiter und endet erst
  // natürlich mit der Audiodatei oder beim Verlassen der Seite.
}

async function startStory(options = {}) {
  clearAnimation();
  storyFinished = false;
  current = -1;
  actions.classList.add('hidden');
  audioStarted = false;
  fallbackStart = performance.now();

  // Die Bildgeschichte startet immer – auch wenn der Browser Audio-Autoplay blockiert.
  // Die Zeitsteuerung fällt dann auf den internen 75-Sekunden-Timer zurück.
  if (storyAudio) {
    storyAudio.pause();
    storyAudio.currentTime = 0;
    storyAudio.volume = 0.65;
    try {
      await storyAudio.play();
      audioStarted = true;
    } catch {
      audioStarted = false;
      const resumeAudio = async () => {
        try {
          storyAudio.currentTime = Math.min(STORY_END_SECONDS, currentTimeSeconds());
          await storyAudio.play();
          audioStarted = true;
        } catch {}
      };
      document.addEventListener('pointerdown', resumeAudio, { once: true, passive: true });
      document.addEventListener('keydown', resumeAudio, { once: true });
    }
  }

  modal?.classList.add('hidden');
  showPanel(0);
  rafId = requestAnimationFrame(updateStory);
}

playBtn?.addEventListener('click', () => startStory({ autoplay: false }));

if (storyAudio) {
  storyAudio.addEventListener('ended', () => {
    if (!storyFinished) finishStory();
  });
}

panels.forEach(panel => {
  const preload = new Image();
  preload.src = panel.img;
});

const query = new URLSearchParams(window.location.search);
const embedded = query.get('embedded') === '1';
const shouldAutoplay = query.get('autoplay') === '1' || sessionStorage.getItem('sinnesmagie-play-intro-story') === '1';
sessionStorage.removeItem('sinnesmagie-play-intro-story');

// Wird die Story im bereits geladenen, gleich-originigen Frame geöffnet, kann der
// ursprüngliche Klick direkt zum Starten der Musik genutzt werden. Das vermeidet
// die Autoplay-Sperre von iOS/Android nach einem vollständigen Seitenwechsel.
window.startStoryFromParent = function startStoryFromParent() {
  return startStory({ autoplay: false });
};
window.__sinnesStoryReady = true;

if (!embedded) {
  window.setTimeout(() => startStory({ autoplay: shouldAutoplay }), 160);
}
