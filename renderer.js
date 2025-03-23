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
    
    // Make sure it has the file:// prefix
    if (!path.startsWith('file://')) {
      path = 'file://' + path;
    }
    
    // Ensure the path ends with /homepage.html
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
    
    // Clear the webview container
    webviewContainer.innerHTML = '';
    
    // Load saved tabs or create a new tab
    const savedTabs = localStorage.getItem('browser-tabs');
    if (savedTabs) {
      try {
        tabs = JSON.parse(savedTabs);
        if (tabs.length === 0) {
          createNewTab();
        } else {
          renderTabs();
          // Activate the previously active tab or the first tab
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
    // Generate a unique tab ID
    const tabId = generateId();
    
    console.log('Creating new tab with ID:', tabId);
    
    // Mark all existing tabs as inactive
    tabs.forEach(tab => tab.active = false);
    
    // Add the new tab to the tabs array
    const newTab = {
      id: tabId,
      title: 'New Tab',
      url: getHomepageUrl(),
      favicon: '',
      active: true
    };
    
    tabs.push(newTab);
    activeTabId = tabId;
    
    // Render the tabs
    renderTabs();
    
    // Clear and focus the URL input
    if (urlInput) {
      urlInput.value = '';
    }
    
    // Create a webview for the new tab
    createTabWebview(tabId);
    
    // Save tabs
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
    // Clear the tabs container
    tabsContainer.innerHTML = '';
    
    // Create and append tab elements
    tabs.forEach(tab => {
      const tabElement = document.createElement('div');
      tabElement.className = 'tab';
      if (tab.active) {
        tabElement.classList.add('active');
      }
      tabElement.dataset.id = tab.id;
      tabElement.dataset.url = tab.url;
      tabElement.setAttribute('data-title', tab.title || 'New Tab');
      
      // Favicon
      const favicon = document.createElement('div');
      favicon.className = 'tab-favicon';
      if (tab.favicon) {
        favicon.innerHTML = `<img src="${tab.favicon}" alt="">`;
      } else {
        favicon.innerHTML = `<span class="material-symbols-rounded">public</span>`;
      }
      
      // Title
      const title = document.createElement('div');
      title.className = 'tab-title';
      title.textContent = tab.title || 'New Tab';
      
      // Close button
      const closeBtn = document.createElement('button');
      closeBtn.className = 'tab-close';
      closeBtn.innerHTML = `<span class="material-symbols-rounded">close</span>`;
      closeBtn.setAttribute('aria-label', 'Close tab');
      
      // Add event listeners
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
      
      // Assemble tab element
      tabElement.appendChild(favicon);
      tabElement.appendChild(title);
      tabElement.appendChild(closeBtn);
      
      tabsContainer.appendChild(tabElement);
    });
  }
  
  function createTabWebview(tabId) {
    console.log(`Creating webview for tab ${tabId}`);
    
    // First, hide all existing webviews
    document.querySelectorAll('.tab-webview-container').forEach(container => {
      container.style.display = 'none';
    });
    
    // Find the tab
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) {
      console.error(`Tab ${tabId} not found`);
      return;
    }
    
    // Check if webview container already exists
    let container = document.getElementById(`webview-container-${tabId}`);
    
    if (!container) {
      console.log(`Creating new webview container for tab ${tabId}`);
      
      // Create a new container
      container = document.createElement('div');
      container.id = `webview-container-${tabId}`;
      container.className = 'tab-webview-container';
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.display = 'flex';
      
      // Create a new webview
      const webview = document.createElement('webview');
      webview.id = `webview-${tabId}`;
      webview.setAttribute('allowpopups', 'true');
      webview.style.width = '100%';
      webview.style.height = '100%';
      webview.style.display = 'flex';
      
      // Add webview event listeners
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
        
        // Update tab URL
        tab.url = e.url;
        saveTabs();
        
        // Update URL input if active tab
        if (tabId === activeTabId && urlInput) {
          urlInput.value = formatUrl(e.url);
        }
      });
      
      webview.addEventListener('page-title-updated', (e) => {
        console.log(`Tab ${tabId} title updated to "${e.title}"`);
        
        // Update tab title
        tab.title = e.title;
        saveTabs();
        
        // Update tab UI
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
          
          // Update tab favicon
          tab.favicon = e.favicons[0];
          saveTabs();
          
          // Update tab UI
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
        
        // Create a new tab for the new window
        const newTabId = createNewTab();
        
        // Navigate the new tab to the requested URL
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
      
      // Set the src attribute (homepage)
      console.log(`Setting initial URL for tab ${tabId}: ${tab.url}`);
      webview.src = tab.url;
      
      // Append the webview to the container
      container.appendChild(webview);
      
      // Append the container to the webview container
      webviewContainer.appendChild(container);
    } else {
      console.log(`Using existing webview container for tab ${tabId}`);
      container.style.display = 'flex';
    }
    
    // Update the URL input
    if (urlInput) {
      urlInput.value = formatUrl(tab.url);
    }
    
    return container;
  }
  
  function setActiveTab(tabId) {
    console.log(`Setting active tab to ${tabId}`);
    
    // Find the tab
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) {
      console.error(`Tab ${tabId} not found`);
      return;
    }
    
    // Update active status in tabs array
    tabs.forEach(t => t.active = (t.id === tabId));
    activeTabId = tabId;
    
    // Update tab UI
    document.querySelectorAll('.tab').forEach(el => {
      el.classList.toggle('active', el.dataset.id === tabId);
    });
    
    // Hide all webviews
    document.querySelectorAll('.tab-webview-container').forEach(container => {
      container.style.display = 'none';
    });
    
    // Show the active webview
    const container = document.getElementById(`webview-container-${tabId}`);
    if (container) {
      container.style.display = 'flex';
    } else {
      createTabWebview(tabId);
    }
    
    // Update URL input
    if (urlInput) {
      urlInput.value = formatUrl(tab.url);
    }
    
    // Update navigation buttons
    updateNavButtons();
    
    // Save tabs
    saveTabs();
  }
  
  function closeTab(tabId) {
    console.log(`Closing tab ${tabId}`);
    
    // Get the tab index
    const index = tabs.findIndex(t => t.id === tabId);
    if (index === -1) {
      console.error(`Tab ${tabId} not found`);
      return;
    }
    
    // Check if it's the only tab
    if (tabs.length === 1) {
      // Create a new tab first
      createNewTab();
      
      // Then remove the old tab
      removeTab(tabId);
      return;
    }
    
    // Check if it's the active tab
    const isActive = tabId === activeTabId;
    
    // Remove the tab
    removeTab(tabId);
    
    // If it was the active tab, activate another tab
    if (isActive) {
      // Prefer the tab to the left
      const newIndex = Math.min(index, tabs.length - 1);
      setActiveTab(tabs[newIndex].id);
    }
  }
  
  function removeTab(tabId) {
    // Remove the tab from the tabs array
    tabs = tabs.filter(t => t.id !== tabId);
    
    // Remove the webview container
    const container = document.getElementById(`webview-container-${tabId}`);
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    
    // Save tabs
    saveTabs();
    
    // Re-render tabs
    renderTabs();
  }
  
  function navigateActiveTab(url) {
    console.log(`Navigating active tab to ${url}`);
    
    if (!activeTabId) {
      console.error('No active tab');
      return;
    }
    
    // Process the URL
    const processedUrl = processUrl(url);
    
    // Find the active tab
    const tab = tabs.find(t => t.id === activeTabId);
    if (!tab) {
      console.error(`Active tab ${activeTabId} not found`);
      return;
    }
    
    // Update the tab URL
    tab.url = processedUrl;
    
    // Get the webview
    const webview = document.getElementById(`webview-${activeTabId}`);
    if (webview) {
      console.log(`Navigating webview to ${processedUrl}`);
      webview.src = processedUrl;
    } else {
      console.error(`Webview for tab ${activeTabId} not found`);
    }
    
    // Save tabs
    saveTabs();
  }
  
  function updateNavButtons() {
    // Get the active webview
    const webview = document.getElementById(`webview-${activeTabId}`);
    if (!webview) return;
    
    // Update the back button
    if (backButton) {
      try {
        backButton.classList.toggle('disabled', !webview.canGoBack());
      } catch (e) {
        console.error('Error updating back button:', e);
      }
    }
    
    // Update the forward button
    if (forwardButton) {
      try {
        forwardButton.classList.toggle('disabled', !webview.canGoForward());
      } catch (e) {
        console.error('Error updating forward button:', e);
      }
    }
  }

  // ------------------ Additional UI Setup ------------------
  // Settings and Extensions panels, keyboard shortcuts, etc.
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
});
