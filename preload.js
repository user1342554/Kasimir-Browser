const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electronAPI', {
    minimizeWindow: () => ipcRenderer.send('window-minimize'),
    maximizeWindow: () => ipcRenderer.send('window-maximize'),
    closeWindow: () => ipcRenderer.send('window-close'),
    navigateToUrl: (url) => ipcRenderer.send('navigate-to-url', url),
    startupAnimationComplete: () => ipcRenderer.send('startup-animation-complete')
  }
);

// Expose app path variables
contextBridge.exposeInMainWorld(
  'appPath', {
    appDir: __dirname,
    assetDir: path.join(__dirname, 'assets')
  }
);

// Add favicon helper functions for bookmarks
contextBridge.exposeInMainWorld(
  'faviconHelper', {
    // Get favicon for a domain
    getFavicon: async (domain) => {
      try {
        // Try standard favicon.ico location
        const standardPath = `https://${domain}/favicon.ico`;
        
        // Use Google's favicon service as a fallback
        const googleFallback = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
        
        // Return both options for the renderer to try
        return {
          standard: standardPath,
          fallback: googleFallback
        };
      } catch (error) {
        console.error('Error getting favicon:', error);
        return null;
      }
    },
    
    // Extract domain from URL
    extractDomain: (url) => {
      try {
        if (!url) return null;
        
        // Add protocol if missing
        if (!url.match(/^https?:\/\//i)) {
          url = 'https://' + url;
        }
        
        const urlObj = new URL(url);
        return urlObj.hostname;
      } catch (error) {
        console.error('Error extracting domain:', error);
        return null;
      }
    }
  }
);