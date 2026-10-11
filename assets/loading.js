/* Skeletons follow real loading events, including cached images and reopened media. */
(() => {
  const imageHolders = new WeakMap(), watchedImages = new WeakSet();
  function clear(holder) {
    holder.classList.remove('is-loading'); holder.removeAttribute('aria-busy');
    holder.querySelectorAll('.media-load-error').forEach(el=>el.remove());
  }
  function start(holder) { clear(holder); holder.classList.add('is-loading'); holder.setAttribute('aria-busy','true'); }
  function fail(holder) {
    clear(holder); const message=document.createElement('span'); message.className='media-load-error';
    message.textContent='Media couldn’t load'; holder.append(message);
  }
  function image(img, holder) {
    imageHolders.set(img,holder); start(holder);
    if (!watchedImages.has(img)) {
      watchedImages.add(img);
      img.addEventListener('load',()=>clear(imageHolders.get(img)));
      img.addEventListener('error',()=>fail(imageHolders.get(img)));
    }
    if (img.complete && img.getAttribute('src')) { if(img.naturalWidth) clear(holder);else fail(holder); }
  }
  const video=document.getElementById('focused-video'), viewer=document.querySelector('.viewer-media');
  ['loadeddata','canplay','playing'].forEach(event=>video.addEventListener(event,()=>{if(!video.hidden)clear(viewer);}));
  video.addEventListener('waiting',()=>{if(!video.hidden&&video.getAttribute('src'))start(viewer);});
  video.addEventListener('error',()=>{if(!video.hidden&&video.getAttribute('src'))fail(viewer);});
  window.portfolioLoading={image,video:()=>start(viewer),clear};
  const portrait=document.querySelector('.profile-photo>img');
  if(portrait)image(portrait,portrait.parentElement);
})();
