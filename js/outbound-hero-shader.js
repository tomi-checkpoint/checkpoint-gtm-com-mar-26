/**
 * Outbound Hero Shader Runner
 * ----------------------------------------
 * Renders an animated topographic-contour fragment shader (from the
 * Mega Graphics Generator "v03-contour" preset) behind the Programmatic
 * Outbound page hero using WebGL2.
 *
 * Public API:
 *   window.initContourShader(selector, opts)
 *     opts.speed            number (default 1.0)  -> u_speed
 *     opts.tint             [r,g,b] 0..1 (default muted sage) -> u_tint
 *     opts.resolutionScale  number (default 1)    -> render-resolution divider
 *
 * Behavior notes:
 *   - WebGL2-only. Bails silently if unavailable.
 *   - Honors prefers-reduced-motion: renders a single static frame at t=0.
 *   - Pauses rAF when canvas is off-screen (IntersectionObserver) and when
 *     the tab is hidden (visibilitychange).
 *   - DPR capped at 2 to avoid punishing phone/tablet render loads.
 */
(function () {
  'use strict';

  var VERTEX_SRC = [
    '#version 300 es',
    'in vec2 a_pos;',
    'void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }'
  ].join('\n');

  // Fragment shader = v03-contour.glsl contents (stripped of header
  // comment block and trailing marker). Uniforms u_speed and u_tint
  // are declared inline in the shader itself.
  var FRAGMENT_SRC = [
    '#version 300 es',
    'precision highp float;',
    'uniform float u_time;',
    'uniform vec2  u_resolution;',
    'uniform vec2  u_mouse;',
    'uniform float u_click;',
    'uniform vec2  u_clickPos;',
    'uniform float u_clickAge;',
    'out vec4 _fragColorOut;',
    '#define gl_FragColor _fragColorOut',
    '#define u_res u_resolution',
    '#define PI 3.14159265359',
    '#define TAU 6.28318530718',
    'float hash11(float p){ p = fract(p*0.1031); p *= p+33.33; p *= p+p; return fract(p); }',
    'float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*0.1031); p3 += dot(p3, p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }',
    'vec2  hash22(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*vec3(.1031,.1030,.0973)); p3 += dot(p3, p3.yzx+33.33); return fract((p3.xx+p3.yz)*p3.zy); }',
    'float vnoise(vec2 p){',
    '  vec2 i = floor(p); vec2 f = fract(p);',
    '  float a = hash12(i), b = hash12(i+vec2(1,0)), c = hash12(i+vec2(0,1)), d = hash12(i+vec2(1,1));',
    '  vec2 u = f*f*(3.0-2.0*f);',
    '  return mix(a,b,u.x) + (c-a)*u.y*(1.-u.x) + (d-b)*u.x*u.y;',
    '}',
    'float fbm(vec2 p){',
    '  float v=0., a=0.5;',
    '  for(int i=0;i<5;i++){ v += a*vnoise(p); p *= 2.02; a *= 0.5; }',
    '  return v;',
    '}',
    'mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }',
    'uniform float u_speed;',
    'uniform vec3 u_tint;',
    'void main(){',
    '  vec2 p = (gl_FragCoord.xy - 0.5*u_res.xy) / u_res.y;',
    '  vec2 m = (u_mouse-0.5);',
    '  float t = u_time*u_speed*0.04;',
    '  float h = fbm(p*1.5 + vec2(t, -t*0.3)) + dot(p, m)*0.5;',
    '  h = mix(h, 0.5, u_click*0.7);',
    '  float lines = abs(fract(h*12.0)-0.5);',
    '  float contour = smoothstep(0.02, 0.0, lines);',
    '  vec3 bg = mix(u_tint, vec3(0.80,0.78,0.70), h);',
    '  vec3 ink = vec3(0.18, 0.20, 0.22);',
    '  vec3 col = mix(bg, ink, contour*0.7);',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  function compileShader(gl, src, type) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      var log = gl.getShaderInfoLog(sh);
      gl.deleteShader(sh);
      console.warn('[outbound-hero-shader] shader compile failed:', log);
      return null;
    }
    return sh;
  }

  function linkProgram(gl, vs, fs) {
    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.bindAttribLocation(prog, 0, 'a_pos');
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      var log = gl.getProgramInfoLog(prog);
      gl.deleteProgram(prog);
      console.warn('[outbound-hero-shader] program link failed:', log);
      return null;
    }
    return prog;
  }

  function hideCanvas(canvas) {
    if (canvas && canvas.style) canvas.style.display = 'none';
  }

  window.initContourShader = function initContourShader(selector, opts) {
    opts = opts || {};
    var speed = typeof opts.speed === 'number' ? opts.speed : 1.0;
    var tint = Array.isArray(opts.tint) && opts.tint.length === 3
      ? opts.tint
      : [0.788, 0.851, 0.835];
    var resolutionScale = typeof opts.resolutionScale === 'number' && opts.resolutionScale > 0
      ? opts.resolutionScale
      : 1;

    var canvas = typeof selector === 'string'
      ? document.querySelector(selector)
      : selector;

    if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
      return null;
    }

    var gl;
    try {
      gl = canvas.getContext('webgl2', {
        antialias: false,
        alpha: true,
        premultipliedAlpha: true,
        powerPreference: 'low-power',
        preserveDrawingBuffer: false
      });
    } catch (err) {
      gl = null;
    }

    if (!gl) {
      hideCanvas(canvas);
      return null;
    }

    var vs = compileShader(gl, VERTEX_SRC, gl.VERTEX_SHADER);
    var fs = compileShader(gl, FRAGMENT_SRC, gl.FRAGMENT_SHADER);
    if (!vs || !fs) {
      hideCanvas(canvas);
      return null;
    }

    var program = linkProgram(gl, vs, fs);
    // Individual shaders can be detached after link; deletion is deferred
    // until the program is deleted.
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!program) {
      hideCanvas(canvas);
      return null;
    }

    // Full-screen triangle (3 verts, no index buffer).
    var vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    var vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1,  3, -1,  -1, 3]),
      gl.STATIC_DRAW
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    gl.useProgram(program);
    var u = {
      time: gl.getUniformLocation(program, 'u_time'),
      res: gl.getUniformLocation(program, 'u_resolution'),
      mouse: gl.getUniformLocation(program, 'u_mouse'),
      click: gl.getUniformLocation(program, 'u_click'),
      clickPos: gl.getUniformLocation(program, 'u_clickPos'),
      clickAge: gl.getUniformLocation(program, 'u_clickAge'),
      speed: gl.getUniformLocation(program, 'u_speed'),
      tint: gl.getUniformLocation(program, 'u_tint')
    };

    // Static uniforms
    gl.uniform1f(u.speed, speed);
    gl.uniform3f(u.tint, tint[0], tint[1], tint[2]);

    // Mutable state
    var mouseX = 0.5;
    var mouseY = 0.5;
    var clickVal = 0.0;
    var clickPosX = 0.5;
    var clickPosY = 0.5;
    var clickStart = 0;

    var width = 0;
    var height = 0;

    function resize() {
      var rect = canvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2) / resolutionScale;
      var w = Math.max(1, Math.floor(rect.width * dpr));
      var h = Math.max(1, Math.floor(rect.height * dpr));
      if (w !== width || h !== height) {
        width = w;
        height = h;
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }

    function onPointerMove(e) {
      var rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      mouseX = (e.clientX - rect.left) / rect.width;
      mouseY = 1.0 - (e.clientY - rect.top) / rect.height;
      // Clamp to [0,1] for safety when pointer is outside the hero.
      if (mouseX < 0) mouseX = 0; else if (mouseX > 1) mouseX = 1;
      if (mouseY < 0) mouseY = 0; else if (mouseY > 1) mouseY = 1;
    }

    function onPointerDown(e) {
      var rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      clickPosX = (e.clientX - rect.left) / rect.width;
      clickPosY = 1.0 - (e.clientY - rect.top) / rect.height;
      clickVal = 1.0;
      clickStart = performance.now();
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });

    // Reduced motion -> draw one static frame at t=0 and stop.
    var prefersReduced = false;
    try {
      prefersReduced = !!(window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (err) {
      prefersReduced = false;
    }

    var running = false;
    var rafId = 0;
    var startTime = performance.now();
    var isVisible = true;
    var docVisible = (typeof document.visibilityState !== 'string')
      || (document.visibilityState === 'visible');

    function renderFrame(tMs) {
      var t = (tMs - startTime) / 1000.0;
      // Click decay: linear over ~0.6s
      if (clickVal > 0.0) {
        var age = (tMs - clickStart) / 1000.0;
        clickVal = Math.max(0.0, 1.0 - age / 0.6);
      }

      gl.useProgram(program);
      gl.bindVertexArray(vao);
      gl.uniform1f(u.time, t);
      gl.uniform2f(u.res, width, height);
      gl.uniform2f(u.mouse, mouseX, mouseY);
      gl.uniform1f(u.click, clickVal);
      gl.uniform2f(u.clickPos, clickPosX, clickPosY);
      gl.uniform1f(u.clickAge, (tMs - clickStart) / 1000.0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
    }

    function loop(tMs) {
      if (!running) return;
      resize();
      renderFrame(tMs);
      rafId = requestAnimationFrame(loop);
    }

    function start() {
      if (running) return;
      if (!isVisible || !docVisible) return;
      running = true;
      rafId = requestAnimationFrame(loop);
    }

    function stop() {
      running = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    }

    // Always render one frame immediately so there's never a blank canvas.
    resize();
    renderFrame(startTime);

    if (prefersReduced) {
      // Single static frame already drawn; do not animate or attach loops.
      // We still want resize to keep the static image sharp on viewport change.
      window.addEventListener('resize', function () {
        resize();
        renderFrame(startTime);
      });
      return {
        stop: function () {},
        start: function () {},
        canvas: canvas
      };
    }

    // IntersectionObserver: pause rAF when canvas is off-screen.
    if (typeof IntersectionObserver === 'function') {
      var io = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          var entry = entries[i];
          isVisible = entry.isIntersecting && entry.intersectionRatio > 0;
        }
        if (isVisible && docVisible) start(); else stop();
      }, { threshold: [0, 0.01] });
      io.observe(canvas);
    } else {
      isVisible = true;
    }

    document.addEventListener('visibilitychange', function () {
      docVisible = document.visibilityState === 'visible';
      if (docVisible && isVisible) start(); else stop();
    });

    window.addEventListener('resize', function () {
      // resize() runs inside the loop already, but cover the stopped case too.
      if (!running) {
        resize();
        renderFrame(performance.now());
      }
    });

    start();

    return {
      start: start,
      stop: stop,
      canvas: canvas
    };
  };
})();
