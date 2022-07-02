import React from "react";

function FullPageArticle({ children }) {
  return <article style={style}>{children}</article>;
}

const style = {
  display: "flex",
  minHeight: "100vh",
  alignItems: "center",
  textAlign: "center",
  margin: "0 auto",
  width: "100vw",
  scrollSnapAlign: "center",
  scrollSnapType: "x mandatory",
};
export default FullPageArticle;
