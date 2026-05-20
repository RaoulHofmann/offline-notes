if (typeof window === "undefined") {
  const CACHE_NAME = "offline-notes-v1";

  self.addEventListener("install", (e) => {
    self.skipWaiting();
    e.waitUntil(
      caches
        .open(CACHE_NAME)
        .then((cache) => cache.addAll(["/", "/notes/", "/favicon.svg"]))
        .catch(() => {}),
    );
  });

  self.addEventListener("activate", (e) => {
    e.waitUntil(self.clients.claim());
    e.waitUntil(
      caches.keys().then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      ),
    );
  });

  self.addEventListener("fetch", (e) => {
    e.respondWith(handleFetch(e.request));
  });

  async function handleFetch(request) {
    if (request.cache === "only-if-cached" && request.mode !== "same-origin") return;

    const isNoCors = request.mode === "no-cors";
    if (isNoCors) {
      request = new Request(request.url, {
        cache: request.cache,
        credentials: "omit",
        headers: request.headers,
        integrity: request.integrity,
        destination: request.destination,
        keepalive: request.keepalive,
        method: request.method,
        mode: request.mode,
        redirect: request.redirect,
        referrer: request.referrer,
        referrerPolicy: request.referrerPolicy,
        signal: request.signal,
      });
    }

    if (request.method !== "GET" || isNoCors) {
      return fetchAndPatchHeaders(request);
    }

    const cached = await caches.match(request);
    try {
      const response = await fetchAndPatchHeaders(request);
      if (response && response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
      }
      return response;
    } catch {
      if (cached) return cached;
      return new Response("Offline", { status: 503 });
    }
  }

  async function fetchAndPatchHeaders(request) {
    const r = await fetch(request).catch((e) => console.error(e));
    if (!r || r.status === 0) return r;

    const headers = new Headers(r.headers);
    headers.set("Cross-Origin-Embedder-Policy", "credentialless");
    headers.set("Cross-Origin-Opener-Policy", "same-origin");

    return new Response(r.body, {
      status: r.status,
      statusText: r.statusText,
      headers,
    });
  }
} else {
  (async function () {
    if (window.crossOriginIsolated !== false) return;

    const registration = await navigator.serviceWorker
      .register(document.currentScript.src, {
        scope: new URL(".", document.currentScript.src).pathname,
      })
      .catch((e) =>
        console.error("COOP/COEP Service Worker registration failed:", e),
      );

    if (registration) {
      registration.addEventListener("updatefound", () => {
        window.location.reload();
      });

      if (registration.active && !navigator.serviceWorker.controller) {
        window.location.reload();
      }
    }
  })();
}
