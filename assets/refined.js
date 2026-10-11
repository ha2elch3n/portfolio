/* Anime.js controls bounded transitions; cancellation always restores readable state. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const animate = window.anime?.animate;
  const channels = new Map();
  let projectCommit = null, currentPanel = null, previousImage = null, projectSnapshot = null;
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
  function finishProjectTransition() {
    stop('project'); stop('cards'); stop('project-out');
    projectSnapshot?.remove(); projectSnapshot = null;
  }
  window.portfolioUX = {
    switchPanel(id, apply) {
      // Finish immediately on interruption: no queued transitions or delayed navigation.
      finishPageTransition(); finishProjectTransition();
      const pending = projectCommit; projectCommit = null; pending?.();
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
    swapProject(apply, nextProject) {
      finishProjectTransition(); projectCommit = null;
      const body = document.querySelector('.work-body');
      const mobile = matchMedia('(max-width:700px)').matches;
      if (mobile) {
        const commit = () => {
          projectCommit = null; apply();
          run('project',[body],{opacity:[0.5,1],y:[6,0],duration:180,ease:'outCubic'});
        };
        projectCommit = commit;
        run('project',[body],{opacity:[1,0.6],duration:70,ease:'outCubic'},commit);
        return;
      }
      const order = ['crossin','research','chathub','kulikuli'];
      const previous = document.querySelector('[data-project][aria-pressed=true]')?.dataset.project;
      const direction = nextProject && order.indexOf(nextProject) < order.indexOf(previous) ? -1 : 1;
      if (!reduced.matches && animate && currentPanel === 'work') {
        // A non-interactive visual copy lets old and new content transition together.
        const snapshot = body.cloneNode(true);
        snapshot.classList.add('project-transition-copy'); snapshot.inert = true;
        snapshot.setAttribute('aria-hidden','true'); snapshot.removeAttribute('aria-labelledby');
        snapshot.querySelectorAll('[id]').forEach(node => {
          const source = body.querySelector(`[id="${node.id}"]`);
          const style = getComputedStyle(source);
          ['font','color','margin','width','height','border-radius','display'].forEach(property => node.style.setProperty(property,style.getPropertyValue(property)));
          node.removeAttribute('id');
        });
        snapshot.querySelectorAll('[tabindex]').forEach(node=>node.removeAttribute('tabindex'));
        snapshot.style.left = body.offsetLeft+'px'; snapshot.style.top = body.offsetTop+'px';
        snapshot.style.width = body.clientWidth+'px'; snapshot.style.height = body.clientHeight+'px';
        snapshot.querySelector('.gallery-area').scrollTop = body.querySelector('.gallery-area').scrollTop;
        body.parentElement.append(snapshot); projectSnapshot = snapshot;
        // ScrollTop can only be applied after attachment.
        snapshot.querySelector('.gallery-area').scrollTop = body.querySelector('.gallery-area').scrollTop;
        snapshot.querySelector('.project-summary').scrollTop = body.querySelector('.project-summary').scrollTop;
      }
      apply();
      if (currentPanel !== 'work') { finishProjectTransition(); return; }
      if (projectSnapshot) run('project-out',[projectSnapshot],{opacity:[1,0],x:[0,-20*direction],duration:200,ease:'outCubic'});
      run('project',[body],{opacity:[0,1],x:[20*direction,0],duration:200,ease:'outCubic'},finishProjectTransition);
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
  // Non-interactive text has very subtle scaling, separate from clickable controls.
  const readingGroups = {
    'reading-title': '.panel h1,.panel h2,.panel h3,.panel h4,#video-title',
    'reading-copy': '.hello-bio p,.hello-line,.hello-credential,.about-story p,.about-card p:not(.education-date),.skill-card li,.contact-description,.contact-role-list p,.contact-location,#project-description,#project-work,#project-responsibilities li,#viewer-context,.player-note',
    'reading-label': '.eyebrow,.hello-proof>span,.hello-proof strong,.profile-subtitle,.photo-caption,.profile-footer,.profile-badge,.education-date,.education-place,.project-kicker'
  };
  Object.entries(readingGroups).forEach(([className, selector]) => {
    document.querySelectorAll(selector).forEach(el => {
      if (!el.closest('a,button,select')) el.classList.add(className);
    });
  });
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
    finishPageTransition(); finishProjectTransition();
    const project = projectCommit; projectCommit = null;
    project?.(); positionIndicator(true);
  }
  reduced.addEventListener('change', reset); fine.addEventListener('change',reset); window.addEventListener('blur',reset);
  window.addEventListener('resize',()=>{finishPageTransition();finishProjectTransition();const pending=projectCommit;projectCommit=null;pending?.();});
  document.documentElement.classList.add('anime-motion');
})();
