/**
 * Steven OS client config
 * Override secrets only in a protected local file (config.local.js) — never commit secrets.
 */
window.STEVEN_OS_CONFIG = {
  // Live brief edge function (Supabase)
  briefUrl: "https://iuklaekcwynchqfmjgbp.supabase.co/functions/v1/steven-os-brief",

  // Optional: set in config.local.js for live mode
  // apiSecret: "..."
};
