/* ===== HANGING CARD =====
   Ported from the Framer HangingCard component. Drag the card; the rope
   follows as a sagging quadratic curve and the card springs back on release.
*/
(() => {
  const frame = document.querySelector('.hanging');
  if (!frame) return;

  const card = frame.querySelector('.hanging-card');
  const rope = frame.querySelector('.hanging-rope path');
  if (!card || !rope) return;

  /* the component's "bouncy 50" preset */
  const STIFFNESS = 380;
  const DAMPING   = 23;
  const MASS      = 1.0;

  const px = n => parseFloat(getComputedStyle(frame).getPropertyValue(n)) || 0;
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  let dx = 0, dy = 0;        /* card offset from rest */
  let vx = 0, vy = 0;        /* spring velocity */
  let dragging = false;
  let running = false;
  let lastTime = 0;
  let pointerOffset = { x: 0, y: 0 };

  function draw(){
    const ropeLength = px('--rope-length');
    const frameWidth = frame.offsetWidth;
    /* where frame coordinate (0,0) sits inside the rope SVG. The SVG spans
       the full viewport width and starts 50vh above it -- see .hanging-rope
       in hanging.css, which these two numbers must match. */
    const overflowX = window.innerWidth * 0.5 - frameWidth / 2;
    const overflowY = window.innerHeight * 0.5;

    /* anchor at the top centre of the frame, card hangs below it */
    const x0 = frameWidth / 2, y0 = 0;
    const x1 = x0 + dx,        y1 = ropeLength + dy;

    const dist = Math.hypot(x1 - x0, y1 - y0);
    const sag  = Math.min(260, dist * 0.35 + ropeLength * 0.25);
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2 + sag;

    rope.setAttribute('d',
      `M ${x0 + overflowX} ${y0 + overflowY} Q ${cx + overflowX} ${cy + overflowY} ${x1 + overflowX} ${y1 + overflowY}`);

    /* the card leans into the direction it has been pulled */
    const swing = clamp(dx / Math.max(window.innerWidth * 0.28, 1), -1, 1) * 12;
    card.style.transform = `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) rotate(${swing.toFixed(2)}deg)`;
  }

  function frameTick(now){
    const dt = Math.min((now - lastTime) / 1000, 1 / 30);
    lastTime = now;

    /* same spring model as the component's release animation */
    vx += ((-STIFFNESS * dx) + (-DAMPING * vx)) / MASS * dt;
    vy += ((-STIFFNESS * dy) + (-DAMPING * vy)) / MASS * dt;
    dx += vx * dt;
    dy += vy * dt;

    draw();

    if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05 && Math.abs(vx) < 0.05 && Math.abs(vy) < 0.05){
      dx = dy = vx = vy = 0;
      draw();
      running = false;
      return;
    }
    requestAnimationFrame(frameTick);
  }

  card.addEventListener('pointerdown', e => {
    dragging = true;
    running = false;
    vx = vy = 0;
    card.classList.add('is-dragging');
    const r = card.getBoundingClientRect();
    pointerOffset = { x: e.clientX - r.left, y: e.clientY - r.top };
    try { card.setPointerCapture(e.pointerId); } catch {}
  });

  /* ---- the key as a pulley handle ----
     Pulling it down scrolls the page, so whatever sits below the key
     screen rises into view behind it. Plain scrolling does the same
     thing, so this is a shortcut, never the only way through. */
  const stays = document.querySelector('[data-pull-target]');
  const PULL_GAIN = 1.6;          /* how far the page moves per px pulled */

  card.addEventListener('pointermove', e => {
    if (!dragging) return;
    const parent = frame.getBoundingClientRect();
    dx = e.clientX - parent.left - pointerOffset.x;
    dy = e.clientY - parent.top - pointerOffset.y - px('--rope-length');
    draw();

    if (stays && dy > 0){
      window.scrollTo(0, Math.min(dy * PULL_GAIN, stays.offsetTop));
    }
  });

  function release(e){
    if (!dragging) return;
    dragging = false;
    card.classList.remove('is-dragging');
    if (e){ try { card.releasePointerCapture(e.pointerId); } catch {} }

    /* pulled far enough -- let it open the rest of the way, else fall back */
    if (stays && window.scrollY > 0){
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const target = window.scrollY > stays.offsetTop * 0.3 ? stays.offsetTop : 0;
      window.scrollTo({ top: target, behavior: reduce ? 'auto' : 'smooth' });
    }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches){
      dx = dy = vx = vy = 0;
      draw();
      return;
    }
    if (!running){
      running = true;
      lastTime = performance.now();
      requestAnimationFrame(frameTick);
    }
  }

  card.addEventListener('pointerup', release);
  card.addEventListener('pointercancel', release);
  window.addEventListener('resize', draw);

  /* ---- entrance ----
     The key starts above the viewport and drops on the same spring it
     uses when released, so the rope pays out behind it and it settles
     with a bounce rather than simply appearing. */
  if (matchMedia('(prefers-reduced-motion: reduce)').matches){
    draw();
  } else {
    dy = -(px('--rope-length') + card.offsetHeight + 80);
    draw();                       /* paint it off-screen before first frame */
    setTimeout(() => {
      if (dragging || running) return;
      running = true;
      lastTime = performance.now();
      requestAnimationFrame(frameTick);
    }, 180);
  }
})();

/* ===== KEY SCREEN RELEASE =====
   The title and the key are position:fixed, so without this they would sit
   on top of the list forever. Fade them out across the first viewport and
   stop them intercepting clicks once gone.
*/
(() => {
  const title = document.querySelector('.section-title');
  const hang  = document.querySelector('.hanging');
  if (!title && !hang) return;

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  const head = document.querySelector('.page-head');
  const screen = document.querySelector('.key-screen');

  function update(){
    /* hold at full strength across most of the key screen and only let go
       at the end, so the title and key overlap the list on the way out */
    /* measured off the key screen itself rather than window.innerHeight:
       the two are the same number on a desktop, but on a phone the screen
       is 100svh (the viewport with the browser toolbars showing) while
       innerHeight grows as those toolbars retract -- and the fade has to
       finish when the list arrives, not a toolbar's worth of scroll later */
    const vh = (screen && screen.offsetHeight) || window.innerHeight;
    const hold = vh * 0.60;                          /* no fade before this */
    const fade = vh * 0.35;                          /* gone by ~95% of a screen */
    const o = clamp(1 - (window.scrollY - hold) / fade, 0, 1);
    [title, hang].forEach(el => {
      if (!el) return;
      el.style.opacity = o.toFixed(3);
      el.style.pointerEvents = o < 0.05 ? 'none' : '';
    });
    if (head) head.classList.toggle('is-solid', window.scrollY > hold + fade * 0.6);
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
