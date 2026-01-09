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
    const particleCount = 100000; // 与源文件相同的粒子数量

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    // Camera - 与源文件相同的配置
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      10,
      100000
    );
    camera.position.set(0, 200, 500); // 与源文件相同的相机位置
    cameraRef.current = camera;

    // Geometry - 与源文件相同的粒子布局
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const separation = 100;
    const amount = Math.sqrt(particleCount);
    const offset = amount / 2;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // 与源文件相同的网格布局
      const x = i % amount;
      const z = Math.floor(i / amount);
      
      positions[i3] = (offset - x) * separation;
      positions[i3 + 1] = 0;
      positions[i3 + 2] = (offset - z) * separation;
      
      sizes[i] = 1.0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Shader Material - 完全复制源文件的动画逻辑
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 }
      },
      vertexShader: `
        uniform float time;
        attribute float size;
        
        void main() {
          // 复制源文件的时间计算
          float time2 = (1.0 - time) * 5.0;
          float x = float(gl_VertexID % int(${Math.sqrt(particleCount)})) * 0.5;
          float z = float(gl_VertexID / int(${Math.sqrt(particleCount)})) * 0.5;
          
          // 波浪动画 - 与源文件相同的逻辑
          float sinX = sin(x + time2 * 0.7) * 50.0;
          float sinZ = sin(z + time2 * 0.5) * 50.0;
          
          vec3 newPosition = vec3(
            position.x,
            sinX + sinZ,
            position.z
          );
          
          // 粒子大小动画 - 与源文件相同的逻辑
          float sinSX = (sin(x + time2 * 0.7) + 1.0) * 5.0;
          float sinSZ = (sin(z + time2 * 0.5) + 1.0) * 5.0;
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
          
          // 粒子颜色改为紫色，与源文件效果一致
          gl_FragColor = vec4(0.6, 0.1, 1.0, 1.0);
        }
      `,
      transparent: false,
      depthWrite: true,
      blending: THREE.NormalBlending,
      // 启用alpha测试，提高性能
      alphaTest: 0.5
    });

    // Particles
    const particles = new THREE.Points(geometry, material);
    particles.frustumCulled = false; // 与源文件相同
    scene.add(particles);
    particlesRef.current = particles;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Animation - 与源文件相同的动画循环
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      if (!particlesRef.current || !sceneRef.current || !cameraRef.current || !rendererRef.current) return;

      // 与源文件相同的时间更新
      const time = Date.now() * 0.001;
      (particlesRef.current.material as THREE.ShaderMaterial).uniforms.time.value = time;

      // 渲染
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