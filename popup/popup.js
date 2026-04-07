// ── Element refs ──────────────────────────────────────────────────────────────

const stateUnsupported = document.getElementById('stateUnsupported');
const stateError       = document.getElementById('stateError');
const stateMain        = document.getElementById('stateMain');
const errorText        = document.getElementById('errorText');

const platformBadge    = document.getElementById('platformBadge');
const contextLabel     = document.getElementById('contextLabel');
const contextPreview   = document.getElementById('contextPreview');
const toneSelect       = document.getElementById('toneSelect');

const generateBtn      = document.getElementById('generateBtn');
const retryBtn         = document.getElementById('retryBtn');

const outputWrap       = document.getElementById('outputWrap');
const outputText       = document.getElementById('outputText');
const copyBtn          = document.getElementById('copyBtn');
const regenerateBtn    = document.getElementById('regenerateBtn');
const loadingWrap      = document.getElementById('loadingWrap');

// ── State ─────────────────────────────────────────────────────────────────────

let currentContext = null;

// ── Init ──────────────────────────────────────────────────────────────────────

(async function init() {
  // 1. Restore saved tone
  const { savedTone } = await chrome.storage.local.get('savedTone');
  if (savedTone) toneSelect.value = savedTone;

  // 2. Check tab URL — only proceed on supported platforms
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab.url || '';
  const supported = url.includes('youtube.com') || url.includes('linkedin.com') || url.includes('substack.com');
  if (!supported) { show(stateUnsupported); return; }

  // 3. Fetch context from content script
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'GET_PAGE_CONTEXT' });

    if (response?.ok) {
      currentContext = response.context;
    }

    // YouTube: if title came back null, page hasn't rendered yet — retry after 2500ms
    if (currentContext?.platform === 'youtube' && !currentContext.title) {
      await new Promise(resolve => setTimeout(resolve, 2500));
      const [tab2] = await chrome.tabs.query({ active: true, currentWindow: true });
      const retry = await chrome.tabs.sendMessage(tab2.id, { action: 'GET_PAGE_CONTEXT' });
      if (retry?.ok) currentContext = retry.context;
    }

    renderContextCard(currentContext);
    show(stateMain);
  } catch (err) {
    if (err.message.includes('Could not establish connection')) {
      show(stateUnsupported);
    } else {
      showError(err.message);
    }
  }
})();

// ── Event listeners ───────────────────────────────────────────────────────────

generateBtn.addEventListener('click', () => generate());
regenerateBtn.addEventListener('click', () => generate());
retryBtn.addEventListener('click', () => location.reload());

toneSelect.addEventListener('change', () => {
  chrome.storage.local.set({ savedTone: toneSelect.value });
});

copyBtn.addEventListener('click', () => {
  const val = outputText.value.trim();
  if (!val) return;
  navigator.clipboard.writeText(val).then(() => {
    copyBtn.textContent = 'Copied!';
    copyBtn.classList.add('copied');
    setTimeout(() => {
      copyBtn.textContent = 'Copy';
      copyBtn.classList.remove('copied');
    }, 2000);
  });
});

// ── Generate ──────────────────────────────────────────────────────────────────

async function generate() {
  setLoading(true);

  try {
    // Re-fetch context
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const ctxResponse = await chrome.tabs.sendMessage(tab.id, { action: 'GET_PAGE_CONTEXT' });

    if (ctxResponse?.ok) {
      currentContext = ctxResponse.context;
    }

    // YouTube: retry once if title is missing (page still loading)
    if ((tab.url || '').includes('youtube.com') && (!currentContext || !currentContext.title)) {
      await new Promise(resolve => setTimeout(resolve, 2500));
      const [tab2] = await chrome.tabs.query({ active: true, currentWindow: true });
      const retry = await chrome.tabs.sendMessage(tab2.id, { action: 'GET_PAGE_CONTEXT' });
      if (retry?.ok) currentContext = retry.context;
    }

    renderContextCard(currentContext);

    const response = await chrome.runtime.sendMessage({
      action: 'GENERATE_COMMENT',
      context: currentContext,
      tone: toneSelect.value,
    });

    if (!response.ok) throw new Error(response.error);

    outputText.value = response.comment;
    outputWrap.classList.remove('hidden');
  } catch (err) {
    showError(err.message);
  } finally {
    setLoading(false);
  }
}

// ── Render helpers ────────────────────────────────────────────────────────────

function renderContextCard(ctx) {
  if (!ctx) {
    platformBadge.className = 'platform-badge hidden';
    contextLabel.textContent = '';
    contextPreview.textContent = 'Highlight any text on the page to get started';
    contextPreview.classList.add('empty');
    return;
  }

  platformBadge.textContent = ctx.platform;
  platformBadge.className = `platform-badge ${ctx.platform}`;

  if (ctx.platform === 'youtube') {
    contextLabel.textContent = ctx.channel || '';
    contextPreview.textContent = ctx.title || '(no title)';
    contextPreview.classList.remove('empty');
    return;
  }

  // LinkedIn or Substack — selection-based
  contextLabel.textContent = '✎ Selected text';
  if (ctx.selectedText) {
    contextPreview.textContent = ctx.selectedText.slice(0, 140) + (ctx.selectedText.length > 140 ? '…' : '');
    contextPreview.classList.remove('empty');
  } else {
    contextPreview.textContent = 'Highlight any text on the page to get started';
    contextPreview.classList.add('empty');
  }
}

function show(el) {
  for (const s of [stateUnsupported, stateError, stateMain]) {
    s.classList.add('hidden');
  }
  el.classList.remove('hidden');
}

function showError(msg) {
  errorText.textContent = msg;
  show(stateError);
}

function setLoading(on) {
  generateBtn.disabled   = on;
  regenerateBtn.disabled = on;
  loadingWrap.classList.toggle('hidden', !on);
  if (on) outputWrap.classList.add('hidden');
}
