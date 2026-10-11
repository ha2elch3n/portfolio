/* Anime.js 4.5.0 · local bundle · MIT. Motion never hides required content. */
(() => {
  if (window.portfolioUX || !window.anime?.animate) return;
  const { animate } = window.anime;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const targets = [...document.querySelectorAll('.about-card, .profile-card, .profile-badge, .contact-link, button:not(.video-card)')];
  const running = new Map();
  let hovered = null, pressed = null;
  function stop(el) { running.get(el)?.cancel(); running.delete(el); }
  function move(el) {
    if (!el) return;
    stop(el);
    if (reduced.matches) { el.style.removeProperty('transform'); return; }
    const card = el.matches('.about-card, .profile-card');
    running.set(el, animate(el, {
      y: el === hovered ? (card ? -3 : -2) : 0,
      scale: el === pressed ? .97 : 1,
      rotate: el.matches('.profile-card') ? 1 : 0,
      duration: el === pressed ? 100 : 180,
      ease: 'outCubic',
      onComplete: () => running.delete(el)
    }));
  }
  targets.forEach(el => {
    el.dataset.motion = '';
    el.addEventListener('pointerenter', () => {
      if (!fine.matches || reduced.matches || el.disabled) return;
      hovered = el; move(el);
    });
    el.addEventListener('pointerleave', () => {
      if (hovered === el) hovered = null;
      if (pressed === el) pressed = null;
      move(el);
    });
    if (el.matches('button, .contact-link')) el.addEventListener('pointerdown', e => {
      if (e.button !== 0 || el.disabled) return;
      pressed = el; move(el);
    });
  });
  function release() { const el = pressed; pressed = null; move(el); }
  document.addEventListener('pointerup', release);
  document.addEventListener('pointercancel', release);
  function reset() {
    hovered = pressed = null;
    for (const [el, animation] of running) { animation.cancel(); el.style.removeProperty('opacity'); }
    running.clear();
    targets.forEach(el => el.style.removeProperty('transform'));
  }
  window.addEventListener('blur', reset);
  reduced.addEventListener('change', reset);
  fine.addEventListener('change', reset);
  function enter() {
    reset();
    if (reduced.matches) return;
    const panel = document.querySelector('.panel.active');
    if (!panel) return;
    // Small fade only: text stays sharp and scrolling stays stable.
    running.set(panel, animate(panel, {
      opacity: [.65, 1], duration: 220, ease: 'outCubic',
      onComplete: () => running.delete(panel)
    }));
  }
  document.documentElement.classList.add('anime-motion');
  window.addEventListener('hashchange', enter);
  enter();
})();
