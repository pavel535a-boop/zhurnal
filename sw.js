/* Офлайн-журнал: программа целиком сохраняется на устройстве и открывается без интернета.
   Данные учеников сюда не попадают — они лежат в IndexedDB. При каждом обновлении файлов увеличь номер версии. */
const VERSION="zhurnal-offline-v19";
const FILES=["./","./index.html","./manifest.webmanifest","./icon-180.png","./icon-192.png","./icon-512.png"];
/* сколько ждать интернет при открытии журнала, потом берём сохранённую копию */
const WAIT_MS=3000;

self.addEventListener("install",e=>{
  /* cache:"reload" — берём файлы прямо с сервера, а не из старого кэша браузера */
  e.waitUntil(caches.open(VERSION).then(c=>c.addAll(FILES.map(u=>new Request(u,{cache:"reload"})))).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",e=>{
  const req=e.request;
  if(req.method!=="GET"||new URL(req.url).origin!==location.origin)return;
  if(req.mode==="navigate"){
    /* открытие журнала: есть интернет — свежая версия с сайта (и она же сохраняется), нет — сохранённая копия */
    e.respondWith(new Promise(resolve=>{
      let done=false;
      const fromCache=()=>caches.match("./index.html").then(r=>r||caches.match("./"));
      const t=setTimeout(()=>{if(!done){done=true;resolve(fromCache());}},WAIT_MS);
      fetch("./index.html",{cache:"no-cache"}).then(res=>{
        if(res&&res.ok){const copy=res.clone();caches.open(VERSION).then(c=>c.put("./index.html",copy));}
        if(!done){done=true;clearTimeout(t);resolve(res&&res.ok?res:fromCache());}
      }).catch(()=>{if(!done){done=true;clearTimeout(t);resolve(fromCache());}});
    }));
    return;
  }
  /* в кэш кладём только файлы программы из списка выше, больше ничего */
  e.respondWith(caches.match(req,{ignoreSearch:true}).then(hit=>hit||fetch(req)));
});
