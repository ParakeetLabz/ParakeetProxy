"use strict";

let debugOverlay = null;
let debugPanel = null;
let fpsCounter = 0;
let lastTime = performance.now();
let frameCount = 0;
let fps = 0;
let cpuUsage = 0;
let isDebugMode = false;
let animationFrameId = null;
let isDragging = false;
let isResizing = false;
let dragStartX = 0;
let dragStartY = 0;
let initialX = 0;
let initialY = 0;
let initialWidth = 0;
let initialHeight = 0;
let consoleLogs = [];
const MAX_CONSOLE_LOGS = 100;

const loadDebugPosition = () => {
  const saved = localStorage.getItem('debugPosition');
  if (saved) {
    try {
      const pos = JSON.parse(saved);
      return {
        x: pos.x || 20,
        y: pos.y || 20,
        width: pos.width || 280,
        height: pos.height || 'auto'
      };
    } catch (e) {
      return { x: 20, y: 20, width: 280, height: 'auto' };
    }
  }
  return { x: 20, y: 20, width: 280, height: 'auto' };
};

const saveDebugPosition = () => {
  if (!debugOverlay) return;
  const pos = {
    x: parseInt(debugOverlay.style.left) || 20,
    y: parseInt(debugOverlay.style.top) || 20,
    width: parseInt(debugOverlay.style.width) || 280,
    height: debugOverlay.style.height === 'auto' ? 'auto' : parseInt(debugOverlay.style.height) || 'auto'
  };
  localStorage.setItem('debugPosition', JSON.stringify(pos));
};

