import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import { AppProvider } from "./context/AppContext";
import { EmojiProvider } from "./context/EmojiContext";

import { usePubSub } from "usepubsub";

const Component = () => {
  const { PubSubContext, publish, subscribe, unsubscribe } = usePubSub();
  return (
    <PubSubContext.Provider value={{ publish, subscribe, unsubscribe }}>
      <AppProvider>
        <EmojiProvider>
          <App />
        </EmojiProvider>
      </AppProvider>
    </PubSubContext.Provider>
  );
};

ReactDOM.render(<Component />, document.getElementById("root"));
