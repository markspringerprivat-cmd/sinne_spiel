(() => {
  'use strict';

  const NAME_KEY = 'sinnesmagie-player-name';
  const FIRST_KEY = 'sinnesmagie-player-first-name';
  const LAST_KEY = 'sinnesmagie-player-last-name';

  const openButton = document.getElementById('openStartFlow');
  const modal = document.getElementById('startFlowModal');
  const nameStep = document.getElementById('nameStep');
  const choiceStep = document.getElementById('storyChoiceStep');
  const firstInput = document.getElementById('playerFirstName');
  const lastInput = document.getElementById('playerLastName');
  const error = document.getElementById('nameStepError');
  const saveButton = document.getElementById('saveFullName');

  const watchStoryButton = document.getElementById('watchIntroStory');
  const storyFrame = document.getElementById('introStoryFrame');

  function cleanPart(value, max) {
    return String(value || '')
      .replace(/[<>]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, max);
  }

  function splitStoredName() {
    const first = localStorage.getItem(FIRST_KEY) || '';
    const last = localStorage.getItem(LAST_KEY) || '';
    if (first || last) return { first, last };
    const full = (localStorage.getItem(NAME_KEY) || '').trim();
    const parts = full.split(/\s+/).filter(Boolean);
    return {
      first: parts.shift() || '',
      last: parts.join(' ')
    };
  }

  function openFlow() {
    const saved = splitStoredName();
    firstInput.value = saved.first;
    lastInput.value = saved.last;
    nameStep.classList.remove('hidden');
    choiceStep.classList.add('hidden');
    error.classList.add('hidden');
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    window.setTimeout(() => firstInput.focus(), 40);
  }

  function saveName() {
    const first = cleanPart(firstInput.value, 30);
    const last = cleanPart(lastInput.value, 40);
    if (!first || !last) {
      error.classList.remove('hidden');
      (!first ? firstInput : lastInput).focus();
      return;
    }
    error.classList.add('hidden');
    const fullName = `${first} ${last}`;
    localStorage.setItem(FIRST_KEY, first);
    localStorage.setItem(LAST_KEY, last);
    if (window.SinnesScore?.setName) window.SinnesScore.setName(fullName);
    else localStorage.setItem(NAME_KEY, fullName);
    nameStep.classList.add('hidden');
    choiceStep.classList.remove('hidden');
    window.SinnesCloud?.scheduleSync?.(100);
  }

  openButton?.addEventListener('click', openFlow);
  watchStoryButton?.addEventListener('click', () => {
    // Der Story-Frame ist bereits geladen. Dadurch wird startStory() noch innerhalb
    // dieses echten Nutzerklicks aufgerufen und die Hintergrundmusik darf sofort starten.
    if (storyFrame?.contentWindow?.startStoryFromParent) {
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
      storyFrame.classList.remove('hidden');
      storyFrame.contentWindow.startStoryFromParent();
      return;
    }

    // Sicherheitsfallback, falls der Frame auf einem sehr langsamen Gerät noch lädt.
    sessionStorage.setItem('sinnesmagie-play-intro-story', '1');
    window.location.assign('story.html?autoplay=1');
  });
  saveButton?.addEventListener('click', saveName);
  [firstInput, lastInput].forEach(input => input?.addEventListener('keydown', event => {
    if (event.key === 'Enter') saveName();
  }));
})();
