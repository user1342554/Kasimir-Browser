// Theme Integration and Enhanced Browser Functionality
document.addEventListener('DOMContentLoaded', () => {
    // Get browser UI elements
    const browserContainer = document.getElementById('browser-container');
    const toolbar = document.getElementById('toolbar');
    const urlForm = document.getElementById('url-form');
    const urlInput = document.getElementById('url-input');
    const tabsContainer = document.getElementById('tabs-container');
    const webviewContainer = document.getElementById('webview-container');
    
    // Theme-specific components and classes
    const createThemeComponents = (theme) => {
      // Remove any existing theme-specific components
      document.querySelectorAll('.theme-specific-component').forEach(el => el.remove());
      
      // Early 2000s internet style additions
      if (theme === 'early2000s') {
        // Add visitor counter
        const visitorCounter = document.createElement('div');
        visitorCounter.className = 'theme-specific-component early2000s-counter';
        visitorCounter.innerHTML = `
          <div class="counter-label">Visitors:</div>
          <div class="counter-value">000${Math.floor(Math.random() * 1000)}</div>
        `;
        browserContainer.appendChild(visitorCounter);
        
        // Change placeholder text to be more retro
        if (urlInput) {
          urlInput.placeholder = "Enter a URL or search with Altavista";
        }
        
        // Add "Under Construction" gif on a random tab load
        document.addEventListener('tab-loaded', () => {
          if (Math.random() > 0.7) {
            const constructionBanner = document.createElement('div');
            constructionBanner.className = 'theme-specific-component construction-banner';
            constructionBanner.innerHTML = `
              <div class="construction-text">UNDER CONSTRUCTION</div>
              <div class="construction-animation"></div>
            `;
            webviewContainer.appendChild(constructionBanner);
            
            // Remove after 3 seconds
            setTimeout(() => {
              constructionBanner.remove();
            }, 3000);
          }
        });
        
        // Add blinking text element
        const blinkingText = document.createElement('div');
        blinkingText.className = 'theme-specific-component early2000s-blinking';
        blinkingText.innerHTML = '<marquee>Welcome to the World Wide Web!</marquee>';
        blinkingText.style.cssText = `
          position: fixed;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          color: #FF00FF;
          font-family: "Times New Roman", serif;
          font-weight: bold;
          z-index: 9999;
          background: #000080;
          padding: 3px 10px;
          border: 2px outset #d0d0d0;
          animation: blink 1s infinite;
        `;
        document.body.appendChild(blinkingText);
      }
      
      // Windows XP style additions
      else if (theme === 'winxp') {
        // Add Start button
        const startButton = document.createElement('button');
        startButton.className = 'theme-specific-component winxp-start-button';
        startButton.innerHTML = `
          <span class="start-icon"></span>
          <span class="start-text">Start</span>
        `;
        toolbar.prepend(startButton);
        
        // Start button click handler
        startButton.addEventListener('click', () => {
          // Check if start menu already exists
          let startMenu = document.querySelector('.winxp-start-menu');
          
          if (startMenu) {
            startMenu.remove();
            return;
          }
          
          // Create start menu
          startMenu = document.createElement('div');
          startMenu.className = 'theme-specific-component winxp-start-menu';
          startMenu.innerHTML = `
            <div class="start-header">
              <div class="start-user">User</div>
              <div class="start-user-icon"></div>
            </div>
            <div class="start-items">
              <div class="start-item"><span class="start-item-icon ie-icon"></span>Internet Explorer</div>
              <div class="start-item"><span class="start-item-icon email-icon"></span>Email</div>
              <div class="start-item"><span class="start-item-icon mypc-icon"></span>My Computer</div>
              <div class="start-item"><span class="start-item-icon docs-icon"></span>My Documents</div>
              <div class="start-divider"></div>
              <div class="start-item"><span class="start-item-icon settings-icon"></span>Control Panel</div>
              <div class="start-item"><span class="start-item-icon power-icon"></span>Turn Off Computer</div>
            </div>
          `;
          browserContainer.appendChild(startMenu);
          
          // Close start menu when clicking elsewhere
          document.addEventListener('click', (e) => {
            if (!startMenu.contains(e.target) && !startButton.contains(e.target)) {
              startMenu.remove();
            }
          }, { once: true });
        });
        
        // Add XP desktop icons
        const desktopIcons = document.createElement('div');
        desktopIcons.className = 'theme-specific-component winxp-desktop-icons';
        desktopIcons.innerHTML = `
          <div class="desktop-icon">
            <div class="icon-img recycle-bin"></div>
            <div class="icon-text">Recycle Bin</div>
          </div>
          <div class="desktop-icon">
            <div class="icon-img ie-icon"></div>
            <div class="icon-text">Internet Explorer</div>
          </div>
          <div class="desktop-icon">
            <div class="icon-img my-docs"></div>
            <div class="icon-text">My Documents</div>
          </div>
        `;
        webviewContainer.appendChild(desktopIcons);
        
        // Try to play the Windows XP startup sound
        const playXPSound = () => {
          const audio = new Audio('data:audio/wav;base64,BASE64_ENCODED_XP_SOUND'); // Would need the actual sound data
          audio.volume = 0.3;
          audio.play().catch(e => console.log('Auto-play prevented'));
        };
        
        // Try to play the sound
        setTimeout(playXPSound, 1000);
      }
      
      // Windows 95/98 style additions
      else if (theme === 'win9x') {
        // Replace browser title with Win98 style
        const title = document.getElementById('title');
        if (title) {
          title.innerHTML = '<span class="win9x-title-text">Kasimir - Web Browser</span>';
        }
        
        // Add classic taskbar
        const taskbar = document.createElement('div');
        taskbar.className = 'theme-specific-component win9x-taskbar';
        taskbar.innerHTML = `
          <button class="win9x-start-button">
            <span class="start-logo"></span>
            <span class="start-text">Start</span>
          </button>
          <div class="win9x-task-divider"></div>
          <div class="win9x-tasks">
            <button class="win9x-task active">Kasimir Browser</button>
          </div>
          <div class="win9x-tray">
            <div class="win9x-time">12:00 PM</div>
          </div>
        `;
        document.body.appendChild(taskbar);
        
        // Update time in taskbar
        const updateTime = () => {
          const timeElement = document.querySelector('.win9x-time');
          if (timeElement) {
            const now = new Date();
            let hours = now.getHours();
            const minutes = now.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            const minutesStr = minutes < 10 ? '0' + minutes : minutes;
            timeElement.textContent = `${hours}:${minutesStr} ${ampm}`;
          }
        };
        
        // Update time initially and then every minute
        updateTime();
        setInterval(updateTime, 60000);
        
        // Start button functionality
        const startButton = document.querySelector('.win9x-start-button');
        if (startButton) {
          startButton.addEventListener('click', () => {
            // Toggle start menu
            let startMenu = document.querySelector('.win9x-start-menu');
            
            if (startMenu) {
              startMenu.remove();
              return;
            }
            
            startMenu = document.createElement('div');
            startMenu.className = 'theme-specific-component win9x-start-menu';
            startMenu.innerHTML = `
              <div class="win9x-start-header">
                <span class="win9x-header-text">Windows<span class="win9x-header-version">98</span></span>
              </div>
              <div class="win9x-menu-items">
                <div class="win9x-menu-item">
                  <span class="win9x-menu-icon win9x-programs"></span>
                  <span class="win9x-menu-text">Programs</span>
                  <span class="win9x-menu-arrow">►</span>
                </div>
                <div class="win9x-menu-item">
                  <span class="win9x-menu-icon win9x-documents"></span>
                  <span class="win9x-menu-text">Documents</span>
                  <span class="win9x-menu-arrow">►</span>
                </div>
                <div class="win9x-menu-item">
                  <span class="win9x-menu-icon win9x-settings"></span>
                  <span class="win9x-menu-text">Settings</span>
                  <span class="win9x-menu-arrow">►</span>
                </div>
                <div class="win9x-menu-item">
                  <span class="win9x-menu-icon win9x-find"></span>
                  <span class="win9x-menu-text">Find</span>
                  <span class="win9x-menu-arrow">►</span>
                </div>
                <div class="win9x-menu-item">
                  <span class="win9x-menu-icon win9x-help"></span>
                  <span class="win9x-menu-text">Help</span>
                </div>
                <div class="win9x-menu-item">
                  <span class="win9x-menu-icon win9x-run"></span>
                  <span class="win9x-menu-text">Run...</span>
                </div>
                <div class="win9x-menu-divider"></div>
                <div class="win9x-menu-item">
                  <span class="win9x-menu-icon win9x-shutdown"></span>
                  <span class="win9x-menu-text">Shut Down...</span>
                </div>
              </div>
            `;
            document.body.appendChild(startMenu);
            
            // Position the start menu at the bottom left
            const taskbarHeight = taskbar.offsetHeight;
            startMenu.style.bottom = `${taskbarHeight}px`;
            startMenu.style.left = '0';
            
            // Close start menu when clicking elsewhere
            document.addEventListener('click', (e) => {
              if (!startMenu.contains(e.target) && !startButton.contains(e.target)) {
                startMenu.remove();
              }
            }, { once: true });
          });
        }
        
        // Add classic Windows error for fun
        const triggerClassicError = () => {
          const randomErrors = [
            'A fatal exception 0E has occurred at 0028:C11B3ADC',
            'This program has performed an illegal operation',
            'Unexpected error reading drive A:',
            'General Protection Fault'
          ];
          
          const errorIndex = Math.floor(Math.random() * randomErrors.length);
          
          const win98Error = document.createElement('div');
          win98Error.className = 'theme-specific-component win9x-error';
          win98Error.innerHTML = `
            <div class="win9x-error-title">
              <span class="win9x-error-icon"></span>
              Windows
            </div>
            <div class="win9x-error-content">
              <div class="win9x-error-message">${randomErrors[errorIndex]}</div>
              <div class="win9x-error-buttons">
                <button class="win9x-error-button">OK</button>
                <button class="win9x-error-button">Cancel</button>
              </div>
            </div>
          `;
          browserContainer.appendChild(win98Error);
          
          // Center the error dialog
          const rect = win98Error.getBoundingClientRect();
          win98Error.style.position = 'absolute';
          win98Error.style.left = `${(window.innerWidth - rect.width) / 2}px`;
          win98Error.style.top = `${(window.innerHeight - rect.height) / 2}px`;
          
          // Error sound
          const errorSound = new Audio('data:audio/wav;base64,BASE64_ENCODED_ERROR_SOUND'); // Would need actual sound data
          errorSound.volume = 0.3;
          errorSound.play().catch(e => console.log('Auto-play prevented'));
          
          // Remove error on button click
          win98Error.querySelectorAll('.win9x-error-button').forEach(button => {
            button.addEventListener('click', () => {
              win98Error.remove();
            });
          });
          
          // Draggable error window
          let isDragging = false;
          let offsetX, offsetY;
          
          win98Error.querySelector('.win9x-error-title').addEventListener('mousedown', (e) => {
            isDragging = true;
            offsetX = e.clientX - win98Error.getBoundingClientRect().left;
            offsetY = e.clientY - win98Error.getBoundingClientRect().top;
          });
          
          document.addEventListener('mousemove', (e) => {
            if (isDragging) {
              win98Error.style.left = `${e.clientX - offsetX}px`;
              win98Error.style.top = `${e.clientY - offsetY}px`;
            }
          });
          
          document.addEventListener('mouseup', () => {
            isDragging = false;
          });
        };
        
        // Random chance to trigger error when clicking
        document.addEventListener('click', () => {
          if (theme === 'win9x' && Math.random() > 0.95) {
            triggerClassicError();
          }
        });
      }
      
      // Add theme-specific CSS
      applyThemeSpecificCSS(theme);
    };
    
    // Apply theme-specific CSS
    const applyThemeSpecificCSS = (theme) => {
      // Remove any existing theme-specific styles
      const existingStyle = document.getElementById('theme-specific-css');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      if (theme === 'early2000s') {
        const cssStyle = document.createElement('style');
        cssStyle.id = 'theme-specific-css';
        cssStyle.textContent = `
          .early2000s-counter {
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: #000080;
            color: #FFFF00;
            border: 2px solid #FFFFFF;
            padding: 5px 10px;
            font-family: "Times New Roman", serif;
            font-size: 12px;
            display: flex;
            z-index: 1000;
          }
          
          .counter-value {
            color: #00FF00;
            margin-left: 5px;
          }
          
          .construction-banner {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #FFFF00;
            border: 3px solid #FF0000;
            padding: 10px;
            text-align: center;
            font-family: "Times New Roman", serif;
            font-weight: bold;
            color: #FF0000;
            z-index: 1000;
            animation: blink 1s infinite;
          }
          
          .construction-animation {
            width: 100px;
            height: 20px;
            margin: 10px auto;
            background: repeating-linear-gradient(
              45deg,
              #FF0000,
              #FF0000 10px,
              #FFFF00 10px,
              #FFFF00 20px
            );
          }
          
          @keyframes blink {
            0%, 49% { opacity: 1; }
            50%, 100% { opacity: 0.7; }
          }
          
          ${theme === 'early2000s' ? '#url-input::placeholder { color: blue; text-decoration: underline; }' : ''}
          
          @keyframes blink {
            0%, 49% { opacity: 1; }
            50%, 100% { opacity: 0; }
          }
        `;
        document.head.appendChild(cssStyle);
      }
      else if (theme === 'winxp') {
        const cssStyle = document.createElement('style');
        cssStyle.id = 'theme-specific-css';
        cssStyle.textContent = `
          .winxp-start-button {
            display: flex;
            align-items: center;
            background: linear-gradient(to bottom, #3c873c 0%, #1e5f1e 48%, #0d4b0d 52%, #306b30 100%);
            border: 1px solid #215a21;
            border-radius: 3px;
            padding: 2px 10px;
            margin-right: 10px;
            height: 30px;
            cursor: pointer;
          }
          
          .start-icon {
            width: 20px;
            height: 20px;
            background-color: #36a336;
            border-radius: 50%;
            margin-right: 5px;
          }
          
          .start-text {
            color: white;
            font-weight: bold;
            font-size: 14px;
          }
          
          .winxp-start-menu {
            position: fixed;
            bottom: 40px;
            left: 0;
            width: 300px;
            background: #ECE9D8;
            border: 1px solid #333;
            box-shadow: 2px 2px 5px rgba(0,0,0,0.3);
            z-index: 1000;
            animation: slideUp 0.2s ease;
          }
          
          .start-header {
            background: linear-gradient(to right, #205CBE 0%, #2F7CFC 100%);
            color: white;
            padding: 10px;
            height: 70px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          
          .start-user {
            font-weight: bold;
            font-size: 18px;
          }
          
          .start-user-icon {
            width: 40px;
            height: 40px;
            background-color: #FFEB9B;
            border-radius: 5px;
          }
          
          .start-items {
            padding: 5px;
          }
          
          .start-item {
            display: flex;
            align-items: center;
            padding: 8px;
            cursor: pointer;
          }
          
          .start-item:hover {
            background-color: #3183FF;
            color: white;
          }
          
          .start-item-icon {
            width: 24px;
            height: 24px;
            margin-right: 8px;
            background-color: #CCCCCC;
          }
          
          .start-divider {
            height: 1px;
            background-color: #A0A0A0;
            margin: 5px 0;
          }
          
          .winxp-desktop-icons {
            position: absolute;
            top: 10px;
            left: 10px;
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
          
          .desktop-icon {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 70px;
            cursor: pointer;
          }
          
          .icon-img {
            width: 40px;
            height: 40px;
            margin-bottom: 5px;
            background-color: #346DC2;
          }
          
          .icon-text {
            text-align: center;
            color: #000;
            font-size: 11px;
            background-color: transparent;
            padding: 2px;
          }
          
          .desktop-icon:hover .icon-text {
            background-color: #3183FF;
            color: white;
          }
          
          @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `;
        document.head.appendChild(cssStyle);
      }
      else if (theme === 'win9x') {
        const cssStyle = document.createElement('style');
        cssStyle.id = 'theme-specific-css';
        cssStyle.textContent = `
          .win9x-title-text {
            font-family: 'MS Sans Serif', Arial, sans-serif;
            font-size: 12px;
            letter-spacing: 0;
          }
          
          .win9x-error {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 300px;
            background-color: #C0C0C0;
            border-top: 1px solid #FFFFFF;
            border-left: 1px solid #FFFFFF;
            border-right: 1px solid #000000;
            border-bottom: 1px solid #000000;
            box-shadow: 3px 3px 0 rgba(0,0,0,0.5);
            z-index: 9999;
          }
          
          .win9x-error-title {
            background-color: #000080;
            color: white;
            padding: 3px 5px;
            font-weight: bold;
            font-size: 12px;
            display: flex;
            align-items: center;
            cursor: move;
          }
          
          .win9x-error-icon {
            width: 16px;
            height: 16px;
            background-color: white;
            margin-right: 5px;
          }
          
          .win9x-error-content {
            padding: 12px;
          }
          
          .win9x-error-message {
            margin-bottom: 15px;
            font-size: 12px;
          }
          
          .win9x-error-buttons {
            display: flex;
            justify-content: center;
            gap: 10px;
          }
          
          .win9x-error-button {
            min-width: 70px;
            padding: 5px 10px;
            font-size: 12px;
            background-color: #C0C0C0;
            border-top: 1px solid #FFFFFF;
            border-left: 1px solid #FFFFFF;
            border-right: 1px solid #000000;
            border-bottom: 1px solid #000000;
            cursor: pointer;
          }
          
          .win9x-error-button:active {
            border-top: 1px solid #000000;
            border-left: 1px solid #000000;
            border-right: 1px solid #FFFFFF;
            border-bottom: 1px solid #FFFFFF;
          }
          
          .win9x-taskbar {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 28px;
            background-color: #C0C0C0;
            border-top: 1px solid #FFFFFF;
            display: flex;
            align-items: center;
            z-index: 1000;
            padding: 0 2px;
          }
          
          .win9x-start-button {
            display: flex;
            align-items: center;
            background-color: #C0C0C0;
            border-top: 1px solid #FFFFFF;
            border-left: 1px solid #FFFFFF;
            border-right: 1px solid #000000;
            border-bottom: 1px solid #000000;
            padding: 2px 6px;
            height: 22px;
            font-size: 12px;
            font-weight: bold;
            cursor: pointer;
          }
          
          .win9x-start-button:active {
            border-top: 1px solid #000000;
            border-left: 1px solid #000000;
            border-right: 1px solid #FFFFFF;
            border-bottom: 1px solid #FFFFFF;
          }
          
          .start-logo {
            width: 16px;
            height: 16px;
            background-color: #000080;
            margin-right: 4px;
          }
          
          .win9x-task-divider {
            width: 1px;
            height: 22px;
            background-color: #808080;
            margin: 0 4px;
          }
          
          .win9x-tasks {
            flex: 1;
            display: flex;
            gap: 4px;
            overflow-x: hidden;
          }
          
          .win9x-task {
            height: 22px;
            padding: 2px 8px;
            font-size: 11px;
            background-color: #C0C0C0;
            border-top: 1px solid #FFFFFF;
            border-left: 1px solid #FFFFFF;
            border-right: 1px solid #000000;
            border-bottom: 1px solid #000000;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            min-width: 120px;
            max-width: 200px;
            cursor: pointer;
          }
          
          .win9x-task.active {
            border-top: 1px solid #000000;
            border-left: 1px solid #000000;
            border-right: 1px solid #FFFFFF;
            border-bottom: 1px solid #FFFFFF;
          }
          
          .win9x-tray {
            display: flex;
            align-items: center;
            height: 22px;
            padding: 0 8px;
            background-color: #C0C0C0;
            border-top: 1px solid #808080;
            border-left: 1px solid #808080;
            border-right: 1px solid #FFFFFF;
            border-bottom: 1px solid #FFFFFF;
          }
          
          .win9x-time {
            font-size: 11px;
          }
          
          .win9x-start-menu {
            position: fixed;
            width: 180px;
            background-color: #C0C0C0;
            border-top: 1px solid #FFFFFF;
            border-left: 1px solid #FFFFFF;
            border-right: 1px solid #000000;
            border-bottom: 1px solid #000000;
            z-index: 1001;
          }
          
          .win9x-start-header {
            background-color: #000080;
            color: white;
            padding: 4px;
            display: flex;
            align-items: center;
          }
          
          .win9x-header-text {
            font-weight: bold;
            font-size: 14px;
            transform: rotate(-90deg);
            transform-origin: left bottom;
            position: absolute;
            left: 16px;
            bottom: 4px;
          }
          
          .win9x-header-version {
            font-size: 12px;
            font-weight: normal;
          }
          
          .win9x-menu-items {
            padding: 2px;
          }
          
          .win9x-menu-item {
            display: flex;
            align-items: center;
            padding: 4px 2px;
            cursor: pointer;
          }
          
          .win9x-menu-item:hover {
            background-color: #000080;
            color: white;
          }
          
          .win9x-menu-icon {
            width: 24px;
            height: 24px;
            margin-right: 4px;
            background-color: #CCCCCC;
          }
          
          .win9x-menu-text {
            flex: 1;
            font-size: 11px;
          }
          
          .win9x-menu-arrow {
            font-size: 10px;
          }
          
          .win9x-menu-divider {
            height: 1px;
            background-color: #808080;
            margin: 2px 0;
          }
        `;
        document.head.appendChild(cssStyle);
      }
    };
    
    // Theme change observer
    const observeThemeChanges = () => {
      // Create an observer to watch for theme changes
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'data-theme') {
            const newTheme = document.documentElement.getAttribute('data-theme');
            createThemeComponents(newTheme);
          }
        });
      });
      
      // Start observing theme changes
      observer.observe(document.documentElement, { attributes: true });
      
      // Initialize with current theme
      const currentTheme = document.documentElement.getAttribute('data-theme');
      createThemeComponents(currentTheme);
    };
    
    // Initialize observer
    observeThemeChanges();
    
    // Add theme class for tabs when created
    const originalCreateTab = window.createNewTab;
    if (originalCreateTab) {
      window.createNewTab = function() {
        const tabId = originalCreateTab.apply(this, arguments);
        
        // Get current theme
        const currentTheme = document.documentElement.getAttribute('data-theme');
        
        // Add theme-specific styling to the new tab
        const tabElement = document.querySelector(`.tab[data-id="${tabId}"]`);
        if (tabElement) {
          tabElement.classList.add(`tab-${currentTheme}`);
        }
        
        return tabId;
      };
    }
    
    // Add special URL behaviors for Windows XP theme
    const originalNavigate = window.navigateActiveTab;
    if (originalNavigate) {
      window.navigateActiveTab = function(url) {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        
        // Windows XP special case - redirect to IE-style pages
        if (currentTheme === 'winxp' && url.toLowerCase().includes('msn')) {
          showNotification('Opening MSN.com in Internet Explorer mode', 'info');
          
          // Create MSN-style overlay
          const msnOverlay = document.createElement('div');
          msnOverlay.className = 'theme-specific-component msn-overlay';
          msnOverlay.innerHTML = `
            <div class="msn-header">
              <span class="msn-logo">MSN</span>
              <span class="ie-logo">Internet Explorer</span>
            </div>
            <div class="msn-loading">
              <div class="msn-spinner"></div>
              <div class="msn-text">Loading MSN.com...</div>
            </div>
          `;
          webviewContainer.appendChild(msnOverlay);
          
          // Remove overlay after 2 seconds
          setTimeout(() => {
            msnOverlay.remove();
            originalNavigate.call(this, url);
          }, 2000);
          
          return;
        }
        
        // Pass through to original function
        originalNavigate.call(this, url);
      };
    }
    
    // Add special behaviors for tabs based on the current theme
    document.addEventListener('tab-click', (e) => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      
      // Windows 98 tab behavior - play click sound
      if (currentTheme === 'win9x') {
        const clickSound = new Audio('data:audio/wav;base64,BASE64_ENCODED_CLICK_SOUND'); // Would need actual sound
        clickSound.volume = 0.2;
        clickSound.play().catch(e => console.log('Auto-play prevented'));
      }
    });
    
    // Add theme-specific loading indicator
    document.addEventListener('page-loading-start', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      
      // Remove any existing custom loading indicators
      document.querySelectorAll('.theme-loading-indicator').forEach(el => el.remove());
      
      if (currentTheme === 'early2000s') {
        const indicator = document.createElement('div');
        indicator.className = 'theme-loading-indicator early2000s-loading';
        indicator.innerHTML = 'Loading... Please Wait...';
        webviewContainer.appendChild(indicator);
      }
      else if (currentTheme === 'winxp') {
        const indicator = document.createElement('div');
        indicator.className = 'theme-loading-indicator winxp-loading';
        indicator.innerHTML = '<div class="xp-loading-circle"></div>';
        webviewContainer.appendChild(indicator);
      }
    });
    
    document.addEventListener('page-loading-end', () => {
      // Remove loading indicators
      document.querySelectorAll('.theme-loading-indicator').forEach(el => el.remove());
    });
    
    // Helper function to trigger custom events
    const triggerCustomEvent = (name, data = {}) => {
      const event = new CustomEvent(name, { detail: data });
      document.dispatchEvent(event);
    };
    
    // Patch existing browser functionality to emit events
    if (window.setActiveTab) {
      const originalSetActiveTab = window.setActiveTab;
      window.setActiveTab = function(tabId) {
        originalSetActiveTab.call(this, tabId);
        triggerCustomEvent('tab-click', { tabId });
      };
    }
    
    // Create event listeners for webview events
    document.querySelectorAll('webview').forEach(webview => {
      webview.addEventListener('did-start-loading', () => {
        triggerCustomEvent('page-loading-start');
      });
      
      webview.addEventListener('did-stop-loading', () => {
        triggerCustomEvent('page-loading-end');
      });
      
      webview.addEventListener('dom-ready', () => {
        triggerCustomEvent('tab-loaded');
      });
    });
    
    // Helper function to show notifications
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
    
    // Export API for other scripts
    window.themeIntegration = {
      applyTheme: createThemeComponents,
      showNotification: showNotification,
      triggerEvent: triggerCustomEvent
    };
  });