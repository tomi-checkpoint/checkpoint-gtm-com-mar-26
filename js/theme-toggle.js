/* ==========================================================================
   Checkpoint GTM — Theme Toggle (Day / Night / AI)
   Three-state theme with localStorage persistence
   ========================================================================== */

(function () {
  var STORAGE_KEY = 'cgtm_theme';
  var VALID_THEMES = ['light', 'dark', 'ai'];
  var root = document.documentElement;

  function isValid(theme) {
    return VALID_THEMES.indexOf(theme) !== -1;
  }

  function aiContextDetected() {
    try {
      // Hostname-based: ai.checkpointgtm.com or any host starting with "ai."
      if (typeof location !== 'undefined' && location.hostname &&
          location.hostname.indexOf('ai.') === 0) {
        return true;
      }
      // Path-based: /ai/ or /ai (treat as AI sub-experience)
      if (typeof location !== 'undefined' && location.pathname &&
          /^\/ai(\/|$)/.test(location.pathname)) {
        return true;
      }
      // Query-based: ?ai=1
      if (typeof location !== 'undefined' && location.search &&
          /[?&]ai=1\b/.test(location.search)) {
        return true;
      }
    } catch (e) { /* ignore */ }
    return false;
  }

  function getInitialTheme() {
    // Context-based AI mode wins (sub-domain / /ai/ path / ?ai=1)
    if (aiContextDetected()) return 'ai';

    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      // Legacy: respect persisted "ai" choice (someone who explicitly opted in before)
      if (isValid(stored)) return stored;
    } catch (e) { /* localStorage blocked */ }

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  function persist(theme) {
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) { /* ignore */ }
  }

  function updateControls(theme) {
    // Update segmented control active states
    document.querySelectorAll('.theme-switch').forEach(function (group) {
      group.querySelectorAll('[data-theme-value]').forEach(function (btn) {
        var active = btn.getAttribute('data-theme-value') === theme;
        btn.setAttribute('aria-checked', active ? 'true' : 'false');
        btn.classList.toggle('is-active', active);
        btn.tabIndex = active ? 0 : -1;
      });
    });

    // Legacy single-button toggle support (cycles through states)
    document.querySelectorAll('.theme-toggle:not(.theme-switch)').forEach(function (btn) {
      var sun = btn.querySelector('.theme-toggle__sun');
      var moon = btn.querySelector('.theme-toggle__moon');
      if (sun && moon) {
        if (theme === 'dark') {
          sun.style.display = 'block';
          moon.style.display = 'none';
        } else {
          sun.style.display = 'none';
          moon.style.display = 'block';
        }
      }
      btn.setAttribute('aria-label', 'Theme: ' + theme + '. Click to cycle themes.');
    });
  }

  function ensureBanner() {
    if (document.querySelector('.ai-mode-banner')) return;
    var banner = document.createElement('div');
    banner.className = 'ai-mode-banner';
    banner.setAttribute('role', 'status');
    banner.innerHTML = 'AI-Optimized View \u00B7 Machine-readable content \u00B7 ' +
      '<a href="#" class="ai-mode-banner__exit">Switch to visual view</a>';
    document.body.insertBefore(banner, document.body.firstChild);

    banner.querySelector('.ai-mode-banner__exit').addEventListener('click', function (e) {
      e.preventDefault();
      setTheme('light');
    });
  }

  function setAiMeta(on) {
    var existing = document.querySelector('meta[name="ai-content-optimized"]');
    if (on) {
      if (!existing) {
        var meta = document.createElement('meta');
        meta.setAttribute('name', 'ai-content-optimized');
        meta.setAttribute('content', 'true');
        (document.head || document.documentElement).appendChild(meta);
      }
    } else if (existing) {
      existing.parentNode.removeChild(existing);
    }
  }

  function setTheme(theme) {
    if (!isValid(theme)) theme = 'light';
    root.setAttribute('data-theme', theme);
    // Only persist light/dark — AI mode is context-driven (sub-domain / path / query),
    // so we don't want to leak it into localStorage and follow the user back to the main site.
    if (theme !== 'ai') {
      persist(theme);
    }

    if (theme === 'ai' && document.body) {
      ensureBanner();
    }
    setAiMeta(theme === 'ai');
    updateControls(theme);
  }

  // Apply before paint (prevents flash of wrong theme)
  setTheme(getInitialTheme());

  function cycleTheme() {
    // AI mode is opt-in via sub-domain / path / query — never cycled into.
    var current = root.getAttribute('data-theme') || 'light';
    if (current === 'ai') return; // don't toggle out of AI sub-experience
    setTheme(current === 'dark' ? 'light' : 'dark');
  }

  function bindControls() {
    // Segmented control — radiogroup pattern
    document.querySelectorAll('.theme-switch').forEach(function (group) {
      group.querySelectorAll('[data-theme-value]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          setTheme(btn.getAttribute('data-theme-value'));
        });
        btn.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            var next = btn.nextElementSibling || group.querySelector('[data-theme-value]');
            if (next) next.focus();
          } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            var items = group.querySelectorAll('[data-theme-value]');
            var prev = btn.previousElementSibling || items[items.length - 1];
            if (prev) prev.focus();
          } else if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            setTheme(btn.getAttribute('data-theme-value'));
          }
        });
      });
    });

    // Legacy single-button toggle → cycles through all 3
    document.querySelectorAll('.theme-toggle:not(.theme-switch)').forEach(function (btn) {
      btn.addEventListener('click', cycleTheme);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTheme(root.getAttribute('data-theme') || 'light');
      bindControls();
    });
  } else {
    setTheme(root.getAttribute('data-theme') || 'light');
    bindControls();
  }

  // Listen for OS theme changes — only auto-switch if user hasn't chosen
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var handler = function (e) {
      var stored;
      try { stored = localStorage.getItem(STORAGE_KEY); } catch (err) { stored = null; }
      if (!isValid(stored)) setTheme(e.matches ? 'dark' : 'light');
    };
    if (mq.addEventListener) {
      mq.addEventListener('change', handler);
    } else if (mq.addListener) {
      mq.addListener(handler);
    }
  }
})();
