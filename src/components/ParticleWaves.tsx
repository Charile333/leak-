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
    const particleCount = 100_000; // 与原始实现相同的粒子数量

    // 初始化场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    // 初始化相机 - 与原始实现相同的相机参数
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      10,
      100000
    );
    camera.position.set(0, 200, 500);
    cameraRef.current = camera;

    // 创建粒子几何体
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    // 初始化粒子位置和大小 - 与原始实现相同的算法
    const separation = 100;
    const amount = Math.sqrt(particleCount);
    const offset = amount / 2;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const x = (i % amount) - offset;
      const z = Math.floor(i / amount) - offset;

      // 与原始实现相同的位置计算
      positions[i3] = x * separation;
      positions[i3 + 1] = 0;
      positions[i3 + 2] = z * separation;

      // 初始大小为1.0
      sizes[i] = 1.0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // 创建粒子材质 - 模拟原始实现的效果
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
      },
      vertexShader: `
        uniform float time;
        attribute float size;
        varying float vSize;
        
        void main() {
          vSize = size;
          
          vec3 pos = position;
          float x = pos.x * 0.5;
          float z = pos.z * 0.5;
          
          // 与原始实现相同的时间计算
          float time2 = (1.0 - time) * 5.0;
          
          // 与原始实现相同的波浪运动
          float sinX = sin(x + time2 * 0.7) * 50.0;
          float sinZ = sin(z + time2 * 0.5) * 50.0;
          
          pos.y = sinX + sinZ;
          
          // 与原始实现相同的大小变化
          float sinSX = sin(x + time2 * 0.7) + 1.0;
          float sinSZ = sin(z + time2 * 0.5) + 1.0;
          float particleSize = (sinSX + sinSZ) * 5.0;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = particleSize * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vSize;
        
        void main() {
          // 与原始实现相同的圆形粒子
          vec2 vUv = gl_PointCoord.xy - vec2(0.5);
          float distance = length(vUv);
          
          if (distance > 0.5) {
            discard;
          }
          
          // 白色粒子，与原始实现相同
          gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        }
      `,
      transparent: false, // 与原始实现相同
      depthWrite: true, // 与原始实现相同
      blending: THREE.NormalBlending, // 与原始实现相同
      vertexColors: false, // 与原始实现相同
    });

    // 创建粒子系统
    const particles = new THREE.Points(geometry, material);
    particles.frustumCulled = false; // 与原始实现相同
    scene.add(particles);
    particlesRef.current = particles;

    // 初始化渲染器 - 尝试使用WebGPURenderer，如果不支持则回退到WebGLRenderer
    let renderer: THREE.WebGLRenderer | null = null;
    try {
      // 检查是否支持WebGPU
      if (typeof navigator !== 'undefined' && navigator.gpu) {
        // @ts-ignore - WebGPURenderer is not yet in the types
        renderer = new THREE.WebGPURenderer({ antialias: true });
      } else {
        renderer = new THREE.WebGLRenderer({ antialias: true });
      }
    } catch (error) {
      console.error('WebGPURenderer not supported, falling back to WebGLRenderer:', error);
      renderer = new THREE.WebGLRenderer({ antialias: true });
    }

    if (!renderer) return;

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 动画循环
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      if (!particlesRef.current || !sceneRef.current || !cameraRef.current || !rendererRef.current) {
        return;
      }

      const time = Date.now() * 0.0001;
      particlesRef.current.material.uniforms.time.value = time;

      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    // 开始动画
    animate();

    // 窗口大小变化处理
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;

      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // 清理函数
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
        particlesRef.current.material.dispose();
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