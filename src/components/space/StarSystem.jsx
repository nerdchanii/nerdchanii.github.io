import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";

const StarSystem = () => {
  const starSystem = useRef();
  useFrame(({ clock }) => {
    starSystem.current.rotation.y += 0.001;
    starSystem.current.rotation.x -= Math.sin(5) * 0.001;
  });
  let random = Math.random;
  return (
    <mesh ref={starSystem}>
      {Array(2000)
        .fill(0)
        .map((_, i) => {
          return (
            <mesh
              key={i}
              ref={starSystem}
              scale={[1, 1, 1]}
              position={[
                random() * 1000 * Math.sin(i * random()) * Math.PI,
                random() * 1000 * Math.sin(-i * random()) * Math.PI,
                random() * 1000 * Math.sin(i * random()) * Math.PI,
              ]}
            >
              <circleGeometry args={[2, 4]} />
              <meshStandardMaterial color="white" flatShading="true" />
            </mesh>
          );
        })}
    </mesh>
  );
};

export default StarSystem;
