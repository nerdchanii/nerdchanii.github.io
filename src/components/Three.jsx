import { Canvas, useFrame } from "@react-three/fiber";
import React, { Suspense, useState } from "react";
import Space from "./space";

const Camera = () => {
  const [keyPressed, setKeyPressed] = useState({});
  const handleKeyDown = (e) => {
    setKeyPressed({ ...keyPressed, [e.key]: new Date().getTime() });
  };

  const handleKeyUp = (e) => {
    setKeyPressed({ ...keyPressed, [e.key]: null });
  };

  useFrame(({ clock, camera }, delta) => {
    // camera.position.z -= Math.sin(0.1);
    Object.entries(keyPressed).forEach(([key, value]) => {
      const duration = value ? new Date().getTime() - value : 0;
      const speed = Math.sqrt(duration * delta) / 0.16;
      const rotateSpeed = speed / 100;
      switch (key) {
        case "w":
          setTimeout(() => camera.translateZ(-speed), 0);
          break;
        case "s":
          setTimeout(() => camera.translateZ(speed), 0);
          break;
        case "a":
          setTimeout(() => camera.translateX(-speed), 0);
          break;
        case "d":
          setTimeout(() => camera.translateX(speed), 0);
          break;
        case "ArrowUp":
          setTimeout(() => camera.rotateX(rotateSpeed), 0);
          break;
        case "ArrowDown":
          setTimeout(() => camera.rotateX(-rotateSpeed), 0);
          break;
        case "ArrowLeft":
          setTimeout(() => camera.rotateY(rotateSpeed), 0);
          break;
        case "ArrowRight":
          setTimeout(() => camera.rotateY(-rotateSpeed), 0);
          break;
        default:
          break;
      } // switch
    });
  });
  addEventListener("keydown", handleKeyDown);
  addEventListener("keyup", handleKeyUp);
  return null;
};

function Three() {
  return (
    <Canvas
      style={{ display: "block", width: "100vw", height: "100vh" }}
      camera={{ fov: 90, near: 0.1, far: 100000, position: [100, 100, 1500] }}
      onCreated={(state) => state.gl.setClearColor("black")}
    >
      <Suspense>
        <pointLight position={[0, 0, 10000]} color="#ffaaaa" />
        <ambientLight intensity={1} />
        <Space camera={<Camera />} />
      </Suspense>
    </Canvas>
  );
}

export default Three;
