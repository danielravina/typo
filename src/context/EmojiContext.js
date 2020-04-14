import React, { useMemo, useState, useCallback } from "react";
import { emojiIndex } from "emoji-mart";
import { categories } from "emoji-mart/data/apple.json";
import arrayChunk from "array-chunk";
import randomcolor from "randomcolor";
import useInputContext from "../hooks/useInputContext";
const GRID_COLUMNS = 16;

const EmojiContext = React.createContext({});

function EmojiProvider({ children }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { query } = useInputContext();

  const filteredQueryResult = useMemo(() => {
    if (query.length < 2) return []; // to include :

    return emojiIndex.search(query.replace(":", "")).map((o) => o.id);
  }, [query]);

  const filteredGrid = useMemo(
    () => arrayChunk(filteredQueryResult, GRID_COLUMNS),
    [filteredQueryResult]
  );

  const allEmojies = useMemo(
    () =>
      categories.reduce((arr, category) => {
        return [...arr, ...category.emojis];
      }, []),
    []
  );

  const fullGrid = useMemo(() => arrayChunk(allEmojies, GRID_COLUMNS), [
    allEmojies,
  ]);

  const colors = useMemo(
    () =>
      allEmojies.map(() =>
        randomcolor({ format: "rgba", alpha: 0.5, luminosity: "dark" })
      ),
    [allEmojies]
  );

  const onSelect = useCallback((emoji) => {
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
        onSelect,
        filteredQueryResult,
        GRID_COLUMNS,
        filteredGrid,
        fullGrid,
        colors,
        allEmojies,
      }}
    >
      {children}
    </EmojiContext.Provider>
  );
}

export default EmojiContext;
export { EmojiProvider };
