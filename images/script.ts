interface ConfettiConfig {
    maxCount: number; // Max confetti count
    speed: number; // Particle animation speed
    frameInterval: number; // Animation frame interval in ms
    alpha: number; // Confetti opacity (between 0 and 1)
    gradient: boolean; // Use gradients for particles
    start?: (timeout?: number, min?: number, max?: number) => void; // Start confetti
    stop?: () => void; // Stop adding confetti
    toggle?: () => void; // Start or stop confetti animation
    pause?: () => void; // Freeze confetti animation
    resume?: () => void; // Unfreeze confetti animation
    togglePause?: () => void; // Toggle paused state
    remove?: () => void; // Stop and remove all confetti
    isPaused?: () => boolean; // Check if animation is paused
    isRunning?: () => boolean; // Check if confetti is running
}

const confetti: ConfettiConfig = {
    maxCount: 150,
    speed: 2,
    frameInterval: 15,
    alpha: 1.0,
    gradient: false
};

(function() {
    let colors: string[] = [
        "rgba(30,144,255,", "rgba(107,142,35,", "rgba(255,215,0,", 
        "rgba(255,192,203,", "rgba(106,90,205,", "rgba(173,216,230,", 
        "rgba(238,130,238,", "rgba(152,251,152,", "rgba(70,130,180,", 
        "rgba(244,164,96,", "rgba(210,105,30,", "rgba(220,20,60,"
    ];
    
    let streamingConfetti: boolean = false;
    let animationTimer: number | null = null;
    let pause: boolean = false;
    let lastFrameTime: number = Date.now();
    let particles: any[] = [];
    let waveAngle: number = 0;
    let context: CanvasRenderingContext2D | null = null;

    confetti.start = startConfetti;
    confetti.stop = stopConfetti;
    confetti.toggle = toggleConfetti;
    confetti.pause = pauseConfetti;
    confetti.resume = resumeConfetti;
    confetti.togglePause = toggleConfettiPause;
    confetti.isPaused = isConfettiPaused;
    confetti.remove = removeConfetti;
    confetti.isRunning = isConfettiRunning;

    function resetParticle(particle: any, width: number, height: number): any {
        particle.color = colors[(Math.random() * colors.length) | 0] + (confetti.alpha + ")");
        particle.color2 = colors[(Math.random() * colors.length) | 0] + (confetti.alpha + ")");
        particle.x = Math.random() * width;
        particle.y = Math.random() * height - height;
        particle.diameter = Math.random() * 10 + 5;
        particle.tilt = Math.random() * 10 - 10;
        particle.tiltAngleIncrement = Math.random() * 0.07 + 0.05;
        particle.tiltAngle = Math.random() * Math.PI;
        return particle;
    }

    function toggleConfettiPause(): void {
        if (pause) resumeConfetti();
        else pauseConfetti();
    }

    function isConfettiPaused(): boolean {
        return pause;
    }

    function pauseConfetti(): void {
        pause = true;
    }

    function resumeConfetti(): void {
        pause = false;
        runAnimation();
    }

    function runAnimation(): void {
        if (pause) return;
        else if (particles.length === 0) {
            context?.clearRect(0, 0, window.innerWidth, window.innerHeight);
            animationTimer = null;
        } else {
            const now: number = Date.now();
            const delta: number = now - lastFrameTime;

            if (delta > confetti.frameInterval) {
                context?.clearRect(0, 0, window.innerWidth, window.innerHeight);
                updateParticles();
                drawParticles(context!);
                lastFrameTime = now - (delta % confetti.frameInterval);
            }
            animationTimer = requestAnimationFrame(runAnimation);
        }
    }

    function startConfetti(timeout?: number, min?: number, max?: number): void {
        const width: number = window.innerWidth;
        const height: number = window.innerHeight;

        const canvas: HTMLCanvasElement | null = document.getElementById("confetti-canvas") as HTMLCanvasElement;
        if (!canvas) {
            const newCanvas: HTMLCanvasElement = document.createElement("canvas");
            newCanvas.setAttribute("id", "confetti-canvas");
            newCanvas.setAttribute("style", "display:block;z-index:999999;pointer-events:none;position:fixed;top:0");
            document.body.prepend(newCanvas);
            newCanvas.width = width;
            newCanvas.height = height;
            window.addEventListener("resize", () => {
                newCanvas.width = window.innerWidth;
                newCanvas.height = window.innerHeight;
            });
            context = newCanvas.getContext("2d");
        } else {
            context = canvas.getContext("2d");
        }

        let count = confetti.maxCount;
        if (min && max) {
            count = min === max ? particles.length + max : particles.length + ((Math.random() * (max - min) + min) | 0);
        } else if (min) {
            count = particles.length + min;
        } else if (max) {
            count = particles.length + max;
        }

        while (particles.length < count) {
            particles.push(resetParticle({}, width, height));
        }

        streamingConfetti = true;
        pause = false;
        runAnimation();

        if (timeout) {
            window.setTimeout(stopConfetti, timeout);
        }
    }

    function stopConfetti(): void {
        streamingConfetti = false;
    }

    function removeConfetti(): void {
        stopConfetti();
        pause = false;
        particles = [];
    }

    function toggleConfetti(): void {
        if (streamingConfetti) stopConfetti();
        else startConfetti();
    }

    function isConfettiRunning(): boolean {
        return streamingConfetti;
    }

    function drawParticles(context: CanvasRenderingContext2D): void {
        particles.forEach(particle => {
            context.beginPath();
            context.lineWidth = particle.diameter;
            const x2 = particle.x + particle.tilt;
            const x = x2 + particle.diameter / 2;
            const y2 = particle.y + particle.tilt + particle.diameter / 2;

            if (confetti.gradient) {
                const gradient = context.createLinearGradient(x, particle.y, x2, y2);
                gradient.addColorStop(0, particle.color);
                gradient.addColorStop(1.0, particle.color2);
                context.strokeStyle = gradient;
            } else {
                context.strokeStyle = particle.color;
            }

            context.moveTo(x, particle.y);
            context.lineTo(x2, y2);
            context.stroke();
        });
    }

    function updateParticles(): void {
        const width: number = window.innerWidth;
        const height: number = window.innerHeight;

        waveAngle += 0.01;
        particles.forEach((particle, i) => {
            if (!streamingConfetti && particle.y < -15) {
                particle.y = height + 100;
            } else {
                particle.tiltAngle += particle.tiltAngleIncrement;
                particle.x += Math.sin(waveAngle) - 0.5;
                particle.y += (Math.cos(waveAngle) + particle.diameter + confetti.speed) * 0.5;
                particle.tilt = Math.sin(particle.tiltAngle) * 15;
            }

            if (particle.x > width + 20 || particle.x < -20 || particle.y > height) {
                if (streamingConfetti && particles.length <= confetti.maxCount) {
                    resetParticle(particle, width, height);
                } else {
                    particles.splice(i, 1);
                }
            }
        });
    }
})();