const createDebugOverlay = () => {
  if (debugOverlay) return;

  const pos = loadDebugPosition();
  debugOverlay = document.createElement('div');
  debugOverlay.id = 'debug-overlay';
  debugOverlay.style.position = 'fixed';
  debugOverlay.style.left = (pos.x || 20) + 'px';
  debugOverlay.style.top = (pos.y || 20) + 'px';
  debugOverlay.style.width = (pos.width === 'auto' || !pos.width ? 280 : pos.width) + 'px';
  debugOverlay.style.zIndex = '99999';
  debugOverlay.style.display = 'block';
  debugOverlay.style.visibility = 'visible';
  debugOverlay.style.opacity = '1';
  if (pos.height !== 'auto' && pos.height !== undefined && pos.height !== 'auto') {
    debugOverlay.style.height = pos.height + 'px';
  } else {
    debugOverlay.style.height = 'auto';
  }
  
  debugOverlay.innerHTML = `
    <div class="debug-panel">
      <div class="debug-header" id="debug-header">
        <span>DEBUG MODE</span>
        <button class="debug-close" id="debug-close" aria-label="Close debug mode">×</button>
      </div>
      <div class="debug-content" id="debug-content">
        <div class="debug-item">
          <span class="debug-label">FPS:</span>
          <span class="debug-value" id="debug-fps">0</span>
        </div>
        <div class="debug-item">
          <span class="debug-label">CPU:</span>
          <span class="debug-value" id="debug-cpu">0%</span>
        </div>
        <div class="debug-item">
          <span class="debug-label">Memory:</span>
          <span class="debug-value" id="debug-memory">N/A</span>
        </div>
        <div class="debug-item">
          <span class="debug-label">User Agent:</span>
          <span class="debug-value" id="debug-ua">N/A</span>
        </div>
        <div class="debug-item">
          <span class="debug-label">Resolution:</span>
          <span class="debug-value" id="debug-resolution">N/A</span>
        </div>
        <div class="debug-item">
          <span class="debug-label">Connection:</span>
          <span class="debug-value" id="debug-connection">N/A</span>
        </div>
        <div class="debug-item">
          <span class="debug-label">Theme:</span>
          <span class="debug-value" id="debug-theme">N/A</span>
        </div>
        <div class="debug-item">
          <span class="debug-label">Search Engine:</span>
          <span class="debug-value" id="debug-search-engine">N/A</span>
        </div>
        <div class="debug-divider"></div>
        <div class="debug-logs-header">
          <span>Console Logs</span>
          <button class="debug-clear-logs" id="debug-clear-logs" title="Clear logs">Clear</button>
        </div>
        <div class="debug-logs" id="debug-logs"></div>
      </div>
      <div class="debug-resize-handle" id="debug-resize-handle"></div>
    </div>
  `;
  document.body.appendChild(debugOverlay);
  debugPanel = debugOverlay.querySelector('.debug-panel');

  const header = document.getElementById('debug-header');
  const resizeHandle = document.getElementById('debug-resize-handle');
  const closeBtn = document.getElementById('debug-close');
  const clearLogsBtn = document.getElementById('debug-clear-logs');

  if (clearLogsBtn) {
    clearLogsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      consoleLogs = [];
      updateConsoleLogs();
    });
  }

  header.addEventListener('mousedown', (e) => {
    if (e.target === closeBtn) return;
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    initialX = parseInt(debugOverlay.style.left) || 20;
    initialY = parseInt(debugOverlay.style.top) || 20;
    debugOverlay.style.cursor = 'grabbing';
    e.preventDefault();
  });

  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    initialWidth = parseInt(debugOverlay.style.width) || 280;
    initialHeight = debugOverlay.style.height === 'auto' ? debugOverlay.offsetHeight : parseInt(debugOverlay.style.height);
    debugOverlay.style.cursor = 'nwse-resize';
    e.preventDefault();
    e.stopPropagation();
  });

  closeBtn.addEventListener('click', () => {
    const toggle = document.getElementById('debug-mode');
    if (toggle) {
      toggle.checked = false;
    }
    toggleDebugMode(false);
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStartX;
      const deltaY = e.clientY - dragStartY;
      let newX = initialX + deltaX;
      let newY = initialY + deltaY;
      
      newX = Math.max(0, Math.min(newX, window.innerWidth - debugOverlay.offsetWidth));
      newY = Math.max(0, Math.min(newY, window.innerHeight - debugOverlay.offsetHeight));
      
      debugOverlay.style.left = newX + 'px';
      debugOverlay.style.top = newY + 'px';
      saveDebugPosition();
    } else if (isResizing) {
      const deltaX = e.clientX - dragStartX;
      const deltaY = e.clientY - dragStartY;
      let newWidth = initialWidth + deltaX;
      let newHeight = initialHeight + deltaY;
      
      newWidth = Math.max(200, Math.min(newWidth, window.innerWidth - parseInt(debugOverlay.style.left)));
      newHeight = Math.max(150, Math.min(newHeight, window.innerHeight - parseInt(debugOverlay.style.top)));
      
      debugOverlay.style.width = newWidth + 'px';
      debugOverlay.style.height = newHeight + 'px';
      saveDebugPosition();
    }
  });

  document.addEventListener('mouseup', () => {
    if (isDragging || isResizing) {
      isDragging = false;
      isResizing = false;
      debugOverlay.style.cursor = '';
      saveDebugPosition();
    }
  });
};

const removeDebugOverlay = () => {
  if (debugOverlay) {
    isDragging = false;
    isResizing = false;
    debugOverlay.remove();
    debugOverlay = null;
    debugPanel = null;
  }
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
};

const updateFPS = () => {
  frameCount++;
  const currentTime = performance.now();
  const delta = currentTime - lastTime;

  if (delta >= 1000) {
    fps = Math.round((frameCount * 1000) / delta);
    frameCount = 0;
    lastTime = currentTime;

    const fpsElement = document.getElementById('debug-fps');
    if (fpsElement) {
      fpsElement.textContent = fps;
      fpsElement.className = 'debug-value ' + (fps < 30 ? 'debug-warning' : fps < 60 ? 'debug-ok' : 'debug-good');
    }
  }
};

