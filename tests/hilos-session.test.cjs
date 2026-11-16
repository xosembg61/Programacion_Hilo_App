const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');

const script = readFileSync(require('node:path').join(__dirname, '../public/hilos-session.js'), 'utf8');

function session(search, sendBeacon) {
  const handlers = {};
  const calls = [];
  runInNewContext(script, {
    URLSearchParams,
    window: {
      location: { search, href: `http://127.0.0.1:1234/${search}` },
      addEventListener: (name, listener) => { handlers[name] = listener; },
    },
    navigator: { sendBeacon },
    fetch: (url, options) => {
      calls.push({ url, options });
      return Promise.resolve({ ok: true });
    },
  });
  return { handlers, calls };
}

test('native mode and ordinary hosting never send browser close signals', () => {
  for (const query of ['', '?session=token&mode=native', '?mode=browser']) {
    assert.deepEqual(Object.keys(session(query).handlers), []);
  }
});

test('pagehide sends one authenticated beacon per page visit', () => {
  const beacons = [];
  const { handlers } = session('?session=test-token&mode=browser', (url) => {
    beacons.push(url);
    return true;
  });
  handlers.pagehide();
  handlers.pagehide();
  assert.deepEqual(beacons, ['/__close?token=test-token']);
  handlers.pageshow();
  handlers.pagehide();
  assert.equal(beacons.length, 2);
});

test('an unavailable, rejected or failing beacon falls back to keepalive POST', () => {
  for (const beacon of [undefined, () => false, () => { throw new Error('unavailable'); }]) {
    const { handlers, calls } = session('?session=test-token&mode=browser', beacon);
    handlers.pagehide();
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, '/__close?token=test-token');
    assert.equal(calls[0].options.method, 'POST');
    assert.equal(calls[0].options.keepalive, true);
  }
});

test('pageshow refreshes the current session to cancel a pending close', () => {
  const { handlers, calls } = session('?session=test-token&mode=browser');
  handlers.pageshow();
  assert.equal(calls[0].url, 'http://127.0.0.1:1234/?session=test-token&mode=browser');
  assert.equal(calls[0].options.cache, 'no-store');
});
