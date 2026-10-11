(() => {
  const $ = id => document.getElementById(id);
  const text = value => Array.isArray(value) ? value[1] : value;
  let project = ['crossin','research','chathub','kulikuli'].includes(new URLSearchParams(location.search).get('project')) ? new URLSearchParams(location.search).get('project') : 'crossin', format = 'video', viewIndex = 0, viewItems = [], slideIndex = 0;
  const projects = {
    crossin: { name: 'crossin', label: 'rednote / Meta paid assets', logo: 'crossin', site: 'https://www.crossin.com/', social: 'https://www.instagram.com/crossin.post/', socialLabel: 'Instagram', description: 'A postcard app for sharing photos and staying close to the people you miss', work: 'Paid video ads for Meta, designed to drive app downloads', role: 'Audience research / Concepts / Copy / Video production' },
    research: { name: 'rednote', logo: 'rednote', site: 'https://www.rednote.com/', label: 'rednote / User interview recruitment', description: 'Recruitment videos and posters for user interviews, alongside community campaign materials', work: 'Creative for Instagram and TikTok, tailored to different cities and interest groups', role: 'Audience research / Copy / Videos / Posters' },
    chathub: { name: 'ChatHub', label: 'If Tech / TikTok content', logo: 'chathub', site: 'https://chathub.gg/', social: 'https://www.tiktok.com/@chathub.gg.au', socialLabel: 'TikTok', description: 'An AI workspace for using and comparing multiple chatbots side by side', work: 'Content for the official TikTok account, turning product features into relatable short videos', role: 'Ideas / Scripts / Filming / Editing' },
    kulikuli: { name: 'KuliKuli', label: 'If Tech / Instagram content', logo: 'kulikuli', site: 'https://kulikuli.app/', social: 'https://www.instagram.com/kulikuliapp__/', socialLabel: 'Instagram', description: 'A travel translation app for menus, shopping and cultural discovery', work: 'Reels and carousel posts for the official Instagram account, built around everyday travel', role: 'Ideas / Scripts / Filming / Editing' }
  };
  function items() {
    if (project === 'chathub') return videos;
    if (project === 'research') return portfolioMedia.research.filter(item => item.type === format);
    return portfolioMedia[project];
  }
  function titleOf(item) { return text(item.displayTitle || item.title); }
  function icon(name) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('ui-icon'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#icon-' + name); svg.append(use); return svg;
  }
  // Keep natural image proportions and DOM reading order in a masonry grid.
  let layoutFrame = 0, pendingProject = null;
  function layoutMedia() {
    cancelAnimationFrame(layoutFrame);
    layoutFrame = requestAnimationFrame(() => {
      if ($('work').hidden) return;
      [...$('gallery').children].forEach(card => {
        const height = card.firstElementChild.getBoundingClientRect().height;
        card.style.gridRowEnd = 'span ' + Math.ceil(height + 16);
      });
    });
  }
  const mediaObserver = new ResizeObserver(layoutMedia);
  function render() {
    const p = projects[project];
    $('project-number').textContent = p.label;
    $('project-name').textContent = p.name;
    $('project-description').textContent = p.description;
    $('project-work').textContent = p.work;
    $('project-responsibilities').replaceChildren(...p.role.split(' / ').map(role => { const li = document.createElement('li'); li.className = 'reading-copy'; li.textContent = role; return li; }));
    $('mobile-project').value = project;
    $('product-social').hidden = !p.social;
    if (p.social) { $('product-social').href = p.social; $('social-label').textContent = p.socialLabel; $('product-social').setAttribute('aria-label', p.name + ' on ' + p.socialLabel); }
    const logo = $('project-logo'); logo.hidden = !p.logo; logo.classList.toggle('wordmark', p.logo === 'rednote');
    if (p.logo) { logo.src = 'assets/brands/' + p.logo + '.png'; logo.alt = p.name + ' logo'; }
    else { logo.removeAttribute('src'); logo.alt = ''; }
    $('product-site').hidden = !p.site;
    if (p.site) { $('product-site').href = p.site; $('product-site').setAttribute('aria-label', p.name + ' website'); }
    document.querySelectorAll('[data-project]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.project === project)));
    $('format-tabs').hidden = project !== 'research';
    document.querySelectorAll('[data-format]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.format === format)));
    const list = items(), gallery = $('gallery');
    mediaObserver.disconnect(); gallery.replaceChildren(); $('work').scrollTop = 0; $('gallery').parentElement.scrollTop = 0; gallery.dataset.count = String(list.length);
    list.forEach((item, index) => {
      const title = titleOf(item), button = document.createElement('button');
      button.className = 'video-card' + (item.type === 'image' ? ' image-card' : '');
      button.setAttribute('aria-label', 'View: ' + title);
      const frame = document.createElement('span'); frame.className = 'frame';
      const img = document.createElement('img'); img.src = item.type === 'image' ? item.file : item.poster; img.alt = ''; img.loading = index < 4 ? 'eager' : 'lazy'; img.decoding = 'async';
      const dimensions = mediaDimensions[img.getAttribute('src')];
      if (dimensions) { img.width = dimensions[0]; img.height = dimensions[1]; }
      const play = document.createElement('span'); play.className = 'play'; play.append(icon(item.type === 'image' ? 'external' : 'play'));
      const caption = document.createElement('span'); caption.className = 'card-caption';
      const label = document.createElement('span'); label.className = 'card-label'; label.textContent = title;
      caption.append(label); frame.append(img, play);
      const content = document.createElement('span'); content.className = 'media-card-content'; content.append(frame, caption); button.append(content);
      button.addEventListener('click', () => {
        viewItems = list; viewIndex = index; showItem(); $('player').showModal(); window.portfolioUX?.openViewer();
        if (item.type !== 'image') $('focused-video').play().catch(() => {});
      });
      gallery.append(button); window.portfolioLoading.image(img, frame); mediaObserver.observe(content);
    });
  }
  function showItem() {
    slideIndex = 0;
    const item = viewItems[viewIndex], image = item.type === 'image', p = projects[project], video = $('focused-video');
    video.pause(); video.removeAttribute('src'); video.load(); video.hidden = image;
    $('focused-image').hidden = !image;
    $('viewer-project').textContent = p.label;
    $('video-title').textContent = titleOf(item);
    $('video-duration').textContent = image ? (item.images ? 'Image post · ' + item.images.length + ' slides' : 'Poster') : item.duration + 's';
    $('original').hidden = !item.url;
    if (item.url) $('original').href = item.url;
    $('viewer-context').textContent = text(item.context) || p.work;
    document.querySelector('.player-note').textContent = 'My role: ' + p.role;
    $('viewer-count').textContent = (viewIndex + 1) + ' / ' + viewItems.length;
    $('viewer-prev').disabled = viewIndex === 0;
    $('viewer-next').disabled = viewIndex === viewItems.length - 1;
    $('image-pager').hidden = !item.images;
    if (image) showSlide();
    else { video.preload = 'auto'; video.src = item.file; video.poster = item.poster; window.portfolioLoading.video(video); video.load(); }
  }
  function showSlide() {
    const item = viewItems[viewIndex], slides = item.images || [{ file: item.file, title: titleOf(item) }], slide = slides[slideIndex];
    window.portfolioUX?.imageChange(); $('focused-image').src = slide.file; $('focused-image').alt = slide.title; window.portfolioLoading.image($('focused-image'),document.querySelector('.viewer-media'));
    $('image-count').textContent = (slideIndex + 1) + ' / ' + slides.length;
    $('image-prev').disabled = slideIndex === 0; $('image-next').disabled = slideIndex === slides.length - 1;
  }
  $('image-prev').addEventListener('click', () => { if (slideIndex > 0) { slideIndex--; showSlide(); } });
  $('image-next').addEventListener('click', () => { if (slideIndex < viewItems[viewIndex].images.length - 1) { slideIndex++; showSlide(); } });
  $('viewer-prev').addEventListener('click', () => { if (viewIndex > 0) { viewIndex--; showItem(); } });
  $('viewer-next').addEventListener('click', () => { if (viewIndex < viewItems.length - 1) { viewIndex++; showItem(); } });
  $('focused-video').addEventListener('error', () => { if ($('focused-video').getAttribute('src')) $('viewer-context').textContent = 'This video couldn’t load. Please reopen it or check your connection'; });
  $('close-player').addEventListener('click', () => $('player').close());
  $('player').addEventListener('click', event => {
    if (event.target !== $('player')) return;
    const rect = $('player').getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) $('player').close();
  });
  $('player').addEventListener('close', () => {
    window.portfolioLoading.clear(document.querySelector('.viewer-media')); $('focused-video').pause(); $('focused-video').removeAttribute('src'); $('focused-video').load(); $('focused-image').removeAttribute('src');
  });
  function switchPanel(id) {
    const order = ['home', 'work', 'about', 'contact'];
    if (!order.includes(id)) id = 'home';
    const apply = () => {
    document.querySelectorAll('.panel').forEach(panel => { panel.hidden = panel.id !== id; panel.classList.toggle('active', panel.id === id); });
    document.querySelectorAll('[data-panel]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.panel === id)));
    $('position').textContent = '0' + (order.indexOf(id) + 1) + ' / 04';
    if ($('player').open) $('player').close();
    };
    if (window.portfolioUX) window.portfolioUX.switchPanel(id, apply); else apply();
  }
  document.querySelectorAll('[data-panel],[data-go]').forEach(button => button.addEventListener('click', () => location.hash = button.dataset.panel || button.dataset.go));
  window.addEventListener('hashchange', () => switchPanel(location.hash.slice(1)));
  function selectProject(next) {
    if (project === next && pendingProject === null) return;
    pendingProject = next;
    window.portfolioUX.swapProject(() => {
      pendingProject = null; project = next; format = 'video'; render();
      document.dispatchEvent(new CustomEvent('portfolio:projectchange', {detail: {project}}));
    }, next);
  }
  document.querySelectorAll('[data-project]').forEach(button => button.addEventListener('click', () => selectProject(button.dataset.project)));
  $('mobile-project').addEventListener('change', event => selectProject(event.target.value));
  document.querySelectorAll('[data-format]').forEach(button => button.addEventListener('click', () => {
    if (format === button.dataset.format) return;
    window.portfolioUX.swapProject(() => { format = button.dataset.format; render(); });
  }));
  render(); switchPanel(location.hash.slice(1));
})();
