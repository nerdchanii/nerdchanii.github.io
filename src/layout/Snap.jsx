import React from "react";

function Snap({ children }) {
  return <div style={style}>{children}</div>;
}

const style = {
  display: "flex",
  height: "100vh",
  flexDirection: "column",
  alignItems: "center",

  margin: "0 auto",
  width: "100%",
  scrollSnapType: "y mandatory",
  overflow: "auto",
};

export default Snap;
