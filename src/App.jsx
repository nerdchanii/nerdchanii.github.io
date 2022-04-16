import React from "react";
import "./App.css";
import { BrowserRouter } from "react-router-dom";
import RoutePages from "./pages/RoutePages";
import Nav from "./layout/Nav";
import Headers from "./layout/Headers";
import Title from "./layout/Title";

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Headers>
          <Title />
          <Nav />
        </Headers>
        <RoutePages></RoutePages>
      </div>
    </BrowserRouter>
  );
}

export default App;
