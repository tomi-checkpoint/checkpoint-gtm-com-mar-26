/* ==========================================================================
   Checkpoint GTM — Navigation
   Sticky nav, scroll-based styling, mobile menu
   ========================================================================== */

(function() {
  const nav = document.querySelector('.nav');
  const mobileToggle = document.querySelector('.nav__mobile-toggle');
  const mobileMenu = document.querySelector('.nav__mobile-menu');
  const navLinks = document.querySelectorAll('.nav__link, .nav__mobile-link');

  if (!nav) return;

  // --- Scroll-based nav styling ---
  let lastScroll = 0;
  let ticking = false;

  function updateNav() {
    const scrollY = window.scrollY;

    if (scrollY > 40) {
      nav.classList.add('nav--scrolled');
    } else {
      nav.classList.remove('nav--scrolled');
    }

    lastScroll = scrollY;
    ticking = false;
  }

  window.addEventListener('scroll', function() {
    if (!ticking) {
      requestAnimationFrame(updateNav);
      ticking = true;
    }
  }, { passive: true });

  // --- Mobile menu toggle ---
  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', function() {
      const isOpen = mobileMenu.classList.contains('is-open');

      if (isOpen) {
        mobileMenu.classList.remove('is-open');
        mobileToggle.classList.remove('is-active');
        mobileToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      } else {
        mobileMenu.classList.add('is-open');
        mobileToggle.classList.add('is-active');
        mobileToggle.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
      }
    });

    // Close mobile menu on link click
    navLinks.forEach(function(link) {
      link.addEventListener('click', function() {
        mobileMenu.classList.remove('is-open');
        mobileToggle.classList.remove('is-active');
        mobileToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // Initial check
  updateNav();
})();
