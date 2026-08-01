(() => {
  const startedAt = { value: null };
  const find = id => document.getElementById(id);
  function install() {
    const start = find('start');
    const clock = find('clock');
    if (!start || !clock || typeof state === 'undefined') return false;
    const originalStart = start.onclick;
    start.onclick = event => {
      if (originalStart) originalStart.call(start, event);
      state.running = true;
      startedAt.value = Date.now() - Math.round(state.time * 1000);
      render();
    };
    setInterval(() => {
      if (!state.running || state.ended) return;
      if (startedAt.value === null) startedAt.value = Date.now() - Math.round(state.time * 1000);
      state.time = Math.floor((Date.now() - startedAt.value) / 1000);
      render();
    }, 250);
    return true;
  }
  if (!install()) {
    const retry = setInterval(() => { if (install()) clearInterval(retry); }, 100);
  }
})();
