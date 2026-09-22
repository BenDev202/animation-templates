(function () {
  if (!window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const messages = gsap.utils.toArray('.message');

  function initMessage(message) {
    const row = message.closest('.row');
    const typing = message.querySelector('.typing-indicator');
    const paragraphs = message.querySelectorAll('.content p');

    if (!row || !typing || !paragraphs.length) return;

    const naturalWidth = Math.min(message.scrollWidth || message.offsetWidth || 260, 500);
    const naturalHeight = message.scrollHeight || message.offsetHeight || 72;

    row.style.minHeight = `${naturalHeight}px`;

    gsap.set(message, {
      width: 64,
      height: 64,
      borderRadius: '50%',
      padding: 0,
      scale: 0,
      force3D: true,
      transformOrigin: 'center center',
      willChange: 'transform, width, height, border-radius, opacity',
    });

    gsap.set(paragraphs, {
      opacity: 0,
      y: 8,
      force3D: true,
    });

    const enterTimeline = gsap.timeline({ paused: true });
    enterTimeline.to(message, {
      scale: 1,
      duration: 0.34,
      ease: 'back.out(1.5)',
    });

    const expandTimeline = gsap.timeline({ paused: true });
    expandTimeline
      .to(typing, { opacity: 0, duration: 0.18, ease: 'power1.out' }, 0)
      .to(message, {
        width: naturalWidth,
        height: naturalHeight,
        borderRadius: '1.25rem',
        padding: '1rem 1.5rem',
        duration: 0.34,
        ease: 'power2.out',
      }, 0)
      .to(paragraphs, {
        opacity: 1,
        y: 0,
        stagger: 0.1,
        duration: 0.22,
        ease: 'power1.out',
      }, '-=0.12');

    if (prefersReducedMotion) {
      gsap.set(typing, { opacity: 0 });
      gsap.set(message, {
        width: naturalWidth,
        height: naturalHeight,
        borderRadius: '1.25rem',
        padding: '1rem 1.5rem',
        scale: 1,
      });
      gsap.set(paragraphs, { opacity: 1, y: 0 });
      return;
    }

    let collapseWhenDone = false;

    ScrollTrigger.create({
      trigger: message,
      start: 'top 85%',
      once: false,
      onEnter: () => enterTimeline.play(0),
      onLeaveBack: () => {
        if (expandTimeline.isActive() || expandTimeline.progress() > 0) {
          collapseWhenDone = true;
        } else {
          enterTimeline.reverse();
        }
      },
    });

    ScrollTrigger.create({
      trigger: message,
      start: 'top 75%',
      onEnter: () => expandTimeline.play(),
      onLeaveBack: () => expandTimeline.reverse(),
      onReverseComplete: () => {
        if (collapseWhenDone) {
          collapseWhenDone = false;
          enterTimeline.reverse();
        }
      },
    });
  }

  function setupFaq() {
    messages.forEach(initMessage);
    ScrollTrigger.refresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupFaq, { once: true });
  } else {
    setupFaq();
  }
})();
