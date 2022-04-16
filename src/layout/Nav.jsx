import React from "react";
import { Link } from "react-router-dom";
import "./layout.scss";
function Sidebar() {
  return (
    <nav className="navigate-bar">
      <Link to="/about">About</Link>
      <Link to="/contact">Contact</Link>
      <Link to="/portfolio">Portfolio</Link>
    </nav>
  );
}

export default Sidebar;
