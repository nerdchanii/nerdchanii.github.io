import React from "react";
import { BrowserRouter } from "react-router-dom";
import Nav from "./layout/Nav";
import Headers from "./layout/Headers";
import Title from "./layout/Title";
import "./App.css";
import MainRoutes from "./pages/MainRoutes";

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Headers>
          <Title />
          <Nav />
        </Headers>
        <MainRoutes />
      </div>
    </BrowserRouter>
  );
}

export default App;
