/* ==========================================================================
   Checkpoint GTM — Hero scroll orchestration

   Replaces the old checkmark particle canvas. The hero visual is now a CSS
   + SVG bot (see .hero-bot in index.html). This script preserves the
   scroll-driven fades that downstream modules (scroll-animations.js,
   cert-badge scatter/converge) rely on:

     - hero__content fades out as the user scrolls through the hero
     - hero__scroll-cta fades out quickly on first scroll
     - hero__fixed fades at the end of the hero so the next section reveals
     - hero-bot drifts + fades alongside the content

   Reduced-motion users get static styling via CSS; this file still runs so
   fades still happen — but fades are a legibility concern, not motion.
   ========================================================================== */

(function () {
  var hero = document.querySelector('.hero');
  if (!hero) return;

  var heroFixed   = document.querySelector('.hero__fixed');
  var heroContent = document.querySelector('.hero__content');
  var scrollCTA   = document.querySelector('.hero__scroll-cta');
  var bot         = document.querySelector('.hero-bot');

  function easeInQuad(t) { return t * t; }

  function getScrollProgress() {
    var rect = hero.getBoundingClientRect();
    var heroHeight = hero.offsetHeight;
    var viewportHeight = window.innerHeight;
    var scrolled = -rect.top;
    var scrollable = heroHeight - viewportHeight;
    if (scrollable <= 0) return 0;
    return Math.max(0, Math.min(1, scrolled / scrollable));
  }

  var ticking = false;

  function update() {
    var p = getScrollProgress();

    // Hero content fades out first
    if (heroContent) {
      var contentOpacity;
      if (p < 0.05)      contentOpacity = 1;
      else if (p < 0.28) contentOpacity = 1 - (p - 0.05) / 0.23;
      else               contentOpacity = 0;
      heroContent.style.opacity = String(contentOpacity);
    }

    // Scroll CTA fades out very fast
    if (scrollCTA) {
      var ctaOpacity;
      if (p < 0.02)      ctaOpacity = 1;
      else if (p < 0.1)  ctaOpacity = 1 - (p - 0.02) / 0.08;
      else               ctaOpacity = 0;
      scrollCTA.style.opacity = String(ctaOpacity);
    }

    // Bot: gentle drift up + fade as the user scrolls (feels like it's
    // "handing off" to the certification badges that converge next).
    if (bot) {
      var botDrift   = Math.min(p * 80, 120);      // up to 120px upward
      var botScale   = 1 - Math.min(p * 0.35, 0.25);
      var botOpacity = p < 0.15 ? 1 : Math.max(0, 1 - (p - 0.15) / 0.35);
      bot.style.transform = 'translateY(' + (-botDrift) + 'px) scale(' + botScale + ')';
      bot.style.opacity = String(botOpacity);
    }

    // Hero fixed container fades out near the end so the next section reveals cleanly
    if (heroFixed) {
      if (p > 0.7) {
        var fade = (p - 0.7) / 0.3;
        heroFixed.style.opacity = String(1 - easeInQuad(fade));
      } else {
        heroFixed.style.opacity = '1';
      }
    }

    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
})();
