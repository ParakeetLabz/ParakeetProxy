const applyTheme = (themeName) => {
    const validThemes = ['dark', 'light', 'blue', 'purple', 'green', 'red', 'orange', 'custom'];
    const theme = validThemes.includes(themeName) ? themeName : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    if (theme === 'custom') {
      applyCustomTheme();
    }
  };
  
  const applyCustomTheme = () => {
    const customTheme = JSON.parse(localStorage.getItem('customTheme') || '{}');
    if (Object.keys(customTheme).length === 0) return;
    
    const root = document.documentElement;
    if (customTheme.bg) root.style.setProperty('--bg', customTheme.bg);
    if (customTheme.text) root.style.setProperty('--text', customTheme.text);
    if (customTheme.muted) root.style.setProperty('--muted', customTheme.muted);
    if (customTheme.pill) root.style.setProperty('--pill', customTheme.pill);
    if (customTheme.dock) {
      const dockRgba = hexToRgba(customTheme.dock, 0.85);
      root.style.setProperty('--dock', dockRgba);
    }
    if (customTheme.dockBorder) {
      const dockBorderRgba = hexToRgba(customTheme.dockBorder, 0.8);
      root.style.setProperty('--dock-border', dockBorderRgba);
    }
    if (customTheme.accent) {
      const accentRgba = hexToRgba(customTheme.accent, 0.6);
      root.style.setProperty('--accent', accentRgba);
    }
    
    if (customTheme.grid) {
      const gridRgba = hexToRgba(customTheme.grid, 0.05);
      const gridStrongRgba = hexToRgba(customTheme.grid, 0.1);
      root.style.setProperty('--grid', gridRgba);
      root.style.setProperty('--grid-strong', gridStrongRgba);
    }
  };
  
  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  
  const clearCustomTheme = () => {
    const root = document.documentElement;
    root.style.removeProperty('--bg');
    root.style.removeProperty('--text');
    root.style.removeProperty('--muted');
    root.style.removeProperty('--pill');
    root.style.removeProperty('--dock');
    root.style.removeProperty('--dock-border');
    root.style.removeProperty('--accent');
    root.style.removeProperty('--grid');
    root.style.removeProperty('--grid-strong');
  };
  
  if (!window.applyTheme) {
    window.applyTheme = applyTheme;
  }
  
  if (!window.applyCustomTheme) {
    window.applyCustomTheme = applyCustomTheme;
  }
  
  if (!window.clearCustomTheme) {
    window.clearCustomTheme = clearCustomTheme;
  }
  
  const loadBatteryVisibility = () => {
    const savedShowBattery = localStorage.getItem('showBattery') !== 'false';
    const notch = document.querySelector('.notch');
    if (notch) {
      notch.style.display = savedShowBattery ? 'flex' : 'none';
    }
  };
  
  if (!window.toggleBatteryVisibility) {
    window.toggleBatteryVisibility = (show) => {
      const notch = document.querySelector('.notch');
      if (notch) {
        notch.style.display = show ? 'flex' : 'none';
      }
      localStorage.setItem('showBattery', show ? 'true' : 'false');
    };
  }
  
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           (window.innerWidth <= 768 && window.matchMedia('(pointer: coarse)').matches);
  };
  
  const loadMobileMode = () => {
    const savedMobileMode = localStorage.getItem('mobileMode');
    const isMobile = isMobileDevice();
    
    if (savedMobileMode === null) {
      const autoEnable = isMobile;
      document.body.classList.toggle('mobile-mode', autoEnable);
      localStorage.setItem('mobileMode', autoEnable ? 'true' : 'false');
    } else {
      const enabled = savedMobileMode === 'true';
      document.body.classList.toggle('mobile-mode', enabled);
    }
  };
  
  if (!window.toggleMobileMode) {
    window.toggleMobileMode = (enabled) => {
      document.body.classList.toggle('mobile-mode', enabled);
      localStorage.setItem('mobileMode', enabled ? 'true' : 'false');
    };
  }
  
  const loadTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);
    loadBatteryVisibility();
    loadMobileMode();
  };
  
  const initPanicKey = () => {
    document.addEventListener('keydown', (e) => {
      const panicKey = localStorage.getItem('panicKey') || '~';
      if (e.key === panicKey) {
        const panicUrl = localStorage.getItem('panicUrl') || 'https://www.google.com';
        window.location.href = panicUrl;
      }
    });
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      loadTheme();
      initPanicKey();
    });
  } else {
    loadTheme();
    initPanicKey();
  }