// Import GSAP and plugins (assumes you have them loaded via script tags or modules)
gsap.registerPlugin(ScrollTrigger);

// Initialize Lenis for smooth scrolling
const lenis = new Lenis({
  duration: 1.2,
  easing: t => t < 0.5 ? 2*t*t : -1+(4-2*t)*t,
  smoothWheel: true,
  smoothTouch: false,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// Select all message bubbles (questions and answers)
const messages = document.querySelectorAll('.message');

messages.forEach(message => {
  const row = message.parentElement; // .row
  const typing = message.querySelector('.typing-indicator');
  const paragraphs = message.querySelectorAll('.content p');

  // Measure natural size before collapsing
  const naturalWidth = message.offsetWidth;
  const naturalHeight = message.offsetHeight;

  // Lock width and min-height on row to prevent layout shift
  row.style.minHeight = naturalHeight + 'px';
  message.style.width = naturalWidth + 'px';

  // Collapse message to small circle with scale 0
  gsap.set(message, {
    width: 64,
    height: 64,
    borderRadius: '50%',
    padding: 0,
    scale: 0,
  });

  // Flag to control animation order on reverse
  let collapseWhenDone = false;

  // Timeline for circle popping in
  const enterTimeline = gsap.timeline({ paused: true });
  enterTimeline.to(message, {
    scale: 1,
    duration: 0.4,
    ease: 'back.out(1.7)',
  });

  // Timeline for expanding bubble
  const expandTimeline = gsap.timeline({
    paused: true,
    onReverseComplete: () => {
      if (collapseWhenDone) {
        collapseWhenDone = false;
        enterTimeline.reverse();
      }
    }
  });

  expandTimeline
    // Fade out typing dots
    .to(typing, { opacity: 0, duration: 0.2 })
    // Expand width, restore border radius and padding
    .to(message, {
      width: naturalWidth,
      borderRadius: '1rem',
      padding: '1rem 1.5rem',
      duration: 0.4,
      ease: 'power1.out',
    }, '<')
    // Expand height and vertical padding
    .to(message, {
      height: naturalHeight,
      paddingTop: '1rem',
      paddingBottom: '1rem',
      duration: 0.4,
      ease: 'power1.out',
    }, '-=0.2')
    // Fade in paragraphs staggered
    .to(paragraphs, {
      opacity: 1,
      stagger: 0.1,
      duration: 0.3,
      ease: 'power1.inOut',
    }, '-=0.25');

  // ScrollTrigger for circle pop-in
  ScrollTrigger.create({
    trigger: message,
    start: 'top 85%',
    onEnter: () => enterTimeline.play(),
    onLeaveBack: () => {
      if (expandTimeline.isActive() || expandTimeline.progress() > 0) {
        collapseWhenDone = true;
      } else {
        enterTimeline.reverse();
      }
    },
  });

  // ScrollTrigger for bubble expand
  ScrollTrigger.create({
    trigger: message,
    start: 'top 75%',
    onEnter: () => expandTimeline.play(),
    onLeaveBack: () => expandTimeline.reverse(),
  });
});
