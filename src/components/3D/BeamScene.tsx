import React, { useRef, useMemo, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Grid } from '@react-three/drei';
import * as THREE from 'three';

interface DeformableBeamProps {
  deflectionRef: React.MutableRefObject<number>;
  targetDeflectionRef: React.MutableRefObject<number>;
  onDeflectionUpdate?: (val: number) => void;
}

const BEAM_SPAN = 13.0; // Total length L
const HALF_SPAN = BEAM_SPAN / 2;
const SUBDIVISIONS = 80;

// Controlled elastic deflection limit (realistic structural stiffness, not exaggerated)
const MAX_DEFLECTION = 0.55;

/**
 * 3D Structural Steel I-Beam with Real-Time Euler-Bernoulli Elastic Bending
 * Bright, gleaming metallic finish with high visibility.
 */
const DeformableIBeam: React.FC<DeformableBeamProps> = ({
  deflectionRef,
  targetDeflectionRef,
  onDeflectionUpdate
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Generate standard wide-flange I-beam cross-section geometry
  const { geometry, origPositions } = useMemo(() => {
    const shape = new THREE.Shape();
    const w = 1.05; // Flange width
    const tf = 0.16; // Flange thickness
    const d = 1.25; // Beam depth
    const tw = 0.15; // Web thickness
    const hw = w / 2;
    const hd = d / 2;
    const htw = tw / 2;

    // Contour of wide-flange I-beam
    shape.moveTo(-hw, -hd);
    shape.lineTo(hw, -hd);
    shape.lineTo(hw, -hd + tf);
    shape.lineTo(htw, -hd + tf);
    shape.lineTo(htw, hd - tf);
    shape.lineTo(hw, hd - tf);
    shape.lineTo(hw, hd);
    shape.lineTo(-hw, hd);
    shape.lineTo(-hw, hd - tf);
    shape.lineTo(-htw, hd - tf);
    shape.lineTo(-htw, -hd + tf);
    shape.lineTo(-hw, -hd + tf);
    shape.closePath();

    // Extrude horizontally with fine subdivisions for smooth bending
    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: BEAM_SPAN,
      steps: SUBDIVISIONS,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.02,
      bevelThickness: 0.02
    });

    // Align length along the X axis and center at origin
    geom.rotateY(Math.PI / 2);
    geom.center();

    const orig = new Float32Array(geom.attributes.position.array);

    return { geometry: geom, origPositions: orig };
  }, []);

  // Frame animation loop for elastic physics & vertex displacement
  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // Smooth elastic lerp towards target deflection
    const lerpSpeed = Math.min(1, delta * 14);
    deflectionRef.current = THREE.MathUtils.lerp(
      deflectionRef.current,
      targetDeflectionRef.current,
      lerpSpeed
    );

    // Natural elastic restoring decay towards equilibrium (steel spring stiffness)
    targetDeflectionRef.current *= Math.pow(0.965, delta * 60);

    const deltaCur = deflectionRef.current;
    const pos = geometry.attributes.position;
    const count = pos.count;
    const array = pos.array as Float32Array;

    // Euler-Bernoulli Elastic Deflection Function:
    // v(x) = delta * sin(pi * xi) where xi in [0, 1]
    const piOverL = Math.PI / BEAM_SPAN;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const x0 = origPositions[idx];
      const y0 = origPositions[idx + 1];

      const xi = (x0 + HALF_SPAN) / BEAM_SPAN; // 0 to 1
      const sinVal = Math.sin(Math.PI * xi);
      const cosVal = Math.cos(Math.PI * xi);

      const v = deltaCur * sinVal; // Vertical sag
      const theta = -deltaCur * piOverL * cosVal; // Section rotation angle

      // Displace vertex accounting for cross-section rotation
      array[idx] = x0 + y0 * Math.sin(theta);
      array[idx + 1] = y0 - v;
    }

    pos.needsUpdate = true;
    geometry.computeVertexNormals();

    if (onDeflectionUpdate) {
      onDeflectionUpdate(deltaCur);
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow position={[0, 0, 0]}>
      {/* Bright, polished structural steel material that reflects light crisply */}
      <meshStandardMaterial
        color="#e2e8f0"
        roughness={0.25}
        metalness={0.65}
      />
    </mesh>
  );
};

/**
 * Clean, well-lit Structural End Supports (Pin & Roller)
 */
const SupportStructures: React.FC = () => {
  const pinX = -HALF_SPAN;
  const rollerX = HALF_SPAN;
  const supportY = -0.62;

  return (
    <group>
      {/* Left Pin Support (Pedestal + Stainless Pin) */}
      <group position={[pinX, supportY, 0]}>
        {/* Triangular Pedestal */}
        <mesh position={[0, -0.6, 0]}>
          <coneGeometry args={[0.75, 1.1, 4]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.35} metalness={0.5} />
        </mesh>
        {/* Polished Pin Cylinder */}
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 1.4, 24]} />
          <meshStandardMaterial color="#ffffff" roughness={0.15} metalness={0.9} />
        </mesh>
        {/* Base Plate */}
        <mesh position={[0, -1.15, 0]}>
          <boxGeometry args={[1.6, 0.16, 1.6]} />
          <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.5} />
        </mesh>
      </group>

      {/* Right Roller Support (Pedestal + Roller Bearings) */}
      <group position={[rollerX, supportY, 0]}>
        {/* Upper Saddle Plate */}
        <mesh position={[0, -0.2, 0]}>
          <boxGeometry args={[1.1, 0.25, 1.4]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.35} metalness={0.5} />
        </mesh>
        {/* Dual Polished Roller Cylinders */}
        <mesh position={[-0.26, -0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 1.4, 20]} />
          <meshStandardMaterial color="#ffffff" roughness={0.15} metalness={0.9} />
        </mesh>
        <mesh position={[0.26, -0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 1.4, 20]} />
          <meshStandardMaterial color="#ffffff" roughness={0.15} metalness={0.9} />
        </mesh>
        {/* Ground Bedplate */}
        <mesh position={[0, -0.9, 0]}>
          <boxGeometry args={[1.7, 0.45, 1.6]} />
          <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.5} />
        </mesh>
      </group>
    </group>
  );
};

