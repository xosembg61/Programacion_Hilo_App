(() => {
  const session = new URLSearchParams(window.location.search).get('session');
  if (!session) return;

  let notified = false;
  const notifyClosed = () => {
    if (notified) return;
    notified = true;

    const url = `/__close?token=${encodeURIComponent(session)}`;
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url);
      return;
    }

    fetch(url, { method: 'POST', keepalive: true }).catch(() => undefined);
  };

  window.addEventListener('pagehide', notifyClosed, { once: true });
})();