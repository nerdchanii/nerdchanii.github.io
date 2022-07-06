import React, { useRef } from "react";

function Planet({ scale, position, color, ...props }) {
  const mesh = useRef();

  return (
    <mesh ref={mesh} {...props} scale={scale} position={position}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

export default Planet;
