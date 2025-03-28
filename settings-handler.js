// settings-handler.js - Minimal version that only handles opening/closing the settings panel
// and applies the saved theme from localStorage

document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const settingsButton = document.getElementById('settings-button');
    const settingsPanel = document.getElementById('settings-panel');
    const extensionsPanel = document.getElementById('extensions-panel');
    
    // Settings button click handler
    if (settingsButton && settingsPanel) {
      settingsButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Settings button clicked');
        
        // Toggle the settings panel
        settingsPanel.classList.toggle('active');
        
        // Close extensions panel if open
        if (extensionsPanel && extensionsPanel.classList.contains('active')) {
          extensionsPanel.classList.remove('active');
        }
        
        // Add/remove click outside listener
        if (settingsPanel.classList.contains('active')) {
          setTimeout(() => {
            document.addEventListener('click', closeSettingsPanelOutside);
          }, 10);
        } else {
          document.removeEventListener('click', closeSettingsPanelOutside);
        }
      });
    } else {
      console.error('Settings button or panel not found:', { 
        button: !!settingsButton, 
        panel: !!settingsPanel 
      });
    }
    
    // Close settings panel when clicking outside
    function closeSettingsPanelOutside(e) {
      if (settingsPanel && !settingsPanel.contains(e.target) && e.target !== settingsButton) {
        settingsPanel.classList.remove('active');
        document.removeEventListener('click', closeSettingsPanelOutside);
      }
    }
    
    // Apply any saved theme
    const savedTheme = localStorage.getItem('theme') || 'midnight';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Keyboard shortcut for settings (Ctrl+,)
    document.addEventListener('keydown', function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        if (settingsPanel) {
          settingsPanel.classList.add('active');
          document.addEventListener('click', closeSettingsPanelOutside);
        }
      }
    });
    
    // Function to change themes programmatically if needed
    window.setTheme = function(themeName) {
      if (themeName) {
        document.documentElement.setAttribute('data-theme', themeName);
        localStorage.setItem('theme', themeName);
        console.log('Theme changed to:', themeName);
      }
    };
  });