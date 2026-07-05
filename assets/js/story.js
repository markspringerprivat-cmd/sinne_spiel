const panels = [
  { img: 'assets/images/story/panel-01.png', text: 'Im Schloss der Prinzessin beginnt ein großes Fest. Musik, Farben, Düfte, Speisen und Berührungen erfüllen den Hof.' },
  { img: 'assets/images/story/panel-02.png', text: 'Draußen beobachtet ein Zauberer die Feier. Er wurde nicht eingeladen und wird neidisch.' },
  { img: 'assets/images/story/panel-03.png', text: 'Aus Wut spricht der Zauberer einen dunklen Fluch über das Fest.' },
  { img: 'assets/images/story/panel-04.png', text: 'Die Magie der Sinne wird aus dem Königreich gerissen.' },
  { img: 'assets/images/story/panel-05.png', text: 'Mit der gestohlenen Sinnesmagie flieht der Zauberer davon.' },
  { img: 'assets/images/story/panel-06.png', text: 'In seinem finsteren Schloss verschließt er das Tor mit einem Zauber.' },
  { img: 'assets/images/story/panel-07.png', text: 'Dann zerbricht er den Schlüssel in fünf leuchtende Fragmente.' },
  { img: 'assets/images/story/panel-08.png', text: 'Die Fragmente landen in fünf Gebieten des Königreichs.' },
  { img: 'assets/images/story/panel-09.png', text: 'Zurück bleibt ein stiller Hof. Die Prinzessin bittet den Ritter um Hilfe.' },
  { img: 'assets/images/story/panel-10.png', text: 'Der Ritter macht sich bereit. Die Suche nach den fünf Fragmenten beginnt.' }
];

const img = document.getElementById('storyImage');
const text = document.getElementById('storyText');
const counter = document.getElementById('storyCounter');
const modal = document.getElementById('storyModal');
const playBtn = document.getElementById('playStory');
const actions = document.getElementById('storyActions');
let current = 0;
let timeouts = [];

function clearTimers() {
  timeouts.forEach(clearTimeout);
  timeouts = [];
}

function showWords(sentence, duration = 2600) {
  text.innerHTML = '';
  const words = sentence.split(/\s+/);
  const interval = Math.max(55, duration / words.length);
  words.forEach((word, i) => {
    const span = document.createElement('span');
    span.className = 'word';
    span.style.animationDelay = `${i * interval}ms`;
    span.textContent = word;
    text.appendChild(span);
  });
  return interval * words.length;
}

function showPanel(index) {
  clearTimers();
  const panel = panels[index];
  current = index;
  img.src = panel.img;
  img.alt = `Vorgeschichte Bild ${index + 1}`;
  counter.textContent = `${index + 1} / ${panels.length}`;
  actions.classList.add('hidden');
  const wordTime = showWords(panel.text, 2600);
  const hold = index === panels.length - 1 ? 500 : 900;
  timeouts.push(setTimeout(() => {
    if (index < panels.length - 1) {
      showPanel(index + 1);
    } else {
      actions.classList.remove('hidden');
    }
  }, wordTime + hold));
}

playBtn.addEventListener('click', () => {
  modal.classList.add('hidden');
  showPanel(0);
});
