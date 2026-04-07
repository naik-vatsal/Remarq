'use strict';

const BACKEND_URL = 'https://remarq-backend-production-fe13.up.railway.app/generate';

// ── Message handler ───────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action !== 'GENERATE_COMMENT') return false;

  (async () => {
    const { context, tone } = message;

    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-id': chrome.runtime.id,
        },
        body: JSON.stringify({ context, tone }),
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        sendResponse({ ok: true, comment: data.comment, remainingToday: data.remainingToday });
      } else {
        sendResponse({ ok: false, error: data.error });
      }
    } catch (_) {
      sendResponse({ ok: false, error: 'Could not reach Remarq server. Please check your connection.' });
    }
  })();

  return true; // Keep message channel open for async response
});
