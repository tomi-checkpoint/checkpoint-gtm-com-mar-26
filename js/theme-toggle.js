/* ==========================================================================
   Checkpoint GTM — Theme Toggle
   Light/dark mode with localStorage persistence
   ========================================================================== */

(function() {
  const STORAGE_KEY = 'cgtm_theme';
  const root = document.documentElement;

  // Determine initial theme
  function getInitialTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;

    // Respect OS preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);

    // Update toggle button icons
    document.querySelectorAll('.theme-toggle').forEach(function(btn) {
      const sunIcon = btn.querySelector('.theme-toggle__sun');
      const moonIcon = btn.querySelector('.theme-toggle__moon');
      if (sunIcon && moonIcon) {
        if (theme === 'dark') {
          sunIcon.style.display = 'block';
          moonIcon.style.display = 'none';
        } else {
          sunIcon.style.display = 'none';
          moonIcon.style.display = 'block';
        }
      }
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    });
  }

  // Apply theme immediately (before paint)
  setTheme(getInitialTheme());

  // Bind toggle buttons after DOM ready
  document.addEventListener('DOMContentLoaded', function() {
    // Re-apply to ensure icons are correct after DOM loads
    setTheme(root.getAttribute('data-theme') || 'light');

    document.querySelectorAll('.theme-toggle').forEach(function(btn) {
      btn.addEventListener('click', function() {
        const current = root.getAttribute('data-theme') || 'light';
        setTheme(current === 'dark' ? 'light' : 'dark');
      });
    });
  });

  // Listen for OS theme changes
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
      // Only auto-switch if user hasn't manually chosen
      if (!localStorage.getItem(STORAGE_KEY)) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
})();
