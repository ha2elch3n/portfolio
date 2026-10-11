/* Anime.js controls bounded transitions; cancellation always restores readable state. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const animate = window.anime?.animate;
  const channels = new Map();
  let projectCommit = null, currentPanel = null, previousImage = null;
  function stop(channel) {
    const entry = channels.get(channel);
    if (!entry) return;
    entry.animation?.cancel();
    entry.targets.forEach(el => { el.style.removeProperty('opacity'); el.style.removeProperty('transform'); });
    channels.delete(channel);
  }
  function run(channel, nodes, options, done) {
    stop(channel);
    const targets = Array.from(nodes);
    if (!animate || reduced.matches || !targets.length) { done?.(); return; }
    const entry = {targets}; channels.set(channel, entry);
    entry.animation = animate(targets, {...options, onComplete: () => {
      if (channels.get(channel) !== entry) return;
      targets.forEach(el => {el.style.removeProperty('opacity');el.style.removeProperty('transform');});
      channels.delete(channel); done?.();
    }});
  }
  const nav = document.querySelector('header>nav');
  const indicator = document.createElement('span'); indicator.className = 'nav-indicator'; indicator.setAttribute('aria-hidden','true'); nav.prepend(indicator);
  let indicatorAnimation;
  function positionIndicator(instant = false) {
    const button = nav.querySelector('[aria-pressed=true]'); if (!button) return;
    indicatorAnimation?.cancel();
    const left = button.offsetLeft, width = button.offsetWidth;
    if (!animate || reduced.matches || instant) { indicator.style.left = left+'px'; indicator.style.width = width+'px'; }
    else indicatorAnimation = animate(indicator,{left,width,duration:200,ease:'outCubic'});
  }
  new ResizeObserver(() => positionIndicator(true)).observe(nav);
  function finishPageTransition() {
    stop('page-out'); stop('page-in');
    document.querySelectorAll('.panel-leaving,.panel-entering').forEach(panel => {
      panel.classList.remove('panel-leaving','panel-entering');
      panel.inert = false; panel.removeAttribute('aria-hidden');
      panel.hidden = panel.id !== currentPanel;
    });
  }
  window.portfolioUX = {
    switchPanel(id, apply) {
      // Finish immediately on interruption: no queued transitions or delayed navigation.
      finishPageTransition();
      const previous = currentPanel;
      const outgoing = previous ? document.getElementById(previous) : null;
      const focusWasInside = outgoing?.contains(document.activeElement);
      currentPanel = id;
      apply(); positionIndicator(!previous);
      if (!previous || previous === id || reduced.matches || !animate) return;
      const order = ['home','work','about','contact'];
      const direction = order.indexOf(id) > order.indexOf(previous) ? 1 : -1;
      const incoming = document.getElementById(id);
      outgoing.hidden = false; outgoing.inert = true;
      outgoing.setAttribute('aria-hidden','true'); outgoing.classList.add('panel-leaving');
      incoming.classList.add('panel-entering');
      if (focusWasInside) nav.querySelector(`[data-panel="${id}"]`)?.focus({preventScroll:true});
      // Both panels move on the same beat; the header and footer stay still.
      run('page-out',[outgoing],{opacity:[1,0],x:[0,-24*direction],duration:220,ease:'outCubic'});
      run('page-in',[incoming],{opacity:[0,1],x:[24*direction,0],duration:220,ease:'outCubic'},finishPageTransition);
    },
    swapProject(apply) {
      stop('project'); stop('cards'); projectCommit = null;
      const body = document.querySelector('.work-body');
      const commit = () => {
        projectCommit = null; apply();
        run('project',[document.querySelector('.project-summary')],{opacity:[0.5,1],y:[6,0],duration:180,ease:'outCubic'});
        // Animate the buttons, leaving their stable inner surface free for hover feedback.
        run('cards',document.querySelectorAll('.video-card'),{opacity:[0.5,1],y:[6,0],delay:(_,i)=>Math.min(i,7)*25,duration:180,ease:'outCubic'});
      };
      projectCommit = commit;
      run('project',[body],{opacity:[1,0.6],duration:70,ease:'outCubic'},commit);
    },
    openViewer() { run('viewer',[document.getElementById('player')],{opacity:[0,1],scale:[0.98,1],duration:180,ease:'outCubic'}); },
    imageChange() {
      stop('image'); stop('image-out'); previousImage?.remove(); previousImage = null;
      const current = document.getElementById('focused-image');
      if (!reduced.matches && document.getElementById('player').open && !current.hidden && current.complete && current.naturalWidth) {
        previousImage = current.cloneNode(); previousImage.removeAttribute('id'); previousImage.alt = ''; previousImage.setAttribute('aria-hidden','true');
        previousImage.className = 'image-transition-layer'; current.parentElement.append(previousImage);
      }
    }
  };
  const image = document.getElementById('focused-image');
  image.addEventListener('load', () => {
    if (document.getElementById('player').open && !image.hidden) {
      run('image',[image],{opacity:[0.4,1],duration:150,ease:'outCubic'});
      const old = previousImage;
      if (old) run('image-out',[old],{opacity:[1,0],duration:150,ease:'outCubic'},()=>{old.remove();if(previousImage===old)previousImage=null;});
    }
  });
  document.getElementById('player').addEventListener('close',()=>{stop('viewer');stop('image');stop('image-out');previousImage?.remove();previousImage=null;});
  // Card hover uses CSS on stable surfaces, independent of page-entry animations.
  const hoverTargets = document.querySelectorAll('.contact-link,button:not(.video-card)');
  hoverTargets.forEach(el => {
    el.dataset.motion = '';
    const channel = el;
    const feedback = (y, scale=1) => {
      if (!fine.matches || reduced.matches || el.disabled) return;
      run(channel,[el],{y,scale,rotate:el.matches('.profile-card')?1:0,duration:160,ease:'outCubic'},()=>{
        // Retain the end pose while hovered; pointerleave restores the baseline.
        if (el.matches(':hover') && y) el.style.transform = `translateY(${y}px)${el.matches('.profile-card')?' rotate(1deg)':''}`;
      });
    };
    el.addEventListener('pointerenter',()=>feedback(-2));
    el.addEventListener('pointerleave',()=>{stop(channel);feedback(0);});
    el.addEventListener('pointerdown',event=>{if(event.button===0 && el.matches('button,a'))feedback(-1,.98);});
    el.addEventListener('pointerup',()=>feedback(el.matches(':hover')?-2:0));
    el.addEventListener('pointercancel',()=>stop(channel));
  });
  function reset() {
    [...channels.keys()].forEach(stop); indicatorAnimation?.cancel();
    hoverTargets.forEach(el=>el.style.removeProperty('transform')); previousImage?.remove(); previousImage=null;
    finishPageTransition();
    const project = projectCommit; projectCommit = null;
    project?.(); positionIndicator(true);
  }
  reduced.addEventListener('change', reset); fine.addEventListener('change',reset); window.addEventListener('blur',reset);
  window.addEventListener('resize',finishPageTransition);
  document.documentElement.classList.add('anime-motion');
})();
