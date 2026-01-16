import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const LiquidGradientBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // 创建场景
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 创建相机
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 1;
    cameraRef.current = camera;

    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.zIndex = '-1';
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 创建平面几何体
    const geometry = new THREE.PlaneGeometry(2, 2);

    // 创建着色器材质
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec2 uResolution;
        varying vec2 vUv;
        
        void main() {
          vec2 uv = vUv;
          
          // 创造液体流动效果
          vec2 p = uv - 0.5;
          p.x *= uResolution.x / uResolution.y;
          
          float time = uTime * 0.5;
          
          // 多层波形
          float wave1 = sin(p.x * 10.0 + time) * 0.1;
          float wave2 = sin(p.y * 15.0 + time * 1.5) * 0.08;
          float wave3 = sin(length(p) * 20.0 - time * 2.0) * 0.05;
          
          // 颜色混合
          vec3 color1 = vec3(0.8, 0.2, 0.8); // 紫色
          vec3 color2 = vec3(0.2, 0.1, 0.4); // 深蓝色
          vec3 color3 = vec3(0.4, 0.1, 0.6); // 深紫色
          
          float mixFactor1 = 0.5 + 0.5 * sin(uv.x * 10.0 + time);
          float mixFactor2 = 0.5 + 0.5 * cos(uv.y * 15.0 + time * 1.2);
          
          vec3 finalColor = mix(color1, color2, mixFactor1);
          finalColor = mix(finalColor, color3, mixFactor2);
          
          // 添加动态效果
          finalColor += vec3(wave1 * 0.2, wave2 * 0.2, wave3 * 0.2);
          
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    });

    // 创建网格
    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    // 动画函数
    const animate = () => {
      timeRef.current += 0.01;
      
      if (material.uniforms.uTime) {
        material.uniforms.uTime.value = timeRef.current;
      }
      
      renderer.render(scene, camera);
      animationIdRef.current = requestAnimationFrame(animate);
    };
    animate();

    // 处理窗口大小变化
    const handleResize = () => {
      if (!camera || !renderer) return;
      
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      
      renderer.setSize(window.innerWidth, window.innerHeight);
      
      if (material.uniforms.uResolution) {
        material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
      
      geometry.dispose();
      material.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: 'transparent',
      }}
    />
  );
};

export default LiquidGradientBackground;