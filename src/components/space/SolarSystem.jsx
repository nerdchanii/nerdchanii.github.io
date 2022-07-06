import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import EarthOrbit from "./EarthOrbit";
import Sun from "./Sun";
import Planet from "./Planet";
const SolarSystem = () => {
  const solorSystem = useRef();
  useFrame(({ clock }) => {
    solorSystem.current.rotation.y += 0.005;
  });
  let earthRadius = 10;
  let sunRadius = earthRadius * 11;
  let mercuryRadius = earthRadius * 0.4;
  let venusRadius = earthRadius * 0.9;
  let marsRadius = earthRadius * 0.5;
  let jupiterRadius = earthRadius * 11.2;
  let saturnRadius = earthRadius * 9.4;
  let uranusRadius = earthRadius * 4;
  let neptuneRadius = earthRadius * 3.9;
  const getScale = (radius) => {
    return [radius, radius, radius];
  };

  return (
    <group ref={solorSystem} scale={[1, 1, 1]}>
      <Sun position={[0, 0, 0]} scale={[sunRadius, sunRadius, sunRadius]} />
      <Planet
        name="Mercury"
        scale={getScale(mercuryRadius)}
        color="red"
        position={[4.5 * sunRadius, 2, 0]}
      />
      <Planet
        name="Venus"
        scale={getScale(venusRadius)}
        color="red"
        position={[8.0 * sunRadius, 4, 0]}
      />
      <EarthOrbit
        position={[11.7 * sunRadius, 2, 0]}
        scale={getScale(earthRadius)}
      />
      <Planet
        name="Mars"
        scale={getScale(marsRadius)}
        color="yellow"
        position={[17.9 * sunRadius, 2, 0]}
      />
      <Planet
        name="Jupiter"
        scale={getScale(jupiterRadius)}
        color="red"
        position={[61.3 * sunRadius, 2, 0]}
      />
      <Planet
        name="Saturn"
        scale={getScale(saturnRadius)}
        color="brown"
        position={[113.3 * sunRadius, 2, 0]}
      />
      <Planet
        name="Uranus"
        scale={getScale(uranusRadius)}
        color="white"
        position={[266.6 * sunRadius, 2, 90]}
      />
      <Planet
        name="Neptune"
        scale={getScale(neptuneRadius)}
        color="purple"
        position={[373.3 * sunRadius, 2, 0]}
      />{" "}
    </group>
  );
};

export default SolarSystem;
