(function(){
  if (!('serviceWorker' in navigator)) return;
  let refreshing = false;

  function askSkipWaiting(reg){
    try {
      if (reg && reg.waiting) reg.waiting.postMessage({type:'SKIP_WAITING'});
    } catch(_) {}
  }

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('sw.js', { scope: './' });

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });

      askSkipWaiting(reg);

      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            askSkipWaiting(reg);
          }
        });
      });

      window.addEventListener('focus', () => reg.update().catch(() => {}));
      setInterval(() => reg.update().catch(() => {}), 60000);
      reg.update().catch(() => {});
    } catch (_) {}
  });
})();
