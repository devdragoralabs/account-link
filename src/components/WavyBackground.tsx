import React, { useEffect, useRef } from 'react';

interface WaveRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  intensity: number;
  speed: number;
}

interface WavyBackgroundProps {
  className?: string;
}

export const WavyBackground: React.FC<WavyBackgroundProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Active ripples triggered by clicks
    const ripples: WaveRipple[] = [];

    const handleGlobalClick = (e: MouseEvent | TouchEvent) => {
      let clientX = 0;
      let clientY = 0;
      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }

      // Add dark physical wave ripple on click
      ripples.push({
        x: clientX,
        y: clientY,
        radius: 0,
        maxRadius: Math.max(width, height) * 0.95,
        intensity: 65,
        speed: 13,
      });

      if (ripples.length > 8) {
        ripples.shift();
      }
    };

    window.addEventListener('pointerdown', handleGlobalClick);

    // Monochromatic Dark Black / Obsidian / Charcoal Waves
    const waveConfigs = [
      {
        baseY: 0.48,
        amplitude: 56,
        frequency: 0.0026,
        speed: 0.014,
        topColor: 'rgba(32, 32, 36, 0.85)',
        midColor: 'rgba(14, 14, 16, 0.95)',
        strokeColor: 'rgba(255, 255, 255, 0.22)', // Subtle silver crest line
        phase: 0,
      },
      {
        baseY: 0.56,
        amplitude: 68,
        frequency: 0.0022,
        speed: 0.011,
        topColor: 'rgba(26, 26, 30, 0.88)',
        midColor: 'rgba(10, 10, 12, 0.96)',
        strokeColor: 'rgba(255, 255, 255, 0.17)',
        phase: 1.7,
      },
      {
        baseY: 0.65,
        amplitude: 78,
        frequency: 0.0019,
        speed: 0.016,
        topColor: 'rgba(20, 20, 24, 0.92)',
        midColor: 'rgba(7, 7, 9, 0.98)',
        strokeColor: 'rgba(255, 255, 255, 0.13)',
        phase: 3.1,
      },
      {
        baseY: 0.74,
        amplitude: 62,
        frequency: 0.0024,
        speed: 0.018,
        topColor: 'rgba(15, 15, 18, 0.95)',
        midColor: 'rgba(4, 4, 5, 0.99)',
        strokeColor: 'rgba(255, 255, 255, 0.09)',
        phase: 4.5,
      },
      {
        baseY: 0.82,
        amplitude: 50,
        frequency: 0.0029,
        speed: 0.013,
        topColor: 'rgba(10, 10, 12, 0.98)',
        midColor: 'rgba(1, 1, 2, 1)',
        strokeColor: 'rgba(255, 255, 255, 0.06)',
        phase: 5.8,
      },
    ];

    let step = 0;

    const render = () => {
      step++;

      // Update click ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += r.speed;
        r.intensity *= 0.982;
        if (r.radius > r.maxRadius || r.intensity < 0.3) {
          ripples.splice(i, 1);
        }
      }

      // Base pitch black background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      ctx.save();

      // Render each dark black wave layer
      for (let w = 0; w < waveConfigs.length; w++) {
        const config = waveConfigs[w];
        const baseY = height * config.baseY;
        const currentPhase = config.phase + step * config.speed;

        ctx.beginPath();
        ctx.moveTo(0, height);

        const resolution = 6;
        for (let x = 0; x <= width + resolution; x += resolution) {
          const wave1 = Math.sin(x * config.frequency + currentPhase) * config.amplitude;
          const wave2 =
            Math.cos(x * config.frequency * 0.5 + currentPhase * 0.7) * (config.amplitude * 0.45);
          const wave3 =
            Math.sin(x * config.frequency * 1.8 - currentPhase * 0.4) * (config.amplitude * 0.25);

          let totalDisplacement = wave1 + wave2 + wave3;

          // Apply click wave disturbance
          for (let i = 0; i < ripples.length; i++) {
            const r = ripples[i];
            const dist = Math.hypot(x - r.x, baseY - r.y);
            const distFromWavefront = Math.abs(dist - r.radius);

            if (distFromWavefront < 130) {
              const falloff = Math.exp(-Math.pow(distFromWavefront / 58, 2));
              const rippleOffset = Math.sin((dist - r.radius) * 0.07) * r.intensity * falloff;
              totalDisplacement += rippleOffset;
            }
          }

          const y = baseY + totalDisplacement;
          if (x === 0) {
            ctx.lineTo(0, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        // Dark obsidian gradient fill
        const gradient = ctx.createLinearGradient(0, baseY - config.amplitude, 0, height);
        gradient.addColorStop(0, config.topColor);
        gradient.addColorStop(0.35, config.midColor);
        gradient.addColorStop(1, '#000000');

        ctx.fillStyle = gradient;
        ctx.fill();

        // Subtle specular crest line for the dark wave edge
        ctx.beginPath();
        for (let x = 0; x <= width + resolution; x += resolution) {
          const wave1 = Math.sin(x * config.frequency + currentPhase) * config.amplitude;
          const wave2 =
            Math.cos(x * config.frequency * 0.5 + currentPhase * 0.7) * (config.amplitude * 0.45);
          const wave3 =
            Math.sin(x * config.frequency * 1.8 - currentPhase * 0.4) * (config.amplitude * 0.25);

          let totalDisplacement = wave1 + wave2 + wave3;

          for (let i = 0; i < ripples.length; i++) {
            const r = ripples[i];
            const dist = Math.hypot(x - r.x, baseY - r.y);
            const distFromWavefront = Math.abs(dist - r.radius);

            if (distFromWavefront < 130) {
              const falloff = Math.exp(-Math.pow(distFromWavefront / 58, 2));
              const rippleOffset = Math.sin((dist - r.radius) * 0.07) * r.intensity * falloff;
              totalDisplacement += rippleOffset;
            }
          }

          const y = baseY + totalDisplacement;
          if (x === 0) {
            ctx.moveTo(0, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.strokeStyle = config.strokeColor;
        ctx.lineWidth = 1.25;
        ctx.stroke();
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointerdown', handleGlobalClick);
    };
  }, []);

  return (
    <div className={`fixed inset-0 pointer-events-none z-0 overflow-hidden ${className}`}>
      {/* HTML5 Canvas Dark Black Waves */}
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* Top subtle fade to blend with pure black screen */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 95% 65% at 50% 10%, rgba(0, 0, 0, 0) 30%, rgba(0, 0, 0, 0.6) 75%, #000000 100%)',
        }}
      />
    </div>
  );
};
