(() => {
  'use strict';
  const config = window.quizAnalyticsConfig || {};
  const enabled = /^phc_[A-Za-z0-9_-]+$/.test(config.projectToken || '') &&
    ['https://us.i.posthog.com', 'https://eu.i.posthog.com'].includes(config.host);
  // This ID lives only in memory. Reloading creates a new visit; no cookies or storage.
  const visitId = enabled ? crypto.randomUUID() : null;
  const release = document.querySelector('meta[name="app-version"]')?.content || 'unknown';
  // Google Analytics uses its own cookies; Google signals and ad personalization stay off.
  const gaId = /^G-[A-Z0-9]+$/.test(config.gaMeasurementId || '') ? config.gaMeasurementId : null;
  if (gaId) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', gaId, {allow_google_signals: false, allow_ad_personalization_signals: false});
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + gaId;
    document.head.appendChild(script);
  }
  function capture(event, characterId) {
    if (!['site_visit', 'quiz_started', 'quiz_completed'].includes(event)) return;
    if (event === 'quiz_completed' && !/^[chumrsk]$/.test(characterId || '')) return;
    // GA counts visits with its automatic page_view, so only quiz events are sent.
    if (gaId && event !== 'site_visit') window.gtag('event', event, event === 'quiz_completed' ? {character_id: characterId} : {});
    if (!enabled) return;
    const properties = {$process_person_profile: false, $geoip_disable: true, $ip: null, release};
    if (event === 'quiz_completed') properties.character_id = characterId;
    try {
      Promise.resolve(fetch(config.host + '/i/v0/e/', {
        method: 'POST', headers: {'Content-Type': 'text/plain'},
        credentials: 'omit', referrerPolicy: 'no-referrer', keepalive: true,
        body: JSON.stringify({api_key: config.projectToken, distinct_id: visitId, event, properties})
      })).catch(() => {});
    } catch (_) { /* Analytics must never interrupt the quiz. */ }
  }
  window.quizAnalytics = Object.freeze({enabled, gaEnabled: Boolean(gaId), capture});
  capture('site_visit');
})();
