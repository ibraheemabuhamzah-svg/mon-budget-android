const NOM_CACHE = "mon-budget-v3";

const FICHIERS_A_METTRE_EN_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/style.css",
  "./js/categories.js",
  "./js/devise.js",
  "./js/storage.js",
  "./js/transactions.js",
  "./js/chart.js",
  "./js/ui.js",
  "./js/app.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(NOM_CACHE)
      .then((cache) => cache.addAll(FICHIERS_A_METTRE_EN_CACHE))
      .catch((erreur) => {
        console.error("Échec de la mise en cache initiale du service worker.", erreur);
        throw erreur;
      })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cles) =>
      Promise.all(cles.filter((cle) => cle !== NOM_CACHE).map((cle) => caches.delete(cle)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches
      .match(event.request)
      .then((reponseEnCache) => {
        if (reponseEnCache) return reponseEnCache;

        return fetch(event.request)
          .then((reponseReseau) => {
            if (
              reponseReseau &&
              reponseReseau.ok &&
              new URL(event.request.url).origin === self.location.origin
            ) {
              const copie = reponseReseau.clone();
              caches.open(NOM_CACHE).then((cache) => cache.put(event.request, copie));
            }
            return reponseReseau;
          })
          .catch(() => caches.match("./index.html"));
      })
      .catch(() => fetch(event.request).catch(() => caches.match("./index.html")))
  );
});
