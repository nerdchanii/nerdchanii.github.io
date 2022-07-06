import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";

const MoonOrbit = (props) => {
  const moon = useRef();
  useFrame((state, delta) => {
    moon.current.rotation.y += 1;
  });
  return (
    <mesh ref={moon} {...props} scale={[0.5, 0.5, 0.5]}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial
        color="yellow"
        emissive={0x0c0c0c}
        flatShading={true}
      />
    </mesh>
  );
};

export default MoonOrbit;