const updateCPUUsage = () => {
  if ('performance' in window && 'mark' in performance && 'measure' in performance) {
    const startMark = 'cpu-start-' + Date.now();
    const endMark = 'cpu-end-' + Date.now();
    
    performance.mark(startMark);
    
    setTimeout(() => {
      performance.mark(endMark);
      performance.measure('cpu-measure', startMark, endMark);
      
      const measure = performance.getEntriesByName('cpu-measure')[0];
      if (measure) {
        const duration = measure.duration;
        cpuUsage = Math.min(100, Math.round((duration / 16.67) * 100));
        
        const cpuElement = document.getElementById('debug-cpu');
        if (cpuElement) {
          cpuElement.textContent = cpuUsage + '%';
          cpuElement.className = 'debug-value ' + (cpuUsage > 80 ? 'debug-warning' : cpuUsage > 50 ? 'debug-ok' : 'debug-good');
        }
        
        performance.clearMarks(startMark);
        performance.clearMarks(endMark);
        performance.clearMeasures('cpu-measure');
      }
    }, 100);
  }
};

const updateMemory = () => {
  if ('memory' in performance) {
    const memory = performance.memory;
    const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
    const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
    const limitMB = Math.round(memory.jsHeapSizeLimit / 1048576);
    
    const memoryElement = document.getElementById('debug-memory');
    if (memoryElement) {
      memoryElement.textContent = `${usedMB}MB / ${totalMB}MB (${limitMB}MB limit)`;
    }
  } else {
    const memoryElement = document.getElementById('debug-memory');
    if (memoryElement) {
      memoryElement.textContent = 'Not available';
    }
  }
};

const updateExtraData = () => {
  const uaElement = document.getElementById('debug-ua');
  if (uaElement) {
    uaElement.textContent = navigator.userAgent.substring(0, 50) + '...';
  }

  const resolutionElement = document.getElementById('debug-resolution');
  if (resolutionElement) {
    resolutionElement.textContent = `${window.innerWidth}x${window.innerHeight}`;
  }

  const connectionElement = document.getElementById('debug-connection');
  if (connectionElement && 'connection' in navigator) {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) {
      connectionElement.textContent = `${conn.effectiveType || 'unknown'} (${conn.downlink || '?'}Mbps)`;
    } else {
      connectionElement.textContent = 'Not available';
    }
  } else if (connectionElement) {
    connectionElement.textContent = 'Not available';
  }

  const themeElement = document.getElementById('debug-theme');
  if (themeElement) {
    const theme = localStorage.getItem('theme') || 'dark';
    themeElement.textContent = theme;
  }

  const searchEngineElement = document.getElementById('debug-search-engine');
  if (searchEngineElement) {
    const searchEngine = localStorage.getItem('searchEngine') || 'https://duckduckgo.com/?q=%s';
    const engineName = searchEngine.includes('duckduckgo') ? 'DuckDuckGo' :
                      searchEngine.includes('google') ? 'Google' :
                      searchEngine.includes('bing') ? 'Bing' :
                      searchEngine.includes('yahoo') ? 'Yahoo' :
                      searchEngine.includes('ecosia') ? 'Ecosia' :
                      searchEngine.includes('brave') ? 'Brave' :
                      searchEngine.includes('startpage') ? 'Startpage' : 'Custom';
    searchEngineElement.textContent = engineName;
  }
};

const debugLoop = () => {
  if (!isDebugMode || !debugOverlay) return;

  updateFPS();
  updateMemory();
  updateExtraData();
  
  if (frameCount % 60 === 0) {
    updateCPUUsage();
  }

  if (frameCount % 10 === 0) {
    updateConsoleLogs();
  }

  animationFrameId = requestAnimationFrame(debugLoop);
};

