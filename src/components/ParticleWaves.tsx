import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ParticleWaves: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const particleCount = 10000; // 减少粒子数量提高性能，同时保持视觉效果

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      10,
      10000
    );
    camera.position.set(0, 200, 800); // 调整相机位置，更好地观察波浪效果
    cameraRef.current = camera;

    // Geometry
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const separation = 50; // 减小间距，使粒子更密集
    const amount = Math.sqrt(particleCount);
    const offset = amount / 2;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // 网格布局
      const x = i % amount;
      const z = Math.floor(i / amount);
      
      positions[i3] = (offset - x) * separation;
      positions[i3 + 1] = 0;
      positions[i3 + 2] = (offset - z) * separation;
      
      sizes[i] = 1.0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // 简化的Shader Material，提高性能
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 }
      },
      vertexShader: `
        uniform float time;
        attribute float size;
        
        void main() {
          // 更明显的波浪动画
          float time2 = time * 2.0;
          float x = position.x * 0.01;
          float z = position.z * 0.01;
          
          // 增加波浪振幅，使动画更明显
          float sinX = sin(x + time2 * 0.7) * 80.0;
          float sinZ = sin(z + time2 * 0.5) * 80.0;
          float sinXY = sin((x + z) * 0.5 + time2 * 1.0) * 40.0;
          
          vec3 newPosition = vec3(
            position.x + sin((z + time2 * 0.3) * 0.5) * 20.0,
            sinX + sinZ + sinXY,
            position.z + sin((x + time2 * 0.4) * 0.5) * 20.0
          );
          
          // 粒子大小动画
          float particleSize = (sin(x + z + time2) + 1.0) * 5.0 + 2.0;
          
          vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
          gl_PointSize = particleSize * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        void main() {
          vec2 vUv = gl_PointCoord.xy - vec2(0.5);
          float distance = length(vUv);
          
          if (distance > 0.5) {
            discard;
          }
          
          // 添加渐变效果，使粒子更美观
          float alpha = 1.0 - distance * 2.0;
          gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    // Particles
    const particles = new THREE.Points(geometry, material);
    particles.frustumCulled = false;
    scene.add(particles);
    particlesRef.current = particles;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Animation
    const startTime = Date.now();
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      if (!particlesRef.current || !sceneRef.current || !cameraRef.current || !rendererRef.current) return;

      // 更新时间，使用相对时间计算
      const elapsedTime = (Date.now() - startTime) * 0.001;
      const shaderMaterial = particlesRef.current.material as THREE.ShaderMaterial;
      shaderMaterial.uniforms.time.value = elapsedTime;
      
      // 添加粒子系统旋转，增强视觉效果
      particlesRef.current.rotation.y = elapsedTime * 0.1;

      // 渲染
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    animate();

    // Resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current || !containerRef.current) return;

      cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }

      if (particlesRef.current) {
        particlesRef.current.geometry.dispose();
        if (Array.isArray(particlesRef.current.material)) {
          particlesRef.current.material.forEach(m => m.dispose());
        } else {
          particlesRef.current.material.dispose();
        }
      }

      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 overflow-hidden"
      style={{ backgroundColor: 'black' }}
    />
  );
};

export default ParticleWaves;