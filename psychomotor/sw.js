/* Psychomotor Therapy English — network-first update strategy with offline fallback */
const CACHE="psychomotor-english-v3";
const ASSETS=["./","./index.html","./styles.css","./data.js","./app.js","./icon.svg","./manifest.webmanifest","./hero.webp"];
self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("psychomotor-english-")&&k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET"||new URL(event.request.url).origin!==self.location.origin)return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    try {
      const response=await fetch(event.request);
      if(response.ok)await cache.put(event.request,response.clone());
      return response;
    }catch(err){
      const saved=await cache.match(event.request,{ignoreSearch:true});
      if(saved)return saved;
      if(event.request.mode==="navigate"){
        const fallback=await cache.match("./index.html");
        if(fallback)return fallback;
      }
      return Response.error();
    }
  })());
});
