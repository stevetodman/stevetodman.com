import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const source = await readFile(new URL('study/unit-1/unit1-cloud.js', root), 'utf8');

function makeStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

function makeMastery() {
  return {
    MAIN_STORAGE: 'studyhub-word-expedition-unit1-v3',
    BANK: [],
    recentEvents() { return []; },
    loadMain() { return { learners: { Luke: { stats: {} }, Samantha: { stats: {} } } }; },
    loadMeta() { return { learners: {} }; },
    saveMain() {},
    saveMeta() {}
  };
}

async function loadClient(hash) {
  const sequence = [];
  const localStorage = makeStorage();
  const location = {
    protocol: 'https:',
    hostname: 'stevetodman.com',
    hash,
    pathname: '/study/unit-1/',
    search: '?source=family',
    origin: 'https://stevetodman.com'
  };
  const history = {
    replaceState(_state, _title, url) {
      sequence.push({ type: 'replaceState', url });
      location.hash = '';
    }
  };
  const document = {
    hidden: false,
    addEventListener() {},
    querySelectorAll() { return []; }
  };
  const window = {
    WordExpeditionMastery: makeMastery(),
    addEventListener() {},
    dispatchEvent() {}
  };
  const context = {
    window,
    document,
    localStorage,
    location,
    history,
    navigator: {},
    CustomEvent: class CustomEvent {
      constructor(type, options) { this.type = type; this.detail = options?.detail; }
    },
    fetch(url, options) {
      sequence.push({ type: 'fetch', url, body: JSON.parse(options.body) });
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ found: false })
      });
    },
    setInterval() { return 1; },
    clearTimeout() {},
    setTimeout() { return 1; },
    Promise,
    Set,
    Map,
    JSON,
    Math,
    Number,
    String,
    Array,
    Object,
    RegExp
  };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'unit1-cloud.js' });
  await new Promise(resolve => setImmediate(resolve));
  await new Promise(resolve => setImmediate(resolve));
  return { client: window.WordExpeditionCloud, localStorage, location, sequence };
}

test('valid family token is adopted and scrubbed before the first cloud request', async () => {
  const token = 'a'.repeat(48);
  const { client, localStorage, location, sequence } = await loadClient(`#k=${token}`);

  assert.equal(localStorage.getItem('studyhubCloudToken'), token);
  assert.equal(location.hash, '');
  assert.equal(sequence[0]?.type, 'replaceState', 'fragment must be scrubbed before cloud traffic begins');
  assert.equal(sequence[0]?.url, '/study/unit-1/?source=family');

  const firstFetch = sequence.find(event => event.type === 'fetch');
  assert.ok(firstFetch, 'adopted family token should trigger the normal initial cloud pull');
  assert.equal(firstFetch.body.token, token);
  assert.equal(firstFetch.body.action, 'pull');
  assert.ok(sequence.indexOf(firstFetch) > 0, 'cloud request must occur after replaceState');
  assert.equal(client.token(), token);
  assert.equal(client.shareLink(), `https://stevetodman.com/study/#k=${token}`);
});

test('malformed family fragment is neither stored nor scrubbed', async () => {
  const { client, localStorage, location, sequence } = await loadClient('#k=too-short');

  assert.equal(localStorage.getItem('studyhubCloudToken'), null);
  assert.equal(location.hash, '#k=too-short');
  assert.equal(sequence.some(event => event.type === 'replaceState'), false);
  assert.equal(sequence.some(event => event.type === 'fetch'), false);
  assert.equal(client.token(), null);
  assert.equal(client.shareLink(), null);
});
