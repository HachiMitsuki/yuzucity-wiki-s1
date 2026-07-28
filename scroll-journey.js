// Index-only scroll-driven animation, powered by GSAP + ScrollTrigger —
// the standard tool for this on real-world sites (used under the hood by
// most agency/campaign "things appear as you scroll" pages). scrub ties
// animation progress directly to scroll position: pause mid-scroll and the
// motion pauses, scroll back up and it plays in reverse.
document.addEventListener('DOMContentLoaded', () => {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  const DIRECTIONS = {
    up:      { from: { opacity: 0, y: 64 },                          to: { opacity: 1, y: 0 } },
    left:    { from: { opacity: 0, x: -110, rotate: -2 },            to: { opacity: 1, x: 0, rotate: 0 } },
    right:   { from: { opacity: 0, x: 110, rotate: 2 },              to: { opacity: 1, x: 0, rotate: 0 } },
    scale:   { from: { opacity: 0, scale: .7 },                      to: { opacity: 1, scale: 1 } },
    pop:     { from: { opacity: 0, scale: .3, rotate: -6 },          to: { opacity: 1, scale: 1, rotate: 0 } },
    chapter: { from: { opacity: 0, y: 40, scale: .985 },             to: { opacity: 1, y: 0, scale: 1 } },
  };

  document.querySelectorAll('[data-reveal]').forEach(el => {
    const dir = el.dataset.reveal;
    const cfg = DIRECTIONS[dir] || DIRECTIONS.up;
    const isChapter = dir === 'chapter';
    gsap.fromTo(el, cfg.from, {
      ...cfg.to,
      ease: 'none',
      scrollTrigger: {
        trigger: el,
        start: 'top 92%',
        end: isChapter ? 'top 45%' : 'top 62%',
        scrub: 0.6,
      },
    });
  });

  // History timeline connecting line — grows/shrinks with scroll through
  // the whole timeline section, not just its entry edge.
  const line = document.querySelector('.yc-timeline-line');
  const track = document.querySelector('.yc-timeline');
  if (line && track){
    gsap.fromTo(line, { scaleY: 0 }, {
      scaleY: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: track,
        start: 'top 75%',
        end: 'bottom 55%',
        scrub: 0.6,
      },
    });
  }
});
