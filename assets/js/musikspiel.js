(() => {
  const TRACKS = {
    farbenreich: { title:'Farbenreich', audio:'assets/audio/farbenreich_new.mp3', bg:'assets/images/level-backgrounds/farbenreich.webp' },
    duftgarten: { title:'Duftgarten', audio:'assets/audio/duftgarten_new.mp3', bg:'assets/images/level-backgrounds/duftgarten.webp' },
    klangwald: { title:'Klangwald', audio:'assets/audio/klangwald_minispiel_new.mp3', bg:'assets/images/level-backgrounds/klangwald.webp' },
    zauberschloss: { title:'Zauberschloss', audio:'assets/audio/bossencounter.mp3', bg:'assets/images/level-backgrounds/zauberschloss.webp' }
  };
  const DIFFICULTIES = {
    leicht: { label:'Leicht', interval:1.45, travel:2.7, maxNotes:22 },
    mittel:{ label:'Mittel', interval:1.0, travel:2.45, maxNotes:36 },
    schwer:{ label:'Schwer', interval:.68, travel:2.2, maxNotes:54 }
  };
  const params = new URLSearchParams(location.search);
  const trackKey = TRACKS[params.get('track')] ? params.get('track') : 'klangwald';
  const difficultyKey = DIFFICULTIES[params.get('difficulty')] ? params.get('difficulty') : 'leicht';
  const track = TRACKS[trackKey], diff = DIFFICULTIES[difficultyKey];
  const stage=document.getElementById('bardStage'), audio=document.getElementById('bardAudio'), lanes=document.getElementById('bardLanes');
  const scoreEl=document.getElementById('bardScore'), bestEl=document.getElementById('bardBest'), feedback=document.getElementById('bardFeedback');
  const intro=document.getElementById('bardIntro'), result=document.getElementById('bardResult');
  const bestKey=`sinnesmagie-bard-best-${trackKey}-${difficultyKey}`;
  let score=0, running=false, notes=[], spawned=0, spawnTimer=0, raf=0, startedAt=0;
  document.body.style.setProperty('--bard-bg', `url('${track.bg}')`);
  document.getElementById('bardTitle').textContent=track.title;
  document.getElementById('bardDifficulty').textContent=diff.label;
  document.getElementById('bardIntroTitle').textContent=`${track.title} – ${diff.label}`;
  bestEl.textContent=`Bestwert: ${Number(localStorage.getItem(bestKey)||0).toLocaleString('de-DE')}`;
  audio.src=track.audio; audio.volume=Math.min(1,Math.max(0,Number(localStorage.getItem('sinnesmagie-volume'))||.5));
  function setScore(v){score=Math.max(0,Math.round(v));scoreEl.textContent=score.toLocaleString('de-DE');}
  function createNote(){ if(!running||spawned>=diff.maxNotes)return; spawned++; const lane=Math.floor(Math.random()*4); const el=document.createElement('i');el.className='bard-note';el.dataset.lane=lane;el.innerHTML='♪';lanes.children[lane+1].appendChild(el);notes.push({el,lane,born:performance.now(),hit:false}); }
  function noteY(note,now){return (now-note.born)/(diff.travel*1000);}
  function loop(now){ if(!running)return; notes.forEach(n=>{if(n.hit)return;const p=noteY(n,now);n.el.style.top=`${Math.min(112,p*100)}%`;if(p>1.12){n.hit=true;n.el.remove();setScore(score-10);show('Verpasst −10','bad');}});notes=notes.filter(n=>!n.hit);if(audio.ended || (spawned>=diff.maxNotes&&!notes.length)){finish();return;}raf=requestAnimationFrame(loop); }
  function show(text,kind){feedback.textContent=text;feedback.className=`bard-feedback ${kind}`;clearTimeout(show.t);show.t=setTimeout(()=>feedback.className='bard-feedback',650);}
  function press(lane){if(!running)return;const candidates=notes.filter(n=>!n.hit&&n.lane===lane).sort((a,b)=>b.born-a.born);let best=null,bestDist=99;const now=performance.now();candidates.forEach(n=>{const d=Math.abs(noteY(n,now)-.88);if(d<bestDist){best=n;bestDist=d;}});if(!best||bestDist>.22){setScore(score-5);show('Zu früh −5','bad');return;}best.hit=true;best.el.remove();if(bestDist<.075){setScore(score+10);show('Perfekt +10','great');}else{setScore(score+5);show('Gut +5','good');}notes=notes.filter(n=>!n.hit);}
  async function start(){intro.classList.add('hidden');result.classList.add('hidden');setScore(0);spawned=0;notes.forEach(n=>n.el.remove());notes=[];running=true;audio.currentTime=0;try{await audio.play();}catch{}createNote();spawnTimer=setInterval(createNote,diff.interval*1000);startedAt=performance.now();raf=requestAnimationFrame(loop);}
  function finish(){if(!running)return;running=false;clearInterval(spawnTimer);cancelAnimationFrame(raf);audio.pause();const old=Number(localStorage.getItem(bestKey)||0),best=Math.max(old,score);localStorage.setItem(bestKey,String(best));document.getElementById('bardResultScore').textContent=score.toLocaleString('de-DE');document.getElementById('bardResultBest').textContent=score>=old?'Neuer persönlicher Bestwert!':`Dein Bestwert: ${best.toLocaleString('de-DE')}`;bestEl.textContent=`Bestwert: ${best.toLocaleString('de-DE')}`;result.classList.remove('hidden');}
  document.getElementById('bardStart').onclick=start;document.getElementById('bardReplay').onclick=start;
  document.querySelectorAll('[data-key]').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();press(Number(b.dataset.key));}));
  window.addEventListener('keydown',e=>{const map={a:0,s:1,d:2,f:3};if(map[e.key.toLowerCase()]!=null)press(map[e.key.toLowerCase()]);});
})();
