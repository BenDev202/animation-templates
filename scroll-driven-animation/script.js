const { gsap, ScrollTrigger, Lenis } = window;

document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger);

  const lenis = new Lenis();
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  const nav = document.querySelector("nav");
  const header = document.querySelector(".header");
  const heroImg = document.querySelector(".hero-img");
  const canvas = document.querySelector("canvas");
  const context = canvas.getContext("2d");

  const setCanvasSize = () => {
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * pixelRatio;
    canvas.height = window.innerHeight * pixelRatio;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.scale(pixelRatio, pixelRatio);
  };

  setCanvasSize();

  const frameCount = 210;
  const animationFrames = Array.from({ length: frameCount }, (_, index) => index + 1).filter(
    (frameNumber) => frameNumber !== 26
  );
  const currentFrame = (index) =>
    `./frames/frame_${animationFrames[index].toString().padStart(4, "0")}.jpg`;

  let images = [];
  let videoFrames = { frame: 0 };
  let imagesToLoad = animationFrames.length;

  const onload = () => {
    imagesToLoad--;
    if (imagesToLoad === 0) {
      render();
      setupScrollTrigger();
    }
  };

  for (let i = 0; i < animationFrames.length; i++) {
    const img = new Image();
    img.onload = onload;
    img.onerror = function () {
      onload.call(this);
    };
    img.src = currentFrame(i);
    images.push(img);
  }

  const render = () => {
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;

    context.clearRect(0, 0, canvasWidth, canvasHeight);

    const img = images[videoFrames.frame];
    if (img && img.complete && img.naturalWidth > 0) {
      const imageAspect = img.naturalWidth / img.naturalHeight;
      const canvasAspect = canvasWidth / canvasHeight;

      let drawWidth, drawHeight, drawX, drawY;

      if (imageAspect > canvasAspect) {
        drawHeight = canvasHeight;
        drawWidth = drawHeight * imageAspect;
        drawX = (canvasWidth - drawWidth) / 2;
        drawY = 0;
      } else {
        drawWidth = canvasWidth;
        drawHeight = drawWidth / imageAspect;
        drawX = 0;
        drawY = (canvasHeight - drawHeight) / 2;
      }

      context.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    }
  };

  const setupScrollTrigger = () => {
    ScrollTrigger.create({
      trigger: ".hero",
      start: "top top",
      end: `+=${window.innerHeight * 7}px`,
      pin: true,
      pinSpacing: true,
      scrub: 1,
      onUpdate: (self) => {
        const progress = self.progress;

        const animationProgress = Math.min(progress / 0.9, 1);
        const targetFrame = Math.round(animationProgress * (animationFrames.length - 1));

        videoFrames.frame = targetFrame;
        render();

        // Nav fade out
        if (progress <= 0.1) {
          const navProgress = progress / 0.1;
          const opacity = 1 - navProgress;
          gsap.set(nav, { opacity: opacity });
        } else {
          gsap.set(nav, { opacity: 0 });
        }

        // Header move and fade
        if (progress <= 0.25) {
          const zProgress = progress / 0.25;
          const transZ = zProgress * -500;

          let opacity = 1;
          if (progress >= 0.2) {
            const fadeProgress = Math.min((progress - 0.2) / (0.25 - 0.2), 1);
            opacity = 1 - fadeProgress;
          }

          gsap.set(header, {
            transform: `translate(-50%, -50%) translateZ(${transZ}px)`,
            opacity: opacity,
          });
        } else {
          gsap.set(header, { opacity: 0 });
        }

        // Dashboard image reveal
        if (progress < 0.6) {
          gsap.set(heroImg, { transform: "translateZ(1000px)", opacity: 0 });
        } else if (progress >= 0.6 && progress <= 0.9) {
          const imgProgress = (progress - 0.6) / 0.3;
          const transZ = 1000 - imgProgress * 1000;

          let opacity = 0;
          if (progress <= 0.8) {
            const opacityProgress = (progress - 0.6) / 0.2;
            opacity = opacityProgress;
          } else {
            opacity = 1;
          }

          gsap.set(heroImg, {
            transform: `translateZ(${transZ}px)`,
            opacity: opacity,
          });
        } else {
          gsap.set(heroImg, { transform: "translateZ(0px)", opacity: 1 });
        }
      },
    });
  };

  window.addEventListener("resize", () => {
    setCanvasSize();
    render();
    ScrollTrigger.refresh();
  });
});