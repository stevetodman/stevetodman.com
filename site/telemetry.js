// Privacy-preserving custom event helper.
//
// Disabled by default. It sends nothing unless a same-origin endpoint is
// explicitly configured with <meta name="site-telemetry-endpoint" content="/…">.
// Free text, URLs, identifiers, tokens, and arbitrary properties are never sent.
(function () {
  'use strict';

  var ALLOWED_EVENTS = new Set([
    'academy_opened',
    'academy_quiz_completed',
    'case_completed',
    'study_round_completed',
    'pin_sprint_replayed',
    'correction_clicked'
  ]);
  var ALLOWED_PROPERTIES = new Set([
    'module',
    'mode',
    'resultBand',
    'questionCount',
    'replay',
    'deviceClass'
  ]);

  function endpoint() {
    var meta = document.querySelector('meta[name="site-telemetry-endpoint"]');
    if (!meta || !meta.content) return null;
    try {
      var url = new URL(meta.content, location.origin);
      return url.origin === location.origin ? url.href : null;
    } catch (_) {
      return null;
    }
  }

  function sanitize(properties) {
    var out = {};
    if (!properties || typeof properties !== 'object' || Array.isArray(properties)) return out;
    Object.keys(properties).forEach(function (key) {
      if (!ALLOWED_PROPERTIES.has(key)) return;
      var value = properties[key];
      if (typeof value === 'string') out[key] = value.slice(0, 80);
      else if (typeof value === 'number' && Number.isFinite(value)) out[key] = value;
      else if (typeof value === 'boolean') out[key] = value;
    });
    return out;
  }

  function record(name, properties) {
    if (!ALLOWED_EVENTS.has(name)) return false;
    var url = endpoint();
    if (!url) return false;
    var body = JSON.stringify({
      schemaVersion: 1,
      event: name,
      properties: sanitize(properties)
    });
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }))) return true;
      fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: body,
        credentials: 'omit',
        keepalive: true
      }).catch(function () {});
      return true;
    } catch (_) {
      return false;
    }
  }

  window.SteveTodmanTelemetry = Object.freeze({ record: record });
})();
