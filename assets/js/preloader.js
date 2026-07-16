
(() => {
  if (window.__sinnesmagiePreloaderInstalled) return;
  window.__sinnesmagiePreloaderInstalled = true;

  const overlay = document.createElement('div');
  overlay.id = 'assetPreloader';
  overlay.className = 'asset-preloader';
  overlay.innerHTML = `
    <div class="asset-preloader-card" role="status" aria-live="polite">
      <div class="asset-preloader-title">Lädt …</div>
      <div class="asset-preloader-track"><div id="assetPreloaderFill" class="asset-preloader-fill"></div></div>
      <div id="assetPreloaderNote" class="asset-preloader-note">Bilder und Musik werden vorbereitet.</div>
    </div>
  `;
  document.addEventListener('DOMContentLoaded', () => {
    document.body.appendChild(overlay);
    beginPreload();
  });

  function assetElements() {
    return [
      ...document.images,
      ...document.querySelectorAll('audio, video')
    ];
  }

  function waitForAsset(el) {
    return new Promise(resolve => {
      if (el.tagName === 'IMG') {
        if (el.complete && el.naturalWidth > 0) return resolve();
        el.addEventListener('load', resolve, { once: true });
        el.addEventListener('error', resolve, { once: true });
        return;
      }
      if (el.tagName === 'AUDIO' || el.tagName === 'VIDEO') {
        if (el.readyState >= 2) return resolve();
        el.addEventListener('loadeddata', resolve, { once: true });
        el.addEventListener('canplay', resolve, { once: true });
        el.addEventListener('error', resolve, { once: true });
        try { el.load(); } catch {}
        setTimeout(resolve, 1600);
        return;
      }
      resolve();
    });
  }

  async function beginPreload() {
    const fill = document.getElementById('assetPreloaderFill');
    const note = document.getElementById('assetPreloaderNote');
    const assets = assetElements();
    let done = 0;
    const minDelay = new Promise(resolve => setTimeout(resolve, 650));

    const tasks = assets.map(el => waitForAsset(el).then(() => {
      done += 1;
      const pct = assets.length ? Math.round((done / assets.length) * 100) : 100;
      if (fill) fill.style.width = `${pct}%`;
      if (note) note.textContent = `Bereit: ${pct}%`;
    }));

    await Promise.race([
      Promise.all(tasks),
      new Promise(resolve => setTimeout(resolve, 2600))
    ]);
    await minDelay;
    if (fill) fill.style.width = '100%';
    overlay.classList.add('is-hidden');
    setTimeout(() => overlay.remove(), 360);
  }
})();
