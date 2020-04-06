import React, { useState, useCallback } from "react";

const EmojiContext = React.createContext({});

function EmojiProvider({ children }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(emoji => {
    console.log(emoji);
    window.ipcRenderer.send("type", emoji);
    window.ipcRenderer.send("hide");
    setTimeout(() => {
      setSelectedIndex(0);
    }, 100);
  }, []);

  return (
    <EmojiContext.Provider
      value={{
        selectedIndex,
        setSelectedIndex,
        onSelect
      }}
    >
      {children}
    </EmojiContext.Provider>
  );
}

export default EmojiContext;
export { EmojiProvider };
