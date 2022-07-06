import React, { Suspense } from "react";
import SolarSystem from "./SolarSystem";
import StarSystem from "./StarSystem";

function index({ camera }) {
  const scale = [0.1, 0.1, 0.1];
  return (
    <Suspense>
      <SolarSystem scale={scale} />
      <StarSystem scale={scale} />
      {camera}
    </Suspense>
  );
}

export default index;
