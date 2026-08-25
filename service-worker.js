const CACHE_NAME='speech-therapy-english-stable-v14-20260825';
const APP_SHELL=[
  './','./index.html','./styles.css','./app.js','./vocabulary.js','./manifest.webmanifest',
  './communication.js','./pronunciation.js','./offline.html','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./apple-touch-icon.png'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;
  const url=new URL(req.url);if(url.origin!==self.location.origin)return;
  if(req.mode==='navigate'){
    event.respondWith(fetch(req).then(res=>{const copy=res.clone();caches.open(CACHE_NAME).then(c=>c.put('./index.html',copy));return res}).catch(async()=>await caches.match('./index.html')||await caches.match('./offline.html')));return;
  }
  event.respondWith(caches.match(req).then(cached=>{
    const network=fetch(req).then(res=>{if(res&&res.ok){const copy=res.clone();caches.open(CACHE_NAME).then(c=>c.put(req,copy))}return res}).catch(()=>cached);
    return cached||network;
  }));
});
