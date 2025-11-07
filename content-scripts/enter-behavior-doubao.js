// Doubao Enter/Shift+Enter behavior swap
// Mirrors DeepSeek/Grok implementations but accommodates Doubao's DOM

function createEnterEvent(modifiers = {}) {
  return new KeyboardEvent('keydown', {
    key: 'Enter',
    code: 'Enter',
    keyCode: 13,
    which: 13,
    bubbles: true,
    cancelable: true,
    shiftKey: modifiers.shift || false,
    ctrlKey: modifiers.ctrl || false,
    metaKey: modifiers.meta || false,
    altKey: modifiers.alt || false
  });
}

const SEND_BUTTON_SELECTORS = [
  // Priority 1: Explicit send button types/roles
  { type: 'css', value: 'button[type="submit"]' },
  { type: 'css', value: 'button[data-testid="chat-send-btn"]' },
  { type: 'css', value: '[role="button"][data-testid="chat-send-btn"]' },

  // Priority 2: Buttons with aria-label/title referencing send/save actions
  { type: 'aria', textKey: 'send' },
  { type: 'aria', textKey: 'submit' },

  // Priority 3: Text-based buttons
  { type: 'text', textKey: 'send' },
  { type: 'text', textKey: 'submit' }
];

function insertTextareaNewline(textarea) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;

  textarea.value = `${value.substring(0, start)}\n${value.substring(end)}`;
  textarea.selectionStart = textarea.selectionEnd = start + 1;

  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.dispatchEvent(new Event('change', { bubbles: true }));
}

function isDoubaoPromptArea(element) {
  if (!element) return false;

  const isTextarea = element.tagName === 'TEXTAREA';
  const isContentEditable = element.tagName === 'DIV' &&
    element.isContentEditable &&
    (element.getAttribute('role') === 'textbox' ||
     element.getAttribute('contenteditable') === 'true');

  if (isTextarea) {
    return element.placeholder?.length > 0 ||
      element.classList.contains('semi-input-textarea-inner');
  }

  if (isContentEditable) {
    return element.closest('[data-editor-root]') ||
      element.classList.contains('semi-input-textarea') ||
      element.dataset?.slateEditor === 'true';
  }

  return false;
}

function findSendButton(activeElement) {
  // Prefer a button that lives within the composer area
  if (activeElement) {
    let container = activeElement.closest('[data-editor-root]') ||
      activeElement.closest('[data-testid="chat-editor"]');

    for (let i = 0; i < 5 && container; i++) {
      const localButton = container.querySelector('button[type="submit"], button[data-testid="chat-send-btn"]');
      if (localButton && !localButton.disabled) return localButton;
      container = container.parentElement;
    }
  }

  return window.ButtonFinderUtils?.findButton
    ? window.ButtonFinderUtils.findButton(SEND_BUTTON_SELECTORS)
    : null;
}

function handleEnterSwap(event) {
  if (!event.isTrusted || event.code !== 'Enter') {
    return;
  }

  if (!enterKeyConfig || !enterKeyConfig.enabled) {
    return;
  }

  const activeElement = document.activeElement;
  const isPromptArea = isDoubaoPromptArea(activeElement);

  if (!isPromptArea) {
    return;
  }

  if (matchesModifiers(event, enterKeyConfig.newlineModifiers)) {
    event.preventDefault();
    event.stopImmediatePropagation();

    if (activeElement.tagName === 'TEXTAREA') {
      insertTextareaNewline(activeElement);
    } else {
      const newlineEvent = createEnterEvent({ shift: true });
      activeElement.dispatchEvent(newlineEvent);
    }
    return;
  }

  if (matchesModifiers(event, enterKeyConfig.sendModifiers)) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const sendButton = findSendButton(activeElement);

    if (sendButton && !sendButton.disabled && !sendButton.getAttribute('aria-disabled')) {
      sendButton.click();
    } else {
      const fallbackEvent = createEnterEvent();
      activeElement.dispatchEvent(fallbackEvent);
    }
    return;
  }

  // Block unsupported combos to prevent conflicting shortcuts
  event.preventDefault();
  event.stopImmediatePropagation();
}

applyEnterSwapSetting();
