// Index-only extras that don't exist on any other page: the logo splash
// and the history timeline's connecting line. Everything else (Lenis setup,
// [data-reveal] scroll-scrubbed reveals) is handled site-wide by common.js
// — this file must not duplicate that or elements would get double-bound.
document.addEventListener('DOMContentLoaded', () => {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  // Logo intro — plays once automatically on page load, NOT tied to scroll.
  const logo = document.querySelector('.yc-hero-logo');
  const heroSection = document.querySelector('.yc-chapter-hero');
  if (logo){
    gsap.fromTo(logo,
      { opacity: 0, scale: .82, y: 26 },
      {
        opacity: 1, scale: 1, y: 0, duration: 1.3, ease: 'power3.out', delay: .15,
        onComplete: () => {
          // Once you start scrolling, the logo dissolves away (instead of
          // just scrolling out of frame) so it reads as "logo fades out,
          // next chapter's photo fades in" rather than one hard cut. Created
          // only after the intro finishes — creating it earlier would fight
          // the intro tween for the same opacity/y properties (GSAP's
          // auto-overwrite would cancel the intro fade before it ever
          // played). The hero's own section never fades/scales as a block
          // (that was the bug — a shrinking full-bleed section reveals the
          // page's white background behind it), so this is the only motion
          // on the hero as it exits.
          if (!heroSection) return;
          gsap.to(logo, {
            opacity: 0,
            y: -30,
            ease: 'none',
            scrollTrigger: { trigger: heroSection, start: 'top top', end: 'bottom top', scrub: 0.6 },
          });
        },
      }
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
