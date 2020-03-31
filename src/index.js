import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import { AppProvider } from "./context/AppContext";

const Component = () => (
  <AppProvider>
    <App />
  </AppProvider>
);

ReactDOM.render(<Component />, document.getElementById("root"));
