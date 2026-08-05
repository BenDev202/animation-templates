"use client";

import { Center, Environment, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import React, { Suspense, useRef, useState } from "react";
import { useLenis } from "lenis/react";

const ModelMesh = ({scrollprogress}) => {
  const { scene } = useGLTF("/greek_underwater_broken_statue_1.glb");
  const groupRef = useRef(null)

  useFrame(()=>{
    if(groupRef.current){
      groupRef.current.rotation.y = scrollprogress * Math.PI * 2
    }
  })
  return (
    <group ref={groupRef}>
      <primitive scale={0.11} object={scene} />
    </group>
  );
};

const Model = () => {
  const [scrollprogress, setscrollprogress] = useState(0)

  useLenis(({progress})=>{
    setscrollprogress(progress)
  })
  return (
    <section className="h-screen w-full">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Environment preset="sunset" environmentIntensity={0.5} />
        <Suspense fallback={null}>
          <mesh position={[0, -1.3, 0]}>
            <Center>
              <ModelMesh scrollprogress={scrollprogress} />
            </Center>
          </mesh>
        </Suspense>
      </Canvas>
    </section>
  );
};

export default Model;
