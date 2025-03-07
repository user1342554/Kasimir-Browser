document.addEventListener('DOMContentLoaded', () => {
    const startupAnimation = document.getElementById('startup-animation');
    
    // Skip animation if it's been shown in this session
    const hasShownAnimation = sessionStorage.getItem('hasShownStartupAnimation');
    if (hasShownAnimation) {
      startupAnimation.classList.add('hidden');
      return;
    }
    
    // Create particles
    const particlesContainer = document.getElementById('particles');
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      
      // Set custom properties for animation
      particle.style.setProperty('--tx', (Math.random() * 200 - 100) + 'px');
      particle.style.setProperty('--ty', (Math.random() * 200 - 100) + 'px');
      
      // Set animation
      particle.style.animation = 'particleAnimation ' + 
        (2 + Math.random() * 2) + 's ' + 
        (Math.random() * 2) + 's infinite ease-out';
      
      particlesContainer.appendChild(particle);
    }
    
    // Stop the animation after exactly 3 seconds
    setTimeout(() => {
      // Trigger the final animation for a clean transition
      const loadingComplete = document.getElementById('loadingComplete');
      loadingComplete.style.animation = 'loadComplete 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards';
      
      // Hide the animation after a short transition
      setTimeout(() => {
        startupAnimation.classList.add('hidden');
        // Mark animation as shown for this session
        sessionStorage.setItem('hasShownStartupAnimation', 'true');
        
        // Trigger browser initialization if needed
        if (window.electronAPI && window.electronAPI.signalAnimationComplete) {
          window.electronAPI.signalAnimationComplete();
        }
      }, 600);
    }, 2400); // 2.4s + 0.6s = 3s total
});