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
    const particleCount = 100000;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      10,
      100000
    );
    camera.position.set(0, 200, 500);
    cameraRef.current = camera;

    // Geometry
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    // 与源文件相同的粒子布局
    const separation = 100;
    const amount = Math.sqrt(particleCount);
    const offset = amount / 2;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      const x = i % amount;
      const z = Math.floor(i / amount);
      
      positions[i3] = (offset - x) * separation;
      positions[i3 + 1] = 0;
      positions[i3 + 2] = (offset - z) * separation;
      
      sizes[i] = 1.0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Shader Material - 修复动画逻辑，确保背景动画正常显示
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 }
      },
      vertexShader: `
        uniform float time;
        attribute float size;
        
        void main() {
          float time2 = time * 0.001;
          float instanceIndex = float(gl_VertexID);
          float amount = ${Math.sqrt(particleCount)};
          
          float x = mod(instanceIndex, amount) * 0.5;
          float z = floor(instanceIndex / amount) * 0.5;
          
          // 修复波浪动画逻辑，确保粒子上下移动
          float sinX = sin(x + time2 * 0.7) * 50.0;
          float sinZ = sin(z + time2 * 0.5) * 50.0;
          
          vec3 newPosition = vec3(
            position.x,
            sinX + sinZ,
            position.z
          );
          
          // 修复粒子大小动画，确保粒子大小变化明显
          float sinSX = (sin(x + time2 * 0.7) + 1.0) * 2.0;
          float sinSZ = (sin(z + time2 * 0.5) + 1.0) * 2.0;
          float newSize = sinSX + sinSZ;
          
          vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
          gl_PointSize = newSize * (300.0 / -mvPosition.z);
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
          
          // 提高粒子亮度和透明度，确保动画可见
          float alpha = 0.8 - distance * 1.6;
          gl_FragColor = vec4(0.8, 0.3, 1.0, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      alphaTest: 0.1
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

    // Animation Loop - 与源文件相同的动画驱动方式
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      if (!particlesRef.current || !sceneRef.current || !cameraRef.current || !rendererRef.current) return;

      // 使用与源文件相同的时间计算方式
      (particlesRef.current.material as THREE.ShaderMaterial).uniforms.time.value = Date.now();

      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    animate();

    // Resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current || !containerRef.current) return;

      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
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