/* Офлайн-журнал: программа целиком сохраняется на устройстве и открывается без интернета.
   Данные учеников сюда не попадают — они лежат в IndexedDB. При каждом обновлении файлов увеличь номер версии. */
const VERSION="zhurnal-offline-v2";
const FILES=["./","./index.html","./manifest.webmanifest","./icon-180.png","./icon-192.png","./icon-512.png"];

self.addEventListener("install",e=>{
  e.waitUntil(caches.open(VERSION).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",e=>{
  const req=e.request;
  if(req.method!=="GET"||new URL(req.url).origin!==location.origin)return;
  e.respondWith(
    caches.match(req,{ignoreSearch:true}).then(hit=>{
      if(hit)return hit;
      /* в кэш кладём только файлы программы из списка выше, больше ничего */
      return fetch(req).catch(()=>req.mode==="navigate"?caches.match("./index.html"):Response.error());
    })
  );
});
