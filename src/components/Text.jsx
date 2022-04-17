import React from "react";

function Text({ children }) {
  return (
    <p style={{ color: "#555", margin: "0 0", fontSize: "1.5rem" }}>
      {children}
    </p>
  );
}

export default Text;
