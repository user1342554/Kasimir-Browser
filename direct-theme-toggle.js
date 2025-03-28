// direct-theme-toggle.js - Simple direct theme toggling without a settings panel
// Add this to your project and include it in index.html

document.addEventListener('DOMContentLoaded', function() {
  // Get the settings button
  const settingsButton = document.getElementById('settings-button');
  
  // Create a simpler function that directly toggles between themes
  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'midnight';
    const newTheme = currentTheme === 'midnight' ? 'winxp' : 'midnight';
    
    // Set the theme attribute
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Save to localStorage
    localStorage.setItem('theme', newTheme);
    
    // Notify about theme change (avoid error if console is not available)
    try { console.log('Theme changed to:', newTheme); } catch(e) {}
    
    // Add or remove XP start button based on theme
    if (newTheme === 'winxp') {
      addXPStartButton();
    } else {
      removeXPStartButton();
    }
    
    // Try to notify webviews about theme change
    try {
      const webview = document.getElementById('browser-view');
      if (webview && webview.contentWindow) {
        webview.contentWindow.postMessage({ type: 'theme-change', theme: newTheme }, '*');
      }
    } catch(e) {
      // Ignore errors, just in case
    }
    
    // Show a simple notification
    showNotification(`Theme changed to ${newTheme === 'midnight' ? 'Default' : 'Windows XP'}`);
  }

  // Apply current theme on page load
  function applyCurrentTheme() {
    const savedTheme = localStorage.getItem('theme') || 'midnight';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // If it's Windows XP theme, add the start button
    if (savedTheme === 'winxp') {
      addXPStartButton();
    }
  }
  
  // Add XP start button
  function addXPStartButton() {
    // Remove existing button if any
    removeXPStartButton();
    
    const startButton = document.createElement('div');
    startButton.className = 'winxp-start-button';
    startButton.innerHTML = `
      <div class="start-icon"></div>
      <div class="start-text">Start</div>
    `;
    
    document.body.appendChild(startButton);
    
    // Handle start button click
    startButton.addEventListener('click', function() {
      alert('Windows XP Start Menu (Simulation)');
    });
  }
  
  // Remove XP start button
  function removeXPStartButton() {
    const existingButton = document.querySelector('.winxp-start-button');
    if (existingButton) existingButton.remove();
  }
  
  // Simple notification
  function showNotification(message) {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('theme-notification');
    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'theme-notification';
      document.body.appendChild(notification);
      
      // Add styles
      const style = document.createElement('style');
      style.textContent = `
        #theme-notification {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background-color: #333;
          color: white;
          padding: 10px 20px;
          border-radius: 5px;
          box-shadow: 0 3px 10px rgba(0,0,0,0.2);
          z-index: 9999;
          transition: transform 0.3s, opacity 0.3s;
          transform: translateY(100px);
          opacity: 0;
        }
        #theme-notification.show {
          transform: translateY(0);
          opacity: 1;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Set message and show
    notification.textContent = message;
    notification.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }
  
  // Attach click event to settings button
  if (settingsButton) {
    settingsButton.addEventListener('click', toggleTheme);
  }
  
  // Apply theme on page load
  applyCurrentTheme();
  
  // Listen for message from homepage
  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'homepage-loaded') {
      // Send current theme to homepage
      try {
        event.source.postMessage({
          type: 'theme-change',
          theme: document.documentElement.getAttribute('data-theme') || 'midnight'
        }, '*');
      } catch(e) {
        // Ignore errors
      }
    }
  });
  
  // For easier debugging in console
  window.toggleTheme = toggleTheme;
  window.setTheme = function(theme) {
    if (theme === 'midnight' || theme === 'winxp') {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
      
      if (theme === 'winxp') {
        addXPStartButton();
      } else {
        removeXPStartButton();
      }
      
      showNotification(`Theme changed to ${theme === 'midnight' ? 'Default' : 'Windows XP'}`);
    }
  };
});