// preload-shortcuts.js
const { ipcRenderer } = require('electron');

console.log('Preload shortcuts script loaded');

window.addEventListener('keydown', function(e) {
  // Do not capture events if an input, textarea, or contentEditable element is focused
  const activeEl = document.activeElement;
  if (activeEl && (
      activeEl.tagName === 'INPUT' ||
      activeEl.tagName === 'TEXTAREA' ||
      activeEl.isContentEditable
    )) {
    return;
  }
  
  // Normalize key for letters
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

  if ((e.ctrlKey || e.metaKey) && key === 't') {
    e.preventDefault();
    ipcRenderer.sendToHost('shortcut', { type: 'new-tab' });
  } else if ((e.ctrlKey || e.metaKey) && key === 'w') {
    e.preventDefault();
    ipcRenderer.sendToHost('shortcut', { type: 'close-tab' });
  } else if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && key === 'r')) {
    e.preventDefault();
    ipcRenderer.sendToHost('shortcut', { type: 'reload-tab' });
  } else if ((e.ctrlKey || e.metaKey) && key === 'l') {
    e.preventDefault();
    ipcRenderer.sendToHost('shortcut', { type: 'focus-url' });
  } else if ((e.ctrlKey || e.metaKey) && key === 'f') {
    e.preventDefault();
    ipcRenderer.sendToHost('shortcut', { type: 'find' });
  } else if ((e.ctrlKey || e.metaKey) && e.key === '+') {
    e.preventDefault();
    ipcRenderer.sendToHost('shortcut', { type: 'zoom-in' });
  } else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
    e.preventDefault();
    ipcRenderer.sendToHost('shortcut', { type: 'zoom-out' });
  } else if ((e.ctrlKey || e.metaKey) && key === '0') {
    e.preventDefault();
    ipcRenderer.sendToHost('shortcut', { type: 'zoom-reset' });
  } else if (e.altKey && e.key === 'ArrowLeft') {
    e.preventDefault();
    ipcRenderer.sendToHost('shortcut', { type: 'back' });
  } else if (e.altKey && e.key === 'ArrowRight') {
    e.preventDefault();
    ipcRenderer.sendToHost('shortcut', { type: 'forward' });
  }
});
