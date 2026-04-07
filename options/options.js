// Options logic: saves and loads the Claude API key to/from chrome.storage.local.
// The actual key value is never placed into the input field.

const apiKeyInput   = document.getElementById('apiKey');
const saveBtn       = document.getElementById('saveBtn');
const clearBtn      = document.getElementById('clearBtn');
const statusEl      = document.getElementById('status');
const toggleBtn     = document.getElementById('toggleVisibility');
const eyeOpen       = document.getElementById('eyeOpen');
const eyeClosed     = document.getElementById('eyeClosed');
const keyStatusRow  = document.getElementById('keyStatusRow');
const keyStatusText = document.getElementById('keyStatusText');

let hasExistingKey = false;

// ── Load state on open ────────────────────────────────────────────────────────

chrome.storage.local.get('claudeApiKey', ({ claudeApiKey }) => {
  if (claudeApiKey) {
    hasExistingKey = true;
    setKeyStatus(true);
  } else {
    setKeyStatus(false);
  }
});

// ── Save ──────────────────────────────────────────────────────────────────────

saveBtn.addEventListener('click', () => {
  const key = apiKeyInput.value.trim();

  if (!key && hasExistingKey) {
    showStatus('Key is already saved.', 'success');
    return;
  }

  if (!key) {
    showStatus('Enter an API key first.', 'error');
    return;
  }

  if (!key.startsWith('sk-ant-')) {
    showStatus('Key should start with sk-ant-', 'error');
    return;
  }

  chrome.storage.local.set({ claudeApiKey: key }, () => {
    hasExistingKey = true;
    apiKeyInput.value = '';
    apiKeyInput.type = 'password';
    eyeOpen.style.display   = '';
    eyeClosed.style.display = 'none';
    showStatus('Saved!', 'success');
    setKeyStatus(true);
  });
});

// ── Clear ─────────────────────────────────────────────────────────────────────

clearBtn.addEventListener('click', () => {
  chrome.storage.local.remove('claudeApiKey', () => {
    hasExistingKey = false;
    apiKeyInput.value = '';
    apiKeyInput.type = 'password';
    eyeOpen.style.display   = '';
    eyeClosed.style.display = 'none';
    showStatus('Key cleared.', 'success');
    setKeyStatus(false);
  });
});

// ── Show / hide toggle ────────────────────────────────────────────────────────
// Only reveals text the user has typed — never retrieves the stored key.

toggleBtn.addEventListener('click', () => {
  const isPassword = apiKeyInput.type === 'password';
  apiKeyInput.type = isPassword ? 'text' : 'password';
  eyeOpen.style.display   = isPassword ? 'none' : '';
  eyeClosed.style.display = isPassword ? ''     : 'none';
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function showStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = type;
  setTimeout(() => {
    statusEl.textContent = '';
    statusEl.className = '';
  }, 3000);
}

function setKeyStatus(hasSavedKey) {
  if (hasSavedKey) {
    keyStatusRow.style.display  = '';
    keyStatusText.textContent   = 'API key saved';
  } else {
    keyStatusRow.style.display  = 'none';
  }
}
