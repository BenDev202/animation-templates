// Register GSAP Plugin
gsap.registerPlugin(ScrollTrigger);

// Initialize Lenis for Smooth Scrolling
const lenis = new Lenis();
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

// Data for animations
const leftXValues = [-800, -900, -400];
const rightXValues = [800, 900, 400];
const leftRotationValues = [-30, -20, -35];
const rightRotationValues = [30, 20, 35];
const yValues = [100, -150, -400];

// Generate Rows and Cards
const mainSection = document.querySelector('.main');
function generateRows() {
    for (let i = 1; i <= 3; i++) {
        const row = document.createElement('div');
        row.className = 'row';
        
        // Left Card
        const cardLeft = document.createElement('div');
        cardLeft.className = 'card card-left';
        cardLeft.innerHTML = `<img src="img-${(i * 2) - 1}.jpg" alt="">`;
        
        // Right Card
        const cardRight = document.createElement('div');
        cardRight.className = 'card card-right';
        cardRight.innerHTML = `<img src="img-${i * 2}.jpg" alt="">`;
        
        row.appendChild(cardLeft);
        row.appendChild(cardRight);
        mainSection.prepend(row); // Add rows before the main-content
    }
}

generateRows();

// ScrollTrigger Settings
const scrollSettings = {
    trigger: ".main",
    start: "top 25%",
    toggleActions: "play reverse play reverse",
};

// 1. Animate Cards on Scroll
const rows = gsap.utils.toArray(".row");
rows.forEach((row, index) => {
    const cardLeft = row.querySelector(".card-left");
    const cardRight = row.querySelector(".card-right");

    gsap.to(row, {
        scrollTrigger: {
            trigger: ".main",
            start: "top center",
            end: "150% bottom",
            scrub: true,
            onUpdate: (self) => {
                const progress = self.progress;
                
                // Left card transform
                cardLeft.style.transform = `
                    translateX(${progress * leftXValues[index]}px) 
                    translateY(${progress * yValues[index]}px) 
                    rotate(${progress * leftRotationValues[index]}deg)`;

                // Right card transform
                cardRight.style.transform = `
                    translateX(${progress * rightXValues[index]}px) 
                    translateY(${progress * yValues[index]}px) 
                    rotate(${progress * rightRotationValues[index]}deg)`;
            }
        }
    });
});

// 2. Animate Central Logo
gsap.to(".logo", {
    scale: 1,
    duration: 0.5,
    ease: "power1.out",
    scrollTrigger: scrollSettings
});

// 3. Animate Text Copy (Staggered Reveal)
gsap.to(".line", {
    clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
    duration: 0.5,
    stagger: 0.1,
    ease: "power1.out",
    scrollTrigger: scrollSettings
});

gsap.to(".line p", {
    y: 0,
    duration: 0.5,
    stagger: 0.1,
    ease: "power1.out",
    scrollTrigger: scrollSettings
});

// 4. Animate Button
gsap.to(".btn button", {
    y: 0,
    opacity: 1,
    delay: 0.25,
    duration: 0.5,
    ease: "power1.out",
    scrollTrigger: scrollSettings
});