import React, { useState } from "react";

const EmojiContext = React.createContext({});

function EmojiProvider({ children }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <EmojiContext.Provider
      value={{
        selectedIndex,
        setSelectedIndex
      }}
    >
      {children}
    </EmojiContext.Provider>
  );
}

export default EmojiContext;
export { EmojiProvider };
