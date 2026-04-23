const KOROGLU_BASE = 'https://bhk.parqour.com';
const YANVAR20_BASE = 'https://bh20.parqour.com';
const LSTR_KEY = 'autofetch_range';
const AUTO_TICK_MS = 30000;
const t = {
  ru: {
    start:'????????????',
    end:'??????????',
    run:'?????????????????? ?? ??????????????????????',
    copied:'??????????????????????!',
    running:'?????????????? ???????????????',
    ready:'???????????? ???????????????? ?? ??????????????????????.',
    failed:'???? ?????????????? ???????????????? ????????????.',
    placeholder:'?????????????? ?????????? ???????????????? ?????????????',
    cors:'???????????? ????????????????????????.',
    partial:'???? ?????? ?????????????? ?????????????? ??????????????????.',
    diag:'??????????????????????',
    ok:'OK',
    hint:'iPhone Safari/PWA ?????????? ?????????????????????? cross-site cookie / CORS ??????????????.',
    free:'????????????????????',
    paid:'??????????????',
    object:'????????????',
    reset:'????????????????'
  },
  az: {
    start:'Ba??lan????c',
    end:'Son',
    run:'Y??kl?? v?? kopyala',
    copied:'Kopyaland??!',
    running:'M??lumatlar y??kl??nir???',
    ready:'M??lumatlar al??nd?? v?? kopyaland??.',
    failed:'M??lumatlar?? almaq olmad??.',
    placeholder:'Haz??r m??tn burada g??r??n??c??k???',
    cors:'Sor??u blokland??.',
    partial:'B??t??n obyektl??ri y??kl??m??k olmad??.',
    diag:'Diaqnostika',
    ok:'OK',
    hint:'iPhone Safari/PWA cross-site cookie / CORS sor??ular??n?? bloklaya bil??r.',
    free:'Pulsuz',
    paid:'??d??ni??li',
    object:'M??kan',
    reset:'S??f??rla'
  }
};
const $ = (id) => document.getElementById(id);
const lang = () => (window.__lang === 'az' ? 'az' : 'ru');
const tr = (k) => (t[lang()] || t.ru)[k] || k;
const OBJECTS = [
  {
    base: KOROGLU_BASE,
    title: '?????????? ??????????????',
    parkingLine: '???? ??????????????e',
    freeLine: '??????????????e ???????????????????? ????????????:0',
    paidLine: '???????????????? ?????????????? ????????????:0'
  },
  {
    base: YANVAR20_BASE,
    title: '?????????? 20 ??????????',
    parkingLine: '???? ????????????????',
    freeLine: '???????????????????? ???????????? ??????????????:0',
    paidLine: '?????????????? ???????????? ??????????????:0'
  }
];

