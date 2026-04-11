(function(){
  const DEF='ru';
  const ALLOWED = new Set(['ru','az']);
  const urlLang=new URLSearchParams(location.search).get('lang');
  const stored=localStorage.getItem('lang');
  const raw=urlLang || stored || DEF;
  const lang=ALLOWED.has(raw)?raw:DEF;
  localStorage.setItem('lang', lang);
  document.documentElement.setAttribute('data-lang', lang);
  window.__lang = lang;
  window.__setLang = function(l){
    const next = ALLOWED.has(l) ? l : DEF;
    localStorage.setItem('lang', next);
    const u=new URL(location.href);
    u.searchParams.set('lang', next);
    location.href=u.toString();
  }
})();
