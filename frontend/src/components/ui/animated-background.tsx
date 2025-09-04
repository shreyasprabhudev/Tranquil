'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface Circle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  hue: number;
}

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const circlesRef = useRef<Circle[]>([]);
  const mousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    // Initialize circles
    const initCircles = () => {
      const circles: Circle[] = [];
      const circleCount = Math.floor((window.innerWidth * window.innerHeight) / 60000); // Adjust density

      for (let i = 0; i < circleCount; i++) {
        circles.push(createCircle());
      }

      circlesRef.current = circles;
    };

    // Create a single circle
    const createCircle = (): Circle => {
      const size = Math.random() * 100 + 50; // 50-150px
      return {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.1 + 0.05, // 0.05-0.15 opacity
        hue: Math.random() * 60 + 190, // Blueish hues (190-250)
      };
    };

    // Animation loop
    const animate = () => {
      if (!ctx) return;
      
      // Clear canvas with a slight fade effect
      ctx.fillStyle = 'rgba(248, 250, 252, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw circles
      circlesRef.current.forEach((circle, index) => {
        // Update position
        circle.x += circle.speedX;
        circle.y += circle.speedY;

        // Bounce off edges
        if (circle.x < -circle.size || circle.x > canvas.width + circle.size) {
          circle.speedX *= -1;
        }
        if (circle.y < -circle.size || circle.y > canvas.height + circle.size) {
          circle.speedY *= -1;
        }

        // Gentle attraction to mouse
        const dx = mousePos.current.x - circle.x;
        const dy = mousePos.current.y - circle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 300;
        
        if (distance < maxDistance) {
          const angle = Math.atan2(dy, dx);
          const force = (1 - distance / maxDistance) * 0.2;
          circle.speedX += Math.cos(angle) * force;
          circle.speedY += Math.sin(angle) * force;
        }

        // Draw circle
        const gradient = ctx.createRadialGradient(
          circle.x, 
          circle.y, 
          0, 
          circle.x, 
          circle.y, 
          circle.size
        );
        
        gradient.addColorStop(0, `hsla(${circle.hue}, 80%, 70%, ${circle.opacity})`);
        gradient.addColorStop(1, `hsla(${circle.hue}, 80%, 70%, 0)`);
        
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.size, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    // Handle mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };

    // Handle touch movement
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    // Initialize
    resizeCanvas();
    initCircles();
    animate();

    // Add event listeners
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        'fixed inset-0 w-full h-full pointer-events-none',
        'transition-opacity duration-1000',
        'dark:mix-blend-plus-lighter',
        'mix-blend-multiply',
        'z-0'
      )}
    />
  );
}
