/* ==========================================================================
   Checkpoint GTM — Hero Particle Explosion

   A checkmark shape made of small squares. On scroll, particles explode
   outward from center. Inspired by Maze.co's globe explosion.

   States:
   - Idle (0-10% scroll): Checkmark formed, slowly rotating, particles pulse
   - Exploding (10-80% scroll): Particles scatter outward, grow, and fade
   - Clear (80-100%): Particles fully dispersed, hero fades out
   ========================================================================== */

(function () {
  var canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var hero = document.querySelector('.hero');
  var heroFixed = document.querySelector('.hero__fixed');
  var scrollCTA = document.querySelector('.hero__scroll-cta');
  var heroContent = document.querySelector('.hero__content');

  // --- Config ---
  var PARTICLE_SIZE_BASE = 5;
  var PARTICLE_GAP = 2;
  var ROTATION_SPEED = 0.0004; // radians per frame
  var ACCENT_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#2D6A4F';
  var WARM_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--accent-warm').trim() || '#E8985E';

  // --- State ---
  var particles = [];
  var width, height, centerX, centerY;
  var scrollProgress = 0;
  var rotationAngle = 0;
  var dpr = window.devicePixelRatio || 1;
  var animationId;
  var lastScrollY = window.scrollY;
  var scrollDelta = 0;
  var wheelDelta = 0;
  var wheelDecay = 0.95;

  // --- Resize ---
  function resize() {
    var rect = canvas.parentElement.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    centerX = width / 2;
    centerY = height * 0.38; // Position checkbox in upper portion
    generateParticles();
  }

  // --- Generate checkmark shape ---
  function generateParticles() {
    particles = [];

    // Scale the checkmark to fit viewport
    var scale = Math.min(width, height) * 0.28;
    var step = PARTICLE_SIZE_BASE + PARTICLE_GAP;

    // Create a temporary canvas to draw checkmark shape and sample points
    var tmpCanvas = document.createElement('canvas');
    var tmpCtx = tmpCanvas.getContext('2d');
    var tmpSize = Math.ceil(scale * 2.5);
    tmpCanvas.width = tmpSize;
    tmpCanvas.height = tmpSize;

    var cx = tmpSize / 2;
    var cy = tmpSize / 2;

    // Draw checkmark with rounded square background
    tmpCtx.fillStyle = '#000';

    // Rounded rectangle background
    var boxSize = scale * 1.8;
    var boxRadius = scale * 0.25;
    var bx = cx - boxSize / 2;
    var by = cy - boxSize / 2;
    tmpCtx.beginPath();
    tmpCtx.moveTo(bx + boxRadius, by);
    tmpCtx.lineTo(bx + boxSize - boxRadius, by);
    tmpCtx.quadraticCurveTo(bx + boxSize, by, bx + boxSize, by + boxRadius);
    tmpCtx.lineTo(bx + boxSize, by + boxSize - boxRadius);
    tmpCtx.quadraticCurveTo(bx + boxSize, by + boxSize, bx + boxSize - boxRadius, by + boxSize);
    tmpCtx.lineTo(bx + boxRadius, by + boxSize);
    tmpCtx.quadraticCurveTo(bx, by + boxSize, bx, by + boxSize - boxRadius);
    tmpCtx.lineTo(bx, by + boxRadius);
    tmpCtx.quadraticCurveTo(bx, by, bx + boxRadius, by);
    tmpCtx.closePath();
    tmpCtx.fill();

    // Cut out checkmark (white = empty)
    tmpCtx.globalCompositeOperation = 'destination-out';
    tmpCtx.strokeStyle = '#000';
    tmpCtx.lineCap = 'round';
    tmpCtx.lineJoin = 'round';
    tmpCtx.lineWidth = scale * 0.22;
    tmpCtx.beginPath();
    // Checkmark path
    tmpCtx.moveTo(cx - scale * 0.38, cy + scale * 0.02);
    tmpCtx.lineTo(cx - scale * 0.08, cy + scale * 0.32);
    tmpCtx.lineTo(cx + scale * 0.42, cy - scale * 0.3);
    tmpCtx.stroke();

    // Sample pixels from the shape
    var imageData = tmpCtx.getImageData(0, 0, tmpSize, tmpSize);
    var data = imageData.data;

    for (var y = 0; y < tmpSize; y += step) {
      for (var x = 0; x < tmpSize; x += step) {
        var idx = (Math.floor(y) * tmpSize + Math.floor(x)) * 4;
        if (data[idx + 3] > 128) {
          // This pixel is part of the shape
          var px = x - cx;
          var py = y - cy;

          // Distance from center for explosion direction
          var dist = Math.sqrt(px * px + py * py);
          var angle = Math.atan2(py, px);

          // Add some randomness to explosion
          var explosionAngle = angle + (Math.random() - 0.5) * 0.8;
          var explosionDist = (300 + Math.random() * 600) * (1 + dist / scale * 0.5);

          // Color: mostly accent, some warm accent scattered
          var isWarm = Math.random() < 0.15;

          particles.push({
            // Home position (relative to center)
            homeX: px,
            homeY: py,
            // Current position
            x: px,
            y: py,
            // Explosion target
            explodeX: Math.cos(explosionAngle) * explosionDist,
            explodeY: Math.sin(explosionAngle) * explosionDist,
            // Size
            sizeBase: PARTICLE_SIZE_BASE * (0.7 + Math.random() * 0.6),
            sizeExploded: PARTICLE_SIZE_BASE * (1.5 + Math.random() * 3),
            // Rotation per particle
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.02,
            // Color
            isWarm: isWarm,
            // Opacity
            opacity: 0.85 + Math.random() * 0.15,
            // Delay for stagger effect
            delay: dist / scale * 0.15 + Math.random() * 0.05,
            // Idle pulse
            pulseOffset: Math.random() * Math.PI * 2,
            pulseSpeed: 0.5 + Math.random() * 1.5,
          });
        }
      }
    }
  }

  // --- Scroll progress ---
  function getScrollProgress() {
    var rect = hero.getBoundingClientRect();
    var heroHeight = hero.offsetHeight;
    var viewportHeight = window.innerHeight;
    var scrolled = -rect.top;
    var scrollableDistance = heroHeight - viewportHeight;
    if (scrollableDistance <= 0) return 0;
    return Math.max(0, Math.min(1, scrolled / scrollableDistance));
  }

  // --- Easing ---
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function easeInQuad(t) {
    return t * t;
  }

  // --- Draw ---
  var time = 0;

  function draw() {
    time += 1;
    scrollProgress = getScrollProgress();

    // Track scroll direction via scrollY for actual scrolling
    var currentScrollY = window.scrollY;
    scrollDelta = currentScrollY - lastScrollY;
    lastScrollY = currentScrollY;

    // Decay wheel delta each frame (smooths out the effect)
    wheelDelta *= wheelDecay;
    if (Math.abs(wheelDelta) < 0.001) wheelDelta = 0;

    // Rotate based on scroll/wheel input when near top
    if (scrollProgress < 0.1) {
      if (scrollDelta !== 0) {
        // Page is actually scrolling — use scroll delta
        var speed = Math.min(Math.abs(scrollDelta) * 0.003, 0.02);
        rotationAngle += scrollDelta > 0 ? (ROTATION_SPEED + speed) : -(ROTATION_SPEED + speed);
      } else if (Math.abs(wheelDelta) > 0.001) {
        // Page isn't moving (overscroll) — use wheel delta for reverse spin
        rotationAngle += wheelDelta;
      } else {
        // Idle — gentle forward rotation
        rotationAngle += ROTATION_SPEED;
      }
    }

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(centerX, centerY);

    // Apply global rotation only when not exploding
    var globalRotation = rotationAngle * Math.max(0, 1 - scrollProgress * 5);
    ctx.rotate(globalRotation);

    // Update colors in case theme changed
    var rootStyle = getComputedStyle(document.documentElement);
    var currentAccent = rootStyle.getPropertyValue('--accent').trim() || ACCENT_COLOR;
    var currentWarm = rootStyle.getPropertyValue('--accent-warm').trim() || WARM_COLOR;

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];

      // Calculate explosion progress for this particle (with delay)
      var explosionStart = 0.05 + p.delay;
      var explosionEnd = explosionStart + 0.55;
      var ep = Math.max(0, Math.min(1, (scrollProgress - explosionStart) / (explosionEnd - explosionStart)));
      var easedEp = easeOutCubic(ep);

      // Interpolate position
      var x = p.homeX + (p.explodeX - p.homeX) * easedEp;
      var y = p.homeY + (p.explodeY - p.homeY) * easedEp;

      // Idle pulse (subtle size variation when formed)
      var pulse = 1;
      if (ep < 0.01) {
        pulse = 1 + Math.sin(time * 0.02 * p.pulseSpeed + p.pulseOffset) * 0.08;
      }

      // Size: grows during explosion
      var size = p.sizeBase * pulse + (p.sizeExploded - p.sizeBase) * easedEp;

      // Opacity: fade out in later explosion stages
      var alpha = p.opacity;
      if (ep > 0.6) {
        alpha *= 1 - (ep - 0.6) / 0.4;
      }

      // Individual rotation during explosion
      var rot = p.rotation + (ep > 0 ? ep * p.rotSpeed * 50 : 0);

      if (alpha < 0.01) continue;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.isWarm ? currentWarm : currentAccent;

      // Draw rounded square
      var half = size / 2;
      var r = size * 0.15;
      ctx.beginPath();
      ctx.moveTo(-half + r, -half);
      ctx.lineTo(half - r, -half);
      ctx.quadraticCurveTo(half, -half, half, -half + r);
      ctx.lineTo(half, half - r);
      ctx.quadraticCurveTo(half, half, half - r, half);
      ctx.lineTo(-half + r, half);
      ctx.quadraticCurveTo(-half, half, -half, half - r);
      ctx.lineTo(-half, -half + r);
      ctx.quadraticCurveTo(-half, -half, -half + r, -half);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();

    // --- Hero content opacity ---
    if (heroContent) {
      if (scrollProgress < 0.05) {
        heroContent.style.opacity = '1';
      } else if (scrollProgress < 0.25) {
        heroContent.style.opacity = String(1 - (scrollProgress - 0.05) / 0.2);
      } else {
        heroContent.style.opacity = '0';
      }
    }

    // --- Scroll CTA ---
    if (scrollCTA) {
      if (scrollProgress < 0.02) {
        scrollCTA.style.opacity = '1';
      } else if (scrollProgress < 0.1) {
        scrollCTA.style.opacity = String(1 - (scrollProgress - 0.02) / 0.08);
      } else {
        scrollCTA.style.opacity = '0';
      }
    }

    // --- Hero fixed fade out at end ---
    if (heroFixed) {
      if (scrollProgress > 0.7) {
        var fade = (scrollProgress - 0.7) / 0.3;
        heroFixed.style.opacity = String(1 - easeInQuad(fade));
      } else {
        heroFixed.style.opacity = '1';
      }
    }

    animationId = requestAnimationFrame(draw);
  }

  // --- Wheel listener (captures scroll intent even during overscroll) ---
  window.addEventListener('wheel', function (e) {
    if (scrollProgress < 0.1) {
      // deltaY > 0 = scrolling down, < 0 = scrolling up
      // Faster multiplier for reverse (up), original speed for down
      wheelDelta = e.deltaY < 0 ? e.deltaY * 0.003 : e.deltaY * 0.0008;
    }
  }, { passive: true });

  // --- Init ---
  resize();
  window.addEventListener('resize', function () {
    resize();
  });

  // Start animation
  draw();

  // Cleanup
  window.addEventListener('beforeunload', function () {
    cancelAnimationFrame(animationId);
  });
})();
