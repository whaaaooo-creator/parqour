(function(){
  if (!('serviceWorker' in navigator)) return;
  const APP_VERSION = '20260413fix3';
  const VERSION_KEY = 'parqour_app_version';
  let refreshing = false;

  async function hardRefreshForNewVersion(){
    const prev = localStorage.getItem(VERSION_KEY);
    if (prev === APP_VERSION) return false;
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister().catch(() => false)));
    } catch(_) {}
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    } catch(_) {}
    localStorage.setItem(VERSION_KEY, APP_VERSION);
    const url = new URL(location.href);
    url.searchParams.set('appv', APP_VERSION);
    location.replace(url.toString());
    return true;
  }

  function askSkipWaiting(reg){
    try { if (reg && reg.waiting) reg.waiting.postMessage({type:'SKIP_WAITING'}); } catch(_) {}
  }

  window.addEventListener('load', async () => {
    try {
      if (await hardRefreshForNewVersion()) return;
      const reg = await navigator.serviceWorker.register('sw.js?v=' + APP_VERSION, { scope: './', updateViaCache: 'none' });

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
          if (nw.state === 'installed' && navigator.serviceWorker.controller) askSkipWaiting(reg);
        });
      });

      window.addEventListener('focus', () => reg.update().catch(() => {}));
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
      setInterval(() => reg.update().catch(() => {}), 45000);
      reg.update().catch(() => {});
    } catch (_) {}
  });
})();
