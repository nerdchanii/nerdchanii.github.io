import React, { useRef } from "react";

function Sun({ scale, ...props }) {
  const mesh = useRef();

  return (
    <mesh ref={mesh} {...props} scale={scale}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial color="red" emissive={"#ff2233"} intensity={1.0} />
    </mesh>
  );
  ƒ;
}

export default Sun;
