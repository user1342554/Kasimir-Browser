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
  const settingsTabButtons = document.querySelectorAll('.settings-tab-button');
  const settingsTabContents = document.querySelectorAll('.settings-tab-content');
  const themePresets = document.querySelectorAll('.theme-preset');
  const resetSettingsButton = document.getElementById('reset-settings');
  const saveSettingsButton = document.getElementById('save-settings');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const startupAnimation = document.getElementById('startup-animation');
  
  // Color pickers
  const accentPrimaryInput = document.getElementById('accent-primary');
  const accentSecondaryInput = document.getElementById('accent-secondary');
  const bgColorInput = document.getElementById('bg-color');
  const cardBgInput = document.getElementById('card-bg');
  const textColorInput = document.getElementById('text-color');
  const textSecondaryInput = document.getElementById('text-secondary');
  const borderColorInput = document.getElementById('border-color');
  const hoverBgInput = document.getElementById('hover-bg');

  // ------------------ State Variables ------------------
  let tabs = [];
  let activeTabId = null;
  let saveTabsTimeout = null;
  let isSettingsPanelOpen = false;
  let isExtensionsPanelOpen = false;
  let currentTheme = localStorage.getItem('browserTheme') || 'midnight';
  let currentTemplate = localStorage.getItem('browserTemplate') || 'default';
  let customColors = JSON.parse(localStorage.getItem('customColors') || '{}');
  let extensions = JSON.parse(localStorage.getItem('extensions') || '[]');
  let browserInitialized = false;
  
  // Single webview for better performance - we'll preserve tab states
  const webview = document.getElementById('browser-view') || document.createElement('webview');
  
  // Tab state storage - for efficient tab switching
  const tabStates = {};
  
  // Performance optimization - throttle functions
  function throttle(func, delay) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, delay);
      }
    };
  }

  // ------------------ Utility Functions ------------------
  // Format URL for display
  function formatUrlForDisplay(url) {
    if (!url) return '';
    
    if (url.startsWith('file://')) {
      if (url.includes('homepage.html')) {
        return '';
      }
      return 'kasimir://local-file';
    }
    return url.replace(/^(https?:\/\/)?(www\.)?/i, '');
  }

  // Get homepage path
  function getHomepagePath() {
    return `file://${window.appPath.appDir.replace(/\\/g, '/')}/homepage.html`;
  }

  // ------------------ Browser Initialization ------------------
  function initializeBrowser() {
    if (browserInitialized) return;
    browserInitialized = true;
    
    // Setup webview if needed
    if (!webview.id) {
      webview.id = 'browser-view';
      webview.setAttribute('src', 'about:blank');
      webview.style.width = '100%';
      webview.style.height = '100%';
      webviewContainer.appendChild(webview);
    }

    // Add webview events
    initWebviewEvents();
    
    // Initialize tabs
    initTabs();
    
    // Apply the current theme
    applyTheme(currentTheme);

    // Apply template if saved
    if (currentTemplate && currentTemplate !== 'default') {
      applyTemplate(currentTemplate);
    }

    // Initialize sidebar toggle
    initSidebarToggle();
    
    // Initialize template handlers
    initTemplateHandlers();
    
    // Apply sidebar position if saved
    const savedPosition = localStorage.getItem('sidebarPosition');
    if (savedPosition) {
      applySidebarPosition(savedPosition);
    }
    
    // Apply bookmark bar visibility if saved
    if (localStorage.getItem('showBookmarks') === 'true') {
      toggleBookmarksBar(true);
    }
    
    // Apply tab titles visibility if saved
    if (localStorage.getItem('showTabTitles') === 'false') {
      toggleTabTitles(false);
    }
    
    // Apply tab size if saved
    const savedTabSize = localStorage.getItem('tabSize');
    if (savedTabSize) {
      applyTabSize(savedTabSize);
    }
    
    console.log('Browser initialized successfully');
  }

  // Initialize the browser when startup animation is hidden
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

  // Initialize webview events - only once
  function initWebviewEvents() {
    webview.addEventListener('did-navigate', (e) => {
      urlInput.value = formatUrlForDisplay(e.url);
      
      // Save URL in tab state
      if (activeTabId) {
        const tab = tabs.find(t => t.id === activeTabId);
        if (tab) {
          tab.url = e.url;
          saveTabState(activeTabId);
          saveTabs();
        }
      }
      
      updateNavigationState();
    });

    webview.addEventListener('did-start-loading', () => {
      loadingBar.classList.add('loading');
    });
    
    webview.addEventListener('did-stop-loading', () => {
      loadingBar.classList.remove('loading');
      updateNavigationState();
    });
    
    webview.addEventListener('did-fail-load', (e) => {
      if (e.errorCode === -3) return; // Ignore aborted errors
      
      console.warn(`Navigation failed:`, e.errorDescription);
      loadingBar.classList.remove('loading');
      
      if (e.errorCode !== -3) { // Don't show for aborted requests
        showNotification(`Failed to load page: ${e.errorDescription}`, 'error');
      }
    });
    
    webview.addEventListener('page-title-updated', (e) => {
      if (activeTabId) {
        const tab = tabs.find(t => t.id === activeTabId);
        if (tab) {
          tab.title = e.title;
          
          // Update tab DOM
          const tabElement = document.querySelector(`.tab[data-id="${activeTabId}"]`);
          if (tabElement) {
            const titleElement = tabElement.querySelector('.tab-title');
            if (titleElement) titleElement.textContent = e.title;
            tabElement.setAttribute('data-title', e.title);
          }
          
          saveTabState(activeTabId);
          saveTabs();
        }
      }
    });
    
    webview.addEventListener('page-favicon-updated', (e) => {
      if (e.favicons && e.favicons.length > 0 && activeTabId) {
        const tab = tabs.find(t => t.id === activeTabId);
        if (tab) {
          tab.favicon = e.favicons[0];
          
          // Update favicon in DOM
          const tabElement = document.querySelector(`.tab[data-id="${activeTabId}"]`);
          if (tabElement) {
            const faviconElement = tabElement.querySelector('.tab-favicon');
            if (faviconElement) {
              faviconElement.innerHTML = `<img src="${e.favicons[0]}" alt="">`;
            }
          }
          
          saveTabState(activeTabId);
          saveTabs();
        }
      }
    });
    
    webview.addEventListener('new-window', (e) => {
      createNewTab(e.url);
      e.preventDefault();
    });
  }

  // ------------------ Tab State Management ------------------
  // Save tab state for efficient switching
  function saveTabState(tabId) {
    if (!tabId) return;
    
    tabStates[tabId] = {
      url: webview.src,
      scrollPos: { x: 0, y: 0 }, // We can add scroll position capture if needed
      history: {
        canGoBack: webview.canGoBack(),
        canGoForward: webview.canGoForward()
      }
    };
  }
  
  // Restore tab state when switching tabs
  function restoreTabState(tabId) {
    if (!tabId || !tabStates[tabId]) return;
    
    const state = tabStates[tabId];
    const tab = tabs.find(t => t.id === tabId);
    
    if (state.url !== webview.src) {
      console.log(`Loading URL for tab ${tabId}: ${state.url}`);
      webview.src = state.url || (tab?.url || getHomepagePath());
    }
    
    // Update navigation buttons based on saved history state
    if (state.history) {
      updateCustomNavigationState(state.history);
    } else {
      // Wait for the webview to update
      setTimeout(updateNavigationState, 100);
    }
  }
  
  // Custom update for navigation buttons without calling webview methods
  function updateCustomNavigationState(historyState) {
    if (backButton) backButton.classList.toggle('disabled', !historyState.canGoBack);
    if (forwardButton) forwardButton.classList.toggle('disabled', !historyState.canGoForward);
  }

  // ------------------ Tab Management ------------------
  function initTabs() {
    try {
      const savedTabs = localStorage.getItem('browser-tabs');
      if (savedTabs) {
        tabs = JSON.parse(savedTabs);
        if (tabs.length > 0) {
          const activeTab = tabs.find(tab => tab.active) || tabs[0];
          activeTabId = activeTab.id;
          
          renderTabs();
          
          // Navigate to active tab's URL
          navigateToUrl(activeTab.url);
          urlInput.value = formatUrlForDisplay(activeTab.url);
        } else {
          createNewTab();
        }
      } else {
        createNewTab();
      }
    } catch (error) {
      console.error('Error initializing tabs:', error);
      createNewTab();
    }
  }

  function createNewTab(initialUrl = 'homepage.html') {
    // Check if the parameter is an event object (prevents [object PointerEvent] issue)
    if (initialUrl && typeof initialUrl === 'object' && initialUrl.type) {
      initialUrl = 'homepage.html';
    }
    
    console.log('Creating new tab with URL:', initialUrl);
    const tabId = 'tab-' + Date.now();
    const newTab = {
      id: tabId,
      title: 'New Tab',
      url: initialUrl,
      favicon: '',
      active: true
    };
    
    // Set all other tabs as inactive
    tabs.forEach(tab => tab.active = false);
    tabs.push(newTab);
    activeTabId = tabId;
    
    renderTabs();
    navigateToUrl(initialUrl);
    
    if (initialUrl === 'homepage.html') {
      urlInput.value = '';
      urlInput.focus();
    } else {
      urlInput.value = formatUrlForDisplay(initialUrl);
    }
    
    saveTabs();
    return tabId;
  }

  const renderTabs = throttle(function() {
    // Efficient tab rendering
    const fragment = document.createDocumentFragment();
    
    // Keep track of existing tabs
    const existingTabs = {};
    document.querySelectorAll('.tab').forEach(tab => {
      existingTabs[tab.dataset.id] = tab;
    });
    
    // Tabs that will be removed
    const tabsToRemove = [];
    
    // Process tabs
    tabs.forEach(tab => {
      let tabElement;
      
      if (existingTabs[tab.id]) {
        // Update existing tab
        tabElement = existingTabs[tab.id];
        delete existingTabs[tab.id];
        
        // Update active state
        tabElement.classList.toggle('active', tab.id === activeTabId);
        
        // Update tab content only when needed
        const faviconDiv = tabElement.querySelector('.tab-favicon');
        if (faviconDiv) {
          if (tab.favicon && !faviconDiv.querySelector('img')) {
            faviconDiv.innerHTML = `<img src="${tab.favicon}" alt="">`;
          } else if (!tab.favicon && !faviconDiv.querySelector('.material-symbols-rounded')) {
            faviconDiv.innerHTML = `<span class="material-symbols-rounded">public</span>`;
          }
        }
        
        const titleDiv = tabElement.querySelector('.tab-title');
        if (titleDiv && titleDiv.textContent !== tab.title) {
          titleDiv.textContent = tab.title || 'New Tab';
        }
        
        if (tabElement.getAttribute('data-title') !== tab.title) {
          tabElement.setAttribute('data-title', tab.title || 'New Tab');
        }
      } else {
        // Create new tab element
        tabElement = document.createElement('div');
        tabElement.className = 'tab';
        tabElement.dataset.id = tab.id;
        tabElement.setAttribute('data-title', tab.title || 'New Tab');
        
        if (tab.id === activeTabId) {
          tabElement.classList.add('active');
        }
        
        // Create tab content
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
      }
      
      fragment.appendChild(tabElement);
    });
    
    // Mark remaining tabs for removal
    Object.values(existingTabs).forEach(tab => tabsToRemove.push(tab));
    
    // Update DOM efficiently
    if (tabsContainer) {
      tabsContainer.innerHTML = '';
      tabsContainer.appendChild(fragment);
      
      // Remove old tabs
      tabsToRemove.forEach(tab => {
        if (tab.parentNode) tab.parentNode.removeChild(tab);
      });
    }
  }, 100); // Throttle tab rendering to 100ms

  function setActiveTab(tabId) {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab || tabId === activeTabId) return;
    
    // Save current tab state
    if (activeTabId) {
      saveTabState(activeTabId);
    }
    
    // Update active tab
    tabs.forEach(t => t.active = (t.id === tabId));
    activeTabId = tabId;
    
    // Update UI
    document.querySelectorAll('.tab').forEach(el => {
      el.classList.toggle('active', el.dataset.id === tabId);
    });
    
    // Restore the tab state
    restoreTabState(tabId);
    
    // Update URL input
    urlInput.value = formatUrlForDisplay(tab.url);
    
    saveTabs();
  }

  function closeTab(tabId) {
    if (tabs.length <= 1) {
      createNewTab();
      tabs = tabs.filter(t => t.id !== tabId);
      delete tabStates[tabId];
      saveTabs();
      return;
    }
    
    const index = tabs.findIndex(t => t.id === tabId);
    if (index === -1) return;
    
    const isActive = (tabId === activeTabId);
    
    // Clean up tab state
    delete tabStates[tabId];
    
    // Remove tab from list
    tabs = tabs.filter(t => t.id !== tabId);
    
    if (isActive) {
      // Activate another tab
      const newActiveIndex = Math.min(index, tabs.length - 1);
      tabs[newActiveIndex].active = true;
      activeTabId = tabs[newActiveIndex].id;
      
      // Restore the new active tab
      restoreTabState(activeTabId);
      
      // Update URL display
      urlInput.value = formatUrlForDisplay(tabs[newActiveIndex].url);
    }
    
    renderTabs();
    saveTabs();
  }

  function saveTabs() {
    if (saveTabsTimeout) clearTimeout(saveTabsTimeout);
    saveTabsTimeout = setTimeout(() => {
      try {
        localStorage.setItem('browser-tabs', JSON.stringify(tabs));
      } catch (error) {
        console.error('Error saving tabs:', error);
      }
    }, 300);
  }

  // ------------------ Navigation & URL Handling ------------------
  function navigateToUrl(url) {
    console.log('Navigating to:', url);
    if (!url || url === 'about:blank') {
      url = 'homepage.html';
    }
    
    let formattedUrl = url;
    
    if (url === 'homepage.html') {
      formattedUrl = getHomepagePath();
      
      // Update the active tab
      const tab = tabs.find(t => t.id === activeTabId);
      if (tab) {
        tab.url = formattedUrl;
        tab.title = 'New Tab';
        saveTabs();
      }
    } else if (!/^(https?:\/\/|file:\/\/|about:)/i.test(url)) {
      if (/^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(url)) {
        formattedUrl = 'https://' + url;
      } else {
        formattedUrl = 'https://www.google.com/search?q=' + encodeURIComponent(url);
      }
    }
    
    console.log('Formatted URL:', formattedUrl);
    
    // Configure loading state
    loadingBar.classList.add('loading');
    
    // Perform the navigation
    try {
      webview.src = formattedUrl;
      
      // Update tab info
      const tab = tabs.find(t => t.id === activeTabId);
      if (tab) {
        tab.url = formattedUrl;
        saveTabs();
      }
      
      // Update URL input
      urlInput.value = formatUrlForDisplay(formattedUrl);
      
      // Notify main process (if needed)
      window.electronAPI.navigateToUrl(formattedUrl);
    } catch (error) {
      console.error('Error navigating:', error);
      loadingBar.classList.remove('loading');
      showNotification('Failed to load page', 'error');
    }
  }

  // ------------------ URL Form Submission ------------------
  if (urlForm) {
    urlForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const url = urlInput.value.trim();
      if (url) navigateToUrl(url);
    });
  }

  // ------------------ Sidebar Toggle ------------------
  function initSidebarToggle() {
    // Check for saved state
    const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
    if (isCollapsed && sidebar) {
      sidebar.classList.add('collapsed');
    }
    
    // Set up toggle button event
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        localStorage.setItem('sidebar-collapsed', sidebar.classList.contains('collapsed'));
      });
    }
    
    // Add keyboard shortcut (Ctrl+B)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        if (sidebarToggle) sidebarToggle.click();
      }
    });
  }

  // ------------------ Navigation Buttons ------------------
  if (backButton) {
    backButton.addEventListener('click', () => {
      if (webview.canGoBack()) {
        webview.goBack();
      }
    });
  }
  
  if (forwardButton) {
    forwardButton.addEventListener('click', () => {
      if (webview.canGoForward()) {
        webview.goForward();
      }
    });
  }
  
  if (reloadButton) {
    reloadButton.addEventListener('click', () => {
      webview.reload();
    });
  }
  
  function updateNavigationState() {
    if (backButton) backButton.classList.toggle('disabled', !webview.canGoBack());
    if (forwardButton) forwardButton.classList.toggle('disabled', !webview.canGoForward());
    
    // Update the active tab's history state
    if (activeTabId && tabStates[activeTabId]) {
      tabStates[activeTabId].history = {
        canGoBack: webview.canGoBack(),
        canGoForward: webview.canGoForward()
      };
    }
  }

  // ------------------ New Tab Button ------------------
  if (newTabButton) {
    newTabButton.addEventListener('click', () => {
      createNewTab(); // Call without passing the event
    });
  }

  // ------------------ Settings Panel & Tabs ------------------
  if (settingsButton) {
    settingsButton.addEventListener('click', () => {
      isSettingsPanelOpen = !isSettingsPanelOpen;
      settingsPanel.classList.toggle('active', isSettingsPanelOpen);
      if (isSettingsPanelOpen) loadCurrentThemeSettings();
    });
  }
  
  document.addEventListener('click', (e) => {
    if (isSettingsPanelOpen && 
        settingsPanel && 
        !settingsPanel.contains(e.target) && 
        e.target !== settingsButton) {
      settingsPanel.classList.remove('active');
      isSettingsPanelOpen = false;
    }
  });
  
  if (settingsTabButtons) {
    settingsTabButtons.forEach(tab => {
      tab.addEventListener('click', () => {
        settingsTabButtons.forEach(t => t.classList.remove('active'));
        settingsTabContents.forEach(content => content.classList.remove('active'));
        
        tab.classList.add('active');
        const target = tab.dataset.tab;
        document.getElementById(`${target}-tab`).classList.add('active');
      });
    });
  }
  
  if (themePresets) {
    themePresets.forEach(preset => {
      preset.addEventListener('click', () => {
        themePresets.forEach(p => p.classList.remove('active'));
        preset.classList.add('active');
        
        const themeName = preset.dataset.theme;
        applyTheme(themeName);
        loadCurrentThemeSettings();
      });
    });
  }
  
  if (saveSettingsButton) {
    saveSettingsButton.addEventListener('click', () => {
      const colors = {
        '--accent-primary': accentPrimaryInput.value,
        '--accent-secondary': accentSecondaryInput.value,
        '--bg-color': bgColorInput.value,
        '--card-bg': cardBgInput.value,
        '--text-color': textColorInput.value,
        '--text-secondary': textSecondaryInput.value,
        '--border-color': borderColorInput.value,
        '--hover-bg': hoverBgInput.value
      };
      
      customColors[currentTheme] = colors;
      localStorage.setItem('customColors', JSON.stringify(customColors));
      applyCustomColors(colors);
      
      // Close settings panel
      settingsPanel.classList.remove('active');
      isSettingsPanelOpen = false;
      
      // Show notification
      showNotification('Settings saved successfully', 'success');
    });
  }
  
  if (resetSettingsButton) {
    resetSettingsButton.addEventListener('click', () => {
      if (customColors[currentTheme]) {
        delete customColors[currentTheme];
        localStorage.setItem('customColors', JSON.stringify(customColors));
      }
      
      applyTheme(currentTheme);
      loadCurrentThemeSettings();
      showNotification('Settings reset to default', 'success');
    });
  }

  // ------------------ Theme System Functions ------------------
  function applyTheme(themeName, updateUI = true) {
    // Set theme attribute
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('browserTheme', themeName);
    currentTheme = themeName;
    
    // Apply custom colors if they exist for this theme
    if (customColors[themeName]) {
      applyCustomColors(customColors[themeName]);
    }
    
    // Update UI to reflect current theme (only if explicitly requested)
    if (updateUI && themePresets) {
      // Update theme preset selections
      themePresets.forEach(preset => {
        preset.classList.toggle('active', preset.dataset.theme === themeName);
      });
      
      // Update color inputs to match theme
      loadCurrentThemeSettings();
    }
  }

  function applyCustomColors(colors) {
    for (const [property, value] of Object.entries(colors)) {
      document.documentElement.style.setProperty(property, value);
    }
  }

  function loadCurrentThemeSettings() {
    const computedStyle = getComputedStyle(document.documentElement);
    
    // Get the current values from either custom settings or computed defaults
    if (accentPrimaryInput) {
      accentPrimaryInput.value = customColors[currentTheme]?.['--accent-primary'] || 
                                computedStyle.getPropertyValue('--accent-primary').trim();
    }
    
    if (accentSecondaryInput) {
      accentSecondaryInput.value = customColors[currentTheme]?.['--accent-secondary'] || 
                                  computedStyle.getPropertyValue('--accent-secondary').trim();
    }
    
    if (bgColorInput) {
      bgColorInput.value = customColors[currentTheme]?.['--bg-color'] || 
                           computedStyle.getPropertyValue('--bg-color').trim();
    }
    
    if (cardBgInput) {
      cardBgInput.value = customColors[currentTheme]?.['--card-bg'] || 
                          computedStyle.getPropertyValue('--card-bg').trim();
    }
    
    if (textColorInput) {
      textColorInput.value = customColors[currentTheme]?.['--text-color'] || 
                            computedStyle.getPropertyValue('--text-color').trim();
    }
    
    if (textSecondaryInput) {
      textSecondaryInput.value = customColors[currentTheme]?.['--text-secondary'] || 
                                computedStyle.getPropertyValue('--text-secondary').trim();
    }
    
    if (borderColorInput) {
      borderColorInput.value = customColors[currentTheme]?.['--border-color'] || 
                              computedStyle.getPropertyValue('--border-color').trim();
    }
    
    if (hoverBgInput) {
      hoverBgInput.value = customColors[currentTheme]?.['--hover-bg'] || 
                           computedStyle.getPropertyValue('--hover-bg').trim();
    }
  }

  // ------------------ Extensions Panel ------------------
  const renderExtensions = throttle(function() {
    const extensionsList = document.getElementById('extensions-list');
    const quickExtensionsList = document.getElementById('quick-extensions-list');
    
    // Clear previous content
    if (quickExtensionsList) quickExtensionsList.innerHTML = '';
    if (extensionsList) extensionsList.innerHTML = '';
    
    if (extensions.length === 0) {
      // Show empty state in quick panel
      if (quickExtensionsList) {
        const emptyState = document.createElement('div');
        emptyState.className = 'extension-empty-state';
        emptyState.innerHTML = `
          <span class="material-symbols-rounded">extension</span>
          <p>No extensions installed</p>
          <button id="browse-extensions">Browse Extensions</button>
        `;
        quickExtensionsList.appendChild(emptyState);
        
        // Add event listener to the browse button
        const browseButton = document.getElementById('browse-extensions');
        if (browseButton) {
          browseButton.addEventListener('click', () => {
            // Open settings panel to extensions tab
            settingsPanel.classList.add('active');
            isSettingsPanelOpen = true;
            
            document.querySelector('[data-tab="extensions"]')?.classList.add('active');
            document.getElementById('extensions-tab')?.classList.add('active');
            
            extensionsPanel.classList.remove('active');
            isExtensionsPanelOpen = false;
          });
        }
      }
      
      // Show empty state in settings panel
      if (extensionsList) {
        extensionsList.innerHTML = '<div class="empty-state">No extensions installed.</div>';
      }
      
      return;
    }
    
    // Render extensions
    if (quickExtensionsList) {
      const fragment = document.createDocumentFragment();
      
      extensions.forEach(ext => {
        const extensionItem = document.createElement('div');
        extensionItem.className = `extension-quick-item${ext.enabled ? '' : ' disabled'}`;
        extensionItem.innerHTML = `
          <div class="extension-icon">
            <span class="material-symbols-rounded">${getExtensionIcon(ext.type)}</span>
          </div>
          <div class="extension-quick-info">
            <div class="extension-name">${ext.name}</div>
            <div class="extension-toggle">
              <label class="toggle-switch">
                <input type="checkbox" ${ext.enabled ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        `;
        
        // Add event listener to toggle
        const toggle = extensionItem.querySelector('input[type="checkbox"]');
        toggle.addEventListener('change', () => {
          ext.enabled = toggle.checked;
          extensionItem.classList.toggle('disabled', !ext.enabled);
          saveExtensions();
          
          showNotification(`${ext.name} ${ext.enabled ? 'enabled' : 'disabled'}`, 'success');
        });
        
        fragment.appendChild(extensionItem);
      });
      
      quickExtensionsList.appendChild(fragment);
    }
    
    // Render in settings panel
    if (extensionsList) {
      const fragment = document.createDocumentFragment();
      
      extensions.forEach(ext => {
        const extensionItem = document.createElement('div');
        extensionItem.className = 'extension-item';
        extensionItem.innerHTML = `
          <div class="extension-card">
            <div class="extension-icon">
              <span class="material-symbols-rounded">${getExtensionIcon(ext.type)}</span>
            </div>
            <div class="extension-details">
              <h4>${ext.name}</h4>
              <p>${ext.description || 'Chrome extension'}</p>
              <div class="extension-controls">
                <label class="toggle-switch">
                  <input type="checkbox" ${ext.enabled ? 'checked' : ''}>
                  <span class="toggle-slider"></span>
                </label>
                <button class="remove-extension">Remove</button>
              </div>
            </div>
          </div>
        `;
        
        // Add event listeners
        const toggle = extensionItem.querySelector('input[type="checkbox"]');
        toggle.addEventListener('change', () => {
          ext.enabled = toggle.checked;
          saveExtensions();
        });
        
        const removeButton = extensionItem.querySelector('.remove-extension');
        removeButton.addEventListener('click', () => {
          extensions = extensions.filter(e => e.id !== ext.id);
          saveExtensions();
          renderExtensions();
          showNotification(`${ext.name} removed`, 'success');
        });
        
        fragment.appendChild(extensionItem);
      });
      
      extensionsList.appendChild(fragment);
    }
  }, 300);
  
  if (extensionsButton) {
    extensionsButton.addEventListener('click', () => {
      isExtensionsPanelOpen = !isExtensionsPanelOpen;
      extensionsPanel.classList.toggle('active', isExtensionsPanelOpen);
      
      if (isExtensionsPanelOpen) {
        // Close settings panel if open
        if (isSettingsPanelOpen) {
          settingsPanel.classList.remove('active');
          isSettingsPanelOpen = false;
        }
        
        // Update extensions list
        renderExtensions();
      }
    });
  }
  
  document.addEventListener('click', (e) => {
    if (isExtensionsPanelOpen && 
        extensionsPanel && 
        !extensionsPanel.contains(e.target) && 
        e.target !== extensionsButton) {
      extensionsPanel.classList.remove('active');
      isExtensionsPanelOpen = false;
    }
  });
  
  function getExtensionIcon(type) {
    switch (type) {
      case 'adblocker': return 'block';
      case 'password': return 'password';
      case 'darkmode': return 'dark_mode';
      case 'translate': return 'translate';
      case 'search': return 'search';
      case 'shopping': return 'shopping_cart';
      default: return 'extension';
    }
  }
  
  function saveExtensions() {
    try {
      localStorage.setItem('extensions', JSON.stringify(extensions));
    } catch (error) {
      console.error('Error saving extensions:', error);
    }
  }
  
  // Initialize template handlers
  function initTemplateHandlers() {
    const templateCards = document.querySelectorAll('.template-card');
    if (templateCards.length > 0) {
      templateCards.forEach(card => {
        // Add active class to current template
        if (card.dataset.template === currentTemplate) {
          card.classList.add('active');
        }
        
        card.addEventListener('click', () => {
          templateCards.forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          
          currentTemplate = card.dataset.template;
          localStorage.setItem('browserTemplate', currentTemplate);
          applyTemplate(currentTemplate);
          
          showNotification(`Template changed to ${currentTemplate}`, 'success');
        });
      });
    }
    
    // Initialize other template controls
    const sidebarPosition = document.getElementById('sidebar-position');
    if (sidebarPosition) {
      sidebarPosition.value = localStorage.getItem('sidebarPosition') || 'left';
      sidebarPosition.addEventListener('change', () => {
        localStorage.setItem('sidebarPosition', sidebarPosition.value);
        applySidebarPosition(sidebarPosition.value);
      });
    }
    
    const showBookmarks = document.getElementById('show-bookmarks');
    if (showBookmarks) {
      showBookmarks.checked = localStorage.getItem('showBookmarks') === 'true';
      showBookmarks.addEventListener('change', () => {
        localStorage.setItem('showBookmarks', showBookmarks.checked);
        toggleBookmarksBar(showBookmarks.checked);
      });
    }
    
    const showTabTitles = document.getElementById('show-tab-titles');
    if (showTabTitles) {
      showTabTitles.checked = localStorage.getItem('showTabTitles') !== 'false';
      showTabTitles.addEventListener('change', () => {
        localStorage.setItem('showTabTitles', showTabTitles.checked);
        toggleTabTitles(showTabTitles.checked);
      });
    }
    
    const tabSize = document.getElementById('tab-size');
    if (tabSize) {
      tabSize.value = localStorage.getItem('tabSize') || '2';
      tabSize.addEventListener('input', () => {
        localStorage.setItem('tabSize', tabSize.value);
        applyTabSize(tabSize.value);
      });
    }
  }
  
  function applyTemplate(templateName) {
    document.body.setAttribute('data-template', templateName);
    
    switch (templateName) {
      case 'compact':
        if (sidebar) sidebar.classList.add('collapsed');
        localStorage.setItem('sidebar-collapsed', 'true');
        break;
      case 'focus':
        if (sidebar) sidebar.classList.add('collapsed');
        localStorage.setItem('sidebar-collapsed', 'true');
        document.body.classList.add('focus-mode');
        break;
      case 'classic':
        if (sidebar) sidebar.classList.remove('collapsed');
        localStorage.setItem('sidebar-collapsed', 'false');
        document.body.classList.add('classic-mode');
        break;
      default: // default template
        document.body.classList.remove('focus-mode', 'classic-mode');
        if (sidebar) sidebar.classList.remove('collapsed');
        localStorage.setItem('sidebar-collapsed', 'false');
        break;
    }
  }
  
  function applySidebarPosition(position) {
    if (position === 'right') {
      document.body.classList.add('sidebar-right');
    } else {
      document.body.classList.remove('sidebar-right');
    }
  }
  
  function toggleBookmarksBar(show) {
    if (show) {
      // Create bookmarks bar if it doesn't exist
      if (!document.getElementById('bookmarks-bar')) {
        const bookmarksBar = document.createElement('div');
        bookmarksBar.id = 'bookmarks-bar';
        bookmarksBar.className = 'bookmarks-bar';
        bookmarksBar.innerHTML = `
          <div class="bookmark-item">
            <span class="material-symbols-rounded">home</span>
            <span class="bookmark-title">Home</span>
          </div>
          <div class="bookmark-item">
            <span class="material-symbols-rounded">public</span>
            <span class="bookmark-title">Google</span>
          </div>
          <div class="bookmark-item">
            <span class="material-symbols-rounded">description</span>
            <span class="bookmark-title">Docs</span>
          </div>
        `;
        
        // Insert after toolbar
        const toolbar = document.getElementById('toolbar');
        if (toolbar) {
          toolbar.parentNode.insertBefore(bookmarksBar, toolbar.nextSibling);
        }
      } else {
        document.getElementById('bookmarks-bar').style.display = 'flex';
      }
    } else if (document.getElementById('bookmarks-bar')) {
      document.getElementById('bookmarks-bar').style.display = 'none';
    }
  }
  
  function toggleTabTitles(show) {
    if (sidebar) {
      if (show) {
        sidebar.classList.remove('hide-tab-titles');
      } else {
        sidebar.classList.add('hide-tab-titles');
      }
    }
  }
  
  function applyTabSize(size) {
    document.body.setAttribute('data-tab-size', size);
    
    // Re-render tabs to apply new size
    renderTabs();
  }
  
  // Extension management functions
  function addExtension(id) {
    // Check if extension already exists
    const existingExt = extensions.find(ext => ext.id === id);
    if (existingExt) {
      showNotification('Extension already installed', 'info');
      return;
    }
    
    // Get extension info based on popular extensions or generate default
    let newExtension;
    
    // Common popular extensions
    if (id === 'cjpalhdlnbpafiamejdnhcphjbkeiagm') {
      newExtension = {
        id: id,
        name: 'uBlock Origin',
        description: 'Efficient ad blocker',
        type: 'adblocker',
        enabled: true
      };
    } else if (id === 'dbepggeogbaibhgnhhndojpepiihcmeb') {
      newExtension = {
        id: id,
        name: 'Vimium',
        description: 'Keyboard shortcuts for navigation',
        type: 'navigation',
        enabled: true
      };
    } else if (id === 'hdokiejnpimakedhajhdlcegeplioahd') {
      newExtension = {
        id: id,
        name: 'LastPass',
        description: 'Password manager',
        type: 'password',
        enabled: true
      };
    } else if (id === 'aapbdbdomjkkjkaonfhkkikfgjllcleb') {
      newExtension = {
        id: id,
        name: 'Google Translate',
        description: 'Translate pages instantly',
        type: 'translate',
        enabled: true
      };
    } else {
      // Default for unknown extensions
      newExtension = {
        id: id,
        name: 'Chrome Extension',
        description: `Extension ID: ${id}`,
        type: 'extension',
        enabled: true
      };
    }
    
    extensions.push(newExtension);
    saveExtensions();
    renderExtensions();
    
    showNotification(`${newExtension.name} installed successfully`, 'success');
  }

  // Set up extension button listeners
  document.addEventListener('DOMContentLoaded', () => {
    // Setting up extension-related event listeners
    const installExtension = document.getElementById('install-extension');
    const extensionId = document.getElementById('extension-id');
    const extensionStore = document.getElementById('extension-store');
    const reloadExtensions = document.getElementById('reload-extensions');
    const popularExtensionButtons = document.querySelectorAll('.install-popular-extension');
    
    if (installExtension && extensionId) {
      installExtension.addEventListener('click', () => {
        const id = extensionId.value.trim();
        if (id) {
          addExtension(id);
          extensionId.value = '';
        } else {
          showNotification('Please enter a valid extension ID', 'error');
        }
      });
    }
    
    if (extensionStore) {
      extensionStore.addEventListener('click', () => {
        // Open Chrome Web Store in new tab
        createNewTab('https://chrome.google.com/webstore/category/extensions');
      });
    }
    
    if (reloadExtensions) {
      reloadExtensions.addEventListener('click', () => {
        // Simulate reloading extensions
        showNotification('Extensions reloaded', 'success');
      });
    }
    
    if (popularExtensionButtons.length > 0) {
      popularExtensionButtons.forEach(button => {
        button.addEventListener('click', () => {
          const card = button.closest('.extension-card');
          if (card && card.dataset.id) {
            addExtension(card.dataset.id);
          }
        });
      });
    }
    
    // Initialize settings panel tabs
    const templateTab = document.querySelector('[data-tab="templates"]');
    if (templateTab) {
      templateTab.addEventListener('click', initTemplateHandlers);
    }
  });

  // ------------------ Global Keyboard Shortcuts ------------------
  window.addEventListener('keydown', handleKeyDown);
  function handleKeyDown(e) {
    const target = e.target;
    const isInputElement = target.tagName === 'INPUT' || 
                          target.tagName === 'TEXTAREA' || 
                          target.contentEditable === 'true';
    
    // Focus URL bar (Ctrl+L)
    if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
      if (urlInput) {
        urlInput.focus();
        urlInput.select();
      }
      e.preventDefault();
      return;
    }
    
    // Skip other shortcuts if we're in an input element
    if (isInputElement && e.key !== 'Escape') return;
    
    // New tab (Ctrl+T)
    if ((e.ctrlKey || e.metaKey) && e.key === 't') {
      createNewTab();
      e.preventDefault();
      return;
    }
    
    // Close tab (Ctrl+W)
    if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
      closeTab(activeTabId);
      e.preventDefault();
      return;
    }
    
    // Reload page (F5 or Ctrl+R)
    if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.key === 'r')) {
      webview.reload();
      e.preventDefault();
      return;
    }
    
    // Escape key to close panels
    if (e.key === 'Escape') {
      if (isSettingsPanelOpen && settingsPanel) {
        settingsPanel.classList.remove('active');
        isSettingsPanelOpen = false;
        e.preventDefault();
        return;
      }
      
      if (isExtensionsPanelOpen && extensionsPanel) {
        extensionsPanel.classList.remove('active');
        isExtensionsPanelOpen = false;
        e.preventDefault();
        return;
      }
    }
    
    // Toggle extensions panel (Ctrl+Shift+E)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'e') {
      if (extensionsButton) extensionsButton.click();
      e.preventDefault();
      return;
    }
    
    // Next tab (Ctrl+Tab)
    if ((e.ctrlKey || e.metaKey) && e.key === 'Tab' && !e.shiftKey) {
      const currentIndex = tabs.findIndex(t => t.id === activeTabId);
      const nextIndex = (currentIndex + 1) % tabs.length;
      setActiveTab(tabs[nextIndex].id);
      e.preventDefault();
      return;
    }
    
    // Previous tab (Ctrl+Shift+Tab)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Tab') {
      const currentIndex = tabs.findIndex(t => t.id === activeTabId);
      const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      setActiveTab(tabs[prevIndex].id);
      e.preventDefault();
      return;
    }
  }

  // ------------------ Utility Functions ------------------
  // Add notification system
  function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'notification';
      document.body.appendChild(notification);
    }
    
    // Set the message and type
    notification.textContent = message;
    notification.className = `notification ${type}`;
    
    // Show the notification
    notification.classList.add('show');
    
    // Hide after a delay
    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }

  // ------------------ Window Control Buttons ------------------
  if (minimizeButton) {
    minimizeButton.addEventListener('click', () => {
      window.electronAPI.minimizeWindow();
    });
  }
  
  if (maximizeButton) {
    maximizeButton.addEventListener('click', () => {
      window.electronAPI.maximizeWindow();
    });
  }
  
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      window.electronAPI.closeWindow();
    });
  }
});