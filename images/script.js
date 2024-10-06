"use strict";
const confetti = {
    maxCount: 150,
    speed: 2,
    frameInterval: 15,
    alpha: 1.0,
    gradient: false
};
(function () {
    let colors = [
        "rgba(30,144,255,", "rgba(107,142,35,", "rgba(255,215,0,",
        "rgba(255,192,203,", "rgba(106,90,205,", "rgba(173,216,230,",
        "rgba(238,130,238,", "rgba(152,251,152,", "rgba(70,130,180,",
        "rgba(244,164,96,", "rgba(210,105,30,", "rgba(220,20,60,"
    ];
    let streamingConfetti = false;
    let animationTimer = null;
    let pause = false;
    let lastFrameTime = Date.now();
    let particles = [];
    let waveAngle = 0;
    let context = null;
    confetti.start = startConfetti;
    confetti.stop = stopConfetti;
    confetti.toggle = toggleConfetti;
    confetti.pause = pauseConfetti;
    confetti.resume = resumeConfetti;
    confetti.togglePause = toggleConfettiPause;
    confetti.isPaused = isConfettiPaused;
    confetti.remove = removeConfetti;
    confetti.isRunning = isConfettiRunning;
    function resetParticle(particle, width, height) {
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
    function toggleConfettiPause() {
        if (pause)
            resumeConfetti();
        else
            pauseConfetti();
    }
    function isConfettiPaused() {
        return pause;
    }
    function pauseConfetti() {
        pause = true;
    }
    function resumeConfetti() {
        pause = false;
        runAnimation();
    }
    function runAnimation() {
        if (pause)
            return;
        else if (particles.length === 0) {
            context?.clearRect(0, 0, window.innerWidth, window.innerHeight);
            animationTimer = null;
        }
        else {
            const now = Date.now();
            const delta = now - lastFrameTime;
            if (delta > confetti.frameInterval) {
                context?.clearRect(0, 0, window.innerWidth, window.innerHeight);
                updateParticles();
                drawParticles(context);
                lastFrameTime = now - (delta % confetti.frameInterval);
            }
            animationTimer = requestAnimationFrame(runAnimation);
        }
    }
    function startConfetti(timeout, min, max) {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const canvas = document.getElementById("confetti-canvas");
        if (!canvas) {
            const newCanvas = document.createElement("canvas");
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
        }
        else {
            context = canvas.getContext("2d");
        }
        let count = confetti.maxCount;
        if (min && max) {
            count = min === max ? particles.length + max : particles.length + ((Math.random() * (max - min) + min) | 0);
        }
        else if (min) {
            count = particles.length + min;
        }
        else if (max) {
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
    function stopConfetti() {
        streamingConfetti = false;
    }
    function removeConfetti() {
        stopConfetti();
        pause = false;
        particles = [];
    }
    function toggleConfetti() {
        if (streamingConfetti)
            stopConfetti();
        else
            startConfetti();
    }
    function isConfettiRunning() {
        return streamingConfetti;
    }
    function drawParticles(context) {
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
            }
            else {
                context.strokeStyle = particle.color;
            }
            context.moveTo(x, particle.y);
            context.lineTo(x2, y2);
            context.stroke();
        });
    }
    function updateParticles() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        waveAngle += 0.01;
        particles.forEach((particle, i) => {
            if (!streamingConfetti && particle.y < -15) {
                particle.y = height + 100;
            }
            else {
                particle.tiltAngle += particle.tiltAngleIncrement;
                particle.x += Math.sin(waveAngle) - 0.5;
                particle.y += (Math.cos(waveAngle) + particle.diameter + confetti.speed) * 0.5;
                particle.tilt = Math.sin(particle.tiltAngle) * 15;
            }
            if (particle.x > width + 20 || particle.x < -20 || particle.y > height) {
                if (streamingConfetti && particles.length <= confetti.maxCount) {
                    resetParticle(particle, width, height);
                }
                else {
                    particles.splice(i, 1);
                }
            }
        });
    }
})();
