/* ==========================================================================
   Checkpoint GTM — Scroll Animations
   ========================================================================== */

(function() {
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reducedMotion) {
    document.querySelectorAll('.reveal').forEach(function(el) {
      el.classList.add('is-visible');
    });
    document.querySelectorAll('.image-bank__card').forEach(function(el) {
      el.style.opacity = '1';
    });
    document.querySelectorAll('.partner-grid__card').forEach(function(el) {
      el.classList.add('is-visible');
    });
    document.querySelectorAll('.click-in').forEach(function(el) {
      el.classList.add('is-visible');
    });
    // Stats: set final values with suffix, no animation
    document.querySelectorAll('.stats-bar .stat-block').forEach(function(block) {
      block.classList.add('is-visible');
      var numberEl = block.querySelector('.stat-block__number');
      if (numberEl) {
        var target = parseInt(numberEl.getAttribute('data-count-to'), 10) || 0;
        var suffix = numberEl.getAttribute('data-suffix') || '';
        numberEl.innerHTML = target + '<span class="stat-block__suffix">' + suffix + '</span>';
      }
    });
    return;
  }

  // --- Stats bar: slide-in + counter + pop ---
  var statsBlocks = document.querySelectorAll('.stats-bar .stat-block');
  if (statsBlocks.length) {
    var easeOutQuart = function(t) { return 1 - Math.pow(1 - t, 4); };

    var animateCounter = function(numberEl, target, suffix, duration, onDone) {
      var start = performance.now();
      var suffixHTML = '<span class="stat-block__suffix">' + suffix + '</span>';
      var tick = function(now) {
        var t = Math.min(1, (now - start) / duration);
        var value = Math.round(easeOutQuart(t) * target);
        numberEl.innerHTML = value + suffixHTML;
        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          numberEl.innerHTML = target + suffixHTML;
          if (onDone) onDone();
        }
      };
      requestAnimationFrame(tick);
    };

    var statsObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var block = entry.target;
          var index = Array.prototype.indexOf.call(statsBlocks, block);
          var slideDelay = index * 150;
          var counterDelay = slideDelay + 250; // start counter after slide-in begins

          setTimeout(function() { block.classList.add('is-visible'); }, slideDelay);

          var numberEl = block.querySelector('.stat-block__number');
          if (numberEl && numberEl.hasAttribute('data-count-to')) {
            var target = parseInt(numberEl.getAttribute('data-count-to'), 10) || 0;
            var suffix = numberEl.getAttribute('data-suffix') || '';
            setTimeout(function() {
              animateCounter(numberEl, target, suffix, 1500, function() {
                block.classList.add('is-popped');
                setTimeout(function() { block.classList.remove('is-popped'); }, 500);
              });
            }, counterDelay);
          }
          statsObserver.unobserve(block);
        }
      });
    }, { threshold: 0.3, rootMargin: '0px 0px -40px 0px' });

    statsBlocks.forEach(function(block) { statsObserver.observe(block); });
  }

  // --- Click-in grid: cards pop up from the bottom one by one ---
  var clickInGrids = document.querySelectorAll('.click-in-grid');
  clickInGrids.forEach(function(grid) {
    var cards = grid.querySelectorAll('.click-in');
    if (!cards.length) return;
    var gridObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          cards.forEach(function(card, i) {
            setTimeout(function() { card.classList.add('is-visible'); }, i * 140);
          });
          gridObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    gridObserver.observe(grid);
  });

  // --- Standard reveal animations ---
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(function(el) {
    observer.observe(el);
  });

  // --- Partner grid: staggered reveal from three sides ---
  var partnerCards = document.querySelectorAll('.partner-grid__card');
  if (partnerCards.length) {
    var partnerObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          // Stagger based on card index
          var card = entry.target;
          var index = Array.prototype.indexOf.call(partnerCards, card);
          var delay = index * 80;
          setTimeout(function() {
            card.classList.add('is-visible');
          }, delay);
          partnerObserver.unobserve(card);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });

    partnerCards.forEach(function(card) {
      partnerObserver.observe(card);
    });
  }

  // --- Certified badges: scatter → converge during hero scroll ---
  var certGrid = document.querySelector('.image-bank__grid--small');
  if (!certGrid) return;

  var certCards = [];
  var cCards = certGrid.querySelectorAll('.image-bank__card');
  cCards.forEach(function(card, i) {
    var angle = (i / cCards.length) * Math.PI * 2 + (Math.random() * 0.6 - 0.3);
    var dist = 600 + Math.random() * 400;
    card.style.position = 'fixed';
    card.style.zIndex = '6';
    certCards.push({
      el: card, index: i, total: cCards.length,
      scatterX: Math.cos(angle) * dist,
      scatterY: Math.sin(angle) * dist,
      stagger: i * 0.05
    });
  });

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function updateBank() {
    var hero = document.querySelector('.hero');
    var imageBank = document.querySelector('.image-bank');
    if (!hero || !imageBank) return;

    var viewH = window.innerHeight;
    var viewW = window.innerWidth;
    var heroHeight = hero.offsetHeight;
    var scrollY = window.pageYOffset || document.documentElement.scrollTop;

    // Find partner-grid to anchor fade-out
    var partnerGridEl = document.querySelector('.partner-grid');
    var fadeTarget = partnerGridEl ? partnerGridEl.offsetTop - viewH : heroHeight * 0.5;

    // Converge certified during hero explosion
    var certStart = heroHeight * 0.08;
    var certEnd = certStart + (fadeTarget - certStart) * 0.6;
    var certProgress = Math.max(0, Math.min(1, (scrollY - certStart) / (certEnd - certStart)));

    var centerX = viewW / 2;
    var certCenterY = viewH * 0.32;

    // Certs fade out as partner grid approaches
    var partnerRect = partnerGridEl ? partnerGridEl.getBoundingClientRect() : { top: viewH };
    var fadeStart = certCenterY + 350; // start fading when partner top reaches this
    var fadeEnd = certCenterY + 100;   // fully gone when partner top reaches this
    var certFadeOut = partnerRect.top > fadeStart ? 1 : partnerRect.top < fadeEnd ? 0 : (partnerRect.top - fadeEnd) / (fadeStart - fadeEnd);

    certCards.forEach(function(data) {
      var cardProgress = Math.max(0, Math.min(1, (certProgress - data.stagger) / (1 - data.stagger)));
      var eased = easeOutCubic(cardProgress);
      var spacing = 240;
      var offsetX = (data.index - (data.total - 1) / 2) * spacing;
      var targetX = centerX + offsetX;
      var targetY = certCenterY;

      var x = targetX + data.scatterX * (1 - eased);
      var y = targetY + data.scatterY * (1 - eased);
      var scale = 0.5 + 0.5 * eased;
      var opacity = eased * certFadeOut;

      data.el.style.left = '0px';
      data.el.style.top = '0px';
      data.el.style.transform = 'translate(' + x.toFixed(1) + 'px, ' + y.toFixed(1) + 'px) translate(-50%, -50%) scale(' + scale.toFixed(3) + ')';
      data.el.style.opacity = opacity.toFixed(3);
    });

    // Hide container once fully faded
    certGrid.closest('.image-bank__group').style.visibility = certFadeOut < 0.01 ? 'hidden' : 'visible';

    // Certified label
    var certLabel = imageBank.querySelector('.image-bank__label');
    if (certLabel) {
      var labelOpacity = Math.max(0, Math.min(1, (certProgress - 0.3) / 0.2)) * certFadeOut;
      certLabel.style.opacity = labelOpacity.toFixed(3);
    }
  }

  var ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(function() {
        updateBank();
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  updateBank();
})();
