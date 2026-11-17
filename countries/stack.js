/* ===== SCROLL STACK PANELS =====
   Ported from the Framer ScrollStackPanels component. Panel i slides from
   100vw to (i * sliver)vw over the first `REVEAL_RATIO` of its slot, then
   holds parked for the rest of it.

   Scroll progress is fed through a real spring rather than tracked 1:1, so
   the slide-in trails the scrollbar instead of snapping to it.
*/
(() => {
  const stack = document.getElementById('stack');
  if (!stack) return;

  const panels = [...stack.querySelectorAll('.panel')];
  if (!panels.length) return;

  const REVEAL_RATIO = 0.55;   /* slide for 55% of the slot, hold for 45% */
  const STIFFNESS    = 280;
  const DAMPING      = 34;
  const MASS         = 1;

  stack.style.setProperty('--count', panels.length);

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const sliver = () =>
    parseFloat(getComputedStyle(stack).getPropertyValue('--sliver')) || 9.7;

  /* raw 0..1 across the track: 0 when its top meets the viewport top,
     1 when its bottom meets the viewport bottom */
  function rawProgress(){
    const total = stack.offsetHeight - window.innerHeight;
    if (total <= 0) return 0;
    return clamp(-stack.getBoundingClientRect().top / total, 0, 1);
  }

  function paint(p){
    /* the first panel is the landing state -- it is already in place at
       scroll 0, so only the remaining panels share the scroll range */
    const sliding = Math.max(panels.length - 1, 1);
    const slot = 1 / sliding;
    const s = sliver();
    panels.forEach((el, i) => {
      el.style.zIndex = i + 1;
      if (i === 0){
        el.style.transform = 'translateX(0vw)';
        return;
      }
      const start = (i - 1) * slot;
      const end   = start + slot * REVEAL_RATIO;
      /* clamped either side, so a panel that has arrived stays parked
         at its sliver offset through its hold period */
      const t = clamp((p - start) / (end - start), 0, 1);
      const x = 100 + (i * s - 100) * t;
      el.style.transform = `translateX(${x.toFixed(3)}vw)`;
    });
  }

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let value = rawProgress();
  let velocity = 0;
  let target = value;
  let running = false;
  let lastTime = 0;

  function frame(now){
    const dt = Math.min((now - lastTime) / 1000, 1 / 30);  /* cap after a stall */
    lastTime = now;

    /* same spring model as framer-motion's useSpring */
    const force  = -STIFFNESS * (value - target);
    const damper = -DAMPING * velocity;
    velocity += ((force + damper) / MASS) * dt;
    value    += velocity * dt;

    paint(value);

    if (Math.abs(value - target) < 0.00005 && Math.abs(velocity) < 0.00005){
      value = target;
      velocity = 0;
      paint(value);
      running = false;
      return;
    }
    requestAnimationFrame(frame);
  }

  function onScroll(){
    target = rawProgress();
    if (reduced){ value = target; velocity = 0; paint(value); return; }
    if (!running){
      running = true;
      lastTime = performance.now();
      requestAnimationFrame(frame);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { target = rawProgress(); value = target; velocity = 0; paint(value); });

  paint(value);
})();

/* ===== SECTION TRANSITION =====
   Clicking a section word lifts it from the panel to the top centre of the
   viewport, then navigates. The destination page renders that word at the
   same size in the same place, so it reads as one continuous move.
*/
(() => {
  const links = [...document.querySelectorAll('.panel-link')];
  if (!links.length) return;

  const DURATION = 620;
  /* must match .section-title on the destination page */
  const END_WEIGHT = '800';
  const END_TRACKING = '-0.05em';
  const END_TOP_RATIO = 0.22;

  links.forEach(link => {
    link.addEventListener('click', e => {
      /* leave modified clicks to the browser so open-in-new-tab still works */
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      e.preventDefault();

      const panel = link.closest('.panel');
      const from = link.getBoundingClientRect();

      /* wash the panel colour over everything so the stacked panels behind
         don't slide past while the word travels */
      const wash = document.createElement('div');
      /* the panel's own colour IS the destination page's ground, so read it
         straight off the panel -- a separate attribute only drifts */
      wash.style.cssText =
        `position:fixed;inset:0;z-index:400;pointer-events:none;` +
        `background:${getComputedStyle(panel).backgroundColor};`;
      document.body.appendChild(wash);

      /* a clone travels, so the original can stay put under the wash */
      const flier = link.cloneNode(true);
      flier.style.cssText =
        `position:fixed;left:${from.left}px;top:${from.top}px;margin:0;z-index:401;` +
        `color:${getComputedStyle(link).color};pointer-events:none;` +
        `font:${getComputedStyle(link).font};letter-spacing:${getComputedStyle(link).letterSpacing};` +
        `text-transform:uppercase;line-height:0.85;`;
      document.body.appendChild(flier);

      /* measure the word at its destination weight, because thinning it
         changes its width and therefore where "centred" actually is */
      const probe = link.cloneNode(true);
      probe.style.cssText = flier.style.cssText +
        `visibility:hidden;font-weight:${END_WEIGHT};letter-spacing:${END_TRACKING};`;
      document.body.appendChild(probe);
      const to = probe.getBoundingClientRect();
      probe.remove();

      const dx = (window.innerWidth - to.width) / 2 - from.left;
      const dy = (window.innerHeight * END_TOP_RATIO - to.height / 2) - from.top;

      flier.animate(
        [
          { transform: 'translate(0,0)', fontWeight: getComputedStyle(link).fontWeight,
            letterSpacing: getComputedStyle(link).letterSpacing },
          { transform: `translate(${dx}px, ${dy}px)`, fontWeight: END_WEIGHT,
            letterSpacing: END_TRACKING }
        ],
        { duration: DURATION, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' }
      );

      setTimeout(() => { window.location.href = link.getAttribute('href'); }, DURATION);
    });
  });
})();
