(function () {
  'use strict';

  // ── Platform detection ────────────────────────────────────────────────────────

  const host = location.hostname;
  let platform;
  if (host.includes('youtube.com'))  platform = 'youtube';
  else if (host.includes('substack.com')) platform = 'substack';
  else if (host.includes('linkedin.com')) platform = 'linkedin';
  else platform = 'unsupported';

  // ── Text-selection state (LinkedIn + Substack only) ───────────────────────────

  let selectedText = '';

  if (platform === 'linkedin' || platform === 'substack') {
    document.addEventListener('mouseup', () => {
      const sel = window.getSelection().toString().trim();
      if (sel) selectedText = sel;
    });

    window.addEventListener('popstate', () => { selectedText = ''; });
    document.addEventListener('visibilitychange', () => { selectedText = ''; });
  }

  // ── YouTube scraper ───────────────────────────────────────────────────────────

  function scrapeYouTube() {
    const title =
      (document.querySelector('h1.ytd-video-primary-info-renderer yt-formatted-string') || {}).textContent?.trim() ||
      (document.querySelector('#title h1') || {}).textContent?.trim() ||
      null;

    const channel =
      (document.querySelector('#channel-name #text a') || {}).textContent?.trim() ||
      (document.querySelector('ytd-channel-name #text') || {}).textContent?.trim() ||
      null;

    const descEl =
      document.querySelector('#description-inline-expander yt-attributed-string') ||
      document.querySelector('#description-text');
    const raw = descEl ? descEl.textContent.trim() : null;
    const description = raw && raw.length > 1500 ? raw.slice(0, 1500) + '…' : raw;

    const comments = Array.from(document.querySelectorAll('#comment-content'))
      .slice(0, 3)
      .map(el => el.textContent.trim())
      .filter(Boolean);

    return { platform: 'youtube', title, channel, description, comments };
  }

  // ── Message listener ──────────────────────────────────────────────────────────

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action !== 'GET_PAGE_CONTEXT') return true;

    if (platform === 'unsupported') {
      sendResponse({ ok: false, error: 'unsupported' });
      return true;
    }

    if (platform === 'youtube') {
      try {
        sendResponse({ ok: true, context: scrapeYouTube() });
      } catch (err) {
        sendResponse({ ok: false, error: err.message });
      }
      return true;
    }

    // LinkedIn or Substack — selection-based
    sendResponse({
      ok: true,
      context: {
        platform,
        title: document.title,
        selectedText,
        type: 'selection',
      },
    });
    return true;
  });

})();
