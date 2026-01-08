import * as THREE from 'three';
import { Fn, If, uniform, float, color, uv, vec2, vec3, hash, sin, length, oneMinus, time, instancedArray, instanceIndex } from 'three/tsl';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';

const particleCount = 100_000;

let camera, scene, renderer;
let controls, stats;
let computeParticles;

init();

function init() {

  const { innerWidth, innerHeight } = window;

  camera = new THREE.PerspectiveCamera( 50, innerWidth / innerHeight, 10, 100000 );
  camera.position.set( 0, 200, 500 );

  scene = new THREE.Scene();

  //

  const positions = instancedArray( particleCount, 'vec3' );
  const sizes = instancedArray( particleCount, 'vec3' );

  // compute
  
  const separation = 100;
  const amount = Math.sqrt( particleCount );
  const offset = float( amount / 2 );

  const computeInit = Fn( () => {

    const position = positions.element( instanceIndex );
    const size = sizes.element( instanceIndex );
    
    const x = instanceIndex.mod( amount );
    const z = instanceIndex.div( amount );
    
    position.x = offset.sub( x ).mul( separation );
    position.z = offset.sub( z ).mul( separation );

    size.assign( vec3( 1.0 ) );

  } )().compute( particleCount );

  //

  const computeUpdate = Fn( () => {

    const x = float( instanceIndex.mod( amount ) ).mul( 0.5 );
    const z = float( instanceIndex.div( amount ) ).mul( 0.5 );

    const time2 = float( 1 ).sub( time ).mul( 5 );

    const position = positions.element( instanceIndex );   
    
    const sinX = sin( x.add( time2 ).mul( 0.7 ) ).mul( 50 );
    const sinZ = sin( z.add( time2 ).mul( 0.5 ) ).mul( 50 );
    
    position.y = sinX.add( sinZ );

    const size = sizes.element( instanceIndex ); 
    
    const sinSX = sin( x.add( time2 ).mul( 0.7 ) ).add( 1 ).mul( 5 );
    const sinSZ = sin( z.add( time2 ).mul( 0.5 ) ).add( 1 ).mul( 5 );
    
    size.assign( sinSX.add( sinSZ ) );

  } );

  computeParticles = computeUpdate().compute( particleCount );

  // create particles
  
  const material = new THREE.SpriteNodeMaterial();
  material.colorNode = vec3( 1.0 );
  material.positionNode = positions.toAttribute();
  material.scaleNode = sizes.toAttribute();
  material.transparent = false;

  const geometry = new THREE.CircleGeometry();
  const particles = new THREE.Mesh( geometry, material );
  particles.count = particleCount;
  particles.frustumCulled = false;
  scene.add( particles );

  //

  renderer = new THREE.WebGPURenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setAnimationLoop( animate );
  document.body.appendChild( renderer.domElement );

  stats = new Stats();
  document.body.appendChild( stats.dom );

  //

  renderer.computeAsync( computeInit );

  //

  controls = new OrbitControls( camera, renderer.domElement );
  controls.enableDamping = true;
  controls.minDistance = 5;
  controls.target.set( 0, 0, 0 );
  controls.update();

  //

  window.addEventListener( 'resize', onWindowResize );

}

function onWindowResize() {

  const { innerWidth, innerHeight } = window;

  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( innerWidth, innerHeight );

}

function animate() {

  stats.update();

  controls.update();
  
  renderer.compute( computeParticles );
  renderer.render( scene, camera );

}