(() => {
  const audio = document.getElementById('villageMusic');
  const volume = Math.min(1, Math.max(0, Number(localStorage.getItem('sinnesmagie-volume')) || .5));
  if (audio) {
    audio.volume = volume;
    const start = () => audio.play().catch(() => {});
    start();
    document.addEventListener('pointerdown', start, { once: true });
  }
})();
