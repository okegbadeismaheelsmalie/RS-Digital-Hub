/**
 * RS Digital Hub — PWA Controller & In-App Install Experience (js/pwa.js)
 * Manages service worker lifecycle, offline indicators, and native install prompt.
 */

(function () {
  'use strict';

  let deferredPrompt = null;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  // ---------------------------------------------------------------------------
  // 1. Service Worker Registration
  // ---------------------------------------------------------------------------
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered with scope:', reg.scope);
          
          // Check for updates periodically
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[PWA] New version available. Refresh to update.');
                }
              };
            }
          };
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration skipped:', err);
        });
    });
  }

  // ---------------------------------------------------------------------------
  // 2. Online / Offline Status Indicator
  // ---------------------------------------------------------------------------
  function createOfflineBanner() {
    let banner = document.getElementById('pwaOfflineBanner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'pwaOfflineBanner';
      banner.className = 'pwa-offline-banner';
      banner.innerHTML = `
        <span>📡 You are currently offline. Live data sync will resume when you reconnect.</span>
      `;
      document.body.appendChild(banner);
    }
    return banner;
  }

  function updateNetworkStatus() {
    const banner = createOfflineBanner();
    if (!navigator.onLine) {
      banner.classList.add('visible');
    } else {
      banner.classList.remove('visible');
    }
  }

  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);

  // ---------------------------------------------------------------------------
  // 3. Install Prompt Handling
  // ---------------------------------------------------------------------------
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent mini-infobar on mobile
    e.preventDefault();
    deferredPrompt = e;
    showInstallButtons();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    hideInstallButtons();
    console.log('[PWA] App successfully installed!');
  });

  function showInstallButtons() {
    if (isStandalone) return;
    const buttons = document.querySelectorAll('.pwa-install-btn, #pwaInstallBtn, #navInstallBtn');
    buttons.forEach((btn) => {
      btn.style.display = 'inline-flex';
      btn.removeAttribute('disabled');
    });
  }

  function hideInstallButtons() {
    const buttons = document.querySelectorAll('.pwa-install-btn, #pwaInstallBtn, #navInstallBtn');
    buttons.forEach((btn) => {
      btn.style.display = 'none';
    });
  }

  async function triggerInstallPrompt() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('[PWA] User choice:', outcome);
      deferredPrompt = null;
      hideInstallButtons();
    } else if (isIOS) {
      showIOSInstallModal();
    } else {
      alert('To install RS Digital Hub, open your browser menu (⋮) and choose "Install App" or "Add to Home screen".');
    }
  }

  function showIOSInstallModal() {
    let modal = document.getElementById('pwaIosModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'pwaIosModal';
      modal.className = 'pwa-ios-modal';
      modal.innerHTML = `
        <div class="pwa-ios-modal-content">
          <div class="pwa-ios-modal-header">
            <h3>Install RS Digital Hub 👑</h3>
            <button class="pwa-ios-close-btn" id="pwaIosCloseBtn">&times;</button>
          </div>
          <p>Install this app on your iPhone or iPad for the best full-screen experience:</p>
          <ol>
            <li>Tap the <strong>Share</strong> button <span style="font-size: 1.2rem;">⎋</span> at the bottom of Safari.</li>
            <li>Scroll down and select <strong>Add to Home Screen</strong> <span style="font-size: 1.2rem;">➕</span>.</li>
            <li>Tap <strong>Add</strong> in the top-right corner.</li>
          </ol>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector('#pwaIosCloseBtn').addEventListener('click', () => {
        modal.classList.remove('active');
      });
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
      });
    }
    modal.classList.add('active');
  }

  // Initialize UI hooks when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    updateNetworkStatus();

    // If on iOS and not standalone, enable iOS install trigger
    if (isIOS && !isStandalone) {
      showInstallButtons();
    }

    // Attach click handlers to any install triggers in page
    document.querySelectorAll('.pwa-install-btn, #pwaInstallBtn, #navInstallBtn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        triggerInstallPrompt();
      });
    });
  });

  // Expose to window
  window.RSPwa = {
    install: triggerInstallPrompt,
    isStandalone: isStandalone,
    isOnline: () => navigator.onLine
  };
})();
