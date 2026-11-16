(() => {
  const params = new URLSearchParams(window.location.search);
  const session = params.get('session');
  if (!session || params.get('mode') !== 'browser') return;

  let notified = false;
  const notifyClosed = () => {
    if (notified) return;
    notified = true;

    const url = `/__close?token=${encodeURIComponent(session)}`;
    if (navigator.sendBeacon) {
      try {
        if (navigator.sendBeacon(url)) return;
      } catch {}
    }

    fetch(url, { method: 'POST', keepalive: true }).catch(() => undefined);
  };

  window.addEventListener('pagehide', notifyClosed);
  window.addEventListener('pageshow', () => {
    notified = false;
    // Reanudar desde la caché del navegador también cancela un cierre pendiente.
    fetch(window.location.href, { cache: 'no-store' }).catch(() => undefined);
  });
})();
