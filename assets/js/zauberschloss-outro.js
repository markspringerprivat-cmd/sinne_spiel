const outroPanels = [
  {
    img: '../assets/images/finale/out_1.png',
    title: 'Die Kugel zerbricht',
    text: 'Mit dem letzten Schlag des Ritters zersprang die Glaskugel. In einem hellen, bunten Strom brach die gefangene Sinnesmagie frei und schoss wie ein leuchtender Regenbogen aus dem finsteren Schloss hinaus in die Nacht.'
  },
  {
    img: '../assets/images/finale/out_2.png',
    title: 'Die Rückkehr des Ritters',
    text: 'Als der Ritter zum Königreich zurückkehrte, lief ihm die Prinzessin voller Erleichterung entgegen. Hinter ihnen glühte das Schloss im Abendlicht – endlich war Hoffnung zurückgekehrt.'
  },
  {
    img: '../assets/images/finale/out_3.png',
    title: 'Die Magie findet ihren Weg',
    text: 'Die freigelassene Sinnesmagie zog über Mauern, Türme und Höfe hinweg zurück ins Königreich. Überall begannen Farben, Klänge, Düfte, Gefühle und Geschmack wieder lebendig zu werden.'
  },
  {
    img: '../assets/images/finale/out_4.png',
    title: 'Die Sinne erwachen',
    text: 'Schon bald konnten die Menschen wieder riechen, schmecken, hören, sehen und fühlen: Blumen dufteten, Brot schmeckte frisch, Musik klang fröhlich und jede Berührung fühlte sich wieder vertraut und sicher an.'
  },
  {
    img: '../assets/images/finale/out_5.png',
    title: 'Ein Fest der Freude',
    text: 'Am Abend saßen alle gemeinsam an einem großen Tisch. Sie aßen, lachten, stießen an und feierten den Ritter, die Prinzessin und die Rückkehr der Sinnesmagie im ganzen Königreich.'
  },
  {
    img: '../assets/images/finale/out_6.png',
    title: 'Warum die Sinne so wichtig sind',
    text: 'Beim Blick in den Sonnenuntergang dachte die Prinzessin daran, wie wertvoll unsere Sinne sind: <strong>Sie zeigen uns den Weg</strong>, lassen uns Schönheit und Freude erleben und helfen uns, andere Menschen zu verstehen. <strong>Sie schützen uns auch vor Gefahren</strong> – die Augen erkennen Hindernisse, die Ohren warnen vor Lärm oder Rufen, die Nase bemerkt Rauch oder verdorbenes Essen, der Geschmack hilft beim Prüfen von Nahrung und der Tastsinn warnt vor Hitze, Kälte oder Schmerz. So schenken uns unsere Sinne nicht nur Wissen, sondern auch Sicherheit, Nähe und unzählige schöne Gefühle.'
  }
];

const imageEl = document.getElementById('castleOutroImage');
const titleEl = document.getElementById('castleOutroTitle');
const textEl = document.getElementById('castleOutroText');
const counterEl = document.getElementById('castleOutroCounter');
const progressEl = document.getElementById('castleOutroProgress');
const nextButton = document.getElementById('castleOutroNext');
const finishButton = document.getElementById('castleOutroFinish');
let current = 0;

function renderPanel(index) {
  const panel = outroPanels[index];
  if (!panel) return;
  imageEl.src = panel.img;
  imageEl.alt = `Abschlussbild ${index + 1}`;
  titleEl.textContent = panel.title;
  textEl.innerHTML = panel.text;
  counterEl.textContent = `${index + 1} / ${outroPanels.length}`;
  progressEl.style.width = `${((index + 1) / outroPanels.length) * 100}%`;
  const isLast = index === outroPanels.length - 1;
  nextButton.classList.toggle('hidden', isLast);
  finishButton.classList.toggle('hidden', !isLast);
}

nextButton?.addEventListener('click', () => {
  if (current >= outroPanels.length - 1) return;
  current += 1;
  renderPanel(current);
});

outroPanels.forEach(panel => {
  const img = new Image();
  img.src = panel.img;
});

renderPanel(current);