function pad(n){ return String(n).padStart(2,'0'); }
function dtLocal(date){
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function getNearestShiftRange(now = new Date()){
  const points = [];
  for(let d = -1; d <= 1; d++){
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d, 0, 0, 0, 0);
    points.push(new Date(day.getFullYear(), day.getMonth(), day.getDate(), 8, 0, 0, 0));
    points.push(new Date(day.getFullYear(), day.getMonth(), day.getDate(), 20, 0, 0, 0));
  }
  let nearest = points[0];
  let best = Math.abs(now - nearest);
  for(const point of points){
    const diff = Math.abs(now - point);
    if(diff < best){
      best = diff;
      nearest = point;
    }
  }
  let start;
  let end;
  if(nearest.getHours() === 20){
    start = new Date(nearest.getFullYear(), nearest.getMonth(), nearest.getDate(), 8, 0, 0, 0);
    end = new Date(nearest.getFullYear(), nearest.getMonth(), nearest.getDate(), 20, 0, 0, 0);
  }else{
    end = new Date(nearest.getFullYear(), nearest.getMonth(), nearest.getDate(), 8, 0, 0, 0);
    start = new Date(end.getTime() - 12 * 60 * 60 * 1000);
  }
  return { start, end };
}
function applyAutoShift(force = false){
  const range = getNearestShiftRange();
  const nextStart = dtLocal(range.start);
  const nextEnd = dtLocal(range.end);
  const changed = $('startDT').value !== nextStart || $('endDT').value !== nextEnd;
  if(force || changed){
    $('startDT').value = nextStart;
    $('endDT').value = nextEnd;
    saveRange();
    return true;
  }
  return false;
}
function loadDefaults(){
  applyAutoShift(true);
}
function saveRange(){
  localStorage.setItem(LSTR_KEY, JSON.stringify({start:$('startDT').value, end:$('endDT').value}));
}
function applyLang(){
  $('lblStart').textContent = tr('start');
  $('lblEnd').textContent = tr('end');
  $('runBtn').textContent = tr('run');
  $('out').placeholder = tr('placeholder');
  $('toast').textContent = tr('copied');
  $('kFreeLabel').textContent = tr('free');
  $('kPaidLabel').textContent = tr('paid');
  $('kObjectLabel').textContent = tr('object');
  $('kReset').setAttribute('title', tr('reset'));
  $('kReset').setAttribute('aria-label', tr('reset'));
  $('kCopy').setAttribute('title', tr('copy'));
  $('kCopy').setAttribute('aria-label', tr('copy'));
}
function setStatus(text){
  $('status').textContent = text || '';
}
function showToast(text){
  const el = $('toast');
  el.textContent = text || tr('copied');
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 1500);
}
async function copyText(text){
  if(navigator.clipboard && window.isSecureContext){
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = $('out');
  ta.focus();
  ta.select();
  document.execCommand('copy');
}
function withYear2020(startValue){
  if(!startValue) return startValue;
  return startValue.replace(/^\d{4}/, '2020');
}
function makeCarStatePayload(dateFromString, dateToString, inParking){
  return {
    draw: 1,
    columns: [
      {data:'function',name:'',searchable:true,orderable:false,search:{value:'',regex:false}},
      {data:'function',name:'',searchable:true,orderable:true,search:{value:'',regex:false}},
      {data:'dimension',name:'',searchable:true,orderable:false,search:{value:'',regex:false}},
      {data:'inTimestampString',name:'',searchable:true,orderable:true,search:{value:'',regex:false}},
      {data:'inGate',name:'',searchable:true,orderable:false,search:{value:'',regex:false}},
      {data:'outTimestampString',name:'',searchable:true,orderable:true,search:{value:'',regex:false}},
      {data:'outGate',name:'',searchable:true,orderable:false,search:{value:'',regex:false}},
      {data:'duration',name:'',searchable:true,orderable:false,search:{value:'',regex:false}},
      {data:'function',name:'',searchable:true,orderable:false,search:{value:'',regex:false}},
      {data:'function',name:'',searchable:true,orderable:false,search:{value:'',regex:false}},
      {data:'function',name:'',searchable:true,orderable:false,search:{value:'',regex:false}}
    ],
    order:[{column:3,dir:'desc'}],
    start:0,
    length:10,
    search:{value:'',regex:false},
    customFilters:{
      dateFromString,
      dateToString,
      plateNumber:'',
      amount:'',
      inGateId:'',
      outGateId:'',
      inParking:!!inParking,
      carOutType:'',
      carEntryType:''
    }
  };
}
function makeEventsPayload(){
  return {
    draw: 1,
    columns: [
      {data:'id',name:'',searchable:false,orderable:true,search:{value:'',regex:false}},
      {data:'plateNumber',name:'',searchable:true,orderable:true,search:{value:'',regex:false}},
      {data:'created',name:'',searchable:true,orderable:true,search:{value:'',regex:false}},
      {data:'description',name:'',searchable:true,orderable:false,search:{value:'',regex:false}},
      {data:'eventType',name:'',searchable:true,orderable:false,search:{value:'',regex:false}},
      {data:'gate',name:'',searchable:true,orderable:false,search:{value:'',regex:false}},
      {data:'imgUrl',name:'',searchable:true,orderable:false,search:{value:'',regex:false}}
    ],
    order:[{column:0,dir:'desc'}],
    start:0,
    length:10,
    search:{value:'',regex:false}
  };
}
async function postJson(base, url, payload, refererPath){
  const headers = {
    'accept':'application/json, text/javascript, */*; q=0.01',
    'content-type':'application/json',
    'x-requested-with':'XMLHttpRequest'
  };
  const extra = {};
  try{
    extra.referrer = base + refererPath;
  }catch(_){}
  let res;
  try{
    res = await fetch(url, {
      method:'POST',
      credentials:'include',
      mode:'cors',
      headers,
      body: JSON.stringify(payload),
      ...extra
    });
  }catch(err){
    const e = new Error(tr('cors'));
    e.cause = err;
    throw e;
  }
  if(!res.ok){
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}
function extractCount(obj){
  if(obj && typeof obj.recordsFiltered === 'number') return obj.recordsFiltered;
  if(obj && typeof obj.recordsTotal === 'number') return obj.recordsTotal;
  if(obj && Array.isArray(obj.data)) return obj.data.length;
  return 0;
}
async function fetchObjectStats(cfg, start, end){
  const parkingStart = withYear2020(start);
  const normal = await postJson(cfg.base, `${cfg.base}/rest/carstate`, makeCarStatePayload(start, end, false), '/journal/list?lang=ru');
  const inside = await postJson(cfg.base, `${cfg.base}/rest/carstate`, makeCarStatePayload(parkingStart, end, true), '/journal/list?lang=ru');
  const manual = await postJson(cfg.base, `${cfg.base}/rest/events?dateFromString=${encodeURIComponent(start)}&dateToString=${encodeURIComponent(end)}&plateNumber=&gateId=&eventType=MANUAL_GATE_OPEN&reasonId=`, makeEventsPayload(), '/events/list?lang=ru');
  const notFound = await postJson(cfg.base, `${cfg.base}/rest/events?dateFromString=${encodeURIComponent(start)}&dateToString=${encodeURIComponent(end)}&plateNumber=&gateId=&eventType=MANUAL_GATE_OPEN&reasonId=1`, makeEventsPayload(), '/events/list?lang=ru');
  return {
    period: extractCount(normal),
    notFound: extractCount(notFound),
    inParking: extractCount(inside),
    manualOpen: extractCount(manual)
  };
}
async function fetchObjectStatsSafe(cfg, start, end){
  try{
    const stats = await fetchObjectStats(cfg, start, end);
    return { ok:true, cfg, stats };
  }catch(error){
    return { ok:false, cfg, error };
  }
}
function formatRuBlock(cfg, stats){
  return [
    cfg.title,
    `?????????? ???? ????????????:${stats.period}`,
    `???? ??????????????:${stats.notFound}`,
    `${cfg.parkingLine}:${stats.inParking}`,
    `???????????? ????????????????:${stats.manualOpen}`,
    cfg.freeLine,
    cfg.paidLine
  ].join('\n');
}
function formatRuDate(value){
  const [d,t] = value.split('T');
  const [y,m,day] = d.split('-');
  return `${day}.${m}.${y} ${t}`;
}
function formatDiagnostics(start, end, results){
  const lines = [
    formatRuDate(start),
    formatRuDate(end),
    '',
    tr('diag')
  ];
  for(const result of results){
    if(result.ok){
      lines.push(`${result.cfg.title}: ${tr('ok')}`);
    }else{
      const msg = result.error && result.error.message ? result.error.message : tr('failed');
      lines.push(`${result.cfg.title}: ${msg}`);
    }
  }
  lines.push('');
  lines.push(tr('hint'));
  return lines.join('\n');
}
function formatRuReport(start, end, results){
  return [
    formatRuDate(start),
    formatRuDate(end),
    '',
    formatRuBlock(results[0].cfg, results[0].stats),
    '',
    formatRuBlock(results[1].cfg, results[1].stats),
    '',
    '',
    '????????????: 0'
  ].join('\n');
}
async function runFetch(){
  const start = $('startDT').value;
  const end = $('endDT').value;
  if(!start || !end){
    setStatus('');
    return;
  }
  saveRange();
  setStatus(tr('running'));
  $('runBtn').disabled = true;
  try{
    const results = [];
    for(const cfg of OBJECTS){
      results.push(await fetchObjectStatsSafe(cfg, start, end));
    }
    const failed = results.filter(result => !result.ok);
    if(failed.length){
      $('out').value = formatDiagnostics(start, end, results);
      setStatus(tr('partial'));
      return;
    }
    const text = formatRuReport(start, end, results);
    $('out').value = text;
    await copyText(text);
    setStatus(tr('ready'));
    showToast(tr('copied'));
  }catch(err){
    console.error(err);
    const msg = err && err.message ? err.message : tr('failed');
    setStatus(msg);
    $('out').value = 'ERROR\n\n' + msg;
  }finally{
    $('runBtn').disabled = false;
  }
}


const KOBJ = [
  {id:'bravo_koroglu', name:'Bravo Koroglu', reportRu:'Bravo Koroglu'},
  {id:'yanvar_20', name:'20 Yanvar', reportRu:'20 Yanvar'},
  {id:'bravo_yeni_yasamal', name:'Bravo Yeni Yasamal', reportRu:'Bravo Yeni Yasamal'},
  {id:'bravo_shuvelan', name:'Bravo Shuvelan', reportRu:'Bravo Shuvelan'},
  {id:'bravo_oazis', name:'Bravo Oazis', reportRu:'Bravo Oazis'}
];
const KCURRENT_KEY = 'koroglu_counter_current_object';
function kCountKey(type, objectId){ return `koroglu_counter_${objectId}_${type}`; }
function kGetCount(type, objectId){ return Number(localStorage.getItem(kCountKey(type, objectId)) || '0'); }
function kSetCount(type, objectId, value){ localStorage.setItem(kCountKey(type, objectId), String(Math.max(0, value))); }
function kCurrentId(){
  const saved = localStorage.getItem(KCURRENT_KEY);
  return KOBJ.some(o => o.id === saved) ? saved : KOBJ[0].id;
}
function kSetCurrentId(id){ localStorage.setItem(KCURRENT_KEY, id); }
function kRenderSelect(){ $('kObjectSelect').innerHTML = KOBJ.map(o => `<option value="${o.id}">${o.name}</option>`).join(''); $('kObjectSelect').value = kCurrentId(); }
function kRenderCurrent(){ const id = kCurrentId(); $('kObjectSelect').value = id; $('kFreeCount').textContent = kGetCount('free', id); $('kPaidCount').textContent = kGetCount('paid', id); }
function kFormatStamp(date){
  return `${pad(date.getDate())}.${pad(date.getMonth()+1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function kGetNightShiftRange(now = new Date()){
  let start;
  let end;
  if(now.getHours() >= 20){
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0, 0);
    end = new Date(start.getTime() + 12 * 60 * 60 * 1000);
  }else{
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0, 0);
    start = new Date(end.getTime() - 12 * 60 * 60 * 1000);
  }
  return {start, end};
}
function kBuildText(){
  const range = kGetNightShiftRange();
  const lines = [
    '???????????????? ????????????',
    kFormatStamp(range.start),
    kFormatStamp(range.end),
    ''
  ];
  for(const object of KOBJ){
    lines.push(`*${object.reportRu}*`);
    lines.push(`???????????????????? ????????????: ${kGetCount('free', object.id)}`);
    lines.push(`?????????????? ????????????: ${kGetCount('paid', object.id)}`);
  }
  $('kOut').value = lines.join('\n');
}
function kChange(type, delta){ const id = kCurrentId(); kSetCount(type, id, kGetCount(type, id) + delta); kRenderCurrent(); kBuildText(); }
function initKCounter(){
  kRenderSelect();
  kRenderCurrent();
  kBuildText();
  $('kObjectSelect').addEventListener('change', e => { kSetCurrentId(e.target.value); kRenderCurrent(); kBuildText(); });
  $('kFreeInc').addEventListener('click', () => kChange('free', 1));
  $('kFreeDec').addEventListener('click', () => kChange('free', -1));
  $('kPaidInc').addEventListener('click', () => kChange('paid', 1));
  $('kPaidDec').addEventListener('click', () => kChange('paid', -1));
  $('kReset').addEventListener('click', () => { const id = kCurrentId(); kSetCount('free', id, 0); kSetCount('paid', id, 0); $('kOut').value=''; kRenderCurrent(); kBuildText(); showToast(tr('reset')); });
  $('kCopy').addEventListener('click', async () => { try { await copyText($('kOut').value); } catch(_) {} showToast(tr('copied')); });
}

loadDefaults();
applyLang();
initKCounter();
$('runBtn').addEventListener('click', runFetch);
$('startDT').addEventListener('change', saveRange);
$('endDT').addEventListener('change', saveRange);

const refreshShiftIfNeeded = () => {
  if(document.visibilityState === 'hidden') return;
  applyAutoShift(false);
};

window.addEventListener('focus', refreshShiftIfNeeded);
document.addEventListener('visibilitychange', refreshShiftIfNeeded);
window.addEventListener('pageshow', refreshShiftIfNeeded);
setInterval(refreshShiftIfNeeded, AUTO_TICK_MS);
