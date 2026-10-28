(() => {
  'use strict';
  const config = window.quizAnalyticsConfig || {};
  const enabled = /^phc_[A-Za-z0-9_-]+$/.test(config.projectToken || '') &&
    ['https://us.i.posthog.com', 'https://eu.i.posthog.com'].includes(config.host);
  // This ID lives only in memory. Reloading creates a new visit; no cookies or storage.
  const visitId = enabled ? crypto.randomUUID() : null;
  const release = document.querySelector('meta[name="app-version"]')?.content || 'unknown';
  function capture(event, characterId) {
    if (!enabled || !['site_visit', 'quiz_started', 'quiz_completed'].includes(event)) return;
    if (event === 'quiz_completed' && !/^[chumrsk]$/.test(characterId || '')) return;
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
  window.quizAnalytics = Object.freeze({enabled, capture});
  capture('site_visit');
})();
