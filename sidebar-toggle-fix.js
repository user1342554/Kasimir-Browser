// =================== SIDEBAR INTERACTION ENHANCEMENTS ===================
document.addEventListener('DOMContentLoaded', () => {
    // Add smooth transitions for sidebar width changes
    const sidebar = document.getElementById('sidebar');
    let sidebarResizeTimeout;
    
    // Function to temporarily remove transition during resize
    function prepareForResize() {
      sidebar.classList.remove('smooth-transition');
    }
    
    // Function to restore transition after resize
    function finishResize() {
      clearTimeout(sidebarResizeTimeout);
      sidebarResizeTimeout = setTimeout(() => {
        sidebar.classList.add('smooth-transition');
      }, 100);
    }
    
    // Add transition class initially
    sidebar.classList.add('smooth-transition');
    
    // Update the sidebar width range event to use smooth transitions
    const sidebarWidthRange = document.getElementById('sidebar-width');
    if (sidebarWidthRange) {
      sidebarWidthRange.addEventListener('mousedown', prepareForResize);
      sidebarWidthRange.addEventListener('touchstart', prepareForResize);
      sidebarWidthRange.addEventListener('mouseup', finishResize);
      sidebarWidthRange.addEventListener('touchend', finishResize);
    }
    
    // Enhanced sidebar toggle with animation
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => {
        prepareForResize();
        sidebar.classList.toggle('collapsed');
        localStorage.setItem('sidebar-collapsed', sidebar.classList.contains('collapsed'));
        finishResize();
        
        // Emit custom event for sidebar state change
        const event = new CustomEvent('sidebar-toggle', { 
          detail: { collapsed: sidebar.classList.contains('collapsed') } 
        });
        document.dispatchEvent(event);
      });
    }
    
    // Double-click on sidebar header to toggle
    const titleBar = document.getElementById('title-bar');
    if (titleBar) {
      titleBar.addEventListener('dblclick', (e) => {
        // Only toggle if double-clicked on empty area
        if (e.target === titleBar || e.target.id === 'title') {
          prepareForResize();
          sidebar.classList.toggle('collapsed');
          localStorage.setItem('sidebar-collapsed', sidebar.classList.contains('collapsed'));
          finishResize();
        }
      });
    }
    
    // Keyboard shortcut for sidebar toggle (Ctrl+B or Cmd+B)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        prepareForResize();
        sidebar.classList.toggle('collapsed');
        localStorage.setItem('sidebar-collapsed', sidebar.classList.contains('collapsed'));
        finishResize();
      }
    });
    
    // Tab drag and drop functionality
    let draggedTab = null;
    let tabPositions = [];
    
    function initTabDragAndDrop() {
      const tabs = document.querySelectorAll('.tab');
      
      tabs.forEach(tab => {
        tab.setAttribute('draggable', 'true');
        
        tab.addEventListener('dragstart', (e) => {
          draggedTab = tab;
          setTimeout(() => {
            tab.classList.add('tab-dragging');
          }, 0);
          
          // Set drag image to be the tab itself
          if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', tab.dataset.id);
          }
          
          // Calculate all tab positions for drop zones
          tabPositions = Array.from(tabs).map(t => {
            const rect = t.getBoundingClientRect();
            return {
              id: t.dataset.id,
              top: rect.top,
              bottom: rect.bottom,
              height: rect.height
            };
          });
        });
        
        tab.addEventListener('dragend', () => {
          tab.classList.remove('tab-dragging');
          draggedTab = null;
          
          // Remove any drag indicators
          document.querySelectorAll('.tab-drag-indicator').forEach(el => el.remove());
        });
        
        tab.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          
          // Position indicator
          const rect = tab.getBoundingClientRect();
          const draggedRect = draggedTab ? draggedTab.getBoundingClientRect() : null;
          
          if (draggedTab && draggedTab !== tab) {
            // Make sure not to show indicator if dragging over self
            const mouse = e.clientY;
            const tabCenter = (rect.top + rect.bottom) / 2;
            
            // Remove all existing indicators
            document.querySelectorAll('.tab-drag-indicator').forEach(el => el.remove());
            
            // Add new indicator based on mouse position
            const indicator = document.createElement('div');
            indicator.className = 'tab-drag-indicator';
            
            // Position the indicator above or below the tab
            indicator.style.left = `${rect.left}px`;
            indicator.style.width = `${rect.width}px`;
            indicator.style.height = '3px';
            
            if (mouse < tabCenter) {
              // Above the tab
              indicator.style.top = `${rect.top - 1}px`;
            } else {
              // Below the tab
              indicator.style.top = `${rect.bottom - 1}px`;
            }
            
            document.body.appendChild(indicator);
          }
        });
        
        tab.addEventListener('drop', (e) => {
          e.preventDefault();
          if (!draggedTab || draggedTab === tab) return;
          
          // Remove any drag indicators
          document.querySelectorAll('.tab-drag-indicator').forEach(el => el.remove());
          
          // Get tab IDs
          const draggedId = draggedTab.dataset.id;
          const targetId = tab.dataset.id;
          
          // Calculate drop position
          const mouse = e.clientY;
          const rect = tab.getBoundingClientRect();
          const tabCenter = (rect.top + rect.bottom) / 2;
          const dropBeforeTarget = mouse < tabCenter;
          
          // Find tab indices
          const tabs = Array.from(document.querySelectorAll('.tab'));
          const draggedIndex = tabs.findIndex(t => t.dataset.id === draggedId);
          const targetIndex = tabs.findIndex(t => t.dataset.id === targetId);
          
          // Re-order tabs in the data model
          if (typeof window.reorderTabs === 'function') {
            if (dropBeforeTarget) {
              window.reorderTabs(draggedId, targetId, 'before');
            } else {
              window.reorderTabs(draggedId, targetId, 'after');
            }
          } else {
            // Fallback for visual reordering only
            const tabsContainer = document.getElementById('tabs-container');
            if (tabsContainer) {
              if (dropBeforeTarget) {
                tabsContainer.insertBefore(draggedTab, tab);
              } else {
                const nextElement = tab.nextElementSibling;
                if (nextElement) {
                  tabsContainer.insertBefore(draggedTab, nextElement);
                } else {
                  tabsContainer.appendChild(draggedTab);
                }
              }
            }
          }
        });
      });
    }
    
    // Initialize tab drag and drop
    initTabDragAndDrop();
    
    // Re-initialize tab drag and drop when tabs change
    document.addEventListener('tabs-updated', () => {
      initTabDragAndDrop();
    });
    
    // =================== THEME ENHANCEMENTS ===================
    
    // Add theme-specific keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Get current theme
      const currentTheme = document.documentElement.getAttribute('data-theme');
      
      // Windows 9x: Alt+F4 to show the classic close dialog
      if (currentTheme === 'win9x' && e.altKey && e.key === 'F4') {
        e.preventDefault();
        
        const win98Dialog = document.createElement('div');
        win98Dialog.className = 'win9x-dialog';
        win98Dialog.innerHTML = `
          <div class="win9x-dialog-title">
            <span class="win9x-dialog-icon"></span>
            <span>Close Program</span>
            <button class="win9x-close-btn">×</button>
          </div>
          <div class="win9x-dialog-content">
            <p>Are you sure you want to close this browser?</p>
            <div class="win9x-dialog-buttons">
              <button class="win9x-btn" id="win9x-yes">Yes</button>
              <button class="win9x-btn" id="win9x-no">No</button>
              <button class="win9x-btn" id="win9x-cancel">Cancel</button>
            </div>
          </div>
        `;
        
        document.body.appendChild(win98Dialog);
        
        // Dialog controls
        const closeBtn = win98Dialog.querySelector('.win9x-close-btn');
        const yesBtn = document.getElementById('win9x-yes');
        const noBtn = document.getElementById('win9x-no');
        const cancelBtn = document.getElementById('win9x-cancel');
        
        const closeDialog = () => {
          win98Dialog.remove();
        };
        
        if (closeBtn) closeBtn.addEventListener('click', closeDialog);
        if (noBtn) noBtn.addEventListener('click', closeDialog);
        if (cancelBtn) cancelBtn.addEventListener('click', closeDialog);
        
        if (yesBtn) {
          yesBtn.addEventListener('click', () => {
            // Close the browser
            if (window.electronAPI && window.electronAPI.closeWindow) {
              window.electronAPI.closeWindow();
            }
            closeDialog();
          });
        }
        
        // Make dialog draggable
        const dialogTitle = win98Dialog.querySelector('.win9x-dialog-title');
        let isDragging = false;
        let offsetX, offsetY;
        
        dialogTitle.addEventListener('mousedown', (e) => {
          isDragging = true;
          offsetX = e.clientX - win98Dialog.getBoundingClientRect().left;
          offsetY = e.clientY - win98Dialog.getBoundingClientRect().top;
        });
        
        document.addEventListener('mousemove', (e) => {
          if (isDragging) {
            win98Dialog.style.left = `${e.clientX - offsetX}px`;
            win98Dialog.style.top = `${e.clientY - offsetY}px`;
          }
        });
        
        document.addEventListener('mouseup', () => {
          isDragging = false;
        });
      }
      
      // Windows XP: Windows key to open start menu
      if (currentTheme === 'winxp' && (e.key === 'Meta' || e.key === 'OS')) {
        e.preventDefault();
        
        // Toggle start menu
        const existingMenu = document.querySelector('.winxp-start-menu');
        if (existingMenu) {
          existingMenu.remove();
        } else {
          const startMenu = document.createElement('div');
          startMenu.className = 'winxp-start-menu';
          startMenu.innerHTML = `
            <div class="start-header">
              <div class="start-user">User</div>
              <div class="start-user-icon"></div>
            </div>
            <div class="start-items">
              <div class="start-item"><span class="start-item-icon"></span>Internet Explorer</div>
              <div class="start-item"><span class="start-item-icon"></span>Email</div>
              <div class="start-item"><span class="start-item-icon"></span>My Computer</div>
              <div class="start-item"><span class="start-item-icon"></span>My Documents</div>
              <div class="start-divider"></div>
              <div class="start-item"><span class="start-item-icon"></span>Control Panel</div>
              <div class="start-item"><span class="start-item-icon"></span>Turn Off Computer</div>
            </div>
          `;
          
          document.body.appendChild(startMenu);
          
          // Close start menu when clicking elsewhere
          document.addEventListener('click', (e) => {
            if (!startMenu.contains(e.target)) {
              startMenu.remove();
            }
          }, { once: true });
        }
      }
    });
    
    // Add CSS animations for theme transitions
    const style = document.createElement('style');
    style.textContent = `
      /* Theme transition animations */
      html[data-theme] {
        transition: background-color 0.5s ease, color 0.5s ease;
      }
      
      /* Tab animations */
      .tab {
        transition: transform 0.3s ease, 
                    background-color 0.3s ease, 
                    box-shadow 0.3s ease,
                    border 0.3s ease;
      }
      
      /* Win9x dialog */
      .win9x-dialog {
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
      
      .win9x-dialog-title {
        background-color: #000080;
        color: white;
        padding: 3px 5px;
        font-weight: bold;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: move;
      }
      
      .win9x-dialog-content {
        padding: 10px;
      }
      
      .win9x-dialog-buttons {
        display: flex;
        justify-content: center;
        gap: 5px;
        margin-top: 10px;
      }
      
      .win9x-btn {
        padding: 3px 10px;
        background-color: #C0C0C0;
        border-top: 1px solid #FFFFFF;
        border-left: 1px solid #FFFFFF;
        border-right: 1px solid #000000;
        border-bottom: 1px solid #000000;
        min-width: 70px;
        cursor: pointer;
      }
      
      .win9x-btn:active {
        border-top: 1px solid #000000;
        border-left: 1px solid #000000;
        border-right: 1px solid #FFFFFF;
        border-bottom: 1px solid #FFFFFF;
      }
      
      .win9x-close-btn {
        background: none;
        border: none;
        color: white;
        font-size: 14px;
        line-height: 1;
        cursor: pointer;
      }
      
      /* Tab drag indicator */
      .tab-drag-indicator {
        position: fixed;
        background-color: var(--accent-primary);
        z-index: 999;
        pointer-events: none;
      }
    `;
    
    document.head.appendChild(style);
    
    // =================== INTEGRATION WITH RENDERER ===================
    
    // Expose API for renderer.js
    window.kasimirUI = window.kasimirUI || {};
    
    // API for sidebar operations
    window.kasimirUI.sidebar = {
      /**
       * Expand the sidebar
       */
      expand: () => {
        sidebar.classList.remove('collapsed');
        localStorage.setItem('sidebar-collapsed', 'false');
      },
      
      /**
       * Collapse the sidebar
       */
      collapse: () => {
        sidebar.classList.add('collapsed');
        localStorage.setItem('sidebar-collapsed', 'true');
      },
      
      /**
       * Toggle the sidebar state
       */
      toggle: () => {
        sidebar.classList.toggle('collapsed');
        localStorage.setItem('sidebar-collapsed', sidebar.classList.contains('collapsed'));
      },
      
      /**
       * Check if sidebar is collapsed
       * @returns {boolean} True if sidebar is collapsed
       */
      isCollapsed: () => {
        return sidebar.classList.contains('collapsed');
      },
      
      /**
       * Set the sidebar width
       * @param {number} width Width in pixels
       */
      setWidth: (width) => {
        if (typeof width === 'number' && width >= 180 && width <= 300) {
          sidebar.style.width = `${width}px`;
          localStorage.setItem('sidebar-width', width.toString());
          
          // Update range if it exists
          if (sidebarWidthRange) {
            sidebarWidthRange.value = width.toString();
          }
        }
      }
    };
    
    // API for theme operations
    window.kasimirUI.theme = {
      /**
       * Set the theme
       * @param {string} theme Theme name
       */
      set: (theme) => {
        if (typeof theme === 'string') {
          document.documentElement.setAttribute('data-theme', theme);
          localStorage.setItem('theme', theme);
          
          // Update theme preset UI
          themePresets.forEach(preset => {
            preset.classList.toggle('active', preset.dataset.theme === theme);
          });
        }
      },
      
      /**
       * Get the current theme
       * @returns {string} Current theme name
       */
      get: () => {
        return document.documentElement.getAttribute('data-theme') || 'midnight';
      },
      
      /**
       * Reset to default theme
       */
      reset: () => {
        window.kasimirUI.theme.set('midnight');
      }
    };
  });