interface BeamSceneProps {
  onDeflectionValue?: (val: number) => void;
  isLaunching?: boolean;
}

/**
 * Dynamic Camera Controller that executes a cinematic fly-through zoom on launch
 */
const CameraController: React.FC<{ isLaunching?: boolean }> = ({ isLaunching }) => {
  useFrame((state, delta) => {
    if (isLaunching) {
      // Cinematic zoom-in accelerating into the beam
      state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, 3.5, delta * 4.5);
      state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, -1.0, delta * 4.5);
    }
  });
  return null;
};

export const BeamScene: React.FC<BeamSceneProps> = ({ onDeflectionValue, isLaunching = false }) => {
  const deflectionRef = useRef<number>(0);
  const targetDeflectionRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const lastPointerYRef = useRef<number>(0);

  // Stiffer, controlled mouse wheel deflection (realistic structural flex)
  const handleWheel = useCallback((e: WheelEvent) => {
    if (isLaunching) return;
    e.preventDefault();
    // Reduced sensitivity by 5x so deflection feels stiff and authentic
    const sensitivity = 0.00065;
    targetDeflectionRef.current += e.deltaY * sensitivity;
    // Strict clamp to prevent exaggerated bending
    targetDeflectionRef.current = Math.max(-MAX_DEFLECTION, Math.min(MAX_DEFLECTION, targetDeflectionRef.current));
  }, [isLaunching]);

  // Pointer drag for tactile interaction
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isLaunching) return;
    isDraggingRef.current = true;
    lastPointerYRef.current = e.clientY;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || isLaunching) return;
    const deltaY = e.clientY - lastPointerYRef.current;
    lastPointerYRef.current = e.clientY;
    targetDeflectionRef.current += deltaY * 0.0012;
    targetDeflectionRef.current = Math.max(-MAX_DEFLECTION, Math.min(MAX_DEFLECTION, targetDeflectionRef.current));
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  useEffect(() => {
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  return (
    <div
      className="w-full h-full cursor-ns-resize select-none overflow-hidden"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <Canvas
        shadows
        camera={{ position: [0, 1.6, 13.0], fov: 46 }}
        className="w-full h-full bg-slate-900"
      >
        {/* Camera Launch Controller */}
        <CameraController isLaunching={isLaunching} />

        {/* Comprehensive Studio Lighting Rig (Ensures the beam is bright and unmistakably visible) */}
        <ambientLight intensity={1.4} color="#f8fafc" />
        
        {/* Key Directional Sun from Top-Right */}
        <directionalLight
          position={[10, 14, 12]}
          intensity={3.4}
          color="#ffffff"
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-9}
          shadow-camera-right={9}
          shadow-camera-top={6}
          shadow-camera-bottom={-6}
        />
        
        {/* Front-Facing Fill Light to illuminate beam web and flanges */}
        <directionalLight position={[0, 1, 14]} intensity={2.4} color="#ffffff" />
        
        {/* Bottom-Up Fill Light to clearly expose lower flange geometry */}
        <directionalLight position={[0, -5, 8]} intensity={1.4} color="#bfdbfe" />
        
        {/* Cool Rim Lighting from Rear for striking edge definition */}
        <directionalLight position={[-12, 6, -10]} intensity={2.2} color="#818cf8" />
        <directionalLight position={[12, 5, -8]} intensity={1.8} color="#c7d2fe" />

        {/* 3D Beam Assembly Group lowered to y = -1.6 (clean separation from upper UI texts) */}
        <group position={[0, -1.6, 0]}>
          {/* 3D Deformable I-Beam */}
          <DeformableIBeam
            deflectionRef={deflectionRef}
            targetDeflectionRef={targetDeflectionRef}
            onDeflectionUpdate={onDeflectionValue}
          />

          {/* Structural Pin & Roller Supports */}
          <SupportStructures />

          {/* Ground Floor Shadow */}
          <ContactShadows
            position={[0, -1.22, 0]}
            opacity={0.65}
            scale={28}
            blur={2.5}
            far={6}
            color="#020617"
          />

          {/* Technical Grid Floor */}
          <Grid
            position={[0, -1.23, 0]}
            args={[32, 32]}
            cellSize={1}
            cellThickness={0.9}
            cellColor="#334155"
            sectionSize={5}
            sectionThickness={1.4}
            sectionColor="#475569"
            fadeDistance={28}
            fadeStrength={1.5}
          />
        </group>
      </Canvas>
    </div>
  );
};

export default BeamScene;
