import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import { AppProvider } from "./context/AppContext";
import { EmojiProvider } from "./context/EmojiContext";

const Component = () => (
  <AppProvider>
    <EmojiProvider>
      <App />
    </EmojiProvider>
  </AppProvider>
);

ReactDOM.render(<Component />, document.getElementById("root"));
