gsap.registerPlugin(ScrollTrigger);

// Initialize Lenis for smooth scrolling
const lenis = new Lenis();
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

// Select elements
const stickyCards = document.querySelector(".sticky-cards");
const frontCard = document.querySelector(".card-front");
const backCards = document.querySelectorAll(".card-back");
const heroHeadline = document.querySelector(".hero-content h1");

// Animation Milestones (in Viewport Height units)
const CARDS_ENTER_END = 90;
const CARD_FLIP_START = 105;
const CARD_FLIP_END = 185;
const CARD_DISMISS_START = 260;
const CARD_DISMISS_DURATION = 70;

const totalScroll = (CARD_DISMISS_START + (backCards.length * CARD_DISMISS_DURATION));

// Helper: Convert VH to normalized progress (0-1)
const vhToProgress = (vh) => vh / totalScroll;

// Individual tilt angles for the fan-out effect
const flipAngles = [-10, -20, 5, 10];
const dismissAngles = [-50, -60, -45, 50];

// Main ScrollTrigger
ScrollTrigger.create({
    trigger: ".hero",
    start: "top top",
    end: `+=${totalScroll}%`,
    pin: true,
    pinSpacing: true,
    scrub: true,
    onUpdate: (self) => {
        const p = self.progress;

        // 1. Entrance Phase: Cards move up, Headline moves away
        const enterP = gsap.utils.clamp(0, 1, gsap.utils.mapRange(0, vhToProgress(CARDS_ENTER_END), 0, 1, p));
        gsap.set(stickyCards, { y: gsap.utils.mapRange(0, 1, 1000, 0, enterP) });
        gsap.set(heroHeadline, { y: gsap.utils.mapRange(0, 1, 0, -1000, enterP) });

        // 2. Flip Phase: interpolate the deck so it stays reversible.
        const flipP = gsap.utils.clamp(0, 1, gsap.utils.mapRange(
            vhToProgress(CARD_FLIP_START),
            vhToProgress(CARD_FLIP_END),
            0,
            1,
            p
        ));
        gsap.set(frontCard, { rotationY: 180 * flipP });
        backCards.forEach((card, i) => {
            gsap.set(card, {
                rotationY: -180 + (180 * flipP),
                rotationZ: flipAngles[i] * flipP
            });
        });

        // 3. Dismissal Phase: Cards fly off one by one
        backCards.forEach((card, i) => {
            // Dismissal happens in reverse order (top card first)
            const order = (backCards.length - 1) - i;
            const start = vhToProgress(CARD_DISMISS_START + (order * CARD_DISMISS_DURATION));
            const end = start + vhToProgress(CARD_DISMISS_DURATION);
            
            const dismissP = gsap.utils.clamp(0, 1, gsap.utils.mapRange(start, end, 0, 1, p));
            
            if (dismissP > 0) {
                gsap.set(card, {
                    y: gsap.utils.mapRange(0, 1, 0, -window.innerHeight * 1.2, dismissP),
                    rotationZ: gsap.utils.mapRange(0, 1, flipAngles[i], dismissAngles[i], dismissP),
                    scale: gsap.utils.mapRange(0, 1, 1, 0.88, dismissP),
                    opacity: 1 - (dismissP * 0.35)
                });
            } else {
                gsap.set(card, { y: 0, scale: 1, opacity: 1 });
            }
        });
    }
});

// Set initial states
gsap.set(frontCard, { rotationY: 0 });
gsap.set(backCards, { rotationY: -180, transformOrigin: "50% 50%" });