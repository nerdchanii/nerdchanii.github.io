import React from "react";
import { Route, Routes } from "react-router-dom";
import About from "./About";
import Contract from "./Contract";
import Home from "./Home";

function MainRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/contract" element={<Contract />} />
    </Routes>
  );
}

export default MainRoutes;
