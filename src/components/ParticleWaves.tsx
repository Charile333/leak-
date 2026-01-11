import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ParticleWaves: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

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
    
    // 粒子布局 - 网格排列，使用与原始代码相同的分离距离
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

    // Shader Material - 更接近源文件的效果
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uAmplitude: { value: 50.0 },
        uSpeed: { value: 0.5 }, // 调整速度接近源文件
        uParticleSize: { value: 1.0 }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uAmplitude;
        uniform float uSpeed;
        uniform float uParticleSize;
        attribute float size;
        
        void main() {
          // 直接使用实例索引计算x和z位置，与源文件匹配
          float instanceIndex = float(gl_VertexID);
          float gridSize = ${Math.sqrt(particleCount)};
          
          // 源文件的位置计算方式
          float x = mod(instanceIndex, gridSize) - gridSize / 2.0;
          float z = floor(instanceIndex / gridSize) - gridSize / 2.0;
          
          // 使用源文件的时间计算方式
          float time2 = 1.0 - uTime * 5.0;
          
          // 与源文件匹配的波浪动画计算
          float xFactor = x * 0.5;
          float zFactor = z * 0.5;
          
          // 计算波浪动画，与源文件公式匹配
          float sinX = sin(xFactor + time2 * uSpeed * 5.0 * 0.7) * uAmplitude;
          float sinZ = sin(zFactor + time2 * uSpeed * 5.0 * 0.5) * uAmplitude;
          float y = sinX + sinZ;
          
          // 更新位置
          vec3 newPosition = vec3(position.x, y, position.z);
          
          // 计算粒子大小 - 完全匹配源文件的大小变化公式
          float sinSX = (sin(xFactor + time2 * uSpeed * 5.0 * 0.7) + 1.0) * 5.0;
          float sinSZ = (sin(zFactor + time2 * uSpeed * 5.0 * 0.5) + 1.0) * 5.0;
          // 源文件中size是vec3，所以我们使用sum作为粒子大小
          float particleSize = sinSX + sinSZ;
          
          // 转换到裁剪空间
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
          
          // 圆形粒子，带有平滑的透明度渐变
          float alpha = 1.0 - distance * 2.0;
          // 粒子颜色改为紫色，接近源文件的视觉效果
          gl_FragColor = vec4(0.9, 0.4, 1.0, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      alphaTest: 0.05
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
    
    // 记录开始时间
    startTimeRef.current = Date.now();

    // Animation Loop - 确保动画持续运行
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      if (!particlesRef.current || !sceneRef.current || !cameraRef.current || !rendererRef.current) return;

      // 计算经过的时间（秒）
      const elapsedTime = (Date.now() - startTimeRef.current) * 0.001;
      
      // 更新着色器的时间变量
      const material = particlesRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = elapsedTime;

      // 渲染场景
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