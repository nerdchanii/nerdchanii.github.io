import React from "react";
import { Route, Routes } from "react-router-dom";
import About from "./About";
import Contract from "./Contract";
import Home from "./Home";
import Portfolio from "./Portfolio";

function RoutePages() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contract />} />
        <Route path="/portfolio" element={<Portfolio />} />
      </Routes>
    </div>
  );
}

export default RoutePages;
