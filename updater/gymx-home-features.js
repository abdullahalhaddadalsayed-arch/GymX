/* GymX home additions — local daily motivation and nonintrusive update discovery.
 * No changes to workout plans, exercise IDs, photos, or training history.
 */
(() => {
  'use strict';
  const messages = Array.isArray(window.GYMX_QUOTES) ? window.GYMX_QUOTES : [];
  if (messages.length !== 5000 || new Set(messages).size !== 5000) {
    console.warn('GymX: 5000-message bundle missing or invalid');
    return;
  }
  const VERSION = String(window.GYMX_QUOTES_VERSION || 'v1');
  const PREFIX = 'gymx.home.v1.';
  const keys = { daily: PREFIX+'daily', checked: PREFIX+'lastUpdateCheck',
    available: PREFIX+'availableVersion', dismissed: PREFIX+'dismissedVersion' };
  let lastRenderedDay = '';
  let dbPromise = null;
  let availableVersion = '';
  let popupShowing = false;

  function read(key, fallback) {
    try { const val=localStorage.getItem(key); return val===null ? fallback : val; }
    catch (_) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key,value); } catch (_) {}
  }
  function todayLocal() {
    const d=new Date(), n=x=>String(x).padStart(2,'0');
    return d.getFullYear()+'-'+n(d.getMonth()+1)+'-'+n(d.getDate());
  }
  function randomIndex(max) {
    if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
      const n=new Uint32Array(1); window.crypto.getRandomValues(n);
      return n[0] % max;
    }
    return Math.floor(Math.random()*max);
  }
  function chooseDaily() {
    const day=todayLocal();
    let previous={};
    try { previous=JSON.parse(read(keys.daily,'{}')) || {}; } catch (_) {}
    const history=Array.isArray(previous.history) ? previous.history.filter(
      x=>Number.isInteger(x) && x>=0 && x<5000).slice(-60) : [];
    if (previous.day===day && Number.isInteger(previous.index) &&
        previous.index>=0 && previous.index<5000)
      return {day:day,index:previous.index};
    let index=randomIndex(messages.length), tries=0;
    while(history.includes(index) && tries++<1000) index=randomIndex(messages.length);
    const next={day:day,index:index,history:history.concat(index).slice(-60)};
    write(keys.daily,JSON.stringify(next));
    return {day:day,index:index};
  }
  function db() {
    if (dbPromise) return dbPromise;
    dbPromise=new Promise(resolve=>{
      if (!('indexedDB' in window)) { resolve(null); return; }
      let request;
      try { request=indexedDB.open('GymXMotivationDB',1); }
      catch (_) { resolve(null); return; }
      request.onupgradeneeded=()=>{
        const database=request.result;
        if(!database.objectStoreNames.contains('messages'))
          database.createObjectStore('messages',{keyPath:'id'});
        if(!database.objectStoreNames.contains('meta'))
          database.createObjectStore('meta',{keyPath:'key'});
      };
      request.onerror=()=>resolve(null);
      request.onsuccess=()=>resolve(request.result);
    });
    return dbPromise;
  }
  async function storeLocally() {
    const database=await db();
    if(!database) return;
    try {
      const tx=database.transaction('meta','readonly');
      const q=tx.objectStore('meta').get('messageVersion');
      q.onsuccess=()=>{
        if(q.result && q.result.value===VERSION) return;
        try {
          const t=database.transaction(['messages','meta'],'readwrite');
          const bucket=t.objectStore('messages');
          for(let i=0;i<messages.length;i++) bucket.put({id:i,text:messages[i]});
          t.objectStore('meta').put({key:'messageVersion',value:VERSION,count:messages.length});
          t.onerror=()=>console.warn('GymX: local message DB import failed');
        } catch (_) {}
      };
    } catch (_) {}
  }
  async function quoteFromDB(index) {
    const database=await db();
    if(!database) return messages[index];
    return new Promise(resolve=>{
      try {
        const request=database.transaction('messages','readonly')
          .objectStore('messages').get(index);
        request.onsuccess=()=>resolve(request.result?.text || messages[index]);
        request.onerror=()=>resolve(messages[index]);
      } catch (_) { resolve(messages[index]); }
    });
  }
  function home() {
    const main=document.querySelector('.shell main.body');
    if(!main) return null;
    const active=document.querySelector('.bottom-nav [data-tab="home"].active');
    const heading=main.querySelector('h1');
    if(!active && !(heading && heading.textContent.includes('Make today count'))) return null;
    return main;
  }
  function renderDaily(main) {
    const chosen=chooseDaily();
    let banner=main.querySelector('#gx-daily-motivation');
    if (banner && banner.dataset.day===chosen.day) return;
    if (banner) banner.remove();
    banner=document.createElement('section');
    banner.id='gx-daily-motivation';
    banner.className='gx-daily-motivation';
    banner.dataset.day=chosen.day;
    banner.setAttribute('aria-label','Daily training motivation');
    const kicker=document.createElement('div');
    kicker.className='gx-daily-kicker';
    kicker.textContent='✦  DAILY DRIVE  ·  '+chosen.day;
    const quote=document.createElement('p');
    quote.className='gx-daily-quote';
    quote.textContent=messages[chosen.index];
    const footer=document.createElement('div');
    footer.className='gx-daily-footer';
    footer.textContent='One fresh, randomly chosen message each day · Saved offline';
    banner.append(kicker,quote,footer);
    main.insertBefore(banner,main.firstChild);
    lastRenderedDay=chosen.day;
    // Read from the local indexed database when available (fallback to the bundled list).
    quoteFromDB(chosen.index).then(text=>{
      if(banner.isConnected && banner.dataset.day===chosen.day) quote.textContent=text;
    });
  }

  function hasNative() {
    return typeof window.GymXNative?.checkForUpdates==='function' &&
           typeof window.GymXNative?.installUpdate==='function';
  }
  function updateBadge(main) {
    const banner=main.querySelector('#gx-daily-motivation');
    if(!banner) return;
    let btn=banner.querySelector('#gx-home-update-badge');
    if(!availableVersion) { if(btn) btn.remove(); return; }
    if(!btn) {
      btn=document.createElement('button');
      btn.type='button';btn.id='gx-home-update-badge';
      btn.className='gx-home-update-badge';
      banner.append(btn);
      btn.addEventListener('click',()=>showPopup(true));
    }
    btn.textContent='Update available · v'+availableVersion;
  }
  function showPopup(force) {
    if(!home() || !hasNative() || !availableVersion || popupShowing) return;
    if(!force && read(keys.dismissed,'')===availableVersion) return;
    if(document.querySelector('#gx-update-overlay')) return;
    const cover=document.createElement('div');
    cover.id='gx-update-overlay';cover.className='gx-update-overlay';
    cover.setAttribute('role','presentation');
    const dialog=document.createElement('section');
    dialog.className='gx-update-dialog';
    dialog.setAttribute('role','dialog');
    dialog.setAttribute('aria-modal','true');
    dialog.setAttribute('aria-labelledby','gx-update-title');
    const over=document.createElement('div');over.className='gx-update-kicker';
    over.textContent='GYMX · NEW VERSION';
    const title=document.createElement('h2');title.id='gx-update-title';
    title.textContent='An update is ready';
    const p=document.createElement('p');p.className='gx-update-copy';
    p.textContent='GymX v'+availableVersion+' is available. Install the signed update to get the latest changes while keeping your app data.';
    const actions=document.createElement('div');actions.className='gx-update-actions';
    const later=document.createElement('button');later.className='btn outline';
    later.type='button';later.textContent='Later';
    const install=document.createElement('button');install.className='btn primary';
    install.type='button';install.textContent='Update GymX';
    const close=()=>{
      write(keys.dismissed,availableVersion);
      cover.remove();popupShowing=false;
    };
    later.addEventListener('click',close);
    install.addEventListener('click',()=>{
      try { window.GymXNative.installUpdate(); close(); }
      catch (_) { p.textContent='Could not start the update. Try Settings → Check for updates.'; }
    });
    cover.addEventListener('click',e=>{if(e.target===cover)close();});
    actions.append(later,install);dialog.append(over,title,p,actions);cover.append(dialog);
    document.body.append(cover);
    popupShowing=true;
    install.focus();
  }
  availableVersion=read(keys.available,'');
  const previousEvent=window.gymxUpdateEvent;
  window.gymxUpdateEvent=function(event) {
    if (typeof previousEvent==='function') previousEvent(event);
    if(!event || typeof event!=='object') return;
    if(event.type==='available' && typeof event.version==='string' && event.version) {
      availableVersion=event.version;
      write(keys.available,availableVersion);
      sync();
      showPopup(false);
    }
    if(event.type==='current') {
      availableVersion='';
      write(keys.available,'');
      document.querySelector('#gx-update-overlay')?.remove();
      popupShowing=false;
      sync();
    }
  };
  function maybeAutoCheck() {
    if(!hasNative() || !home()) return;
    const now=Date.now(), last=Number(read(keys.checked,'0'));
    if(Number.isFinite(last) && now-last>=0 && now-last<12*60*60*1000) return;
    write(keys.checked,String(now));
    try { window.GymXNative.checkForUpdates(); } catch (_) {}
  }
  let scheduled=false;
  function sync() {
    scheduled=false;
    const main=home();
    if(!main) return;
    renderDaily(main);
    updateBadge(main);
    showPopup(false);
    maybeAutoCheck();
  }
  const observer=new MutationObserver(()=>{
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(sync);
  });
  observer.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden) sync();
  });
  // Midnight refresh for a home screen left open.
  setInterval(()=>{ if(home() && lastRenderedDay!==todayLocal()) sync(); },120000);
  storeLocally();
  sync();
})();
