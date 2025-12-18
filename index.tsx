import React, { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";

const App = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    // --- Configuration ---
    const FOV = 350;
    const CAMERA_Z = 400; 
    const ROTATION_SPEED = 0.003; 

    // --- State ---
    let rotation = 0;
    const startTime = Date.now(); 

    interface Particle3D {
      x: number;
      y: number;
      z: number;
      ox: number;
      oz: number;
      color: string;
      radius: number;
      type: 'ribbon' | 'ribbon_red' | 'foliage' | 'star' | 'floor' | 'ornament';
      ornamentShape?: 'sphere' | 'diamond' | 'bell';
      blinkOffset: number;
      alpha: number;
      delay: number; 
    }

    interface SnowParticle {
      x: number;
      y: number;
      speed: number;
      radius: number;
      alpha: number;
    }

    // Firework Interfaces
    interface FireworkParticle {
        x: number;
        y: number;
        vx: number;
        vy: number;
        alpha: number;
        color: string;
        life: number;
        decay: number;
    }

    interface Firework {
        id: number;
        x: number;
        y: number;
        targetY: number;
        vy: number;
        color: string;
        state: 'rising' | 'exploding';
        particles: FireworkParticle[];
        hue: number;
    }

    const particles: Particle3D[] = [];
    const snow: SnowParticle[] = [];
    let fireworks: Firework[] = [];
    let fireworkIdCounter = 0;

    // --- Initialization ---

    // 1. Setup Tree Dimensions
    const treeHeight = Math.min(h * 0.9, 900); 
    const maxRadius = Math.min(w * 0.5, 450); 

    // --- GENERATION LOGIC ---

    // A. The Golden Ribbon
    const RIBBON_PARTICLES = 1600; 
    const RIBBON_TURNS = 7;
    const RIBBON_WIDTH = 25; 
    
    for (let i = 0; i < RIBBON_PARTICLES; i++) {
      const p = i / RIBBON_PARTICLES; 
      const angle = p * Math.PI * 2 * RIBBON_TURNS;
      
      const rBase = maxRadius * (1 - p);
      const r = rBase + 30; 

      const spreadX = (Math.random() - 0.5) * RIBBON_WIDTH;
      const spreadY = (Math.random() - 0.5) * RIBBON_WIDTH;
      const spreadZ = (Math.random() - 0.5) * RIBBON_WIDTH;

      const x = Math.cos(angle) * r + spreadX;
      const z = Math.sin(angle) * r + spreadZ;
      const y = (treeHeight / 2) - (p * treeHeight) + spreadY;

      const hue = 45 + Math.random() * 10;
      const lightness = 70 + Math.random() * 30; 
      const color = `hsla(${hue}, 100%, ${lightness}%, 1)`;

      particles.push({
        x, y, z, ox: x, oz: z,
        color,
        radius: 2 + Math.random() * 3, 
        type: 'ribbon',
        blinkOffset: Math.random() * Math.PI * 2,
        alpha: 0.9 + Math.random() * 0.1,
        delay: 500 + p * 2000 
      });
    }

    // A2. The Red Ribbon
    const RED_RIBBON_PARTICLES = 1600;
    
    for (let i = 0; i < RED_RIBBON_PARTICLES; i++) {
      const p = i / RED_RIBBON_PARTICLES; 
      // Offset angle by PI/1.5 so it spirals interwoven with the gold
      const angle = p * Math.PI * 2 * RIBBON_TURNS + (Math.PI / 1.5);
      
      const rBase = maxRadius * (1 - p);
      const r = rBase + 35; // Slightly wider

      const spreadX = (Math.random() - 0.5) * 20;
      const spreadY = (Math.random() - 0.5) * 20;
      const spreadZ = (Math.random() - 0.5) * 20;

      const x = Math.cos(angle) * r + spreadX;
      const z = Math.sin(angle) * r + spreadZ;
      const y = (treeHeight / 2) - (p * treeHeight) + spreadY;

      // Vivid Red
      const hue = 345 + Math.random() * 20; // Pinkish red to bright red
      const lightness = 50 + Math.random() * 20; 
      const color = `hsla(${hue}, 90%, ${lightness}%, 1)`;

      particles.push({
        x, y, z, ox: x, oz: z,
        color,
        radius: 2 + Math.random() * 3, 
        type: 'ribbon_red',
        blinkOffset: Math.random() * Math.PI * 2,
        alpha: 0.9 + Math.random() * 0.1,
        delay: 500 + p * 2000 
      });
    }

    // B. Volumetric Foliage
    const FOLIAGE_PARTICLES = 7000; 
    const LAYERS = 12; 

    for (let i = 0; i < FOLIAGE_PARTICLES; i++) {
      const p = Math.pow(Math.random(), 1.5); 
      
      const baseR = maxRadius * (1 - p);

      const layerPhase = p * LAYERS * Math.PI * 2;
      const layerExtension = (Math.sin(layerPhase) + 1) / 2; 
      const rMax = baseR * (0.85 + 0.15 * layerExtension);

      const rDist = Math.pow(Math.random(), 0.6) * rMax;
      
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * rDist;
      const z = Math.sin(angle) * rDist;
      
      const y = (treeHeight / 2) - (p * treeHeight);

      let hue, sat, light;
      const colorRand = Math.random();

      if (colorRand > 0.85) {
        hue = 40 + Math.random() * 15; 
        sat = 90 + Math.random() * 10;
        light = 60 + Math.random() * 25;
      } else if (colorRand > 0.6) {
        hue = 60 + Math.random() * 30; 
        sat = 80 + Math.random() * 20;
        light = 40 + Math.random() * 20;
      } else {
        hue = 95 + Math.random() * 35; 
        sat = 70 + Math.random() * 20;
        light = 20 + Math.random() * 20; 
      }
      
      const color = `hsla(${hue}, ${sat}%, ${light}%, 1)`;

      particles.push({
        x, y, z, ox: x, oz: z,
        color,
        radius: 1.0 + Math.random() * 2.0,
        type: 'foliage',
        blinkOffset: Math.random() * 100,
        alpha: Math.random() * 0.7 + 0.3,
        delay: 200 + p * 2500 + Math.random() * 500
      });
    }

    // C. Varied Ornaments
    const ORNAMENT_COUNT = 350;
    const ORNAMENT_TYPES = ['sphere', 'diamond', 'bell'] as const;
    
    for (let i = 0; i < ORNAMENT_COUNT; i++) {
        const p = Math.random(); 
        const rBase = maxRadius * (1 - p);
        const r = rBase * (0.85 + Math.random() * 0.25); 

        const angle = Math.random() * Math.PI * 2;
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;
        const y = (treeHeight / 2) - (p * treeHeight);

        const typeIdx = Math.floor(Math.random() * ORNAMENT_TYPES.length);
        const shape = ORNAMENT_TYPES[typeIdx];
        
        let color = '#fff';
        const colorRand = Math.random();
        if (colorRand < 0.25) color = '#ff3333'; // Red
        else if (colorRand < 0.5) color = '#ffd700'; // Gold
        else if (colorRand < 0.75) color = '#4169e1'; // Blue
        else color = '#e0e0e0'; // Silver

        particles.push({
            x, y, z, ox: x, oz: z,
            color,
            radius: 4 + Math.random() * 4,
            type: 'ornament',
            ornamentShape: shape,
            blinkOffset: Math.random() * 10,
            alpha: 1,
            delay: 1000 + Math.random() * 2000
        });
    }

    // D. Magical Floor Galaxy 
    const FLOOR_PARTICLES = 1000;
    for (let i = 0; i < FLOOR_PARTICLES; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random();
        const r = (dist * maxRadius * 1.5) + (Math.random() * 50); 
        
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;
        const y = treeHeight / 2 + (Math.random() - 0.5) * 15; 

        const hue = 40 + Math.random() * 10;
        const color = `hsla(${hue}, 100%, ${70 + Math.random() * 30}%, ${0.6 + Math.random() * 0.4})`;

        particles.push({
            x, y, z, ox: x, oz: z,
            color,
            radius: 1 + Math.random() * 3,
            type: 'floor',
            blinkOffset: Math.random() * 10,
            alpha: Math.random(),
            delay: Math.random() * 1000
        });
    }

    // E. Topper (Star)
    const topperY = -treeHeight / 2 - 25; 
    
    // Main Star Particle
    particles.push({
      x: 0, y: topperY, z: 0, ox: 0, oz: 0,
      color: '#fffef0', 
      radius: 22, 
      type: 'star', 
      blinkOffset: 0, alpha: 1,
      delay: 3500 
    });

    // Surround sparkles for the star
    for (let i = 0; i < 6; i++) { 
        const angle = (i / 6) * Math.PI * 2 + Math.random();
        const dist = 25 + Math.random() * 15;
        const sx = Math.cos(angle) * dist;
        const sz = Math.sin(angle) * dist;
        const sy = topperY + (Math.random() - 0.5) * 20;

        particles.push({
            x: sx, y: sy, z: sz, ox: sx, oz: sz,
            color: '#fffcd1',
            radius: 2 + Math.random() * 3,
            type: 'floor', // Reuse simple glow render for sparkles
            blinkOffset: Math.random() * 10,
            alpha: 0.8,
            delay: 3800 + Math.random() * 500
        });
    }

    // 2. Setup Snow
    const SNOW_COUNT = 400;
    for (let i = 0; i < SNOW_COUNT; i++) {
        snow.push({
            x: Math.random() * w,
            y: Math.random() * h,
            speed: 0.5 + Math.random() * 1.5,
            radius: 1 + Math.random() * 2,
            alpha: 0.1 + Math.random() * 0.4
        });
    }

    // --- Utility: Create Firework ---
    const launchFirework = () => {
        const x = (Math.random() * 0.8 + 0.1) * w;
        const targetY = (Math.random() * 0.5 + 0.1) * h; 
        const hue = Math.random() * 360;
        
        fireworks.push({
            id: fireworkIdCounter++,
            x,
            y: h,
            targetY,
            vy: - (8 + Math.random() * 5), // Higher velocity for bigger scale
            color: `hsl(${hue}, 100%, 80%)`, // More pastel/bright
            hue,
            state: 'rising',
            particles: []
        });
    };

    const explodeFirework = (fw: Firework) => {
        // More particles, bigger spread
        const particleCount = 100 + Math.random() * 50;
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 6 + 3; // Increased explosion speed for "bigger" look
            fw.particles.push({
                x: fw.x,
                y: fw.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                alpha: 1,
                color: fw.color,
                life: 1.0,
                decay: 0.005 + Math.random() * 0.01 // Slower decay = Dreamy
            });
        }
    };


    // --- Render Loop ---
    const render = () => {
      // Create trails
      ctx.fillStyle = "rgba(2, 2, 5, 0.4)"; 
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2 - 100; 
      
      const now = Date.now();
      const elapsed = now - startTime;

      // --- 1. Draw Fireworks (Background) ---
      // Randomly launch
      if (Math.random() < 0.02) {
          launchFirework();
      }

      ctx.globalCompositeOperation = 'lighter';
      fireworks.forEach((fw, index) => {
          if (fw.state === 'rising') {
              fw.y += fw.vy;
              fw.vy += 0.05; // gravity
              
              ctx.globalAlpha = 1;
              ctx.fillStyle = fw.color;
              ctx.beginPath();
              ctx.arc(fw.x, fw.y, 2, 0, Math.PI * 2);
              ctx.fill();

              if (fw.vy >= 0 || fw.y <= fw.targetY) {
                  fw.state = 'exploding';
                  explodeFirework(fw);
              }
          } else {
              // Exploding
              for (let i = fw.particles.length - 1; i >= 0; i--) {
                  const p = fw.particles[i];
                  p.x += p.vx;
                  p.y += p.vy;
                  p.vy += 0.03; 
                  p.vx *= 0.98; 
                  p.vy *= 0.98;
                  p.life -= p.decay;
                  
                  if (p.life <= 0) {
                      fw.particles.splice(i, 1);
                      continue;
                  }

                  const sparkle = Math.random() < 0.1 ? 1.5 : 1; 

                  ctx.globalAlpha = p.life;
                  ctx.fillStyle = p.color;
                  ctx.beginPath();
                  ctx.arc(p.x, p.y, 1.5 * sparkle, 0, Math.PI*2);
                  ctx.fill();
              }
          }
      });
      // Cleanup dead fireworks
      fireworks = fireworks.filter(fw => fw.state === 'rising' || fw.particles.length > 0);


      // --- 2. Draw Snow (Background Layer) ---
      ctx.globalCompositeOperation = 'source-over'; 
      snow.forEach(s => {
          s.y += s.speed;
          if (s.y > h) {
              s.y = -10;
              s.x = Math.random() * w;
          }
          ctx.beginPath();
          ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
          ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
          ctx.fill();
      });

      rotation += ROTATION_SPEED;

      // --- 3. Intense Floor Glow ---
      ctx.globalCompositeOperation = 'lighter'; 
      ctx.save();
      const floorY = cy + treeHeight/2 * (FOV / (FOV + CAMERA_Z));
      const floorGrad = ctx.createRadialGradient(cx, floorY, 10, cx, floorY, maxRadius * 1.2);
      
      const floorAlpha = Math.min(elapsed / 2000, 1);
      
      floorGrad.addColorStop(0, `rgba(255, 220, 100, ${0.3 * floorAlpha})`); 
      floorGrad.addColorStop(0.3, `rgba(255, 150, 50, ${0.1 * floorAlpha})`);
      floorGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = floorGrad;
      ctx.transform(1, 0, 0, 0.3, 0, floorY * 0.7); 
      ctx.beginPath();
      ctx.arc(cx, floorY, maxRadius * 3, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();

      // --- 4. Process Tree Particles ---
      const projectedParticles = particles.map(p => {
        // --- Intro Animation Logic ---
        const pElapsed = Math.max(0, elapsed - p.delay);
        const duration = 2000;
        let progress = Math.min(pElapsed / duration, 1);
        
        const ease = 1 - Math.pow(1 - progress, 3);

        const startY = treeHeight / 2;
        const currentY = startY + (p.y - startY) * ease;

        const expansion = ease;
        const currentOx = p.ox * expansion;
        const currentOz = p.oz * expansion;

        const spiralOffset = (1 - ease) * Math.PI * 4; 

        const finalRotation = rotation + spiralOffset;
        const cos = Math.cos(finalRotation);
        const sin = Math.sin(finalRotation);

        const rx = currentOx * cos - currentOz * sin;
        const rz = currentOx * sin + currentOz * cos;

        const scale = FOV / (FOV + rz + CAMERA_Z);
        const x2d = rx * scale + cx;
        const y2d = currentY * scale + cy;

        const currentAlpha = p.alpha * progress;

        return { ...p, x2d, y2d, scale, rz, renderedAlpha: currentAlpha, progress };
      });

      projectedParticles.sort((a, b) => b.rz - a.rz);

      projectedParticles.forEach(p => {
        if (p.scale <= 0 || p.progress <= 0) return;

        let alpha = p.renderedAlpha;
        let radius = p.radius * p.scale;
        
        // Use additive blending for that "sparkly" feeling
        ctx.globalCompositeOperation = 'lighter';
        
        if (p.type === 'ribbon') {
            const flicker = Math.sin(now * 0.003 + p.blinkOffset);
            alpha = alpha * (0.8 + flicker * 0.2); 
            
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x2d, p.y2d, radius, 0, Math.PI * 2);
            ctx.fill();

        } else if (p.type === 'ribbon_red') {
            const flicker = Math.sin(now * 0.003 + p.blinkOffset + 100);
            alpha = alpha * (0.8 + flicker * 0.2); 
            
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x2d, p.y2d, radius, 0, Math.PI * 2);
            ctx.fill();

        } else if (p.type === 'floor') {
            const flicker = Math.sin(now * 0.002 + p.blinkOffset);
            alpha = alpha * (0.6 + flicker * 0.4);

            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x2d, p.y2d, radius, 0, Math.PI * 2);
            ctx.fill();

        } else if (p.type === 'ornament') {
            const flicker = Math.sin(now * 0.002 + p.blinkOffset);
            ctx.save();
            ctx.translate(p.x2d, p.y2d);
            ctx.globalAlpha = Math.min(1, alpha);
            
            ctx.fillStyle = p.color;
            ctx.beginPath();
            
            if (p.ornamentShape === 'sphere') {
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
                // Highlight
                ctx.fillStyle = "rgba(255,255,255,0.4)";
                ctx.beginPath();
                ctx.arc(-radius*0.3, -radius*0.3, radius*0.3, 0, Math.PI*2);
                ctx.fill();
            } else if (p.ornamentShape === 'diamond') {
                ctx.moveTo(0, -radius * 1.2);
                ctx.lineTo(radius, 0);
                ctx.lineTo(0, radius * 1.2);
                ctx.lineTo(-radius, 0);
                ctx.fill();
                // Shine
                ctx.fillStyle = "rgba(255,255,255,0.3)";
                ctx.beginPath();
                ctx.moveTo(0, -radius * 1.2);
                ctx.lineTo(radius * 0.4, 0);
                ctx.lineTo(0, radius * 0.4);
                ctx.lineTo(-radius * 0.4, 0);
                ctx.fill();
            } else if (p.ornamentShape === 'bell') {
                ctx.moveTo(0, -radius);
                ctx.bezierCurveTo(radius, -radius*0.5, radius, radius*0.8, radius*1.2, radius);
                ctx.quadraticCurveTo(0, radius*1.2, -radius*1.2, radius);
                ctx.bezierCurveTo(-radius, radius*0.8, -radius, -radius*0.5, 0, -radius);
                ctx.fill();
                 // Rim highlight
                 ctx.fillStyle = "rgba(255,255,255,0.3)";
                 ctx.beginPath();
                 ctx.ellipse(0, radius, radius*0.8, radius*0.2, 0, 0, Math.PI*2);
                 ctx.fill();
            }
            
            ctx.restore();

        } else if (p.type === 'star') {
            if (p.progress < 1) {
                 radius *= p.progress * 1.5;
            }
            const flicker = Math.sin(now * 0.004 + p.blinkOffset);
            alpha = Math.min(alpha, 1) * (0.8 + flicker * 0.2); 
            const starScale = 1 + flicker * 0.2; 

            // Distinct 5-pointed Star Rendering
            ctx.save();
            ctx.translate(p.x2d, p.y2d);
            
            // Outer Glow
            ctx.shadowColor = "rgba(255, 230, 150, 0.8)";
            ctx.shadowBlur = 40 * starScale;

            ctx.globalAlpha = alpha;
            ctx.fillStyle = "#fffef0"; // Warm white
            
            // Draw Star Geometry
            ctx.rotate(now * 0.0005); // Slow rotation of the star shape
            
            ctx.beginPath();
            const spikes = 5;
            const outerRadius = p.radius * starScale * 2.0; 
            const innerRadius = p.radius * starScale * 0.8;
            
            let rot = Math.PI / 2 * 3;
            let x = 0;
            let y = 0;
            let step = Math.PI / spikes;

            ctx.moveTo(0, 0 - outerRadius);
            for (let i = 0; i < spikes; i++) {
                x = Math.cos(rot) * outerRadius;
                y = Math.sin(rot) * outerRadius;
                ctx.lineTo(x, y);
                rot += step;

                x = Math.cos(rot) * innerRadius;
                y = Math.sin(rot) * innerRadius;
                ctx.lineTo(x, y);
                rot += step;
            }
            ctx.lineTo(0, 0 - outerRadius);
            ctx.closePath();
            ctx.fill();

            // Inner intense core
            ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            ctx.shadowBlur = 20 * starScale;
            ctx.beginPath();
            ctx.arc(0, 0, innerRadius * 0.6, 0, Math.PI * 2);
            ctx.fill();

            // Beams (rotating differently)
            ctx.rotate(-now * 0.0008); // Counter rotation for beams
            ctx.globalAlpha = alpha * 0.7;
            const rayLen = outerRadius * 3;
            const rayWidth = outerRadius * 0.15;
            
            ctx.fillRect(-rayLen/2, -rayWidth/2, rayLen, rayWidth);
            ctx.fillRect(-rayWidth/2, -rayLen/2, rayWidth, rayLen);
            
            ctx.rotate(Math.PI / 4);
            const diagLen = rayLen * 0.6;
            ctx.fillRect(-diagLen/2, -rayWidth/2, diagLen, rayWidth);
            ctx.fillRect(-rayWidth/2, -diagLen/2, rayWidth, diagLen);
            
            ctx.restore();
            ctx.shadowBlur = 0; 

        } else {
            // Foliage
            const flicker = Math.sin(now * 0.003 + p.blinkOffset);
            alpha = alpha * (0.7 + flicker * 0.4); 
            
            ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x2d, p.y2d, radius, 0, Math.PI * 2);
            ctx.fill();
        }
      });

      // --- 5. Draw Text ---
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      const textDelay = 4000;
      if (elapsed > textDelay) {
          const textAlpha = Math.min((elapsed - textDelay) / 2000, 1);
          ctx.save();
          const fontSize = Math.min(w * 0.15, 100);
          ctx.font = `${fontSize}px "Great Vibes", cursive`;
          ctx.textAlign = "center";
          
          ctx.shadowColor = "#ffaa00";
          ctx.shadowBlur = 20;
          
          const textGrad = ctx.createLinearGradient(0, h - 120, 0, h - 20);
          textGrad.addColorStop(0, `rgba(255, 248, 219, ${textAlpha})`);
          textGrad.addColorStop(0.5, `rgba(255, 204, 0, ${textAlpha})`);
          textGrad.addColorStop(1, `rgba(255, 153, 0, ${textAlpha})`);
          
          ctx.fillStyle = textGrad;
          ctx.globalAlpha = textAlpha;
          ctx.fillText("Merry Christmas", cx, h - 40);
          ctx.restore();
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ display: 'block', outline: 'none' }} />;
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);