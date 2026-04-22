/**
 * Checkpoint GTM — Cookie Consent Banner
 * GDPR-compliant banner with conditional HubSpot tracking pixel load.
 *
 * Behaviour:
 *   - First visit: banner slides in (bottom-right on desktop, full-width on mobile)
 *   - "Accept all": stores consent=accepted, injects HubSpot pixel
 *   - "Decline":    stores consent=declined, does NOT inject HubSpot pixel
 *   - "Preferences": simple toggle view (same two choices, for now)
 *   - Consent persists in localStorage for 12 months
 *   - Re-opens via any element with data-cookie-preferences or #cookie-preferences-link
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'checkpoint_cookie_consent';
  var STORAGE_EXPIRY_KEY = 'checkpoint_cookie_consent_expiry';
  var TWELVE_MONTHS_MS = 365 * 24 * 60 * 60 * 1000;
  var HUBSPOT_SCRIPT_ID = 'hs-script-loader';
  var HUBSPOT_SRC = '//js-eu1.hs-scripts.com/26616591.js';

  function now() { return Date.now(); }

  function getStoredConsent() {
    try {
      var value = localStorage.getItem(STORAGE_KEY);
      var expiry = parseInt(localStorage.getItem(STORAGE_EXPIRY_KEY), 10);
      if (!value) return null;
      if (expiry && now() > expiry) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_EXPIRY_KEY);
        return null;
      }
      return value;
    } catch (e) {
      return null;
    }
  }

  function setStoredConsent(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
      localStorage.setItem(STORAGE_EXPIRY_KEY, String(now() + TWELVE_MONTHS_MS));
    } catch (e) { /* noop */ }
  }

  function injectHubSpotPixel() {
    if (document.getElementById(HUBSPOT_SCRIPT_ID)) return;
    var s = document.createElement('script');
    s.type = 'text/javascript';
    s.id = HUBSPOT_SCRIPT_ID;
    s.async = true;
    s.defer = true;
    s.src = HUBSPOT_SRC;
    document.head.appendChild(s);
  }

  function injectStyles() {
    if (document.getElementById('cookie-consent-styles')) return;
    var css = [
      '#cookie-banner .cc-card{',
      '  position:fixed;z-index:9998;',
      '  right:1.5rem;bottom:1.5rem;',
      '  max-width:400px;width:calc(100% - 3rem);',
      '  background:var(--bg-card,#fff);',
      '  color:var(--text-primary,#1A1A1A);',
      '  border:1px solid var(--border,#E5E3DE);',
      '  border-radius:var(--radius-lg,16px);',
      '  box-shadow:var(--shadow-lg,0 8px 30px rgba(0,0,0,0.10));',
      '  padding:1.5rem;',
      '  font-family:var(--font-body,"Inter",system-ui,sans-serif);',
      '  font-size:0.9375rem;line-height:1.5;',
      '  transform:translateY(1.5rem);opacity:0;pointer-events:none;',
      '  transition:transform 240ms ease,opacity 240ms ease;',
      '}',
      '#cookie-banner.is-open .cc-card{transform:translateY(0);opacity:1;pointer-events:auto;}',
      '#cookie-banner .cc-title{',
      '  font-weight:600;font-size:1rem;margin:0 0 .5rem 0;',
      '  color:var(--text-primary,#1A1A1A);',
      '}',
      '#cookie-banner .cc-body{',
      '  margin:0 0 1rem 0;',
      '  color:var(--text-secondary,#6B6B6B);',
      '}',
      '#cookie-banner .cc-body a{color:var(--accent,#2D6A4F);text-decoration:underline;}',
      '#cookie-banner .cc-actions{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;}',
      '#cookie-banner .cc-btn{',
      '  appearance:none;border:none;cursor:pointer;',
      '  font-family:inherit;font-size:.875rem;font-weight:500;',
      '  padding:.625rem 1rem;border-radius:var(--radius-sm,6px);',
      '  transition:background 160ms ease,color 160ms ease,border-color 160ms ease;',
      '}',
      '#cookie-banner .cc-btn--primary{',
      '  background:var(--accent,#2D6A4F);color:#fff;',
      '}',
      '#cookie-banner .cc-btn--primary:hover{background:var(--accent-light,#40916C);}',
      '#cookie-banner .cc-btn--ghost{',
      '  background:transparent;color:var(--text-primary,#1A1A1A);',
      '  border:1px solid var(--border,#E5E3DE);',
      '}',
      '#cookie-banner .cc-btn--ghost:hover{background:var(--bg-secondary,#F5F4F0);border-color:var(--text-secondary,#6B6B6B);}',
      '#cookie-banner .cc-btn--link{',
      '  background:transparent;color:var(--text-secondary,#6B6B6B);',
      '  text-decoration:underline;padding:.625rem .25rem;',
      '}',
      '#cookie-banner .cc-btn--link:hover{color:var(--text-primary,#1A1A1A);}',
      '#cookie-banner .cc-prefs{display:none;margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border,#E5E3DE);}',
      '#cookie-banner.is-prefs .cc-prefs{display:block;}',
      '#cookie-banner .cc-pref-row{display:flex;justify-content:space-between;align-items:flex-start;gap:.75rem;margin-bottom:.75rem;}',
      '#cookie-banner .cc-pref-row:last-child{margin-bottom:0;}',
      '#cookie-banner .cc-pref-label{font-weight:500;font-size:.875rem;color:var(--text-primary,#1A1A1A);margin:0;}',
      '#cookie-banner .cc-pref-desc{font-size:.8125rem;color:var(--text-secondary,#6B6B6B);margin:.125rem 0 0 0;}',
      '#cookie-banner .cc-pref-tag{',
      '  font-size:.75rem;font-weight:500;padding:.125rem .5rem;border-radius:999px;',
      '  background:var(--accent-subtle,#D8F3DC);color:var(--accent,#2D6A4F);flex-shrink:0;',
      '}',
      '#cookie-banner .cc-toggle{position:relative;flex-shrink:0;width:36px;height:20px;display:inline-block;}',
      '#cookie-banner .cc-toggle input{opacity:0;width:0;height:0;}',
      '#cookie-banner .cc-toggle .cc-slider{',
      '  position:absolute;inset:0;background:#ccc;border-radius:999px;',
      '  transition:background 160ms ease;cursor:pointer;',
      '}',
      '#cookie-banner .cc-toggle .cc-slider:before{',
      '  content:"";position:absolute;height:14px;width:14px;left:3px;top:3px;',
      '  background:#fff;border-radius:50%;transition:transform 160ms ease;',
      '}',
      '#cookie-banner .cc-toggle input:checked + .cc-slider{background:var(--accent,#2D6A4F);}',
      '#cookie-banner .cc-toggle input:checked + .cc-slider:before{transform:translateX(16px);}',
      '@media (max-width:640px){',
      '  #cookie-banner .cc-card{',
      '    right:0;bottom:0;left:0;',
      '    width:100%;max-width:none;',
      '    border-radius:var(--radius-lg,16px) var(--radius-lg,16px) 0 0;',
      '    border-bottom:none;',
      '  }',
      '}',
      '@media (prefers-reduced-motion:reduce){',
      '  #cookie-banner .cc-card{transition:none;}',
      '}'
    ].join('\n');
    var style = document.createElement('style');
    style.id = 'cookie-consent-styles';
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }

  function renderBanner(container) {
    container.innerHTML = [
      '<div class="cc-card" role="dialog" aria-modal="false" aria-labelledby="cc-title" aria-describedby="cc-body">',
      '  <h2 id="cc-title" class="cc-title">Cookies &amp; privacy</h2>',
      '  <p id="cc-body" class="cc-body">We use cookies to understand how visitors use this site and to improve the experience. Analytics cookies only load if you accept. See our <a href="/legal-privacy-policy.html">privacy policy</a>.</p>',
      '  <div class="cc-actions">',
      '    <button type="button" class="cc-btn cc-btn--primary" data-cc-action="accept">Accept all</button>',
      '    <button type="button" class="cc-btn cc-btn--ghost" data-cc-action="decline">Decline</button>',
      '    <button type="button" class="cc-btn cc-btn--link" data-cc-action="toggle-prefs" aria-expanded="false">Preferences</button>',
      '  </div>',
      '  <div class="cc-prefs" aria-hidden="true">',
      '    <div class="cc-pref-row">',
      '      <div>',
      '        <p class="cc-pref-label">Essential</p>',
      '        <p class="cc-pref-desc">Required for the site to function. Always on.</p>',
      '      </div>',
      '      <span class="cc-pref-tag">Always on</span>',
      '    </div>',
      '    <div class="cc-pref-row">',
      '      <div>',
      '        <p class="cc-pref-label">Analytics (HubSpot)</p>',
      '        <p class="cc-pref-desc">Helps us understand which pages are useful. Optional.</p>',
      '      </div>',
      '      <label class="cc-toggle"><input type="checkbox" data-cc-toggle="analytics" checked><span class="cc-slider"></span></label>',
      '    </div>',
      '    <div class="cc-actions" style="margin-top:1rem;">',
      '      <button type="button" class="cc-btn cc-btn--primary" data-cc-action="save-prefs">Save preferences</button>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('\n');
  }

  function showBanner(container) {
    container.classList.add('is-open');
  }

  function hideBanner(container) {
    container.classList.remove('is-open');
    container.classList.remove('is-prefs');
  }

  function togglePrefs(container, btn) {
    var willOpen = !container.classList.contains('is-prefs');
    container.classList.toggle('is-prefs');
    if (btn) btn.setAttribute('aria-expanded', String(willOpen));
    var prefs = container.querySelector('.cc-prefs');
    if (prefs) prefs.setAttribute('aria-hidden', String(!willOpen));
  }

  function bindActions(container) {
    container.addEventListener('click', function (e) {
      var target = e.target.closest('[data-cc-action]');
      if (!target) return;
      var action = target.getAttribute('data-cc-action');
      if (action === 'accept') {
        setStoredConsent('accepted');
        injectHubSpotPixel();
        hideBanner(container);
      } else if (action === 'decline') {
        setStoredConsent('declined');
        hideBanner(container);
      } else if (action === 'toggle-prefs') {
        togglePrefs(container, target);
      } else if (action === 'save-prefs') {
        var toggle = container.querySelector('[data-cc-toggle="analytics"]');
        var accepted = toggle && toggle.checked;
        if (accepted) {
          setStoredConsent('accepted');
          injectHubSpotPixel();
        } else {
          setStoredConsent('declined');
        }
        hideBanner(container);
      }
    });
  }

  function bindReopenLinks(container) {
    document.addEventListener('click', function (e) {
      var trigger = e.target.closest('[data-cookie-preferences], #cookie-preferences-link');
      if (!trigger) return;
      e.preventDefault();
      showBanner(container);
    });
  }

  function init() {
    var container = document.getElementById('cookie-banner');
    if (!container) return;

    injectStyles();
    renderBanner(container);
    bindActions(container);
    bindReopenLinks(container);

    var consent = getStoredConsent();
    if (consent === 'accepted') {
      injectHubSpotPixel();
    } else if (consent === null) {
      // First visit — show banner shortly after paint
      setTimeout(function () { showBanner(container); }, 600);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
