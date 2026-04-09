const LANG={
  ru:{title:'Support 2',copy:'Копировать',copied:'Скопировано!',update:'Обновить',updated:'Обновлено!',reset:'Сбросить счётчики',resetAsk:'Сбросить все счётчики Support 2?',resetDone:'Счётчики сброшены!',free:'Бесплатные',paid:'Платные'},
  az:{title:'Support 2',copy:'Kopyala',copied:'Kopyalandı!',update:'Yenilə',updated:'Yeniləndi!',reset:'Sayğacları sıfırla',resetAsk:'Support 2 sayğaclarının hamısı sıfırlansın?',resetDone:'Sayğaclar sıfırlandı!',free:'Pulsuz',paid:'Ödənişli'}
};
const T=(k)=>((LANG[window.__lang]||LANG.ru)[k] || (LANG.ru[k] || k));
const $ = (id)=>document.getElementById(id);
const COUNT_TOTAL = 7;
const COUNTER_NAMES = [
  'East Park',
  'Konqres',
  'Jalə Plaza',
  'Bakıxanov mall',
  'Parkspot',
  'Univerium',
  'Liv Bona Dea'
];
const REPORT_NAMES_RU = [
  'Ист Парк',
  'Конгрес',
  'Джаля Плаза',
  'Бакиханов молл',
  'Паркспот',
  'Универиум',
  'Лив Бона Деа'
];

function key(type, n){
  return `support2_${type}_${n}`;
}
function getCount(type, n){
  return Number(localStorage.getItem(key(type,n)) || '0');
}
function setCount(type, n, v){
  localStorage.setItem(key(type,n), String(Math.max(0, v)));
}
function resetAllCounts(){
  for(let i=1;i<=COUNT_TOTAL;i++){
    localStorage.removeItem(key('free', i));
    localStorage.removeItem(key('paid', i));
  }
}
function pad(n){return n.toString().padStart(2,'0')}
function fmt(d){return pad(d.getDate())+'.'+pad(d.getMonth()+1)+'.'+d.getFullYear()+' '+pad(d.getHours())+':'+pad(d.getMinutes())}
function atTime(date,h,m){return new Date(date.getFullYear(),date.getMonth(),date.getDate(),h,m,0,0)}
function computeShift(){
  const now=new Date();
  const startToday=atTime(now,13,0);
  const endToday=atTime(now,21,0);
  let start,end;
  if(now < startToday){
    const y=new Date(now); y.setDate(now.getDate()-1);
    start=atTime(y,13,0);
    end=atTime(y,21,0);
  } else {
    start=startToday;
    end=endToday;
  }
  $('startDT').value=fmt(start);
  $('endDT').value=fmt(end);
}
function showToast(key){
  const toast=$('toast');
  toast.textContent=T(key);
  toast.classList.remove('show');
  void toast.offsetWidth;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=>toast.classList.remove('show'),1500);
}
function renderCounters(){
  const grid=$('counterGrid');
  grid.innerHTML='';
  for(let i=1;i<=COUNT_TOTAL;i++){
    const freeValue=getCount('free', i);
    const paidValue=getCount('paid', i);
    const name = COUNTER_NAMES[i-1] || `Counter ${i}`;
    const card=document.createElement('div');
    card.className='card support2card';
    card.innerHTML=`
      <div class="support2title">${name}</div>
      <div class="support2split compact">
        <div class="support2side compact">
          <div class="support2meta compact">
            <div class="label">${T('free')}</div>
            <div class="count">${freeValue}</div>
          </div>
          <div class="support2buttons compact">
            <button class="full btn-inc" data-act="inc" data-type="free" data-n="${i}">+1</button>
            <button class="full btn-dec" data-act="dec" data-type="free" data-n="${i}">−1</button>
          </div>
        </div>
        <div class="support2side compact">
          <div class="support2meta compact">
            <div class="label">${T('paid')}</div>
            <div class="count">${paidValue}</div>
          </div>
          <div class="support2buttons compact">
            <button class="full btn-inc" data-act="inc" data-type="paid" data-n="${i}">+1</button>
            <button class="full btn-dec" data-act="dec" data-type="paid" data-n="${i}">−1</button>
          </div>
        </div>
      </div>
    `;
    grid.appendChild(card);
  }
}
function buildText(){
  const lines=[$('startDT').value.trim(), $('endDT').value.trim()];
  let hasEntries = false;
  for(let i=1;i<=COUNT_TOTAL;i++){
    const freeValue=getCount('free', i);
    const paidValue=getCount('paid', i);
    if(freeValue === 0 && paidValue === 0) continue;
    const parts=[];
    if(freeValue > 0) parts.push(`Бесплатные ${freeValue}`);
    if(paidValue > 0) parts.push(`Платные ${paidValue}`);
    lines.push('', REPORT_NAMES_RU[i-1], parts.join(' | '));
    hasEntries = true;
  }
  if(!hasEntries){
    lines.push('');
  }
  $('out').value=lines.join('\n');
}
function applyLang(){
  $('pageHead').textContent=T('title');
  $('copy').setAttribute('title', T('copy'));
  $('copy').setAttribute('aria-label', T('copy'));
  $('updateNow').setAttribute('title', T('update'));
  $('updateNow').setAttribute('aria-label', T('update'));
  $('resetAll').setAttribute('title', T('reset'));
  $('resetAll').setAttribute('aria-label', T('reset'));
}

document.addEventListener('click', (e)=>{
  const btn=e.target.closest('button[data-act]');
  if(!btn) return;
  const n=Number(btn.dataset.n);
  const type=btn.dataset.type;
  const delta=btn.dataset.act==='inc' ? 1 : -1;
  setCount(type, n, getCount(type, n)+delta);
  renderCounters();
  buildText();
});

document.getElementById('updateNow').addEventListener('click', ()=>{
  computeShift();
  buildText();
  showToast('updated');
});

document.getElementById('resetAll').addEventListener('click', ()=>{
  if(!confirm(T('resetAsk'))) return;
  resetAllCounts();
  renderCounters();
  buildText();
  showToast('resetDone');
});

document.getElementById('copy').addEventListener('click', async ()=>{
  const text = $('out').value;
  try {
    await navigator.clipboard.writeText(text);
  } catch (_) {
    $('out').focus();
    $('out').select();
    document.execCommand('copy');
  }
  showToast('copied');
});

applyLang();
computeShift();
renderCounters();
buildText();
window.addEventListener('focus', ()=>{ computeShift(); buildText(); });
setInterval(()=>{ computeShift(); buildText(); }, 60000);