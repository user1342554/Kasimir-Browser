const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  closeWindow: () => {
    ipcRenderer.send('window-close');
  },
  minimizeWindow: () => {
    ipcRenderer.send('window-minimize');
  },
  maximizeWindow: () => {
    ipcRenderer.send('window-maximize');
  },
  
  // Browser navigation
  navigateToUrl: (url) => {
    ipcRenderer.send('navigate-to-url', url);
  },
  goBack: () => {
    ipcRenderer.send('browser-back');
  },
  goForward: () => {
    ipcRenderer.send('browser-forward');
  },
  reload: () => {
    ipcRenderer.send('browser-reload');
  },
  
  // Animation completion signal
  signalAnimationComplete: () => {
    ipcRenderer.send('startup-animation-complete');
  }
});

// Expose the application directory path for local file loading
contextBridge.exposeInMainWorld('appPath', {
  appDir: __dirname,
  join: (...args) => path.join(...args)
});