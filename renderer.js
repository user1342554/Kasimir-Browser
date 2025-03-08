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
  
  // Use a Map for storing webviews
  const webviewsMap = new Map();

  // ------------------ Utility Functions ------------------
  // Format URL for display (hide file paths, remove protocol)
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

  // Helper function to get the proper homepage URL 
  function getHomepageUrl() {
    // Create the proper path with forward slashes for URL
    let path = window.appPath.appDir.replace(/\\/g, '/');
    
    // Make sure it has the file:// prefix
    if (!path.startsWith('file://')) {
      path = 'file://' + path;
    }
    
    // Ensure the path ends with /homepage.html
    if (!path.endsWith('/homepage.html')) {
      path = path + '/homepage.html';
    }
    
    console.log('Full homepage URL:', path);
    return path;
  }

  // Process URL for navigation
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

  // ------------------ Browser Initialization ------------------
  function initializeBrowser() {
    if (browserInitialized) return;
    browserInitialized = true;
    
    // Clear webview container
    if (webviewContainer) {
      webviewContainer.innerHTML = '';
    }
    
    // Clear the webview map
    webviewsMap.clear();
    
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
    
    // Fallback initialization in case animation is already hidden or doesn't exist
    if (startupAnimation.classList.contains('hidden')) {
      initializeBrowser();
    }
  } else {
    // If there's no startup animation, initialize immediately
    initializeBrowser();
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
          
          // Render tabs first
          renderTabs();
          
          // Create webview for active tab only (lazy loading)
          createWebview(activeTabId, activeTab.url);
          
          // Set URL input
          urlInput.value = formatUrlForDisplay(activeTab.url);
        } else {
          createNewTab(); // Create new tab if no saved tabs
        }
      } else {
        createNewTab(); // Create new tab for first-time users
      }
    } catch (error) {
      console.error('Error initializing tabs:', error);
      createNewTab();
    }
  }

  function createNewTab() {
    console.log('Creating new tab with direct homepage load');
    const tabId = 'tab-' + Date.now();
    
    // Set other tabs as inactive
    tabs.forEach(tab => tab.active = false);
    
    // For debugging purposes, reload any existing homepage webviews
    webviewsMap.forEach((webview, id) => {
      if (webview.src && webview.src.includes('homepage.html')) {
        console.log(`Found existing homepage webview for tab ${id}, reloading it`);
        webview.reload();
      }
    });
    
    // First create the tab data
    const homepageUrl = getHomepageUrl();
    const newTab = {
      id: tabId,
      title: 'New Tab',
      url: homepageUrl,
      favicon: '',
      active: true,
      lastAccessed: Date.now()
    };
    
    // Add to tabs array
    tabs.push(newTab);
    activeTabId = tabId;
    
    // Render tabs UI
    renderTabs();
    
    // STEP 1: Remove ALL existing webviews - more aggressive cleanup
    webviewsMap.forEach((oldWebview, oldId) => {
      try {
        if (oldWebview && oldWebview.parentNode) {
          console.log(`Removing webview for tab ${oldId}`);
          oldWebview.parentNode.removeChild(oldWebview);
        }
      } catch (err) {
        console.error(`Error removing webview ${oldId}:`, err);
      }
    });
    webviewsMap.clear();
    
    // STEP 2: Clear the webview container completely
    while (webviewContainer.firstChild) {
      webviewContainer.removeChild(webviewContainer.firstChild);
    }
    
    // STEP 3: Create the new webview with direct homepage URL
    console.log(`Creating new webview for tab ${tabId} with direct homepage URL: ${homepageUrl}`);
    const webview = document.createElement('webview');
    webview.id = `webview-${tabId}`;
    
    // IMPORTANT: Set key attributes properly
    webview.style.width = '100%';
    webview.style.height = '100%';
    webview.style.display = 'flex';
    webview.setAttribute('allowpopups', 'true');
    
    // Add core event listeners BEFORE setting src
    webview.addEventListener('did-start-loading', () => {
      console.log(`Tab ${tabId} started loading`);
      loadingBar.classList.add('loading');
    });
    
    webview.addEventListener('did-stop-loading', () => {
      console.log(`Tab ${tabId} finished loading`);
      loadingBar.classList.remove('loading');
    });
    
    webview.addEventListener('did-navigate', (e) => {
      console.log(`Tab ${tabId} navigated to: ${e.url}`);
      if (e.url.includes('homepage.html')) {
        console.log(`✅ Successfully loaded homepage in tab ${tabId}`);
      }
    });
    
    // Add all other event listeners
    addWebviewEventListeners(webview, tabId);
    
    // STEP 4: Append to container BEFORE setting src
    webviewContainer.appendChild(webview);
    
    // STEP 5: Store in map
    webviewsMap.set(tabId, webview);
    
    // STEP 6: Set src AFTER adding to DOM
    console.log(`Setting src for webview ${tabId} to ${homepageUrl}`);
    webview.src = homepageUrl;
    
    // STEP 7: Double verify the src attribute was set
    setTimeout(() => {
      console.log(`Verifying webview src: ${webview.src}`);
      if (!webview.src || !webview.src.includes('homepage.html')) {
        console.warn(`Homepage URL not set correctly, forcing it again`);
        webview.src = homepageUrl;
      }
    }, 100);
    
    // Clear URL input and focus it
    urlInput.value = '';
    urlInput.focus();
    
    // Notify main process
    window.electronAPI.navigateToUrl(homepageUrl);
    
    // Save tabs
    saveTabs();
    
    return tabId;
  }

  function createWebview(tabId, url) {
    // Hide all existing webviews first
    webviewsMap.forEach((webview) => {
      webview.style.display = 'none';
    });
    
    // Remove existing webview if present
    if (webviewsMap.has(tabId)) {
      const oldWebview = webviewsMap.get(tabId);
      if (oldWebview.parentNode) {
        oldWebview.parentNode.removeChild(oldWebview);
      }
      webviewsMap.delete(tabId);
    }

    // Create new webview
    const webview = document.createElement('webview');
    webview.id = `webview-${tabId}`;
    webview.setAttribute('src', 'about:blank');
    webview.setAttribute('allowpopups', 'true');
    webview.style.width = '100%';
    webview.style.height = '100%';
    webview.style.display = 'flex'; // Always visible initially
    
    // Add to container
    webviewContainer.appendChild(webview);
    
    // Store in map
    webviewsMap.set(tabId, webview);
    
    // Add core event listeners
    addWebviewEventListeners(webview, tabId);
    
    // Navigate to URL after a brief delay
    if (url && url !== 'about:blank') {
      setTimeout(() => {
        navigateToUrl(url, tabId);
      }, 50);
    }
    
    return webview;
  }

  function renderTabs() {
    if (!tabsContainer) return;
    
    // Store existing tabs to prevent unnecessary DOM operations
    const existingTabs = {};
    document.querySelectorAll('.tab').forEach(tab => {
      existingTabs[tab.dataset.id] = tab;
    });
    
    const fragment = document.createDocumentFragment();
    const tabsToRemove = [];
    
    tabs.forEach(tab => {
      let tabElement;
      
      if (existingTabs[tab.id]) {
        // Update existing tab
        tabElement = existingTabs[tab.id];
        delete existingTabs[tab.id];
        
        // Update active state
        tabElement.classList.toggle('active', tab.id === activeTabId);
        
        // Update favicon
        const faviconDiv = tabElement.querySelector('.tab-favicon');
        if (faviconDiv) {
          if (tab.favicon) {
            faviconDiv.innerHTML = `<img src="${tab.favicon}" alt="">`;
          } else {
            faviconDiv.innerHTML = `<span class="material-symbols-rounded">public</span>`;
          }
        }
        
        // Update title
        const titleDiv = tabElement.querySelector('.tab-title');
        if (titleDiv) {
          titleDiv.textContent = tab.title || 'New Tab';
        }
        
        // Update data-title attribute for tooltips in collapsed state
        tabElement.setAttribute('data-title', tab.title || 'New Tab');
      } else {
        // Create new tab element
        tabElement = document.createElement('div');
        tabElement.className = 'tab';
        tabElement.dataset.id = tab.id;
        tabElement.setAttribute('data-title', tab.title || 'New Tab');
        
        if (tab.id === activeTabId) {
          tabElement.classList.add('active');
        }
        
        // Create favicon element
        const favicon = document.createElement('div');
        favicon.className = 'tab-favicon';
        if (tab.favicon) {
          favicon.innerHTML = `<img src="${tab.favicon}" alt="">`;
        } else {
          favicon.innerHTML = `<span class="material-symbols-rounded">public</span>`;
        }
        
        // Create title element
        const title = document.createElement('div');
        title.className = 'tab-title';
        title.textContent = tab.title || 'New Tab';
        
        // Create close button
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
    
    // Collect tabs to remove
    Object.values(existingTabs).forEach(tab => tabsToRemove.push(tab));
    
    // Clear and repopulate tabs container
    while (tabsContainer.firstChild) {
      tabsContainer.removeChild(tabsContainer.firstChild);
    }
    
    tabsContainer.appendChild(fragment);
    
    // Remove old tabs
    tabsToRemove.forEach(tab => {
      if (tab.parentNode) tab.parentNode.removeChild(tab);
    });
  }

  function setActiveTab(tabId) {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;
    
    console.log(`Switching to tab ${tabId}`);
    
    // Update active tab in data
    tabs.forEach(t => t.active = (t.id === tabId));
    activeTabId = tabId;
    
    // Update UI
    document.querySelectorAll('.tab').forEach(el => {
      el.classList.toggle('active', el.dataset.id === tabId);
    });
    
    // Hide all webviews first
    webviewsMap.forEach((webview, id) => {
      webview.style.display = 'none';
    });
    
    // If webview doesn't exist yet, create it
    if (!webviewsMap.has(tabId)) {
      // Create webview for this tab
      console.log(`Creating new webview for tab ${tabId}`);
      createWebview(tabId, tab.url);
    } else {
      // Show existing webview
      const webview = webviewsMap.get(tabId);
      webview.style.display = 'flex';
      console.log(`Showing existing webview for tab ${tabId}`);
    }
    
    // Update URL input
    urlInput.value = formatUrlForDisplay(tab.url);
    
    // Update navigation controls
    updateNavigationState();
    
    // Save tabs
    if (saveTabsTimeout) clearTimeout(saveTabsTimeout);
    saveTabsTimeout = setTimeout(saveTabs, 300);
    
    // Record last accessed time for memory management
    tab.lastAccessed = Date.now();
  }

  function closeTab(tabId) {
    if (tabs.length <= 1) {
      createNewTab();
      
      // Remove the old tab's webview
      removeWebview(tabId);
      
      tabs = tabs.filter(t => t.id !== tabId);
      saveTabs();
      return;
    }
    
    const index = tabs.findIndex(t => t.id === tabId);
    if (index === -1) return;
    
    const isActive = (tabId === activeTabId);
    
    // Remove the webview
    removeWebview(tabId);
    
    // Remove from tabs array
    tabs = tabs.filter(t => t.id !== tabId);
    
    // If closing active tab, activate the next available tab
    if (isActive) {
      const newActiveIndex = Math.min(index, tabs.length - 1);
      tabs[newActiveIndex].active = true;
      activeTabId = tabs[newActiveIndex].id;
      
      // Show webview for new active tab
      const newActiveTabId = tabs[newActiveIndex].id;
      if (webviewsMap.has(newActiveTabId)) {
        webviewsMap.get(newActiveTabId).style.display = 'flex';
      } else {
        createWebview(newActiveTabId, tabs[newActiveIndex].url);
      }
      
      // Update URL input
      urlInput.value = formatUrlForDisplay(tabs[newActiveIndex].url);
      
      // Update navigation state
      updateNavigationState();
    }
    
    renderTabs();
    saveTabs();
  }

  function removeWebview(tabId) {
    if (webviewsMap.has(tabId)) {
      const webview = webviewsMap.get(tabId);
      
      // Remove from DOM
      if (webview && webview.parentNode) {
        webview.parentNode.removeChild(webview);
      }
      
      // Delete from map
      webviewsMap.delete(tabId);
    }
  }

  function saveTabs() {
    try {
      localStorage.setItem('browser-tabs', JSON.stringify(tabs));
    } catch (error) {
      console.error('Error saving tabs:', error);
    }
  }

  // ------------------ Navigation & URL Handling ------------------
  function navigateToUrl(url, tabId = activeTabId) {
    console.log(`Navigating tab ${tabId} to: ${url}`);
    
    // Process the URL
    const processedUrl = processUrl(url);
    console.log(`Processed URL: ${processedUrl}`);
    
    // Get webview for this tab
    let webview = webviewsMap.get(tabId);
    
    // If no webview exists yet, create one
    if (!webview) {
      webview = createWebview(tabId, 'about:blank');
    }
    
    if (tabId === activeTabId) {
      loadingBar.classList.add('loading');
    }
    
    try {
      // Navigate the webview
      webview.src = processedUrl;
      
      // Update tab data
      const tab = tabs.find(t => t.id === tabId);
      if (tab) {
        tab.url = processedUrl;
        saveTabs();
      }
      
      // Update URL input if active tab
      if (tabId === activeTabId) {
        urlInput.value = formatUrlForDisplay(processedUrl);
      }
      
      // Notify main process
      window.electronAPI.navigateToUrl(processedUrl);
    } catch (error) {
      console.error('Error navigating:', error);
      if (tabId === activeTabId) {
        loadingBar.classList.remove('loading');
        showNotification('Failed to load page', 'error');
      }
    }
  }

  // ------------------ Webview Event Listeners ------------------
  function addWebviewEventListeners(webview, tabId) {
    // Navigation events
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
      }
    });
    
    webview.addEventListener('did-navigate', (e) => {
      console.log(`Tab ${tabId} navigated to: ${e.url}`);
      
      // Update tab URL
      const tab = tabs.find(t => t.id === tabId);
      if (tab) {
        tab.url = e.url;
        saveTabs();
      }
      
      // Update URL input if this is the active tab
      if (tabId === activeTabId) {
        urlInput.value = formatUrlForDisplay(e.url);
        updateNavigationState();
      }
    });
    
    // Title and favicon events
    webview.addEventListener('page-title-updated', (e) => {
      console.log(`Tab ${tabId} title updated to: ${e.title}`);
      
      const tab = tabs.find(t => t.id === tabId);
      if (tab) {
        tab.title = e.title;
        
        // Update tab UI
        const tabElement = document.querySelector(`.tab[data-id="${tabId}"]`);
        if (tabElement) {
          const titleElement = tabElement.querySelector('.tab-title');
          if (titleElement) titleElement.textContent = e.title;
          tabElement.setAttribute('data-title', e.title);
        }
        
        saveTabs();
      }
    });
    
    webview.addEventListener('page-favicon-updated', (e) => {
      if (e.favicons && e.favicons.length > 0) {
        console.log(`Tab ${tabId} favicon updated`);
        
        const tab = tabs.find(t => t.id === tabId);
        if (tab) {
          tab.favicon = e.favicons[0];
          
          // Update favicon in UI
          const tabElement = document.querySelector(`.tab[data-id="${tabId}"]`);
          if (tabElement) {
            const faviconElement = tabElement.querySelector('.tab-favicon');
            if (faviconElement) {
              faviconElement.innerHTML = `<img src="${e.favicons[0]}" alt="">`;
            }
          }
          
          saveTabs();
        }
      }
    });
    
    // Handle errors more gracefully
    webview.addEventListener('did-fail-load', (e) => {
      // Ignore errors for about:blank
      if (e.validatedURL === 'about:blank') return;
      
      console.warn(`Tab ${tabId} failed to load: ${e.errorDescription} (${e.errorCode})`);
      
      // Only show notification for critical errors
      if (e.errorCode !== -3 && tabId === activeTabId) {
        loadingBar.classList.remove('loading');
        showNotification(`Failed to load page: ${e.errorDescription}`, 'error');
      }
    });
    
    // Handle new windows
    webview.addEventListener('new-window', (e) => {
      console.log(`New window requested from tab ${tabId}: ${e.url}`);
      
      // Create a new tab and navigate to the URL
      const newTabId = createNewTab();
      
      // Update the new tab's URL after a brief delay to ensure it's ready
      setTimeout(() => {
        navigateToUrl(e.url, newTabId);
      }, 100);
      
      // Prevent the default action
      e.preventDefault();
    });
    
    // Try to disable background throttling for better performance
    webview.addEventListener('dom-ready', () => {
      try {
        const webContents = webview.getWebContents();
        if (webContents) {
          webContents.setBackgroundThrottling(false);
        }
      } catch (err) {
        // Ignore errors
      }
    });
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
      const webview = webviewsMap.get(activeTabId);
      if (webview && webview.canGoBack()) {
        webview.goBack();
      }
    });
  }
  
  if (forwardButton) {
    forwardButton.addEventListener('click', () => {
      const webview = webviewsMap.get(activeTabId);
      if (webview && webview.canGoForward()) {
        webview.goForward();
      }
    });
  }
  
  if (reloadButton) {
    reloadButton.addEventListener('click', () => {
      const webview = webviewsMap.get(activeTabId);
      if (webview) {
        webview.reload();
      }
    });
  }
  
  function updateNavigationState() {
    requestAnimationFrame(() => {
      const webview = webviewsMap.get(activeTabId);
      if (webview) {
        if (backButton) backButton.classList.toggle('disabled', !webview.canGoBack());
        if (forwardButton) forwardButton.classList.toggle('disabled', !webview.canGoForward());
      }
    });
  }

  // ------------------ New Tab Button ------------------
  if (newTabButton) {
    newTabButton.addEventListener('click', () => { 
      createNewTab(); 
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
  
  function renderExtensions() {
    const extensionsList = document.getElementById('extensions-list');
    const quickExtensionsList = document.getElementById('quick-extensions-list');
    
    // Clear previous content
    if (quickExtensionsList) {
      quickExtensionsList.innerHTML = '';
    }
    
    if (extensionsList) {
      extensionsList.innerHTML = '';
    }
    
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
            
            // Select extensions tab
            document.querySelectorAll('.settings-tab-button').forEach(tab => {
              tab.classList.remove('active');
            });
            document.querySelectorAll('.settings-tab-content').forEach(content => {
              content.classList.remove('active');
            });
            
            document.querySelector('[data-tab="extensions"]').classList.add('active');
            document.getElementById('extensions-tab').classList.add('active');
            
            // Close extensions panel
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
    
    // Render in quick panel
    if (quickExtensionsList) {
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
        
        quickExtensionsList.appendChild(extensionItem);
        
        // Add event listener to toggle
        const toggle = extensionItem.querySelector('input[type="checkbox"]');
        toggle.addEventListener('change', () => {
          ext.enabled = toggle.checked;
          extensionItem.classList.toggle('disabled', !ext.enabled);
          saveExtensions();
          
          // Show notification
          showNotification(`${ext.name} ${ext.enabled ? 'enabled' : 'disabled'}`, 'success');
        });
      });
    }
    
    // Render in settings panel
    if (extensionsList) {
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
        
        extensionsList.appendChild(extensionItem);
        
        // Add event listeners
        const toggle = extensionItem.querySelector('input[type="checkbox"]');
        toggle.addEventListener('change', () => {
          ext.enabled = toggle.checked;
          saveExtensions();
          renderExtensions();
        });
        
        const removeButton = extensionItem.querySelector('.remove-extension');
        removeButton.addEventListener('click', () => {
          extensions = extensions.filter(e => e.id !== ext.id);
          saveExtensions();
          renderExtensions();
          showNotification(`${ext.name} removed`, 'success');
        });
      });
    }
  }
  
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
      const webview = webviewsMap.get(activeTabId);
      if (webview) webview.reload();
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
  
  // ------------------ Memory Management ------------------
  // Periodically clean up inactive tabs to save memory
  setInterval(() => {
    // Only keep the 10 most recently used tabs in memory
    if (tabs.length > 10) {
      const activeTabIds = new Set([activeTabId]);
      
      // Add the 4 most recently accessed tabs
      const recentTabs = tabs
        .filter(tab => tab.id !== activeTabId)
        .sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0))
        .slice(0, 4)
        .map(tab => tab.id);
      
      recentTabs.forEach(id => activeTabIds.add(id));
      
      // Remove webviews for inactive tabs
      webviewsMap.forEach((webview, id) => {
        if (!activeTabIds.has(id)) {
          removeWebview(id);
        }
      });
    }
  }, 60000); // Check every minute
});