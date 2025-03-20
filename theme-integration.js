// Theme Integration Enhancement
document.addEventListener('DOMContentLoaded', () => {
    // Reference to theme elements
    const themePresets = document.querySelectorAll('.theme-preset');
    const htmlElement = document.documentElement;
    
    // Get saved theme or default to midnight
    const savedTheme = localStorage.getItem('theme') || 'midnight';
    
    // Apply saved theme on load
    htmlElement.setAttribute('data-theme', savedTheme);
    
    // Update theme presets to show active state
    themePresets.forEach(preset => {
      preset.classList.toggle('active', preset.dataset.theme === savedTheme);
    });
    
    // Theme switching functionality
    themePresets.forEach(preset => {
      preset.addEventListener('click', () => {
        const theme = preset.dataset.theme;
        
        // Apply theme
        htmlElement.setAttribute('data-theme', theme);
        
        // Save theme preference
        localStorage.setItem('theme', theme);
        
        // Update active state on presets
        themePresets.forEach(p => {
          p.classList.toggle('active', p === preset);
        });
        
        // Show notification
        showThemeChangeNotification(theme);
      });
    });
    
    // Theme change notification
    function showThemeChangeNotification(theme) {
      // Format theme name for display
      const formattedName = theme
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      let notification = document.getElementById('notification');
      if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        document.body.appendChild(notification);
      }
      
      notification.textContent = `Theme changed to ${formattedName}`;
      notification.className = 'info';
      notification.classList.add('show');
      
      setTimeout(() => {
        notification.classList.remove('show');
      }, 3000);
    }
    
    // Add keyboard shortcut for quick theme toggle (Ctrl+Shift+T)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        
        // Toggle between light/dark themes based on current theme
        const currentTheme = htmlElement.getAttribute('data-theme');
        
        let newTheme;
        if (currentTheme === 'metro') {
          newTheme = 'metro-light';
        } else if (currentTheme === 'metro-light') {
          newTheme = 'metro';
        } else if (currentTheme === 'midnight' || currentTheme === 'dark') {
          newTheme = 'light';
        } else {
          newTheme = 'midnight';
        }
        
        // Apply and save new theme
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Update active state on presets
        themePresets.forEach(preset => {
          preset.classList.toggle('active', preset.dataset.theme === newTheme);
        });
        
        // Show notification
        showThemeChangeNotification(newTheme);
      }
    });
  });