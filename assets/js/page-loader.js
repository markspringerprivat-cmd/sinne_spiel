(() => {
  if (window.__sinnesmagiePageLoaderInstalled) return;
  window.__sinnesmagiePageLoaderInstalled = true;

  const script = document.currentScript;
  const siteRoot = new URL('../../', script?.src || document.baseURI);
  const overlay = document.getElementById('globalPageLoader');
  const fill = document.getElementById('globalPageLoaderFill');
  const percent = document.getElementById('globalPageLoaderPercent');
  const note = document.getElementById('globalPageLoaderNote');
  const pageName = decodeURIComponent(location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const pageStem = pageName.replace(/\.html?$/, '');
  const startedAt = performance.now();

  let readyResolve;
  window.__sinnesmagieAssetsReady = false;
  window.__sinnesmagieAssetsReadyPromise = new Promise(resolve => { readyResolve = resolve; });

  const IMAGE_RE = /\.(?:png|jpe?g|webp|gif|svg|avif)(?:[?#].*)?$/i;
  const AUDIO_RE = /\.(?:mp3|wav|ogg|m4a|aac)(?:[?#].*)?$/i;

  const areaInfo = {
    farbenreich: { enemy: 'farbgolem', fragment: 'red', music: 'farbenreich_new.mp3' },
    klangwald: { enemy: 'waldgeist', fragment: 'blue', music: 'klangwald_new.mp3' },
    tastminen: { enemy: 'maulwurf', fragment: 'gold', music: 'cave.mp3' },
    duftgarten: { enemy: 'duftgeist', fragment: 'purple', music: 'duftgarten_new.mp3' },
    flammenkueche: { enemy: 'feuergolem', fragment: 'green', music: 'volcano.mp3' },
    zauberschloss: { enemy: 'zauberer', fragment: null, music: 'zauberschloss_new.mp3' }
  };

  const A = path => new URL(path.replace(/^\/+/, ''), siteRoot).href;
  const unique = list => [...new Set(list.filter(Boolean))];

  function areaCore(area) {
    return [
      `assets/images/level-backgrounds/${area}.webp`,
      'assets/images/characters/knight.png'
    ];
  }

  function areaDeferred(area) {
    const info = areaInfo[area];
    if (!info) return [];
    const list = [
      `assets/images/battle-backgrounds/${area}.webp`,
      `assets/images/enemies/${info.enemy}.png`,
      `assets/images/enemies/${info.enemy}_damage.png`,
      `assets/images/enemies/${info.enemy}_defeated.png`,
      'assets/images/characters/ritter_attack.png',
      'assets/images/characters/ritter_damage.png',
      'assets/images/characters/ritter_defeated.png',
      'assets/images/characters/ritter_victory.png',
      'assets/images/ui/parchment_popup.png',
      `assets/audio/${info.music}`,
      'assets/audio/correct.mp3',
      'assets/audio/falsch_3.mp3',
      'assets/audio/slice_cut.mp3',
      'assets/audio/magehit.mp3'
    ];
    if (area !== 'zauberschloss') list.push(`assets/images/enemies/${info.enemy}_attack.png`);
    if (info.fragment) list.push(`assets/images/fragments/${info.fragment}.png`);
    return list;
  }

  function castleBossDeferred() {
    return [
      'assets/audio/bossencounter.mp3', 'assets/audio/castle_finale_itsover.mp3', 'assets/audio/winfin.mp3',
      'assets/audio/hoersinn_C3.mp3', 'assets/audio/hoersinn_D3.mp3', 'assets/audio/hoersinn_E3.mp3',
      'assets/audio/hoersinn_F3.mp3', 'assets/audio/hoersinn_G3.mp3',
      'assets/images/characters/knight_left_fall.png', 'assets/images/characters/knight_left_jump.png',
      'assets/images/characters/knight_right_fall.png', 'assets/images/characters/knight_right_jump.png',
      ...[
        'knight.png', 'knight_attack.png', 'knight_final_attack.png',
        'knight_run_left_1.png', 'knight_run_left_2.png', 'knight_run_right_1.png', 'knight_run_right_2.png',
        'mage.png', 'mage_laugh.png', 'mage_surprised.png', 'mage_hover.png',
        'mage_fly_left.png', 'mage_fly_right.png', 'mage_shield.png',
        'mage_bush_fake.png', 'mage_bush_only.png', 'mage_bush_real.png',
        'smell_scent_cloud.png', 'smell_stink_cloud.png', 'mage_defeated.png'
      ].map(name => `assets/images/castle-combat/${name}`)
    ];
  }

  function manifests() {
    const core = [];
    const deferred = [];

    if (pageStem === 'story') {
      core.push('assets/images/story/panel-01.jpg');
      deferred.push(...Array.from({ length: 13 }, (_, i) => `assets/images/story/panel-${String(i + 2).padStart(2, '0')}.jpg`), 'assets/audio/intro_music.mp3');
    } else if (pageStem === 'game') {
      core.push('assets/images/map/overworld.webp', 'assets/images/characters/knight.png');
      deferred.push('assets/audio/overworld_new.mp3',
        ...['zauberschloss','farbenreich','klangwald','tastminen','duftgarten','flammenkueche'].map(a => `assets/qr/unlock-${a}.png`),
        ...['red','blue','gold','purple','green'].map(c => `assets/images/fragments/${c}.png`));
    } else if (pageStem === 'qr-codes') {
      core.push('assets/qr/unlock-zauberschloss.png');
      deferred.push(...['farbenreich','klangwald','tastminen','duftgarten','flammenkueche'].map(a => `assets/qr/unlock-${a}.png`));
    } else if (areaInfo[pageStem]) {
      core.push(...areaCore(pageStem));
      if (pageStem === 'zauberschloss') {
        // Der große Zaubererkampf benötigt seine Sprites bereits beim ersten Bild.
        // Deshalb werden sie auf der Ziel-HTML vollständig geladen, bevor die Seite freigegeben wird.
        core.push(...areaDeferred(pageStem), ...castleBossDeferred());
      } else {
        deferred.push(...areaDeferred(pageStem));
      }
    } else if (pageStem === 'tastminen-lore') {
      core.push('assets/images/minigame/mine_chasm_bg.webp', 'assets/images/minigame/cart_normal.png');
      deferred.push('assets/audio/tastminen_minispiel_new.mp3');
    } else if (pageStem === 'klangwald-rhythm') {
      core.push('assets/images/level-backgrounds/klangwald.webp');
      deferred.push('assets/audio/klangwald_minispiel_new.mp3');
    } else if (pageStem === 'farbenreich-malen') {
      core.push('assets/images/level-backgrounds/farbenreich.webp');
    } else if (pageStem === 'flammenkueche-schnitt') {
      core.push('assets/images/battle-backgrounds/flammenkueche.webp');
      deferred.push('assets/audio/volcano.mp3', 'assets/audio/slice_cut.mp3');
    } else if (pageStem === 'duftgarten-sprung') {
      core.push('assets/images/level-backgrounds/duftgarten.webp', 'assets/images/minigame/duftgarten/flower_normal.png');
      deferred.push(
        ...['flower_slime.png','flower_rotten.png','flower_gold.png','cloud_stink.png','knight_top.png','beetle_stink.png'].map(n => `assets/images/minigame/duftgarten/${n}`),
        'assets/audio/duftgarten_new.mp3', 'assets/audio/slime_squish.mp3');
    } else if (pageStem === 'zauberschloss-pong') {
      core.push('assets/images/minigame/zauberschloss-pong/background.jpg', 'assets/images/minigame/zauberschloss-pong/ritter_paddle.png', 'assets/images/minigame/zauberschloss-pong/magier_paddle.png');
      deferred.push('assets/images/minigame/zauberschloss-pong/wall1.png', 'assets/images/ui/parchment_popup.png');
    } else if (pageStem === 'zauberschloss-dodge') {
      core.push('assets/images/battle-backgrounds/zauberschloss.webp', 'assets/images/characters/knight.png');
      deferred.push('assets/images/enemies/zauberer_fly_left.png', 'assets/images/enemies/zauberer_fly_right.png', 'assets/audio/bossencounter.mp3');
    } else if (pageStem === 'zauberschloss-finale') {
      core.push('assets/images/finale/background.webp', 'assets/images/finale/knight_idle_finale.png', 'assets/images/finale/orb_stage_1.png');
      deferred.push(
        'assets/images/finale/knight_attack_finale.png',
        ...[2,3,4,5].map(i => `assets/images/finale/orb_stage_${i}.png`),
        ...[1,2,3,4,5,6].map(i => `assets/images/finale/out_${i}.webp`),
        ...[
          'credits_01_waldgeist.webp','credits_02_maulwurf.webp','credits_03_feuergolem.webp',
          'credits_04_farbgolem.webp','credits_05_duftgeist.webp','credits_06_stuermen.webp',
          'credits_07_handreichen.webp','credits_08_feier.webp','credits_09_danke.webp'
        ].map(n => `assets/images/finale/credits/${n}`),
        'assets/audio/slice_cut.mp3','assets/audio/magehit.mp3','assets/audio/hopeful_happy_ending.mp3');
    }

    return {
      core: unique(core.map(A)),
      deferred: unique(deferred.map(A))
    };
  }

  function updateProgress(done, total, message = 'Spiel wird vorbereitet …') {
    const ratio = total ? Math.min(1, done / total) : 1;
    if (fill) fill.style.width = `${Math.round(ratio * 100)}%`;
    if (percent) percent.textContent = `${Math.round(ratio * 100)} %`;
    if (note) note.textContent = message;
  }

  function timeout(ms) {
    return new Promise(resolve => setTimeout(() => resolve(false), ms));
  }

  function preloadImage(url, ms = 8000) {
    return Promise.race([
      new Promise(resolve => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = async () => {
          try { if (img.decode) await img.decode(); } catch {}
          resolve(true);
        };
        img.onerror = () => resolve(false);
        img.src = url;
        if (img.complete && img.naturalWidth > 0) resolve(true);
      }),
      timeout(ms)
    ]);
  }

  async function preload(url, ms = 8000) {
    if (IMAGE_RE.test(url)) return preloadImage(url, ms);
    // Audio/video must never block the first screen. Deferred fetch only.
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), ms);
      const response = await fetch(url, { cache: 'force-cache', signal: controller.signal });
      clearTimeout(timer);
      return response.ok;
    } catch { return false; }
  }

  async function runPool(items, worker, concurrency) {
    let index = 0;
    const count = Math.min(concurrency, Math.max(1, items.length));
    await Promise.all(Array.from({ length: count }, async () => {
      while (index < items.length) {
        const item = items[index++];
        await worker(item);
      }
    }));
  }

  function releasePage() {
    window.__sinnesmagieAssetsReady = true;
    document.documentElement.classList.remove('sm-page-loading');
    overlay?.classList.add('is-leaving');
    readyResolve?.();
    window.dispatchEvent(new CustomEvent('sinnesmagie:assets-ready'));
    setTimeout(() => overlay?.remove(), 420);
  }

  function startDeferred(list) {
    if (!list.length) return;
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const saveData = Boolean(connection?.saveData);
    const verySlow = /(^|-)2g$/.test(connection?.effectiveType || '');
    if (saveData || verySlow) return;

    const task = () => runPool(list, url => preload(url, 12000), 2).catch(() => {});
    if ('requestIdleCallback' in window) requestIdleCallback(task, { timeout: 1800 });
    else setTimeout(task, 500);
  }

  async function begin() {
    const { core, deferred } = manifests();
    let done = 0;
    let failed = 0;
    updateProgress(0, Math.max(1, core.length), 'Wichtige Inhalte werden geladen …');

    await runPool(core, async url => {
      const ok = await preload(url, 8000);
      if (!ok) failed += 1;
      done += 1;
      updateProgress(done, Math.max(1, core.length));
    }, 6);

    const elapsed = performance.now() - startedAt;
    if (elapsed < 260) await new Promise(resolve => setTimeout(resolve, 260 - elapsed));
    updateProgress(Math.max(1, core.length), Math.max(1, core.length), failed ? 'Spiel ist bereit. Weitere Inhalte laden im Hintergrund.' : 'Spiel ist bereit.');
    await new Promise(resolve => setTimeout(resolve, 100));
    releasePage();
    startDeferred(deferred);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', begin, { once: true });
  else begin();
})();
