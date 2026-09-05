const navToggler = document.querySelector(".nav-toggler");
const menuOverlay = document.querySelector(".menu-overlay");
const menuOverlayBg = document.querySelector(".menu-overlay-bg");
const player = document.querySelector(".player");
const tapes = document.querySelectorAll(".tape");

let isMenuOpen = false;
const isMobile = window.matchMedia("(max-width: 1000px)").matches;
const playerFinalY = window.innerHeight >= 900 ? 125 : 175;

// 1. SET INITIAL POSITIONS
gsap.set(player, { yPercent: 300, rotation: 30 });
gsap.set(tapes, { yPercent: 325, rotation: 30 });

// 2. OPEN TIMELINE
const openTL = gsap.timeline({
    paused: true,
    defaults: { ease: "power3.out", duration: 1 }
});

openTL
    .to(menuOverlay, { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" }, 0)
    .to(menuOverlayBg, { y: "-25%" }, 0)
    .to([player, tapes], { yPercent: 0, rotation: -15, duration: 1 }, 0.2)
    .to(tapes, { yPercent: -17, rotation: 0, duration: 0.5 }, "-=0.5")
    .to(player, { 
        yPercent: playerFinalY, 
        rotation: 0, 
        duration: 1 
    }, 1.1)
    .to(tapes, {
        // Center the four tapes and space them evenly in a row.
        xPercent: (i) => (i - 1.5) * 110,
        yPercent: 0,
        rotation: 0,
        duration: 1,
        stagger: 0.05
    }, 1.1);

// 3. CLOSE TIMELINE
const closeTL = gsap.timeline({
    paused: true,
    defaults: { ease: "power3.inOut", duration: 0.75 }
});

closeTL
    .to(tapes, {
        xPercent: 0,
        yPercent: isMobile ? 0 : 0,
        stagger: 0.035,
        duration: 0.6
    })
    // Cassette "Click" effect
    .to(player, {
        keyframes: {
            yPercent: [playerFinalY + 10, playerFinalY, playerFinalY + 10],
            rotation: [0, -2, 0]
        },
        duration: 0.35
    }, "-=0.35")
    .to([player, tapes], { yPercent: 300, duration: 0.5 }, "+=0.1")
    .to(menuOverlay, { clipPath: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)" })
    .to(menuOverlayBg, { y: "25%" }, "-=0.75");

// TOGGLE LOGIC
navToggler.addEventListener("click", () => {
    if (!isMenuOpen) {
        openTL.restart();
        navToggler.innerText = "CLOSE";
    } else {
        closeTL.restart();
        navToggler.innerText = "MENU";
    }
    isMenuOpen = !isMenuOpen;
});

