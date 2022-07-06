import React, { useRef } from "react";
// import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { useFrame } from "@react-three/fiber";
import MoonOrbit from "./MoonOrbit";

const EarthOrbit = ({ position, scale, ...props }) => {
  const earth = useRef();
  // const gltf = useLoader(GLTFLoader, "path");
  useFrame((state, delta) => {
    earth.current.rotation.y += 0.05;
    earth.current.rotation.x = Math.sin(10) * 0.02;
  });
  return (
    <mesh ref={earth} {...props} position={position} scale={scale}>
      <sphereGeometry args={[1, 16, 16]} />
      {/* <primitive object={gltf.scene} scale={[1, 1, 1]} /> */}
      <meshStandardMaterial color="blue" />
      <MoonOrbit position={[3, 0, 0]} />
    </mesh>
  );
};

export default EarthOrbit;