const captureConsoleLogs = () => {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalInfo = console.info;
  const originalDebug = console.debug;

  const addLog = (type, args) => {
    const timestamp = new Date().toLocaleTimeString();
    const message = Array.from(args).map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');

    consoleLogs.push({ type, message, timestamp });
    if (consoleLogs.length > MAX_CONSOLE_LOGS) {
      consoleLogs.shift();
    }
    updateConsoleLogs();
  };

  console.log = function(...args) {
    originalLog.apply(console, args);
    addLog('log', args);
  };

  console.error = function(...args) {
    originalError.apply(console, args);
    addLog('error', args);
  };

  console.warn = function(...args) {
    originalWarn.apply(console, args);
    addLog('warn', args);
  };

  console.info = function(...args) {
    originalInfo.apply(console, args);
    addLog('info', args);
  };

  console.debug = function(...args) {
    originalDebug.apply(console, args);
    addLog('debug', args);
  };

  window.addEventListener('error', (e) => {
    addLog('error', [`${e.message} at ${e.filename}:${e.lineno}:${e.colno}`]);
  });

  window.addEventListener('unhandledrejection', (e) => {
    addLog('error', [`Unhandled Promise Rejection: ${e.reason}`]);
  });
};

const updateConsoleLogs = () => {
  const logsContainer = document.getElementById('debug-logs');
  if (!logsContainer) return;

  logsContainer.innerHTML = '';
  const recentLogs = consoleLogs.slice(-20).reverse();

  recentLogs.forEach(log => {
    const logElement = document.createElement('div');
    logElement.className = `debug-log-item debug-log-${log.type}`;
    logElement.innerHTML = `
      <span class="debug-log-time">[${log.timestamp}]</span>
      <span class="debug-log-type">${log.type.toUpperCase()}</span>
      <span class="debug-log-message">${escapeHtml(log.message)}</span>
    `;
    logsContainer.appendChild(logElement);
  });

  if (consoleLogs.length > 20) {
    const moreElement = document.createElement('div');
    moreElement.className = 'debug-log-more';
    moreElement.textContent = `... ${consoleLogs.length - 20} more logs`;
    logsContainer.insertBefore(moreElement, logsContainer.firstChild);
  }
};

const escapeHtml = window.escapeHtml;

const startDebugMode = () => {
  if (isDebugMode) return;
  isDebugMode = true;
  captureConsoleLogs();
  createDebugOverlay();
  if (!debugOverlay) {
    console.error('Failed to create debug overlay');
    return;
  }
  debugOverlay.style.display = 'block';
  debugOverlay.style.visibility = 'visible';
  lastTime = performance.now();
  frameCount = 0;
  updateConsoleLogs();
  debugLoop();
};

const stopDebugMode = () => {
  if (!isDebugMode) return;
  isDebugMode = false;
  removeDebugOverlay();
};

const toggleDebugMode = (enabled) => {
  if (enabled) {
    startDebugMode();
  } else {
    stopDebugMode();
  }
};

window.toggleDebugMode = toggleDebugMode;

let debugModeToggle = null;

const initDebugMode = () => {
  debugModeToggle = document.getElementById('debug-mode');
  const debugModeEnabled = localStorage.getItem('debugMode') === 'true';
  
  if (debugModeToggle) {
    debugModeToggle.checked = debugModeEnabled;
  }
  
  if (debugModeEnabled) {
    setTimeout(() => {
      startDebugMode();
    }, 100);
  }
};

const checkAndInit = () => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDebugMode);
  } else {
    initDebugMode();
  }
};

checkAndInit();

window.addEventListener('resize', () => {
  if (isDebugMode && debugOverlay) {
    updateExtraData();
    const pos = loadDebugPosition();
    const maxX = window.innerWidth - (parseInt(debugOverlay.style.width) || 280);
    const maxY = window.innerHeight - (parseInt(debugOverlay.style.height) || debugOverlay.offsetHeight);
    let currentX = parseInt(debugOverlay.style.left) || pos.x;
    let currentY = parseInt(debugOverlay.style.top) || pos.y;
    
    if (currentX > maxX) {
      debugOverlay.style.left = Math.max(0, maxX) + 'px';
    }
    if (currentY > maxY) {
      debugOverlay.style.top = Math.max(0, maxY) + 'px';
    }
    saveDebugPosition();
  }
});