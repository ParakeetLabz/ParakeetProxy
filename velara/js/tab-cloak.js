const tabCloaks = {
    none: { title: 'LanStupid', icon: '/assets/images/lanstupid-logo.jpg' },
    google: { title: 'Google', icon: '/assets/images/tabs/google.ico' },
    youtube: { title: 'YouTube', icon: '/assets/images/tabs/youtube.ico' },
    canvas: { title: 'Canvas', icon: '/assets/images/tabs/canvas.ico' },
    gmail: { title: 'Gmail', icon: '/assets/images/tabs/gmail.ico' },
    drive: { title: 'Google Drive', icon: '/assets/images/tabs/googledrive.png' },
    googledocs: { title: 'Google Docs', icon: '/assets/images/tabs/googledocs.ico' },
    clever: { title: 'Clever', icon: '/assets/images/tabs/clever.webp' }
  };
  
  const applyTabCloakLocal = (cloakName) => {
    if (!cloakName) {
      cloakName = localStorage.getItem('tabCloak') || 'none';
    }
    const cloak = tabCloaks[cloakName] || tabCloaks.none;
    
    if (!cloak) {
      console.error('Cloak not found:', cloakName);
      return;
    }
    
    document.title = cloak.title;
    
    const existingFavicons = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
    existingFavicons.forEach(link => link.remove());
    
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.href = cloak.icon + '?t=' + Date.now();
    
    if (cloak.icon.endsWith('.ico')) {
      favicon.type = 'image/x-icon';
    } else if (cloak.icon.endsWith('.png')) {
      favicon.type = 'image/png';
    } else if (cloak.icon.endsWith('.webp')) {
      favicon.type = 'image/webp';
    } else {
      favicon.type = 'image/svg+xml';
    }
    
    document.head.appendChild(favicon);
    
    const shortcut = document.createElement('link');
    shortcut.rel = 'shortcut icon';
    shortcut.href = cloak.icon;
    document.head.appendChild(shortcut);
    
    const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (appleTouchIcon) {
      appleTouchIcon.href = cloak.icon;
    }
  };
  
  if (!window.applyTabCloak) {
    window.applyTabCloak = applyTabCloakLocal;
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const savedCloak = localStorage.getItem('tabCloak') || 'none';
      if (typeof window.applyTabCloak === 'function') {
        window.applyTabCloak(savedCloak);
      } else {
        applyTabCloakLocal(savedCloak);
      }
    });
  } else {
    const savedCloak = localStorage.getItem('tabCloak') || 'none';
    if (typeof window.applyTabCloak === 'function') {
      window.applyTabCloak(savedCloak);
    } else {
      applyTabCloakLocal(savedCloak);
    }
  }
  
  window.addEventListener('storage', (e) => {
    if (e.key === 'tabCloak') {
      const savedCloak = localStorage.getItem('tabCloak') || 'none';
      if (typeof window.applyTabCloak === 'function') {
        window.applyTabCloak(savedCloak);
      } else {
        applyTabCloakLocal(savedCloak);
      }
    }
  });