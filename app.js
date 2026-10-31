const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2,'0');
const cap = s => s.charAt(0).toUpperCase()+s.slice(1);

/* ---------- Thèmes de couleurs selon l'heure ---------- */
const THEMES = {
  dawn:  ['#41295a','#c2587a','#f7b267'],
  day:   ['#0f4c81','#1fa2ff','#12d8fa'],
  dusk:  ['#42275a','#c0392b','#f39c12'],
  night: ['#0f2027','#203a43','#2c5364']
};
function theme(h){
  if(h>=5 && h<8) return THEMES.dawn;
  if(h>=8 && h<17) return THEMES.day;
  if(h>=17 && h<20) return THEMES.dusk;
  return THEMES.night;
}
function greeting(h){
  if(h>=5 && h<12)  return 'Bonjour · صباح الخير ☀️';
  if(h>=12 && h<18) return 'Bon après-midi · نهارك سعيد 🌤️';
  if(h>=18 && h<22) return 'Bonsoir · مساء الخير 🌇';
  return 'Bonne nuit · تصبح على خير 🌙';
}

/* ---------- Heure et dates ---------- */
const fmtFr   = new Intl.DateTimeFormat('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
const fmtAr   = new Intl.DateTimeFormat('ar-u-nu-latn',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
let fmtHFr, fmtHAr;
try{
  fmtHFr = new Intl.DateTimeFormat('fr-FR-u-ca-islamic-umalqura',{day:'numeric',month:'long',year:'numeric'});
  fmtHAr = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn',{day:'numeric',month:'long',year:'numeric'});
}catch(e){}
const MOIS_H=["Mouharram","Safar","Rabi' al-awwal","Rabi' ath-thani","Joumada al-oula","Joumada ath-thania","Rajab","Chaabane","Ramadan","Chawwal","Dhou al-qi'da","Dhou al-hijja"];
function hijriFr(d){
  try{
    const p=new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn',{day:'numeric',month:'numeric',year:'numeric'}).formatToParts(d);
    const g=t=>(p.find(x=>x.type===t)||{}).value;
    return parseInt(g('day'))+' '+MOIS_H[parseInt(g('month'))-1]+' '+parseInt(g('year'))+' H';
  }catch(e){return '';}
}
let lastDay = -1, lastTheme = '';
function tick(){
  const d = new Date();
  $('hm').textContent  = pad(d.getHours())+':'+pad(d.getMinutes());
  $('sec').textContent = pad(d.getSeconds());
  if(d.getDate() !== lastDay){
    lastDay = d.getDate();
    $('dateFr').textContent = cap(fmtFr.format(d));
    $('dateAr').textContent = fmtAr.format(d);
    if(fmtHFr){
      $('hijriFr').textContent = '🌙 ' + hijriFr(d);
      $('hijriAr').textContent = '🌙 ' + fmtHAr.format(d);
    }
  }
  $('greet').textContent = greeting(d.getHours());
  const t = theme(d.getHours()), key = t.join();
  if(key !== lastTheme){
    lastTheme = key;
    const r = document.documentElement.style;
    r.setProperty('--bg1',t[0]); r.setProperty('--bg2',t[1]); r.setProperty('--bg3',t[2]);
  }
}
tick(); setInterval(tick,1000);

/* ---------- Batterie ---------- */
if(navigator.getBattery){
  navigator.getBattery().then(b=>{
    const upd = ()=>{
      const p = Math.round(b.level*100);
      $('bat').textContent = (b.charging?'⚡ ':'🔋 ') + p + ' %';
      $('batState').textContent = b.charging ? 'En charge · قيد الشحن' : 'Sur batterie · على البطارية';
    };
    upd();
    ['levelchange','chargingchange'].forEach(e=>b.addEventListener(e,upd));
  }).catch(()=>{});
}else{
  $('bat').textContent = '🔋';
}

/* ---------- Météo (Open-Meteo) ---------- */
const WMO = [
  [[0],               '☀️','Ciel dégagé','صافٍ'],
  [[1,2],             '⛅','Peu nuageux','غائم جزئيًا'],
  [[3],               '☁️','Couvert','غائم'],
  [[45,48],           '🌫️','Brouillard','ضباب'],
  [[51,53,55,56,57],  '🌦️','Bruine','رذاذ'],
  [[61,63,65,66,67],  '🌧️','Pluie','مطر'],
  [[71,73,75,77,85,86],'❄️','Neige','ثلج'],
  [[80,81,82],        '🌧️','Averses','زخات مطر'],
  [[95,96,99],        '⛈️','Orage','عاصفة رعدية']
];
function wmo(code){
  for(const [codes,ic,fr,ar] of WMO) if(codes.includes(code)) return {ic,fr,ar};
  return {ic:'🌡️',fr:'Météo',ar:'الطقس'};
}
let pos = {lat:33.6861, lon:-7.3830, name:'Mohammedia', ar:'المحمدية'}; // position par défaut
function setCity(){ $('city').textContent = '📍 '+pos.name; $('cityAr').textContent = pos.ar; }
setCity();

async function weather(){
  try{
    const url = 'https://api.open-meteo.com/v1/forecast?latitude='+pos.lat+'&longitude='+pos.lon+
                '&current=temperature_2m,weather_code&timezone=auto';
    const r = await fetch(url); const j = await r.json();
    const c = j.current, w = wmo(c.weather_code);
    $('temp').textContent  = w.ic+' '+Math.round(c.temperature_2m)+'°C';
    $('wDesc').textContent = w.fr+' · '+w.ar;
  }catch(e){
    $('wDesc').textContent = 'Hors ligne · غير متصل';
  }
}
if(navigator.geolocation){
  navigator.geolocation.getCurrentPosition(p=>{
    pos = {lat:p.coords.latitude, lon:p.coords.longitude, name:'Ma position', ar:'موقعي'};
    setCity(); weather();
  }, ()=>{}, {timeout:8000, maximumAge:600000});
}
weather(); setInterval(weather, 15*60*1000);

/* ---------- Écran toujours allumé ---------- */
async function keepAwake(){
  try{ if('wakeLock' in navigator) await navigator.wakeLock.request('screen'); }catch(e){}
}
keepAwake();
document.addEventListener('visibilitychange',()=>{ if(!document.hidden) keepAwake(); });
