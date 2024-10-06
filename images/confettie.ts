interface Particle {
	color: string;
	color2: string;
	x: number;
	y: number;
	diameter: number;
	tilt: number;
	tiltAngleIncrement: number;
	tiltAngle: number;
}

interface Confetti {
	maxCount: number;
	speed: number;
	frameInterval: number;
	alpha: number;
	gradient: boolean;
	start: (timeout?: number, min?: number, max?: number) => void;
	stop: () => void;
	toggle: () => void;
	pause: () => void;
	resume: () => void;
	togglePause: () => void;
	remove: () => void;
	isPaused: () => boolean;
	isRunning: () => boolean;
}

const confetti: Confetti = {
	maxCount: 150, // set max confetti count
	speed: 2, // set the particle animation speed
	frameInterval: 15, // the confetti animation frame interval in milliseconds
	alpha: 1.0, // the alpha opacity of the confetti (between 0 and 1)
	gradient: false, // whether to use gradients for the confetti particles
	start: startConfetti,
	stop: stopConfetti,
	toggle: toggleConfetti,
	pause: pauseConfetti,
	resume: resumeConfetti,
	togglePause: toggleConfettiPause,
	remove: removeConfetti,
	isPaused: isConfettiPaused,
	isRunning: isConfettiRunning,
};

(function () {
	let supportsAnimationFrame =
		window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame;
	const colors = [
		"rgba(30,144,255,", "rgba(107,142,35,", "rgba(255,215,0,", "rgba(255,192,203,", "rgba(106,90,205,", "rgba(173,216,230,", "rgba(238,130,238,", "rgba(152,251,152,", "rgba(70,130,180,", "rgba(244,164,96,", "rgba(210,105,30,", "rgba(220,20,60,",
	];
	let streamingConfetti = false;
	let animationTimer: number | null = null;
	let pause = false;
	let lastFrameTime = Date.now();
	let particles: Particle[] = [];
	let waveAngle = 0;
	let context: CanvasRenderingContext2D | null = null;

	function resetParticle(particle: Particle, width: number, height: number): Particle {
		particle.color = colors[(Math.random() * colors.length) | 0] + confetti.alpha + ")";
		particle.color2 = colors[(Math.random() * colors.length) | 0] + confetti.alpha + ")";
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
			const now = Date.now();
			const delta = now - lastFrameTime;
			if (!supportsAnimationFrame || delta > confetti.frameInterval) {
				context?.clearRect(0, 0, window.innerWidth, window.innerHeight);
				updateParticles();
				if (context) drawParticles(context);
				lastFrameTime = now - (delta % confetti.frameInterval);
			}
			animationTimer = requestAnimationFrame(runAnimation);
		}
	}

	function startConfetti(timeout?: number, min?: number, max?: number): void {
		const width = window.innerWidth;
		const height = window.innerHeight;
		window.requestAnimationFrame =
			window.requestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			window.oRequestAnimationFrame ||
			window.msRequestAnimationFrame ||
			function (callback: FrameRequestCallback) {
				return window.setTimeout(callback, confetti.frameInterval);
			};

		let canvas = document.getElementById("confetti-canvas") as HTMLCanvasElement | null;
		if (canvas === null) {
			canvas = document.createElement("canvas");
			canvas.setAttribute("id", "confetti-canvas");
			canvas.setAttribute("style", "display:block;z-index:999999;pointer-events:none;position:fixed;top:0");
			document.body.prepend(canvas);
			canvas.width = width;
			canvas.height = height;
			window.addEventListener("resize", function () {
				canvas!.width = window.innerWidth;
				canvas!.height = window.innerHeight;
			}, true);
			context = canvas.getContext("2d");
		} else if (context === null) {
			context = canvas.getContext("2d");
		}

		let count = confetti.maxCount;
		if (min !== undefined) {
			if (max !== undefined) {
				if (min === max) count = particles.length + max;
				else {
					if (min > max) {
						[min, max] = [max, min];
					}
					count = particles.length + ((Math.random() * (max - min) + min) | 0);
				}
			} else count = particles.length + min;
		} else if (max !== undefined) count = particles.length + max;

		while (particles.length < count) particles.push(resetParticle({} as Particle, width, height));

		streamingConfetti = true;
		pause = false;
		runAnimation();
		if (timeout) window.setTimeout(stopConfetti, timeout);
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
		let particle: Particle;
		let x, y, x2, y2;
		for (let i = 0; i < particles.length; i++) {
			particle = particles[i];
			context.beginPath();
			context.lineWidth = particle.diameter;
			x2 = particle.x + particle.tilt;
			x = x2 + particle.diameter / 2;
			y2 = particle.y + particle.tilt + particle.diameter / 2;
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
		}
	}

	function updateParticles(): void {
		const width = window.innerWidth;
		const height = window.innerHeight;
		let particle: Particle;
		waveAngle += 0.01;
		for (let i = 0; i < particles.length; i++) {
			particle = particles[i];
			if (!streamingConfetti && particle.y < -15) particle.y = height + 100;
			else {
				particle.tiltAngle += particle.tiltAngleIncrement;
				particle.x += Math.sin(waveAngle) - 0.5;
				particle.y += (Math.cos(waveAngle) + particle.diameter + confetti.speed) * 0.5;
				particle.tilt = Math.sin(particle.tiltAngle) * 15;
			}
			if (particle.x > width + 20 || particle.x < -20 || particle.y > height) {
				if (streamingConfetti && particles.length <= confetti.maxCount) resetParticle(particle, width, height);
				else {
					particles.splice(i, 1);
					i--;
				}
			}
		}
	}
})();

export default confetti;
