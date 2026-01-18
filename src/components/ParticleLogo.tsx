import React, { useEffect, useRef } from 'react';

interface ParticleLogoProps {
  className?: string;
  activeLogo?: string | null;
}

export const ParticleLogo: React.FC<ParticleLogoProps> = ({ className, activeLogo }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const particlesRef = useRef<any[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const activeLogoRef = useRef(activeLogo);

  // Update ref when prop changes
  useEffect(() => {
    activeLogoRef.current = activeLogo;
  }, [activeLogo]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
        const parent = canvas.parentElement;
        if (parent) {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle Class
    class Particle {
        x: number;
        y: number;
        dest: { x: number; y: number };
        r: number;
        vx: number;
        vy: number;
        accX: number;
        accY: number;
        friction: number;
        color: string;

        constructor(x: number, y: number, color: string) {
            this.x = Math.random() * canvas!.width;
            this.y = Math.random() * canvas!.height;
            this.dest = { x, y };
            // Increase radius: 2 to 4.5
            this.r = Math.random() * 2.5 + 2; 
            this.vx = (Math.random() - 0.5) * 20;
            this.vy = (Math.random() - 0.5) * 20;
            this.accX = 0;
            this.accY = 0;
            this.friction = Math.random() * 0.05 + 0.92; // Adjust friction
            this.color = color;
        }

        render() {
            // Physics: Spring force towards destination
            this.accX = (this.dest.x - this.x) / 300; // Stiffer spring
            this.accY = (this.dest.y - this.y) / 300;
            this.vx += this.accX;
            this.vy += this.accY;
            this.vx *= this.friction;
            this.vy *= this.friction;

            this.x += this.vx;
            this.y += this.vy;

            // Mouse Interaction: Repulsion
            const a = this.x - mouseRef.current.x;
            const b = this.y - mouseRef.current.y;
            const distance = Math.sqrt(a * a + b * b);
            
            // Interaction radius
            if (distance < 50) {
                this.accX = (this.x - mouseRef.current.x) / 20;
                this.accY = (this.y - mouseRef.current.y) / 20;
                this.vx += this.accX;
                this.vy += this.accY;
            }

            if (ctx) {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    const initScene = () => {
        if (!ctx) return;
        
        // Load image
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = activeLogoRef.current || '/diewei-w.png';
        
        img.onload = () => {
            // Calculate draw dimensions to fit canvas
            const imgAspect = img.width / img.height;
            const canvasAspect = canvas.width / canvas.height;
            let drawW, drawH;

            if (canvasAspect > imgAspect) {
                drawH = canvas.height * 0.7; // 70% height
                drawW = drawH * imgAspect;
            } else {
                drawW = canvas.width * 0.7; // 70% width
                drawH = drawW / imgAspect;
            }

            const startX = (canvas.width - drawW) / 2;
            const startY = (canvas.height - drawH) / 2;

            // Draw image to canvas to scan pixels
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, startX, startY, drawW, drawH);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear after scanning

            particlesRef.current = [];
            
            // Special color handling
            const isWhiteLogo = activeLogoRef.current && (
                activeLogoRef.current.includes('nio.png') || 
                activeLogoRef.current.includes('xpeng.png')
            );

            // Scan pixels
            // Adjust step based on density needs
            // Reduced density divisor from 80 to 60 for even fewer particles
            const step = Math.floor(Math.min(canvas.width, canvas.height) / 60); 
            
            for (let y = 0; y < canvas.height; y += step) {
                for (let x = 0; x < canvas.width; x += step) {
                    const index = (y * canvas.width + x) * 4;
                    // Check alpha and brightness
                    if (imageData[index + 3] > 20) {
                        let color = `rgb(${imageData[index]}, ${imageData[index + 1]}, ${imageData[index + 2]})`;
                        
                        if (isWhiteLogo) {
                            color = '#FFFFFF';
                        }
                        
                        particlesRef.current.push(new Particle(x, y, color));
                    }
                }
            }
        };
        
        // Fallback if image fails (Optional, but good to have)
        img.onerror = () => {
             console.log("Image load failed, using text fallback");
             ctx.clearRect(0, 0, canvas.width, canvas.height);
             ctx.fillStyle = "white";
             ctx.font = `bold ${canvas.width/5}px sans-serif`;
             ctx.textAlign = "center";
             ctx.textBaseline = "middle";
             ctx.fillText("DIEWEI", canvas.width/2, canvas.height/2);
             
             const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
             ctx.clearRect(0, 0, canvas.width, canvas.height);
             
             particlesRef.current = [];
             const step = 6;
             for (let y = 0; y < canvas.height; y += step) {
                for (let x = 0; x < canvas.width; x += step) {
                    const index = (y * canvas.width + x) * 4;
                    if (data[index + 3] > 100) {
                        particlesRef.current.push(new Particle(x, y, "#FFFFFF"));
                    }
                }
             }
        };
    };

    // Animation Loop
    const animate = () => {
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (let i = 0; i < particlesRef.current.length; i++) {
            particlesRef.current[i].render();
        }
        
        requestRef.current = requestAnimationFrame(animate);
    };

    // Input Listeners
    const onMouseMove = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        mouseRef.current.x = e.clientX - rect.left;
        mouseRef.current.y = e.clientY - rect.top;
    };
    
    const onTouchMove = (e: TouchEvent) => {
        if (e.touches.length > 0) {
            const rect = canvas.getBoundingClientRect();
            mouseRef.current.x = e.touches[0].clientX - rect.left;
            mouseRef.current.y = e.touches[0].clientY - rect.top;
        }
    };

    const onMouseLeave = () => {
        mouseRef.current.x = -9999;
        mouseRef.current.y = -9999;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onMouseLeave);
    // Mouse leave specific to canvas container might be better but window is safer for fast movements
    
    // Start
    initScene();
    requestRef.current = requestAnimationFrame(animate);

    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        window.removeEventListener('resize', resizeCanvas);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onMouseLeave);
    };
  }, [activeLogo]); // Re-run when logo changes

  return <canvas ref={canvasRef} className={`block ${className}`} style={{ background: 'transparent' }} />;
};
