// Index-only extras that don't exist on any other page: the logo splash
// and the history timeline's connecting line. Everything else (Lenis setup,
// [data-reveal] scroll-scrubbed reveals) is handled site-wide by common.js
// — this file must not duplicate that or elements would get double-bound.
document.addEventListener('DOMContentLoaded', () => {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  // Logo intro — plays once automatically on page load, NOT tied to scroll.
  const logo = document.querySelector('.yc-hero-logo');
  if (logo){
    gsap.fromTo(logo,
      { opacity: 0, scale: .82, y: 26 },
      { opacity: 1, scale: 1, y: 0, duration: 1.3, ease: 'power3.out', delay: .15 }
    );
  }

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
