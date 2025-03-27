document.addEventListener('DOMContentLoaded', () => {
  console.log('Renderer script loaded');

  // ------------------ DOM Elements ------------------
  const sidebar = document.getElementById('sidebar');
  const tabsContainer = document.getElementById('tabs-container');
  const newTabButton = document.getElementById('new-tab-button');
  const webviewContainer = document.getElementById('webview-container');
  const urlForm = document.getElementById('url-form');
  const urlInput = document.getElementById('url-input');
  const backButton = document.getElementById('back-button');
  const forwardButton = document.getElementById('forward-button');
  const reloadButton = document.getElementById('reload-button');
  const extensionsButton = document.getElementById('extensions-button');
  const extensionsPanel = document.getElementById('extensions-panel');
  const loadingBar = document.getElementById('loading-bar');
  const minimizeButton = document.getElementById('minimize-button');
  const maximizeButton = document.getElementById('maximize-button');
  const closeButton = document.getElementById('close-button');
  const settingsButton = document.getElementById('settings-button');
  const settingsPanel = document.getElementById('settings-panel');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const startupAnimation = document.getElementById('startup-animation');

  // ------------------ State Variables ------------------
  let tabs = [];
  let activeTabId = null;

  // ------------------ Simple Utility Functions ------------------
  function getHomepageUrl() {
    // Create absolute path to homepage.html
    let path = window.appPath.appDir.replace(/\\/g, '/');
    if (!path.startsWith('file://')) {
      path = 'file://' + path;
    }
    if (!path.endsWith('/homepage.html')) {
      path = path + '/homepage.html';
    }
    console.log('Homepage URL:', path);
    return path;
  }
  
  function formatUrl(url) {
    if (!url) return '';
    if (url.startsWith('file://')) {
      return url.includes('homepage.html') ? '' : 'Local File';
    }
    return url.replace(/^(https?:\/\/)?(www\.)?/i, '');
  }
  
  function processUrl(url) {
    if (!url || url === 'about:blank') {
      return getHomepageUrl();
    }
    if (url === 'homepage.html') {
      return getHomepageUrl();
    }
    if (!/^(https?:\/\/|file:\/\/|about:)/i.test(url)) {
      if (/^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(url)) {
        return 'https://' + url;
      } else {
        return 'https://www.google.com/search?q=' + encodeURIComponent(url);
      }
    }
    return url;
  }
  
  function generateId() {
    return 'tab-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  }
  
  function showNotification(message, type = 'info') {
    let notification = document.getElementById('notification');
    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'notification';
      document.body.appendChild(notification);
    }
    notification.textContent = message;
    notification.className = type;
    notification.classList.add('show');
    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }

  // ------------------ Tab Management ------------------
  function initializeBrowser() {
    console.log('Initializing browser...');
    webviewContainer.innerHTML = '';
    const savedTabs = localStorage.getItem('browser-tabs');
    if (savedTabs) {
      try {
        tabs = JSON.parse(savedTabs);
        if (tabs.length === 0) {
          createNewTab();
        } else {
          renderTabs();
          const activeTab = tabs.find(tab => tab.active);
          if (activeTab) {
            setActiveTab(activeTab.id);
          } else {
            setActiveTab(tabs[0].id);
          }
        }
      } catch (e) {
        console.error('Error loading saved tabs:', e);
        createNewTab();
      }
    } else {
      createNewTab();
    }
  }
  
  function createNewTab() {
    const tabId = generateId();
    console.log('Creating new tab with ID:', tabId);
    tabs.forEach(tab => tab.active = false);
    const newTab = {
      id: tabId,
      title: 'New Tab',
      url: getHomepageUrl(),
      favicon: '',
      active: true
    };
    tabs.push(newTab);
    activeTabId = tabId;
    renderTabs();
    if (urlInput) {
      urlInput.value = '';
    }
    createTabWebview(tabId);
    saveTabs();
    return tabId;
  }
  
  function saveTabs() {
    try {
      localStorage.setItem('browser-tabs', JSON.stringify(tabs));
    } catch (e) {
      console.error('Error saving tabs:', e);
    }
  }
  
  function renderTabs() {
    tabsContainer.innerHTML = '';
    tabs.forEach(tab => {
      const tabElement = document.createElement('div');
      tabElement.className = 'tab';
      if (tab.active) {
        tabElement.classList.add('active');
      }
      tabElement.dataset.id = tab.id;
      tabElement.dataset.url = tab.url;
      tabElement.setAttribute('data-title', tab.title || 'New Tab');
      
      const favicon = document.createElement('div');
      favicon.className = 'tab-favicon';
      if (tab.favicon) {
        favicon.innerHTML = `<img src="${tab.favicon}" alt="">`;
      } else {
        favicon.innerHTML = `<span class="material-symbols-rounded">public</span>`;
      }
      
      const title = document.createElement('div');
      title.className = 'tab-title';
      title.textContent = tab.title || 'New Tab';
      
      const closeBtn = document.createElement('button');
      closeBtn.className = 'tab-close';
      closeBtn.innerHTML = `<span class="material-symbols-rounded">close</span>`;
      closeBtn.setAttribute('aria-label', 'Close tab');
      
      tabElement.addEventListener('click', (e) => {
        if (!e.target.closest('.tab-close')) {
          setActiveTab(tab.id);
        }
      });
      
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        closeTab(tab.id);
      });
      
      tabElement.appendChild(favicon);
      tabElement.appendChild(title);
      tabElement.appendChild(closeBtn);
      
      tabsContainer.appendChild(tabElement);
    });
  }
  
  function createTabWebview(tabId) {
    console.log(`Creating webview for tab ${tabId}`);
    document.querySelectorAll('.tab-webview-container').forEach(container => {
      container.style.display = 'none';
    });
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) {
      console.error(`Tab ${tabId} not found`);
      return;
    }
    
    let container = document.getElementById(`webview-container-${tabId}`);
    if (!container) {
      console.log(`Creating new webview container for tab ${tabId}`);
      container = document.createElement('div');
      container.id = `webview-container-${tabId}`;
      container.className = 'tab-webview-container';
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.display = 'flex';
      
      const webview = document.createElement('webview');
      webview.id = `webview-${tabId}`;
      webview.setAttribute('allowpopups', 'true');
      webview.style.width = '100%';
      webview.style.height = '100%';
      webview.style.display = 'flex';
      
      // *** Set preload attribute to inject our shortcut handler ***
      // Ensure the path is correct; you might need to use an absolute path.
      webview.setAttribute('preload', 'preload-shortcuts.js');
      
      // Listen for IPC messages from the preload script
      webview.addEventListener('ipc-message', (event) => {
        if (event.channel === 'shortcut') {
          const data = event.args[0];
          switch(data.type) {
            case 'new-tab':
              createNewTab();
              break;
            case 'close-tab':
              closeTab(activeTabId);
              break;
            case 'reload-tab': {
                const webview = document.getElementById(`webview-${activeTabId}`);
                if (webview) {
                  webview.reload();
                }
              }
              break;
            case 'focus-url':
              if (urlInput) {
                urlInput.focus();
                urlInput.select();
              }
              break;
            case 'find':
              showNotification('Find on page not implemented', 'info');
              break;
            case 'zoom-in': {
                const webview = document.getElementById(`webview-${activeTabId}`);
                if (webview && typeof webview.getZoomFactor === 'function') {
                  let factor = webview.getZoomFactor();
                  webview.setZoomFactor(factor + 0.1);
                }
              }
              break;
            case 'zoom-out': {
                const webview = document.getElementById(`webview-${activeTabId}`);
                if (webview && typeof webview.getZoomFactor === 'function') {
                  let factor = webview.getZoomFactor();
                  webview.setZoomFactor(Math.max(0.1, factor - 0.1));
                }
              }
              break;
            case 'zoom-reset': {
                const webview = document.getElementById(`webview-${activeTabId}`);
                if (webview && typeof webview.setZoomFactor === 'function') {
                  webview.setZoomFactor(1);
                }
              }
              break;
            case 'back': {
                const webview = document.getElementById(`webview-${activeTabId}`);
                if (webview && webview.canGoBack && webview.canGoBack()) {
                  webview.goBack();
                }
              }
              break;
            case 'forward': {
                const webview = document.getElementById(`webview-${activeTabId}`);
                if (webview && webview.canGoForward && webview.canGoForward()) {
                  webview.goForward();
                }
              }
              break;
          }
        }
      });
      
      // Add other event listeners as before
      webview.addEventListener('did-start-loading', () => {
        console.log(`Tab ${tabId} started loading`);
        if (tabId === activeTabId) {
          loadingBar.classList.add('loading');
        }
      });
      
      webview.addEventListener('did-stop-loading', () => {
        console.log(`Tab ${tabId} finished loading`);
        if (tabId === activeTabId) {
          loadingBar.classList.remove('loading');
          updateNavButtons();
        }
      });
      
      webview.addEventListener('dom-ready', () => {
        console.log(`Webview for tab ${tabId} is dom-ready.`);
        updateNavButtons();
      });
      
      webview.addEventListener('did-navigate', (e) => {
        console.log(`Tab ${tabId} navigated to ${e.url}`);
        tab.url = e.url;
        saveTabs();
        if (tabId === activeTabId && urlInput) {
          urlInput.value = formatUrl(e.url);
        }
      });
      
      webview.addEventListener('page-title-updated', (e) => {
        console.log(`Tab ${tabId} title updated to "${e.title}"`);
        tab.title = e.title;
        saveTabs();
        const tabElement = document.querySelector(`.tab[data-id="${tabId}"]`);
        if (tabElement) {
          const titleElement = tabElement.querySelector('.tab-title');
          if (titleElement) {
            titleElement.textContent = e.title;
          }
          tabElement.setAttribute('data-title', e.title);
        }
      });
      
      webview.addEventListener('page-favicon-updated', (e) => {
        if (e.favicons && e.favicons.length > 0) {
          console.log(`Tab ${tabId} favicon updated`);
          tab.favicon = e.favicons[0];
          saveTabs();
          const tabElement = document.querySelector(`.tab[data-id="${tabId}"]`);
          if (tabElement) {
            const faviconElement = tabElement.querySelector('.tab-favicon');
            if (faviconElement) {
              faviconElement.innerHTML = `<img src="${e.favicons[0]}" alt="">`;
            }
          }
        }
      });
      
      webview.addEventListener('did-fail-load', (e) => {
        if (e.validatedURL === 'about:blank') return;
        console.error(`Tab ${tabId} failed to load: ${e.errorDescription} (${e.errorCode})`);
        if (tabId === activeTabId) {
          loadingBar.classList.remove('loading');
          showNotification(`Failed to load page: ${e.errorDescription}`, 'error');
        }
      });
      
      webview.addEventListener('new-window', (e) => {
        console.log(`Tab ${tabId} requested new window for ${e.url}`);
        const newTabId = createNewTab();
        const newTab = tabs.find(t => t.id === newTabId);
        if (newTab) {
          newTab.url = e.url;
          const newWebview = document.getElementById(`webview-${newTabId}`);
          if (newWebview) {
            setTimeout(() => {
              newWebview.src = e.url;
            }, 50);
          }
          saveTabs();
        }
        e.preventDefault();
      });
      
      console.log(`Setting initial URL for tab ${tabId}: ${tab.url}`);
      webview.src = tab.url;
      container.appendChild(webview);
      webviewContainer.appendChild(container);
    } else {
      console.log(`Using existing webview container for tab ${tabId}`);
      container.style.display = 'flex';
    }
    
    if (urlInput) {
      urlInput.value = formatUrl(tab.url);
    }
    return container;
  }
  
  function setActiveTab(tabId) {
    console.log(`Setting active tab to ${tabId}`);
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) {
      console.error(`Tab ${tabId} not found`);
      return;
    }
    tabs.forEach(t => t.active = (t.id === tabId));
    activeTabId = tabId;
    document.querySelectorAll('.tab').forEach(el => {
      el.classList.toggle('active', el.dataset.id === tabId);
    });
    document.querySelectorAll('.tab-webview-container').forEach(container => {
      container.style.display = 'none';
    });
    const container = document.getElementById(`webview-container-${tabId}`);
    if (container) {
      container.style.display = 'flex';
    } else {
      createTabWebview(tabId);
    }
    if (urlInput) {
      urlInput.value = formatUrl(tab.url);
    }
    updateNavButtons();
    saveTabs();
  }
  
  function closeTab(tabId) {
    console.log(`Closing tab ${tabId}`);
    const index = tabs.findIndex(t => t.id === tabId);
    if (index === -1) {
      console.error(`Tab ${tabId} not found`);
      return;
    }
    if (tabs.length === 1) {
      createNewTab();
      removeTab(tabId);
      return;
    }
    const isActive = tabId === activeTabId;
    removeTab(tabId);
    if (isActive) {
      const newIndex = Math.min(index, tabs.length - 1);
      setActiveTab(tabs[newIndex].id);
    }
  }
  
  function removeTab(tabId) {
    tabs = tabs.filter(t => t.id !== tabId);
    const container = document.getElementById(`webview-container-${tabId}`);
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    saveTabs();
    renderTabs();
  }
  
  function navigateActiveTab(url) {
    console.log(`Navigating active tab to ${url}`);
    if (!activeTabId) {
      console.error('No active tab');
      return;
    }
    const processedUrl = processUrl(url);
    const tab = tabs.find(t => t.id === activeTabId);
    if (!tab) {
      console.error(`Active tab ${activeTabId} not found`);
      return;
    }
    tab.url = processedUrl;
    const webview = document.getElementById(`webview-${activeTabId}`);
    if (webview) {
      console.log(`Navigating webview to ${processedUrl}`);
      webview.src = processedUrl;
    } else {
      console.error(`Webview for tab ${activeTabId} not found`);
    }
    saveTabs();
  }
  
  function updateNavButtons() {
    const webview = document.getElementById(`webview-${activeTabId}`);
    if (!webview) return;
    if (backButton) {
      try {
        backButton.classList.toggle('disabled', !webview.canGoBack());
      } catch (e) {
        console.error('Error updating back button:', e);
      }
    }
    if (forwardButton) {
      try {
        forwardButton.classList.toggle('disabled', !webview.canGoForward());
      } catch (e) {
        console.error('Error updating forward button:', e);
      }
    }
  }

  // ------------------ Additional UI Setup ------------------
  document.addEventListener('DOMContentLoaded', () => {
    const settingsButton = document.getElementById('settings-button');
    const settingsPanel = document.getElementById('settings-panel');
    
    if (settingsButton && settingsPanel) {
      const newSettingsButton = settingsButton.cloneNode(true);
      settingsButton.parentNode.replaceChild(newSettingsButton, settingsButton);
      
      newSettingsButton.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Settings button clicked');
        settingsPanel.classList.toggle('active');
        const extensionsPanel = document.getElementById('extensions-panel');
        if (extensionsPanel && extensionsPanel.classList.contains('active')) {
          extensionsPanel.classList.remove('active');
        }
        if (settingsPanel.classList.contains('active')) {
          document.addEventListener('click', closeSettingsPanelOutside);
        } else {
          document.removeEventListener('click', closeSettingsPanelOutside);
        }
      });
      
      function closeSettingsPanelOutside(e) {
        if (!settingsPanel.contains(e.target) && e.target !== newSettingsButton) {
          settingsPanel.classList.remove('active');
          document.removeEventListener('click', closeSettingsPanelOutside);
        }
      }
      
      const settingsTabButtons = document.querySelectorAll('.settings-tab-button');
      const settingsTabContents = document.querySelectorAll('.settings-tab-content');
      
      settingsTabButtons.forEach(button => {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        newButton.addEventListener('click', () => {
          const tabToShow = newButton.dataset.tab;
          settingsTabButtons.forEach(btn => {
            btn.classList.toggle('active', btn === newButton);
          });
          settingsTabContents.forEach(content => {
            const isActive = content.id === `${tabToShow}-tab`;
            content.classList.toggle('active', isActive);
          });
        });
      });
      
      const extensionsButton = document.getElementById('extensions-button');
      const extensionsPanel = document.getElementById('extensions-panel');
      
      if (extensionsButton && extensionsPanel) {
        const newExtensionsButton = extensionsButton.cloneNode(true);
        extensionsButton.parentNode.replaceChild(newExtensionsButton, extensionsButton);
        
        newExtensionsButton.addEventListener('click', (e) => {
          e.preventDefault();
          extensionsPanel.classList.toggle('active');
          if (settingsPanel.classList.contains('active')) {
            settingsPanel.classList.remove('active');
          }
          if (extensionsPanel.classList.contains('active')) {
            document.addEventListener('click', closeExtensionsPanelOutside);
          } else {
            document.removeEventListener('click', closeExtensionsPanelOutside);
          }
        });
        
        function closeExtensionsPanelOutside(e) {
          if (!extensionsPanel.contains(e.target) && e.target !== newExtensionsButton) {
            extensionsPanel.classList.remove('active');
            document.removeEventListener('click', closeExtensionsPanelOutside);
          }
        }
      }
    } else {
      console.error('Settings button or panel not found');
    }
    
    const styleCheck = document.createElement('style');
    styleCheck.textContent = `
      #settings-panel {
        position: absolute;
        top: calc(var(--toolbar-height) + 8px);
        right: 16px;
        width: 420px;
        background: var(--card-bg);
        border-radius: var(--global-radius);
        box-shadow: var(--shadow-lg);
        z-index: 200;
        padding: 24px;
        transform: translateY(-20px);
        opacity: 0;
        pointer-events: none;
        overflow-y: auto;
        max-height: calc(100vh - var(--toolbar-height) - 32px);
        border: 1px solid var(--border-color);
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
                  opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }
      #settings-panel.active {
        transform: translateY(0);
        opacity: 1;
        pointer-events: auto;
      }
      #settings-button {
        width: 36px;
        height: 36px;
        display: flex;
        justify-content: center;
        align-items: center;
        background: var(--button-bg);
        border: none;
        cursor: pointer;
        border-radius: var(--button-radius);
        color: var(--text-secondary);
        margin-left: 16px;
        position: relative;
        overflow: hidden;
      }
    `;
    document.head.appendChild(styleCheck);
    
    console.log('Settings Button Element:', settingsButton);
    console.log('Settings Panel Element:', settingsPanel);
    
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        if (settingsPanel) {
          settingsPanel.classList.toggle('active');
        }
      }
    });
  });

  // ------------------ Event Listeners ------------------
  
  if (newTabButton) {
    newTabButton.addEventListener('click', () => {
      createNewTab();
    });
  }
  
  if (urlForm) {
    urlForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const url = urlInput.value.trim();
      if (url) {
        navigateActiveTab(url);
      }
    });
  }
  
  if (backButton) {
    backButton.addEventListener('click', () => {
      const webview = document.getElementById(`webview-${activeTabId}`);
      if (webview && webview.canGoBack && webview.canGoBack()) {
        webview.goBack();
      }
    });
  }
  
  if (forwardButton) {
    forwardButton.addEventListener('click', () => {
      const webview = document.getElementById(`webview-${activeTabId}`);
      if (webview && webview.canGoForward && webview.canGoForward()) {
        webview.goForward();
      }
    });
  }
  
  if (reloadButton) {
    reloadButton.addEventListener('click', () => {
      const webview = document.getElementById(`webview-${activeTabId}`);
      if (webview) {
        webview.reload();
      }
    });
  }
  
  if (minimizeButton) {
    minimizeButton.addEventListener('click', () => {
      if (window.electronAPI) {
        window.electronAPI.minimizeWindow();
      }
    });
  }
  
  if (maximizeButton) {
    maximizeButton.addEventListener('click', () => {
      if (window.electronAPI) {
        window.electronAPI.maximizeWindow();
      }
    });
  }
  
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      if (window.electronAPI) {
        window.electronAPI.closeWindow();
      }
    });
  }
  
  if (startupAnimation) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            mutation.attributeName === 'class' && 
            startupAnimation.classList.contains('hidden')) {
          initializeBrowser();
          observer.disconnect();
        }
      });
    });
    
    observer.observe(startupAnimation, { attributes: true });
    
    if (startupAnimation.classList.contains('hidden')) {
      initializeBrowser();
    }
  } else {
    initializeBrowser();
  }
  
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
      if (urlInput) {
        urlInput.focus();
        urlInput.select();
        e.preventDefault();
      }
      return;
    }
    
    const isInputFocused = document.activeElement.tagName === 'INPUT' || 
                           document.activeElement.tagName === 'TEXTAREA' || 
                           document.activeElement.isContentEditable;
    if (isInputFocused && e.key !== 'Escape') return;
    
    if ((e.ctrlKey || e.metaKey) && e.key === 't') {
      createNewTab();
      e.preventDefault();
      return;
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
      closeTab(activeTabId);
      e.preventDefault();
      return;
    }
    
    if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.key === 'r')) {
      const webview = document.getElementById(`webview-${activeTabId}`);
      if (webview) {
        webview.reload();
      }
      e.preventDefault();
      return;
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'Tab' && !e.shiftKey) {
      const currentIndex = tabs.findIndex(t => t.id === activeTabId);
      const nextIndex = (currentIndex + 1) % tabs.length;
      setActiveTab(tabs[nextIndex].id);
      e.preventDefault();
      return;
    }
    
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Tab') {
      const currentIndex = tabs.findIndex(t => t.id === activeTabId);
      const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      setActiveTab(tabs[prevIndex].id);
      e.preventDefault();
      return;
    }
  });

  // ------------------ (Optional) Message Listener for Pages Not in Webviews ------------------
  // This catches messages from the homepage when loaded outside a webview.
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type) {
      switch(e.data.type) {
        case 'new-tab':
          createNewTab();
          break;
        case 'close-tab':
          closeTab(activeTabId);
          break;
        case 'reload-tab': {
            const webview = document.getElementById(`webview-${activeTabId}`);
            if (webview) {
              webview.reload();
            }
          }
          break;
        case 'focus-url':
          if (urlInput) {
            urlInput.focus();
            urlInput.select();
          }
          break;
        case 'find':
          showNotification('Find on page not implemented', 'info');
          break;
        case 'zoom-in': {
            const webview = document.getElementById(`webview-${activeTabId}`);
            if (webview && typeof webview.getZoomFactor === 'function') {
              let factor = webview.getZoomFactor();
              webview.setZoomFactor(factor + 0.1);
            }
          }
          break;
        case 'zoom-out': {
            const webview = document.getElementById(`webview-${activeTabId}`);
            if (webview && typeof webview.getZoomFactor === 'function') {
              let factor = webview.getZoomFactor();
              webview.setZoomFactor(Math.max(0.1, factor - 0.1));
            }
          }
          break;
        case 'zoom-reset': {
            const webview = document.getElementById(`webview-${activeTabId}`);
            if (webview && typeof webview.setZoomFactor === 'function') {
              webview.setZoomFactor(1);
            }
          }
          break;
        case 'back': {
            const webview = document.getElementById(`webview-${activeTabId}`);
            if (webview && webview.canGoBack && webview.canGoBack()) {
              webview.goBack();
            }
          }
          break;
        case 'forward': {
            const webview = document.getElementById(`webview-${activeTabId}`);
            if (webview && webview.canGoForward && webview.canGoForward()) {
              webview.goForward();
            }
          }
          break;
      }
    }
  });
});