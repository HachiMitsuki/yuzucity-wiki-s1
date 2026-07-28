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
            scrollTrigger: { trigger: heroSection, start: 'top top', end: 'bottom top', scrub: true },
          });
        },
      }
    );
  }

  // Fixed full-viewport background: one backdrop pinned behind the whole
  // page (see .yc-fixed-bg in styles.css) that crossfades between chapter
  // photos at chapter boundaries, instead of each chapter carrying its own
  // photo that scrolls along with it. Two stacked layers ping-pong so the
  // outgoing image can fade out while the incoming one fades in, with
  // neither ever both being transparent (no flash of the black base showing
  // through mid-crossfade — not that it'd be wrong here, just avoids a
  // needless double-fade dip).
  const bgLayers = document.querySelectorAll('.yc-fixed-bg-layer');
  const YC_CHAPTER_TINT = 'rgba(6,6,6,.76)';
  let activeBgLayer = 0;
  let activeBgUrl = null;
  function setChapterBackground(url){
    if (!bgLayers.length || url === activeBgUrl) return;
    activeBgUrl = url;
    const outgoing = bgLayers[activeBgLayer];
    const incoming = bgLayers[1 - activeBgLayer];
    incoming.style.backgroundImage = `linear-gradient(${YC_CHAPTER_TINT}, ${YC_CHAPTER_TINT}), url('${url}')`;
    gsap.to(incoming, { opacity: 1, duration: 1, ease: 'power1.inOut' });
    gsap.to(outgoing, { opacity: 0, duration: 1, ease: 'power1.inOut' });
    activeBgLayer = 1 - activeBgLayer;
  }
  function clearChapterBackground(){
    if (activeBgUrl === null) return;
    activeBgUrl = null;
    gsap.to(bgLayers[activeBgLayer], { opacity: 0, duration: 1, ease: 'power1.inOut' });
  }
  const bgChapters = document.querySelectorAll('.yc-chapter[data-bg]');
  bgChapters.forEach((ch, i) => {
    const url = ch.dataset.bg;
    ScrollTrigger.create({
      trigger: ch,
      start: 'top 60%',
      end: 'bottom 60%',
      onEnter: () => setChapterBackground(url),
      onEnterBack: () => setChapterBackground(url),
      // Only the very first/last photo chapter needs to hand off to
      // "no photo" — every other boundary is just one chapter's onEnter(Back)
      // immediately followed by the next chapter's, so the crossfade already
      // happens naturally between the two real images.
      onLeaveBack: i === 0 ? clearChapterBackground : undefined,
      onLeave: i === bgChapters.length - 1 ? clearChapterBackground : undefined,
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
        scrub: true,
      },
    });
  }
});
