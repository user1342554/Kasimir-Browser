document.addEventListener('DOMContentLoaded', () => {
  console.log('Renderer script loaded');

  // ------------------ DOM Elements ------------------
  const sidebar = document.getElementById('sidebar');
  const tabsContainer = document.getElementById('tabs-container');
  const newTabButton = document.getElementById('new-tab-button');
  const webview = document.getElementById('browser-view');
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

  // ------------------ Utility Functions ------------------
  // Format URL for display (hide file paths, remove protocol)
  function formatUrlForDisplay(url) {
    if (url.startsWith('file://')) {
      if (url.endsWith('homepage.html')) {
        return '';
      }
      return 'kasimir://local-file';
    }
    return url.replace(/^(https?:\/\/)?(www\.)?/i, '');
  }

  // ------------------ Browser Initialization ------------------
  // This function initializes the browser after the startup animation completes
  function initializeBrowser() {
    if (browserInitialized) return;
    browserInitialized = true;
    
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
  // We can use a MutationObserver to detect when the animation is hidden
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
          
          // Make sure we render tabs before navigating
          renderTabs();
          
          // Ensure we navigate to the active tab's URL
          setTimeout(() => {
            navigateToUrl(activeTab.url);
            urlInput.value = formatUrlForDisplay(activeTab.url);
          }, 100);
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
    console.log('Creating new tab');
    const tabId = 'tab-' + Date.now();
    const newTab = {
      id: tabId,
      title: 'New Tab',
      url: 'homepage.html', // New tabs load the homepage
      favicon: '',
      active: true
    };
    
    tabs.forEach(tab => tab.active = false);
    tabs.push(newTab);
    activeTabId = tabId;
    
    // Render the tabs first
    renderTabs();
    
    // Then navigate to the homepage with a slight delay to ensure proper loading
    setTimeout(() => {
      navigateToUrl('homepage.html');
      urlInput.value = '';
      urlInput.focus();
    }, 50);
    
    saveTabs();
  }

  function renderTabs() {
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
    if (tabsContainer) {
      while (tabsContainer.firstChild) {
        tabsContainer.removeChild(tabsContainer.firstChild);
      }
      tabsContainer.appendChild(fragment);
    }
    
    // Remove old tabs
    tabsToRemove.forEach(tab => {
      if (tab.parentNode) tab.parentNode.removeChild(tab);
    });
  }

  function setActiveTab(tabId) {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;
    
    tabs.forEach(t => t.active = (t.id === tabId));
    activeTabId = tabId;
    
    document.querySelectorAll('.tab').forEach(el => {
      el.classList.toggle('active', el.dataset.id === tabId);
    });
    
    requestAnimationFrame(() => {
      if (webview.src !== tab.url) navigateToUrl(tab.url);
      urlInput.value = formatUrlForDisplay(tab.url);
    });
    
    if (saveTabsTimeout) clearTimeout(saveTabsTimeout);
    saveTabsTimeout = setTimeout(saveTabs, 300);
  }

  function closeTab(tabId) {
    if (tabs.length <= 1) {
      createNewTab();
      tabs = tabs.filter(t => t.id !== tabId);
      saveTabs();
      return;
    }
    
    const index = tabs.findIndex(t => t.id === tabId);
    if (index === -1) return;
    
    const isActive = (tabId === activeTabId);
    tabs = tabs.filter(t => t.id !== tabId);
    
    if (isActive) {
      const newActiveIndex = Math.min(index, tabs.length - 1);
      tabs[newActiveIndex].active = true;
      activeTabId = tabs[newActiveIndex].id;
      navigateToUrl(tabs[newActiveIndex].url);
      urlInput.value = (tabs[newActiveIndex].url !== 'about:blank') ? 
                       formatUrlForDisplay(tabs[newActiveIndex].url) : '';
    }
    
    renderTabs();
    saveTabs();
  }

  function saveTabs() {
    try {
      localStorage.setItem('browser-tabs', JSON.stringify(tabs));
    } catch (error) {
      console.error('Error saving tabs:', error);
    }
  }

  // ------------------ Navigation & URL Handling ------------------
  function navigateToUrl(url) {
    console.log('Navigating to:', url);
    if (!url || url === 'about:blank') {
      // Default to homepage instead of about:blank
      const homepagePath = `file://${window.appPath.appDir}/homepage.html`;
      console.log('Default navigation redirected to homepage:', homepagePath);
      webview.src = homepagePath;
      return;
    }
    
    if (url === 'homepage.html') {
      const homepagePath = `file://${window.appPath.appDir}/homepage.html`;
      console.log('Loading homepage from:', homepagePath);
      webview.src = homepagePath;
      
      // Update the active tab to reflect we're on the homepage
      const activeTab = tabs.find(t => t.id === activeTabId);
      if (activeTab) {
        activeTab.url = homepagePath;
        activeTab.title = 'New Tab';
        saveTabs();
      }
      return;
    }
    
    let formattedUrl = url;
    if (!/^(https?:\/\/|file:\/\/|about:)/i.test(url)) {
      if (/^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(url)) {
        formattedUrl = 'https://' + url;
      } else {
        formattedUrl = 'https://www.google.com/search?q=' + encodeURIComponent(url);
      }
    }
    
    console.log('Formatted URL:', formattedUrl);
    webview.src = formattedUrl;
    window.electronAPI.navigateToUrl(formattedUrl);
    
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (activeTab) {
      activeTab.url = formattedUrl;
      saveTabs();
    }
  }

  // Add webview event listeners
  if (webview) {
    webview.addEventListener('did-navigate', (e) => {
      urlInput.value = formatUrlForDisplay(e.url);
      const activeTab = tabs.find(t => t.id === activeTabId);
      if (activeTab) {
        activeTab.url = e.url;
        saveTabs();
      }
    });

    // Update navigation button states
    webview.addEventListener('did-start-navigation', updateNavigationState);
    webview.addEventListener('did-navigate', updateNavigationState);
    webview.addEventListener('did-navigate-in-page', updateNavigationState);
    
    // Loading indicator
    webview.addEventListener('did-start-loading', () => { 
      loadingBar.classList.add('loading'); 
    });
    
    webview.addEventListener('did-stop-loading', () => { 
      loadingBar.classList.remove('loading'); 
    });
    
    webview.addEventListener('page-title-updated', (e) => {
      const activeTab = tabs.find(t => t.id === activeTabId);
      if (activeTab) {
        activeTab.title = e.title;
        // Update the tab element's data-title attribute for tooltip
        const tabElement = document.querySelector(`.tab[data-id="${activeTabId}"]`);
        if (tabElement) {
          tabElement.setAttribute('data-title', e.title);
        }
        renderTabs();
        saveTabs();
      }
    });
    
    webview.addEventListener('page-favicon-updated', (e) => {
      if (e.favicons && e.favicons.length > 0) {
        const activeTab = tabs.find(t => t.id === activeTabId);
        if (activeTab) {
          activeTab.favicon = e.favicons[0];
          renderTabs();
          saveTabs();
        }
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
      if (webview && webview.canGoBack()) {
        webview.goBack();
      }
    });
  }
  
  if (forwardButton) {
    forwardButton.addEventListener('click', () => {
      if (webview && webview.canGoForward()) {
        webview.goForward();
      }
    });
  }
  
  if (reloadButton) {
    reloadButton.addEventListener('click', () => {
      if (webview) {
        webview.reload();
      }
    });
  }
  
  function updateNavigationState() {
    requestAnimationFrame(() => {
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
  
  // Extension management functions
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
        createNewTab();
        navigateToUrl('https://chrome.google.com/webstore/category/extensions');
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