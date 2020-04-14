import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import { AppProvider } from "./context/AppContext";
import { EmojiProvider } from "./context/EmojiContext";

import { InputProvider } from "./context/InputContext";
import { LocationProvider, createHistory } from "@reach/router";

const history = createHistory(window);

const Component = () => {
  return (
    <LocationProvider history={history}>
      <AppProvider>
        <InputProvider>
          <EmojiProvider>
            <App />
          </EmojiProvider>
        </InputProvider>
      </AppProvider>
    </LocationProvider>
  );
};

ReactDOM.render(<Component />, document.getElementById("root"));
