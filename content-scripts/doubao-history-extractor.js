// Doubao Conversation History Extractor (placeholder implementation)
// Currently logs a message and keeps the extension stable; actual extraction TBD.

(function () {
  'use strict';

  if (!window.ConversationExtractorUtils) {
    console.warn('[Doubao Extractor] ConversationExtractorUtils not available');
    return;
  }

  console.log('[Doubao Extractor] Loaded - TODO implement conversation saving');

  // Insert a hidden marker so future implementations can detect that the script ran.
  document.documentElement.dataset.insidebarDoubaoExtractor = 'ready';
})();
