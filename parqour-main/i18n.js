(function(){
  const DEF='en';
  const ALLOWED=['en','ru'];
  const urlLang=new URLSearchParams(location.search).get('lang');
  const stored=localStorage.getItem('lang');
  let lang=urlLang || stored || DEF;
  if(!ALLOWED.includes(lang)) lang=DEF;
  localStorage.setItem('lang', lang);
  document.documentElement.setAttribute('data-lang', lang);
  window.__lang = lang;
  window.__setLang = function(l){
    if(!ALLOWED.includes(l)) l=DEF;
    localStorage.setItem('lang', l);
    const u=new URL(location.href);
    u.searchParams.set('lang', l);
    location.href=u.toString();
  }
})();
