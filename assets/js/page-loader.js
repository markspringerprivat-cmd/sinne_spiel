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

  const IMAGE_EXT = /\.(?:png|jpe?g|webp|gif|svg|avif)$/i;
  const AUDIO_EXT = /\.(?:mp3|wav|ogg|m4a|aac|flac)$/i;
  const VIDEO_EXT = /\.(?:mp4|webm|ogv)$/i;
  const ASSET_LITERAL = /(?:\.\.\/|\.\/|\/)?assets\/[A-Za-z0-9_./%()\-]+?\.(?:png|jpe?g|webp|gif|svg|avif|mp3|wav|ogg|m4a|aac|flac|mp4|webm|ogv)/gi;
  const CSS_URL = /url\(\s*(['"]?)(.*?)\1\s*\)/gi;

  const areaInfo = {
    farbenreich: { enemy: 'farbgolem', fragment: 'red', music: 'farbenreich_new.mp3' },
    klangwald: { enemy: 'waldgeist', fragment: 'blue', music: 'klangwald_new.mp3' },
    tastminen: { enemy: 'maulwurf', fragment: 'gold', music: 'cave.mp3' },
    duftgarten: { enemy: 'duftgeist', fragment: 'purple', music: 'duftgarten_new.mp3' },
    flammenkueche: { enemy: 'feuergolem', fragment: 'green', music: 'volcano.mp3' },
    zauberschloss: { enemy: 'zauberer', fragment: null, music: 'zauberschloss_new.mp3' }
  };

  function A(path) {
    return new URL(path.replace(/^\/+/, ''), siteRoot).href;
  }

  function commonBattleAssets(area) {
    const info = areaInfo[area];
    if (!info) return [];
    const assets = [
      `assets/images/level-backgrounds/${area}.png`,
      `assets/images/battle-backgrounds/${area}.png`,
      'assets/images/characters/knight.png',
      'assets/images/characters/ritter_attack.png',
      'assets/images/characters/ritter_damage.png',
      'assets/images/characters/ritter_defeated.png',
      'assets/images/characters/ritter_victory.png',
      `assets/images/enemies/${info.enemy}.png`,
      `assets/images/enemies/${info.enemy}_damage.png`,
      `assets/images/enemies/${info.enemy}_defeated.png`,
      'assets/images/ui/parchment_popup.png',
      `assets/audio/${info.music}`,
      'assets/audio/correct.mp3',
      'assets/audio/falsch_3.mp3',
      'assets/audio/slice_cut.mp3',
      'assets/audio/magehit.mp3'
    ];
    if (area !== 'zauberschloss') assets.push(`assets/images/enemies/${info.enemy}_attack.png`);
    if (info.fragment) assets.push(`assets/images/fragments/${info.fragment}.png`);
    return assets;
  }

  function castleBossAssets() {
    return [
      'assets/audio/bossencounter.mp3',
      'assets/audio/castle_finale_itsover.mp3',
      'assets/audio/winfin.mp3',
      'assets/audio/hoersinn_C3.mp3',
      'assets/audio/hoersinn_D3.mp3',
      'assets/audio/hoersinn_E3.mp3',
      'assets/audio/hoersinn_F3.mp3',
      'assets/audio/hoersinn_G3.mp3',
      'assets/images/characters/knight_left_fall.png',
      'assets/images/characters/knight_left_jump.png',
      'assets/images/characters/knight_right_fall.png',
      'assets/images/characters/knight_right_jump.png',
      ...[
        'knight.png', 'knight_attack.png', 'knight_final_attack.png',
        'knight_run_left_1.png', 'knight_run_left_2.png',
        'knight_run_right_1.png', 'knight_run_right_2.png',
        'mage.png', 'mage_laugh.png', 'mage_surprised.png', 'mage_hover.png',
        'mage_fly_left.png', 'mage_fly_right.png', 'mage_shield.png',
        'mage_bush_fake.png', 'mage_bush_only.png', 'mage_bush_real.png',
        'smell_scent_cloud.png', 'smell_stink_cloud.png', 'mage_defeated.png'
      ].map(name => `assets/images/castle-combat/${name}`)
    ];
  }

  function explicitManifest() {
    const assets = [];

    if (pageStem === 'story') {
      for (let i = 1; i <= 14; i += 1) assets.push(`assets/images/story/panel-${String(i).padStart(2, '0')}.jpg`);
      assets.push('assets/audio/story_music.mp3');
    }

    if (pageStem === 'game') {
      assets.push(
        'assets/images/map/overworld.png',
        'assets/images/characters/knight.png',
        'assets/audio/overworld_new.mp3',
        ...['zauberschloss', 'farbenreich', 'klangwald', 'tastminen', 'duftgarten', 'flammenkueche'].map(area => `assets/qr/unlock-${area}.png`),
        ...['red', 'blue', 'gold', 'purple', 'green'].map(color => `assets/images/fragments/${color}.png`)
      );
    }

    if (pageStem === 'qr-codes') {
      assets.push(...['zauberschloss', 'farbenreich', 'klangwald', 'tastminen', 'duftgarten', 'flammenkueche'].map(area => `assets/qr/unlock-${area}.png`));
    }

    if (areaInfo[pageStem]) {
      assets.push(...commonBattleAssets(pageStem));
      if (pageStem === 'zauberschloss') assets.push(...castleBossAssets());
    }

    if (pageStem === 'tastminen-lore') {
      assets.push(
        'assets/images/minigame/mine_chasm_bg.png',
        'assets/images/minigame/cart_normal.png',
        'assets/audio/tastminen_minispiel_new.mp3'
      );
    }

    if (pageStem === 'klangwald-rhythm') {
      assets.push('assets/images/level-backgrounds/klangwald.png', 'assets/audio/klangwald_minispiel_new.mp3');
    }

    if (pageStem === 'farbenreich-malen') {
      assets.push('assets/images/level-backgrounds/farbenreich.png');
    }

    if (pageStem === 'flammenkueche-schnitt') {
      assets.push(
        'assets/images/battle-backgrounds/flammenkueche.png',
        'assets/audio/volcano.mp3',
        'assets/audio/slice_cut.mp3'
      );
    }

    if (pageStem === 'duftgarten-sprung') {
      assets.push(
        'assets/images/level-backgrounds/duftgarten.png',
        ...['flower_normal.png', 'flower_slime.png', 'flower_rotten.png', 'flower_gold.png', 'cloud_stink.png', 'knight_top.png', 'beetle_stink.png'].map(name => `assets/images/minigame/duftgarten/${name}`),
        'assets/audio/duftgarten_new.mp3',
        'assets/audio/slime_squish.mp3'
      );
    }

    if (pageStem === 'zauberschloss-pong') {
      assets.push(
        'assets/images/minigame/zauberschloss-pong/background.jpg',
        'assets/images/minigame/zauberschloss-pong/ritter_paddle.png',
        'assets/images/minigame/zauberschloss-pong/magier_paddle.png',
        'assets/images/minigame/zauberschloss-pong/wall1.png',
        'assets/images/ui/parchment_popup.png'
      );
    }

    if (pageStem === 'zauberschloss-dodge') {
      assets.push(
        'assets/images/battle-backgrounds/zauberschloss.png',
        'assets/images/characters/knight.png',
        'assets/images/enemies/zauberer_fly_left.png',
        'assets/images/enemies/zauberer_fly_right.png',
        'assets/audio/bossencounter.mp3'
      );
    }

    if (pageStem === 'zauberschloss-finale') {
      assets.push(
        'assets/images/finale/background.png',
        'assets/images/finale/knight_idle_finale.png',
        'assets/images/finale/knight_attack_finale.png',
        ...[1, 2, 3, 4, 5].map(i => `assets/images/finale/orb_stage_${i}.png`),
        ...[1, 2, 3, 4, 5, 6].map(i => `assets/images/finale/out_${i}.png`),
        'assets/images/characters/ritter_victory.png',
        ...['duftgeist', 'waldgeist', 'farbgolem', 'maulwurf', 'feuergolem'].map(enemy => `assets/images/enemies/${enemy}.png`),
        'assets/images/enemies/zauberer_defeated.png',
        'assets/audio/slice_cut.mp3',
        'assets/audio/magehit.mp3',
        'assets/audio/hopeful_happy_ending.mp3'
      );
    }

    return assets.map(A);
  }

  function sameOriginAsset(raw, base = document.baseURI) {
    if (!raw || /^(?:data:|blob:|javascript:|#)/i.test(raw)) return null;
    try {
      const url = new URL(raw, base);
      if (url.origin !== location.origin) return null;
      if (!/\.(?:png|jpe?g|webp|gif|svg|avif|mp3|wav|ogg|m4a|aac|flac|mp4|webm|ogv)(?:[?#].*)?$/i.test(url.href)) return null;
      url.hash = '';
      return url.href;
    } catch {
      return null;
    }
  }

  function collectDomAssets() {
    const found = [];
    document.querySelectorAll('img[src], audio[src], video[src], source[src], video[poster], input[type="image"][src]').forEach(el => {
      const raw = el.getAttribute('src') || el.getAttribute('poster');
      const url = sameOriginAsset(raw);
      if (url) found.push(url);
    });
    document.querySelectorAll('[style]').forEach(el => {
      const text = el.getAttribute('style') || '';
      for (const match of text.matchAll(CSS_URL)) {
        const url = sameOriginAsset(match[2]);
        if (url) found.push(url);
      }
    });
    return found;
  }

  async function collectCssAssets() {
    const found = [];
    const inlineStyles = [...document.querySelectorAll('style')].map(style => ({ text: style.textContent || '', base: document.baseURI }));
    const linked = [...document.querySelectorAll('link[rel="stylesheet"][href]')]
      .map(link => new URL(link.href, document.baseURI))
      .filter(url => url.origin === location.origin);

    const linkedStyles = await Promise.all(linked.map(async url => {
      try {
        const response = await fetch(url.href, { cache: 'force-cache' });
        return { text: await response.text(), base: url.href };
      } catch {
        return { text: '', base: url.href };
      }
    }));

    [...inlineStyles, ...linkedStyles].forEach(({ text, base }) => {
      for (const match of text.matchAll(CSS_URL)) {
        const url = sameOriginAsset(match[2], base);
        if (url) found.push(url);
      }
    });
    return found;
  }

  async function collectScriptLiteralAssets() {
    const found = [];
    const scripts = [...document.querySelectorAll('script[src]')]
      .map(el => new URL(el.src, document.baseURI))
      .filter(url => url.origin === location.origin && !url.pathname.endsWith('/page-loader.js'));

    await Promise.all(scripts.map(async url => {
      try {
        const response = await fetch(url.href, { cache: 'force-cache' });
        const source = await response.text();
        for (const match of source.matchAll(ASSET_LITERAL)) {
          const asset = sameOriginAsset(match[0], document.baseURI);
          if (asset) found.push(asset);
        }
      } catch {}
    }));
    return found;
  }

  function updateProgress(done, total, label = '') {
    const value = total > 0 ? Math.round((done / total) * 100) : 100;
    if (fill) fill.style.width = `${Math.max(3, value)}%`;
    if (percent) percent.textContent = `${value} %`;
    if (note) note.textContent = label || `Spieldateien werden vorbereitet: ${done} von ${total}`;
  }

  async function fetchWithTimeout(url, timeoutMs = 25000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { cache: 'force-cache', signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await response.blob();
      return true;
    } catch {
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function decodeImage(url) {
    if (!IMAGE_EXT.test(new URL(url).pathname)) return;
    await new Promise(resolve => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = async () => {
        try { if (img.decode) await img.decode(); } catch {}
        resolve();
      };
      img.onerror = resolve;
      img.src = url;
      if (img.complete && img.naturalWidth > 0) resolve();
    });
  }

  async function preloadAsset(url) {
    const ok = await fetchWithTimeout(url);
    if (ok && IMAGE_EXT.test(new URL(url).pathname)) await decodeImage(url);
    return ok;
  }

  async function runPool(items, worker, concurrency = 5) {
    let index = 0;
    const runners = Array.from({ length: Math.min(concurrency, Math.max(1, items.length)) }, async () => {
      while (index < items.length) {
        const current = items[index];
        index += 1;
        await worker(current);
      }
    });
    await Promise.all(runners);
  }

  async function begin() {
    try {
      updateProgress(0, 1, 'Benötigte Dateien werden ermittelt …');
      const [cssAssets, scriptAssets] = await Promise.all([
        collectCssAssets(),
        collectScriptLiteralAssets()
      ]);

      const all = new Set([
        ...explicitManifest(),
        ...collectDomAssets(),
        ...cssAssets,
        ...scriptAssets
      ]);

      const assets = [...all].filter(url => {
        try {
          const path = new URL(url).pathname;
          return IMAGE_EXT.test(path) || AUDIO_EXT.test(path) || VIDEO_EXT.test(path);
        } catch {
          return false;
        }
      });

      let done = 0;
      let failed = 0;
      updateProgress(done, assets.length || 1);

      await runPool(assets, async url => {
        const ok = await preloadAsset(url);
        if (!ok) failed += 1;
        done += 1;
        updateProgress(done, assets.length || 1);
      }, 5);

      const elapsed = performance.now() - startedAt;
      if (elapsed < 500) await new Promise(resolve => setTimeout(resolve, 500 - elapsed));

      updateProgress(assets.length || 1, assets.length || 1, failed ? 'Spiel ist bereit. Einige optionale Dateien werden bei Bedarf nachgeladen.' : 'Alles bereit.');
      await new Promise(resolve => setTimeout(resolve, 180));
    } finally {
      window.__sinnesmagieAssetsReady = true;
      document.documentElement.classList.remove('sm-page-loading');
      overlay?.classList.add('is-leaving');
      readyResolve?.();
      window.dispatchEvent(new CustomEvent('sinnesmagie:assets-ready'));
      setTimeout(() => overlay?.remove(), 420);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', begin, { once: true });
  } else {
    begin();
  }
})();
