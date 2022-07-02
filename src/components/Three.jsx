import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import React, { Suspense, useRef } from "react";

function Sun(props) {
  const mesh = useRef();

  return (
    <mesh ref={mesh} {...props} scale={[2.0, 2.0, 2.0]}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial color="red" emissive={"#ff2233"} intensity={1.0} />
    </mesh>
  );
}

const Camera = () => {
  useFrame(({ clock, camera }) => {
    camera.position.z -= Math.sin(0.1) * 0.1;
  });
  return null;
};

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

const EarthOrbit = (props) => {
  const earth = useRef();

  useFrame((state, delta) => {
    earth.current.rotation.y += 0.05;
    earth.current.rotation.x = Math.sin(10) * 0.02;
  });

  return (
    <mesh ref={earth} {...props} scale={[1.5, 1.5, 1.5]}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial color="blue" />
      <MoonOrbit position={[3, 0, 0]} />
    </mesh>
  );
};

const SolarSystem = () => {
  const solorSystem = useRef();
  useFrame(({ clock }) => {
    solorSystem.current.rotation.y += 0.005;
  });

  return (
    <group ref={solorSystem}>
      <Sun position={[0, 0, 0]} />
      <EarthOrbit position={[10, 2, 0]} />
    </group>
  );
};

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
              scale={[0.1, 0.1, 0.1]}
              position={[
                random() * 100 * Math.sin(i * random()) * Math.PI,
                random() * 100 * Math.sin(i * random()) * Math.PI,
                random() * 100 * Math.sin(i * random()) * Math.PI,
              ]}
            >
              <sphereGeometry args={[2, 4, 4]} />
              <meshStandardMaterial color="white" flatShading="true" />
            </mesh>
          );
        })}
    </mesh>
  );
};

function FindMe() {
  return (
    <Canvas
      style={{ display: "block", width: "100vw", height: "100vh" }}
      camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 0, -100] }}
      onCreated={(state) => state.gl.setClearColor("black")}
    >
      <Suspense>
        <ambientLight />
        <pointLight position={[0, 0, 0]} color="#ffaaaa" />
        <ambientLight intensity={0.1} />
        <Camera />
        <SolarSystem />
        <StarSystem />
      </Suspense>
    </Canvas>
  );
}

export default FindMe;
