(function () {
  'use strict';

  var NativeAudioContext = window.AudioContext || window.webkitAudioContext;
  if (!NativeAudioContext || window.__wordExpeditionAudioUnlockInstalled) return;

  var sharedContext = null;

  function getSharedContext() {
    if (!sharedContext || sharedContext.state === 'closed') sharedContext = new NativeAudioContext();
    return sharedContext;
  }

  function SharedAudioContext() {
    return getSharedContext();
  }

  SharedAudioContext.prototype = NativeAudioContext.prototype;
  try { Object.setPrototypeOf(SharedAudioContext, NativeAudioContext); } catch (_) {}

  function primeAudio() {
    if (document.hidden) return;
    var ctx;
    try { ctx = getSharedContext(); } catch (_) { return; }

    // Queue one silent frame while the user gesture is still active. This is the
    // most reliable way to open the Web Audio route on iPhone/iPad Safari.
    try {
      var buffer = ctx.createBuffer(1, 1, 22050);
      var source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    } catch (_) {}

    if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
      try {
        var resumed = ctx.resume();
        if (resumed && typeof resumed.catch === 'function') resumed.catch(function () {});
      } catch (_) {}
    }
  }

  // App code still uses the standard constructors, but receives the same context
  // that was primed during the preceding user gesture.
  window.AudioContext = SharedAudioContext;
  window.webkitAudioContext = SharedAudioContext;
  window.__wordExpeditionAudioUnlockInstalled = true;

  ['pointerdown', 'touchstart', 'keydown', 'click'].forEach(function (eventName) {
    document.addEventListener(eventName, primeAudio, { capture:true, passive:true });
  });
})();
