/* GymX v0.4 native updater panel, injected into the existing Settings modal. */
(() => {
  'use strict';
  const hasNative = typeof window.GymXNative?.checkForUpdates === 'function';
  let nextVersion = '';
  let statusText = 'Tap Check for updates to see the newest GitHub version.';
  function message(text) {
    statusText = text;
    const el = document.getElementById('gymx-update-status');
    if (el) el.textContent = text;
  }
  function available(version) {
    nextVersion = version || '';
    const b = document.getElementById('gymx-update-install');
    if(b) { b.hidden = !nextVersion; b.textContent = 'Update GymX to v' + nextVersion; }
  }
  window.gymxUpdateEvent = e => {
    if(!e || typeof e !== 'object') return;
    message(String(e.message || ''));
    if(e.type === 'available') available(e.version);
    else if(e.type === 'error' || e.type === 'current') available('');
  };
  function attach() {
    const modal = document.querySelector('#modal-layer .modal');
    if(!modal || !modal.textContent.includes('Settings & backups') || modal.querySelector('#gymx-updater-panel')) return;
    const panel = document.createElement('section');
    panel.id = 'gymx-updater-panel';
    panel.className = 'card';
    panel.style.margin = '16px 0';
    panel.innerHTML = '<div class="eyebrow">APP UPDATES · GITHUB</div><h3 style="margin:8px 0">GymX updates</h3>' +
      '<p class="p">Installed version: <strong id="gymx-current-version"></strong>. New features install over the existing app while keeping its data.</p>' +
      '<button type="button" class="btn outline full" id="gymx-update-check">Check for updates</button>' +
      '<p class="small-note" role="status" aria-live="polite" id="gymx-update-status"></p>' +
      '<button type="button" class="btn primary full" id="gymx-update-install" hidden>Update GymX</button>' +
      '<button type="button" class="btn outline full" id="gymx-update-browser">Open GitHub Releases in browser</button>' +
      '<p class="small-note">Requires an official signed GymX GitHub Release. Android will request installation approval. Back up before the first signing-key migration.</p>';
    panel.querySelector('#gymx-current-version').textContent =
      hasNative ? String(window.GymXNative.getAppVersion?.() || 'installed') : 'browser preview';
    panel.querySelector('#gymx-update-status').textContent = hasNative ? statusText : 'In-app APK updates require the Android installation.';
    panel.querySelector('#gymx-update-check').disabled = !hasNative;
    panel.querySelector('#gymx-update-browser').disabled = !hasNative || typeof window.GymXNative?.openUpdateReleasePage !== 'function';
    const install=panel.querySelector('#gymx-update-install');
    install.hidden=!nextVersion;
    if(nextVersion) install.textContent='Update GymX to v'+nextVersion;
    modal.appendChild(panel);
  }
  document.addEventListener('click',e=>{
    const button=e.target.closest?.('#gymx-update-check,#gymx-update-install,#gymx-update-browser');
    if(!button) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if(!hasNative) return;
    if(button.id==='gymx-update-check') {
      available('');
      message('Checking GitHub for a new version…');
      window.GymXNative.checkForUpdates();
    } else if (button.id==='gymx-update-browser') {
      window.GymXNative.openUpdateReleasePage();
    } else {
      message('Preparing your Android update…');
      window.GymXNative.installUpdate();
    }
  },true);
  new MutationObserver(attach).observe(document.documentElement,{subtree:true,childList:true});
  attach();
})();