if (typeof window === "undefined") {
  self.addEventListener("install", () => self.skipWaiting());
  self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

  self.addEventListener("fetch", (e) => {
    e.respondWith(handleFetch(e.request));
  });

  async function handleFetch(request) {
    if (request.cache === "only-if-cached" && request.mode !== "same-origin") {
      return;
    }

    if (request.mode === "no-cors") {
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
