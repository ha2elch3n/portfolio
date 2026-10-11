(() => {
  const links = [...document.querySelectorAll('[data-version]')];
  const version = document.documentElement.dataset.design;
  if (new URLSearchParams(location.search).has('compare')) document.documentElement.dataset.comparing = '';
  function update() {
    const project = document.querySelector('[data-project][aria-pressed=true]')?.dataset.project || 'crossin';
    links.forEach(link => {
      link.setAttribute('aria-current', String(link.dataset.version === version));
      link.href = (link.dataset.version === 'original' ? 'original.html' : 'index.html') + '?compare=1&project=' + project + location.hash;
    });
  }
  update(); window.addEventListener('hashchange', update);
  document.addEventListener('portfolio:projectchange', update);
  document.addEventListener('click', event => { if (event.target.closest('[data-project]')) queueMicrotask(update); });
})();
