import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ParticleWaves: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const particleCount = 5000; // 减少粒子数量，提高性能，同时保持视觉效果

    console.log('[ParticleWaves] Initializing with', particleCount, 'particles');

    // 初始化场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    // 初始化相机
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

    // 初始化粒子位置和大小
    const separation = 100;
    const amount = Math.sqrt(particleCount);
    const offset = amount / 2;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const x = (i % amount) - offset;
      const z = Math.floor(i / amount) - offset;

      positions[i3] = x * separation;
      positions[i3 + 1] = 0;
      positions[i3 + 2] = z * separation;
      sizes[i] = 1.0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // 创建粒子材质
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
      },
      vertexShader: `
        uniform float time;
        
        void main() {
          vec3 pos = position;
          float x = pos.x * 0.5;
          float z = pos.z * 0.5;
          
          // 使用直接的时间计算，确保动画正常向前播放
          float time2 = time * 2.0; // 调整速度，使动画更明显
          
          // 波浪运动 - 调整参数使动画更明显
          float sinX = sin(x + time2 * 0.7) * 80.0; // 增加振幅
          float sinZ = sin(z + time2 * 0.5) * 80.0; // 增加振幅
          
          pos.y = sinX + sinZ;
          
          // 大小变化 - 调整参数使粒子大小变化更明显
          float sinSX = sin(x + time2 * 0.7) + 1.0;
          float sinSZ = sin(z + time2 * 0.5) + 1.0;
          float particleSize = (sinSX + sinSZ) * 8.0; // 增加粒子大小
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = particleSize * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        void main() {
          // 圆形粒子
          vec2 vUv = gl_PointCoord.xy - vec2(0.5);
          float distance = length(vUv);
          
          if (distance > 0.5) {
            discard;
          }
          
          // 白色粒子，添加轻微的透明度变化，使效果更柔和
          float alpha = 1.0 - distance * 2.0;
          gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
        }
      `,
      transparent: true, // 启用透明，使效果更柔和
      depthWrite: false, // 禁用深度写入，提高性能
      blending: THREE.AdditiveBlending, // 使用加法混合，使粒子更明亮
      vertexColors: false,
    });

    // 创建粒子系统
    const particles = new THREE.Points(geometry, material);
    particles.frustumCulled = false;
    scene.add(particles);
    particlesRef.current = particles;

    // 初始化渲染器
    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;
      console.log('[ParticleWaves] Renderer initialized successfully');
    } catch (error) {
      console.error('[ParticleWaves] Failed to initialize renderer:', error);
      return;
    }

    // 动画循环
    const animate = () => {
      // 使用requestAnimationFrame确保动画流畅运行
      animationFrameRef.current = requestAnimationFrame(animate);

      // 确保所有引用都存在
      if (!particlesRef.current || !sceneRef.current || !cameraRef.current || !rendererRef.current) {
        return;
      }

      // 更新时间 uniforms - 修复类型错误：添加类型断言
      const currentTime = (Date.now() - (startTimeRef.current || Date.now())) * 0.001;
      const material = particlesRef.current.material as THREE.ShaderMaterial;
      material.uniforms.time.value = currentTime;
      
      console.log('[ParticleWaves] Time updated:', currentTime);

      // 渲染场景
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    // 开始动画
    startTimeRef.current = Date.now();
    animate();
    console.log('[ParticleWaves] Animation started');

    // 窗口大小变化处理
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;

      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      console.log('[ParticleWaves] Resized renderer to', window.innerWidth, 'x', window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // 清理函数
    return () => {
      console.log('[ParticleWaves] Cleaning up');
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
        rendererRef.current = null;
      }

      if (particlesRef.current) {
        // 清理几何体
        particlesRef.current.geometry.dispose();
        
        // 清理材质 - 修复类型错误：处理Material | Material[]类型
        const material = particlesRef.current.material;
        if (Array.isArray(material)) {
          // 如果是材质数组，遍历并清理每个材质
          material.forEach(m => m.dispose());
        } else {
          // 如果是单个材质，直接清理
          material.dispose();
        }
        
        particlesRef.current = null;
      }

      window.removeEventListener('resize', handleResize);
      
      sceneRef.current = null;
      cameraRef.current = null;
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