// Local-only resident-learning recency helper.
//
// This intentionally stores only the last internal module route/title selected
// from the education hub. No account, learner identifier, answer history,
// completion percentage, or network request is involved.
(function () {
  'use strict';

  var KEY = 'stevetodman-learning-recent-v1';
  var MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;

  function safeParse(raw) {
    try {
      var value = JSON.parse(raw);
      if (!value || typeof value !== 'object') return null;
      if (typeof value.route !== 'string' || !/^\/[a-z0-9-]+\/$/i.test(value.route)) return null;
      if (typeof value.title !== 'string' || !value.title.trim()) return null;
      if (typeof value.savedAt !== 'number' || !Number.isFinite(value.savedAt)) return null;
      if (Date.now() - value.savedAt > MAX_AGE_MS) return null;
      return { route: value.route, title: value.title.slice(0, 120), savedAt: value.savedAt };
    } catch (_) {
      return null;
    }
  }

  function load() {
    try { return safeParse(localStorage.getItem(KEY)); } catch (_) { return null; }
  }

  function save(route, title) {
    if (typeof route !== 'string' || !/^\/[a-z0-9-]+\/$/i.test(route)) return;
    if (typeof title !== 'string' || !title.trim()) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ route: route, title: title.slice(0, 120), savedAt: Date.now() }));
    } catch (_) {}
  }

  function render() {
    var host = document.getElementById('continue-learning');
    if (!host) return;
    var recent = load();
    if (!recent) {
      host.hidden = true;
      return;
    }
    var link = host.querySelector('a[data-continue-link]');
    var title = host.querySelector('[data-continue-title]');
    if (!link || !title) return;
    link.href = recent.route;
    title.textContent = recent.title;
    host.hidden = false;
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest('a[data-learning-route]');
    if (!link) return;
    save(link.getAttribute('href') || '', link.getAttribute('data-learning-title') || link.textContent || '');
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render, { once: true });
  else render();

  window.SteveTodmanLearningProgress = Object.freeze({ load: load, save: save, render: render });
})();
