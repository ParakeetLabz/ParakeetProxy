const detectMobile = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i;
  const isMobileUA = mobileRegex.test(userAgent);
  
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  const isSmallScreen = window.innerWidth <= 768;
  
  const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  
  const isMobile = isMobileUA || (isSmallScreen && (isTouchDevice || hasCoarsePointer));
  
  const deviceInfo = {
    isMobile,
    isMobileUA,
    isTouchDevice,
    isSmallScreen,
    hasCoarsePointer,
    userAgent,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    platform: navigator.platform || 'unknown',
    vendor: navigator.vendor || 'unknown'
  };
  
  if (isMobileUA) {
    if (/android/i.test(userAgent)) {
      deviceInfo.os = 'Android';
    } else if (/iphone|ipad|ipod/i.test(userAgent)) {
      deviceInfo.os = /ipad/i.test(userAgent) ? 'iOS (iPad)' : 'iOS (iPhone)';
    } else if (/windows phone/i.test(userAgent)) {
      deviceInfo.os = 'Windows Phone';
    } else {
      deviceInfo.os = 'Mobile';
    }
  } else {
    deviceInfo.os = 'Desktop';
  }
  
  return deviceInfo;
};

const initMobileDetection = () => {
  const deviceInfo = detectMobile();
  
  if (deviceInfo.isMobile) {
    document.body.classList.add('is-mobile');
    document.documentElement.setAttribute('data-device', 'mobile');
  } else {
    document.body.classList.add('is-desktop');
    document.documentElement.setAttribute('data-device', 'desktop');
  }
  
  if (deviceInfo.isTouchDevice) {
    document.body.classList.add('is-touch');
  }
  
  if (deviceInfo.isSmallScreen) {
    document.body.classList.add('is-small-screen');
  }
  
  return deviceInfo;
};

if (!window.detectMobile) {
  window.detectMobile = detectMobile;
}

if (!window.initMobileDetection) {
  window.initMobileDetection = initMobileDetection;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileDetection);
} else {
  initMobileDetection();
}
