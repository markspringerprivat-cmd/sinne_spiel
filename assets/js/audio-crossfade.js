(function () {
  class CrossfadeLoop {
    constructor(audioElement, options = {}) {
      this.sourceElement = audioElement;
      this.src = audioElement ? audioElement.currentSrc || audioElement.src : '';
      this.fadeSeconds = options.fadeSeconds || 0.025;
      this.monitorMs = options.monitorMs || 70;
      this.volume = 0.5;
      this.isPlaying = false;
      this.isFading = false;
      this.monitorId = null;
      this.activeIndex = 0;

      this.tracks = [audioElement, new Audio(this.src)].filter(Boolean);
      this.tracks.forEach(track => {
        track.loop = false;
        track.preload = 'auto';
        track.volume = 0;
      });
    }

    setVolume(value) {
      const volume = Math.min(1, Math.max(0, Number(value)));
      this.volume = Number.isFinite(volume) ? volume : 0.5;

      if (!this.isFading) {
        this.currentTrack().volume = this.isPlaying ? this.volume : 0;
        this.nextTrack().volume = 0;
      }
    }

    play() {
      if (!this.currentTrack()) return Promise.resolve();
      this.isPlaying = true;
      const current = this.currentTrack();
      current.loop = false;
      current.volume = this.volume;
      this.startMonitor();
      return current.play().catch(() => {});
    }

    pause() {
      this.isPlaying = false;
      this.stopMonitor();
      this.tracks.forEach(track => {
        track.pause();
        track.volume = 0;
      });
    }

    currentTrack() {
      return this.tracks[this.activeIndex];
    }

    nextTrack() {
      return this.tracks[1 - this.activeIndex];
    }

    startMonitor() {
      if (this.monitorId) return;
      this.monitorId = window.setInterval(() => this.checkLoopPoint(), this.monitorMs);
    }

    stopMonitor() {
      if (!this.monitorId) return;
      window.clearInterval(this.monitorId);
      this.monitorId = null;
    }

    checkLoopPoint() {
      if (!this.isPlaying || this.isFading) return;
      const current = this.currentTrack();
      if (!current) return;

      const duration = current.duration;
      if (!Number.isFinite(duration) || duration <= 0) return;

      const remaining = duration - current.currentTime;
      if (remaining <= this.fadeSeconds + 0.035) {
        this.crossfadeToNext();
      }
    }

    crossfadeToNext() {
      const oldTrack = this.currentTrack();
      const newTrack = this.nextTrack();
      if (!oldTrack || !newTrack) return;

      this.isFading = true;
      newTrack.pause();
      try { newTrack.currentTime = 0; } catch {}
      newTrack.loop = false;
      newTrack.volume = 0;

      newTrack.play().then(() => {
        const startTime = performance.now();
        const durationMs = this.fadeSeconds * 1000;

        const step = now => {
          if (!this.isPlaying) {
            this.isFading = false;
            return;
          }

          const progress = Math.min(1, (now - startTime) / durationMs);
          oldTrack.volume = this.volume * (1 - progress);
          newTrack.volume = this.volume * progress;

          if (progress < 1) {
            window.requestAnimationFrame(step);
            return;
          }

          oldTrack.pause();
          try { oldTrack.currentTime = 0; } catch {}
          oldTrack.volume = 0;
          newTrack.volume = this.volume;
          this.activeIndex = 1 - this.activeIndex;
          this.isFading = false;
        };

        window.requestAnimationFrame(step);
      }).catch(() => {
        this.isFading = false;
      });
    }
  }

  window.createCrossfadeLoop = function createCrossfadeLoop(audioElement, options) {
    return new CrossfadeLoop(audioElement, options);
  };
}());
