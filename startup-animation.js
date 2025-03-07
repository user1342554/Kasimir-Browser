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
    
    // Create pulse effect after loading
    setTimeout(() => {
      const pulseRing1 = document.getElementById('pulseRing1');
      pulseRing1.style.animation = 'pulseRing 1.5s cubic-bezier(0, 0.55, 0.45, 1) forwards';
      
      setTimeout(() => {
        const pulseRing2 = document.getElementById('pulseRing2');
        pulseRing2.style.animation = 'pulseRing 1.5s cubic-bezier(0, 0.55, 0.45, 1) forwards';
      }, 300);
      
      // Final animation - fade out startup animation
      setTimeout(() => {
        const loadingComplete = document.getElementById('loadingComplete');
        loadingComplete.style.animation = 'loadComplete 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards';
        
        // Hide startup animation after the final animation
        setTimeout(() => {
          startupAnimation.classList.add('hidden');
          // Mark animation as shown for this session
          sessionStorage.setItem('hasShownStartupAnimation', 'true');
          
          // Trigger browser initialization if needed
          if (window.electronAPI && window.electronAPI.signalAnimationComplete) {
            window.electronAPI.signalAnimationComplete();
          }
        }, 800);
      }, 3400);
    }, 3000);
  });