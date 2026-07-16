(() => {
  const TRACKS = {
    farbenreich: { title:'Farbenreich', audio:'assets/audio/farbenreich_new.mp3', bg:'assets/images/level-backgrounds/farbenreich.webp' },
    duftgarten: { title:'Duftgarten', audio:'assets/audio/duftgarten_new.mp3', bg:'assets/images/level-backgrounds/duftgarten.webp' },
    klangwald: { title:'Klangwald', audio:'assets/audio/klangwald_minispiel_new.mp3', bg:'assets/images/level-backgrounds/klangwald.webp' },
    zauberschloss: { title:'Zauberschloss', audio:'assets/audio/bossencounter.mp3', bg:'assets/images/level-backgrounds/zauberschloss.webp' }
  };

  // Die Zeitpunkte wurden aus den tatsächlichen Musikdateien anhand ihrer
  // hörbaren Anschläge und Melodieakzente ermittelt. Dadurch fallen die Noten
  // nicht mehr in einem starren Zufallsintervall, sondern passend zur Musik.
  const NOTE_MAPS = {"farbenreich":{"leicht":[[4.133,3],[6.618,3],[9.125,0],[10.379,0],[13.491,2],[15.07,0],[19.133,1],[21.618,3],[24.451,3],[25.403,0],[28.816,1],[31.626,3],[32.879,1],[35.364,3],[37.872,2],[41.633,3],[42.887,2],[45.697,0],[48.506,1],[50.689,3],[52.872,2],[55.055,1]],"mittel":[[4.133,3],[4.458,2],[6.618,3],[7.872,0],[9.125,3],[10.379,0],[12.887,1],[13.491,2],[15.07,0],[16.324,1],[19.133,1],[20.387,3],[21.618,3],[23.22,2],[24.451,3],[25.403,3],[26.958,0],[28.816,1],[31.022,3],[31.626,3],[32.879,1],[35.364,3],[36.618,3],[37.872,2],[39.126,2],[41.006,0],[41.633,3],[44.118,3],[45.697,0],[47.253,2],[48.506,1],[49.133,3],[50.689,3],[52.872,2],[54.126,3],[55.055,1]],"schwer":[[2.879,0],[4.133,3],[5.712,0],[6.618,3],[6.966,2],[7.872,0],[9.125,3],[10.379,0],[11.633,1],[12.26,2],[13.491,2],[14.466,3],[15.07,0],[16.324,1],[17.578,1],[18.506,2],[19.133,1],[20.387,3],[21.618,3],[21.966,2],[23.22,2],[24.451,3],[25.403,3],[25.704,0],[26.958,0],[27.585,1],[28.816,1],[30.093,2],[31.022,3],[31.626,3],[32.879,1],[34.11,2],[35.364,3],[35.991,2],[36.618,3],[37.872,2],[39.126,2],[39.753,1],[41.006,0],[41.633,3],[42.887,2],[44.118,3],[44.443,0],[45.697,0],[47.253,2],[47.88,3],[48.506,1],[49.459,0],[50.689,3],[52.245,1],[52.872,2],[54.126,3],[55.055,1],[55.681,2]]},"duftgarten":{"leicht":[[4.412,1],[7.059,1],[8.406,2],[11.726,2],[15.07,1],[17.74,1],[20.062,2],[21.734,2],[25.728,3],[27.4,2],[32.392,1],[33.112,0],[36.107,2],[39.102,1],[41.773,0],[43.746,1],[46.765,3],[50.155,1],[51.223,3],[51.595,2],[51.966,2],[52.756,1]],"mittel":[[4.412,1],[4.737,2],[7.059,1],[8.406,2],[9.729,1],[11.726,2],[13.073,0],[15.07,1],[16.068,3],[17.74,1],[20.062,1],[21.734,2],[23.081,1],[25.728,3],[27.4,2],[28.398,1],[29.396,3],[32.392,1],[33.112,0],[35.109,1],[36.107,2],[38.104,2],[39.102,1],[41.773,0],[43.119,3],[43.932,2],[46.765,3],[47.438,1],[49.83,1],[50.155,2],[50.527,2],[50.875,1],[51.223,3],[51.595,2],[51.966,2],[52.756,1]],"schwer":[[3.088,2],[4.412,1],[5.41,3],[7.059,1],[7.732,1],[8.406,2],[9.729,1],[11.401,1],[11.726,2],[13.073,0],[14.745,3],[15.07,1],[16.068,3],[17.74,1],[18.739,3],[20.062,1],[20.387,1],[21.734,2],[23.081,1],[24.404,2],[25.728,3],[26.076,3],[27.4,2],[28.398,1],[29.396,3],[31.068,1],[32.392,1],[33.112,0],[33.762,0],[35.109,1],[36.107,2],[37.105,0],[38.104,2],[39.102,1],[41.099,1],[41.773,0],[43.119,3],[43.746,1],[44.907,1],[46.533,2],[46.765,3],[47.763,2],[48.112,1],[48.437,3],[48.785,2],[49.482,1],[49.83,1],[50.155,2],[50.527,2],[50.875,1],[51.223,3],[51.595,2],[51.966,2],[52.756,1]]},"klangwald":{"leicht":[[7.825,0],[11.494,1],[20.085,2],[26.796,1],[30.79,3],[36.246,1],[40.124,3],[47.369,2],[52.315,2],[57.841,3],[64.319,2],[71.843,3],[79.482,0],[83.081,3],[89.629,3],[95.643,0],[101.564,2],[109.25,2],[117.888,3],[124.157,2],[124.877,2],[130.426,3]],"mittel":[[6.223,3],[7.825,0],[11.494,1],[14.698,3],[20.085,2],[21.641,2],[26.796,1],[30.79,3],[36.246,1],[36.78,0],[40.124,3],[47.369,2],[48.414,2],[52.315,3],[57.841,3],[59.977,2],[64.319,2],[66.479,1],[71.843,3],[76.788,2],[79.482,0],[83.081,3],[86.355,1],[89.629,3],[92.88,0],[98.894,2],[101.564,2],[106.371,3],[109.25,2],[111.433,2],[117.888,3],[121.951,2],[124.157,2],[125.504,3],[127.779,2],[130.426,2]],"schwer":[[4.063,1],[7.245,3],[7.825,0],[11.494,1],[13.63,3],[16.881,2],[20.085,2],[21.641,3],[24.335,1],[26.796,1],[28.05,2],[30.79,3],[33.553,1],[36.246,1],[39.59,0],[40.124,3],[43.955,1],[47.369,2],[48.414,2],[52.315,3],[53.452,0],[56.773,3],[57.841,3],[59.977,2],[64.319,2],[66.479,1],[69.126,0],[71.843,3],[72.934,0],[76.788,2],[79.482,0],[81.804,3],[83.081,3],[86.355,1],[89.629,3],[91.278,0],[92.88,0],[95.643,1],[98.894,2],[101.564,2],[102.679,3],[106.371,2],[109.25,2],[111.433,3],[112.57,2],[114.869,1],[117.888,2],[121.951,2],[124.157,3],[124.877,2],[125.295,2],[125.504,3],[127.779,2],[130.426,2]]},"zauberschloss":{"leicht":[[7.129,0],[9.543,3],[14.095,3],[21.06,0],[24.567,2],[35.016,0],[36.757,1],[40.89,3],[51.13,3],[52.872,1],[61.579,2],[66.827,1],[72.678,1],[74.443,2],[79.668,1],[88.375,2],[91.208,3],[99.939,2],[104.072,3],[106.905,3],[112.57,0],[118.677,3]],"mittel":[[6.06,3],[7.129,0],[9.543,3],[14.095,3],[17.578,0],[21.06,0],[24.567,2],[28.05,3],[32.183,1],[35.016,0],[36.757,1],[40.89,3],[44.048,3],[49.157,0],[51.13,3],[52.872,1],[56.355,1],[61.579,2],[63.321,1],[68.986,3],[72.052,1],[72.678,1],[77.276,2],[79.668,1],[82.5,3],[88.375,2],[91.208,3],[92.949,0],[97.106,3],[101.68,0],[104.072,3],[105.813,2],[109.296,3],[112.57,0],[118.677,3],[119.118,0]],"schwer":[[3.669,3],[7.129,0],[8.893,0],[9.543,3],[13.026,3],[14.095,0],[17.578,0],[18.924,3],[21.06,0],[24.567,2],[25.89,3],[28.05,3],[29.791,1],[32.833,3],[35.016,0],[36.757,1],[38.499,2],[40.89,3],[44.048,3],[46.742,0],[49.157,0],[51.13,3],[51.548,1],[54.613,3],[56.355,1],[59.838,1],[61.579,2],[63.321,1],[66.827,1],[68.986,3],[70.31,0],[72.678,1],[74.443,1],[77.276,2],[79.668,1],[81.409,2],[82.5,3],[86.634,1],[88.375,2],[91.208,3],[91.858,3],[93.623,1],[97.106,3],[99.939,2],[101.68,0],[104.072,3],[105.163,2],[106.905,3],[109.296,3],[112.57,0],[115.403,3],[116.053,3],[118.677,0],[119.931,0]]}};

  const DIFFICULTIES = {
    leicht: { label:'Leicht', travel:2.85, perfect:.060, good:.145 },
    mittel: { label:'Mittel', travel:2.55, perfect:.052, good:.125 },
    schwer: { label:'Schwer', travel:2.25, perfect:.045, good:.105 }
  };

  const params = new URLSearchParams(location.search);
  const trackKey = TRACKS[params.get('track')] ? params.get('track') : 'klangwald';
  const difficultyKey = DIFFICULTIES[params.get('difficulty')] ? params.get('difficulty') : 'leicht';
  const track = TRACKS[trackKey];
  const diff = DIFFICULTIES[difficultyKey];
  const chart = NOTE_MAPS[trackKey][difficultyKey].map(([time, lane], index) => ({ time, lane, index }));

  const stage = document.getElementById('bardStage');
  const audio = document.getElementById('bardAudio');
  const lanes = document.getElementById('bardLanes');
  const controls = document.querySelector('.bard-controls');
  const scoreEl = document.getElementById('bardScore');
  const bestEl = document.getElementById('bardBest');
  const feedback = document.getElementById('bardFeedback');
  const intro = document.getElementById('bardIntro');
  const result = document.getElementById('bardResult');
  const buttons = [...document.querySelectorAll('.bard-controls button')];
  const bestKey = `sinnesmagie-bard-best-${trackKey}-${difficultyKey}`;

  let score = 0;
  let running = false;
  let notes = [];
  let nextEvent = 0;
  let raf = 0;

  document.body.style.setProperty('--bard-bg', `url('${track.bg}')`);
  document.getElementById('bardTitle').textContent = track.title;
  document.getElementById('bardDifficulty').textContent = diff.label;
  document.getElementById('bardIntroTitle').textContent = `${track.title} – ${diff.label}`;
  bestEl.textContent = `Bestwert: ${Number(localStorage.getItem(bestKey) || 0).toLocaleString('de-DE')}`;
  audio.src = track.audio;
  audio.volume = Math.min(1, Math.max(0, Number(localStorage.getItem('sinnesmagie-volume')) || .5));

  function setScore(value) {
    score = Math.max(0, Math.round(value));
    scoreEl.textContent = score.toLocaleString('de-DE');
  }

  function spawnNote(event) {
    const laneEl = lanes.querySelector(`.bard-lane[data-lane="${event.lane}"]`);
    if (!laneEl) return;
    const el = document.createElement('i');
    el.className = 'bard-note';
    el.dataset.lane = String(event.lane);
    el.innerHTML = '♪';
    laneEl.appendChild(el);
    notes.push({ ...event, el, hit:false });
  }

  function progressFor(note) {
    return (audio.currentTime - (note.time - diff.travel)) / diff.travel;
  }

  function loop() {
    if (!running) return;

    while (nextEvent < chart.length && chart[nextEvent].time - audio.currentTime <= diff.travel) {
      spawnNote(chart[nextEvent]);
      nextEvent += 1;
    }

    for (const note of notes) {
      if (note.hit) continue;
      const progress = progressFor(note);
      note.el.style.top = `${Math.max(-8, Math.min(106, progress * 88))}%`;
      if (audio.currentTime > note.time + diff.good) {
        note.hit = true;
        note.el.remove();
        setScore(score - 10);
        show('Verpasst −10', 'bad');
      }
    }
    notes = notes.filter(note => !note.hit);

    if (audio.ended || (nextEvent >= chart.length && !notes.length && audio.currentTime > chart.at(-1).time + .5)) {
      finish();
      return;
    }
    raf = requestAnimationFrame(loop);
  }

  function show(text, kind) {
    feedback.textContent = text;
    feedback.className = `bard-feedback ${kind}`;
    clearTimeout(show.timer);
    show.timer = setTimeout(() => feedback.className = 'bard-feedback', 650);
  }

  function flashButton(lane) {
    const button = buttons[lane];
    if (!button) return;
    button.classList.add('pressed');
    clearTimeout(button._releaseTimer);
    button._releaseTimer = setTimeout(() => button.classList.remove('pressed'), 110);
  }

  function press(lane) {
    if (!running) return;
    flashButton(lane);
    const now = audio.currentTime;
    const candidates = notes
      .filter(note => !note.hit && note.lane === lane)
      .sort((a, b) => Math.abs(a.time - now) - Math.abs(b.time - now));
    const best = candidates[0];
    const distance = best ? Math.abs(best.time - now) : Infinity;

    if (!best || distance > diff.good) {
      setScore(score - 5);
      show('Zu früh −5', 'bad');
      return;
    }

    best.hit = true;
    best.el.remove();
    if (distance <= diff.perfect) {
      setScore(score + 10);
      show('Perfekt +10', 'great');
    } else {
      setScore(score + 5);
      show('Gut +5', 'good');
    }
    notes = notes.filter(note => !note.hit);
  }

  async function start() {
    intro.classList.add('hidden');
    result.classList.add('hidden');
    setScore(0);
    notes.forEach(note => note.el.remove());
    notes = [];
    nextEvent = 0;
    running = true;
    audio.currentTime = 0;
    try { await audio.play(); } catch (error) {
      running = false;
      intro.classList.remove('hidden');
      return;
    }
    raf = requestAnimationFrame(loop);
  }

  function finish() {
    if (!running) return;
    running = false;
    cancelAnimationFrame(raf);
    audio.pause();
    notes.forEach(note => note.el.remove());
    notes = [];
    const old = Number(localStorage.getItem(bestKey) || 0);
    const best = Math.max(old, score);
    localStorage.setItem(bestKey, String(best));
    document.getElementById('bardResultScore').textContent = score.toLocaleString('de-DE');
    document.getElementById('bardResultBest').textContent = score >= old
      ? 'Neuer persönlicher Bestwert!'
      : `Dein Bestwert: ${best.toLocaleString('de-DE')}`;
    bestEl.textContent = `Bestwert: ${best.toLocaleString('de-DE')}`;
    result.classList.remove('hidden');
  }

  document.getElementById('bardStart').onclick = start;
  document.getElementById('bardReplay').onclick = start;

  // Die gesamte untere Steuerungszone ist anklickbar. Auch Berührungen in den
  // Zwischenräumen und knapp neben einer Taste werden der nächsten Spur zugeordnet.
  document.addEventListener('pointerdown', event => {
    if (!running || event.pointerType === 'mouse' && event.button !== 0) return;
    const rect = controls.getBoundingClientRect();
    const generousTop = rect.top - 28;
    const generousBottom = Math.min(window.innerHeight, rect.bottom + 12);
    if (event.clientY < generousTop || event.clientY > generousBottom) return;
    if (event.clientX < rect.left - 8 || event.clientX > rect.right + 8) return;
    event.preventDefault();
    const relativeX = Math.max(0, Math.min(rect.width - .01, event.clientX - rect.left));
    press(Math.floor(relativeX / (rect.width / 4)));
  }, { passive:false });

  window.addEventListener('keydown', event => {
    const map = { a:0, s:1, d:2, f:3 };
    const lane = map[event.key.toLowerCase()];
    if (lane != null) press(lane);
  });
})();
