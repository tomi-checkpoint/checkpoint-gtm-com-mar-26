/* ==========================================================================
   Checkpoint GTM — Hero Scroll Animation
   Maze-inspired: content visible on load with staggered entrance,
   scroll drives parallax movement on cards, exit fade at bottom.
   ========================================================================== */

(function() {
  var hero = document.querySelector('.hero');
  if (!hero) return;

  var heroContent = hero.querySelector('.hero__content');
  var heroCards = hero.querySelectorAll('.hero-card');
  var heroInner = hero.querySelector('.hero__fixed');
  var scrollCTA = hero.querySelector('.hero__scroll-cta');

  // --- Staggered entrance on page load ---
  // Text fades in via CSS animation (heroFadeIn in animations.css)
  // Cards stagger in with JS-controlled delays
  setTimeout(function() {
    heroCards.forEach(function(card, i) {
      setTimeout(function() {
        card.classList.add('is-entered');
        // Set the final resting transform with rotation
        var rotation = parseFloat(card.dataset.rotation || '0');
        card.style.setProperty('--base-rotation', rotation + 'deg');
      }, i * 150);
    });
  }, 300);

  // Show scroll CTA after cards are in
  if (scrollCTA) {
    setTimeout(function() {
      scrollCTA.style.opacity = '1';
    }, 1200);
  }

  // --- Scroll-driven parallax + exit ---
  var ticking = false;

  function getScrollProgress() {
    var rect = hero.getBoundingClientRect();
    var heroHeight = hero.offsetHeight;
    var viewportHeight = window.innerHeight;
    var scrolled = -rect.top;
    var scrollableDistance = heroHeight - viewportHeight;
    if (scrollableDistance <= 0) return 0;
    return Math.max(0, Math.min(1, scrolled / scrollableDistance));
  }

  function updateScroll() {
    var progress = getScrollProgress();

    // --- Parallax movement on cards (0% - 100%) ---
    heroCards.forEach(function(card) {
      var speed = parseFloat(card.dataset.parallaxSpeed || '0.5');
      var parallaxY = progress * -120 * speed;
      var parallaxX = progress * 20 * (speed - 0.5);
      card.style.setProperty('--parallax-y', parallaxY + 'px');
      card.style.setProperty('--parallax-x', parallaxX + 'px');
    });

    // --- Scroll CTA fades out quickly ---
    if (scrollCTA) {
      var ctaFade = progress > 0.08 ? Math.max(0, 1 - (progress - 0.08) / 0.07) : 1;
      scrollCTA.style.opacity = ctaFade;
    }

    // --- Full hero fades + shifts up at 65-100% scroll ---
    if (heroInner) {
      if (progress > 0.6) {
        var fadeProgress = (progress - 0.6) / 0.4;
        var eased = fadeProgress * fadeProgress; // ease-in
        heroInner.style.opacity = 1 - eased;
        heroInner.style.transform = 'translateY(' + (-eased * 50) + 'px)';
      } else {
        heroInner.style.opacity = '1';
        heroInner.style.transform = 'translateY(0)';
      }
    }

    ticking = false;
  }

  window.addEventListener('scroll', function() {
    if (!ticking) {
      requestAnimationFrame(updateScroll);
      ticking = true;
    }
  }, { passive: true });

  // --- Cursor reactivity ---
  var mouseX = 0, mouseY = 0;
  var currentX = 0, currentY = 0;

  function handleMouseMove(e) {
    var rect = heroInner.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  }

  function animateCursor() {
    currentX += (mouseX - currentX) * 0.06;
    currentY += (mouseY - currentY) * 0.06;

    heroCards.forEach(function(card) {
      var sensitivity = parseFloat(card.dataset.cursorSensitivity || '8');
      card.style.setProperty('--cursor-x', (currentX * sensitivity) + 'px');
      card.style.setProperty('--cursor-y', (currentY * sensitivity) + 'px');
    });

    requestAnimationFrame(animateCursor);
  }

  if (!('ontouchstart' in window)) {
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    animateCursor();
  }

  // --- Gentle idle float ---
  var t = 0;
  function idleFloat() {
    t += 0.004;
    heroCards.forEach(function(card, i) {
      var fy = Math.sin(t + i * 1.3) * 5;
      var fx = Math.cos(t * 0.6 + i * 0.8) * 3;
      card.style.setProperty('--float-x', fx + 'px');
      card.style.setProperty('--float-y', fy + 'px');
    });
    requestAnimationFrame(idleFloat);
  }
  idleFloat();

  // Initial scroll state
  updateScroll();
})();
