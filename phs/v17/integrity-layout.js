'use strict';

/*
 * Tablet-width correction for the v1.8 remediation layer.
 * The base stylesheet gives the top bar min-width:max-content, which prevents
 * flex wrapping from reducing its intrinsic width between mobile and desktop.
 */
(function installV18LayoutCorrection() {
  const style = document.createElement('style');
  style.id = 'phs-v18-layout-correction';
  style.textContent = `
    @media (max-width: 900px) {
      .topbar {
        width: 100%;
        min-width: 0;
        max-width: 100%;
        flex-wrap: wrap;
      }
      .topbar > * {
        min-width: 0;
        max-width: 100%;
      }
      .topbar .brand {
        flex: 1 1 100%;
      }
      .topbar .metric {
        flex: 1 1 110px;
      }
      .topbar .spacer {
        display: none;
      }
      .topbar .version,
      .topbar button {
        flex: 1 1 auto;
        margin-left: 0;
      }
    }
  `;
  document.head.appendChild(style);
})();
