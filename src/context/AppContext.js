import React, { useEffect, useCallback, useState } from "react";
import { strip } from "../lib/utils";

const Diff = require("diff"); // for some reason need 'require'

const initialState = {
  query: "",
  suggestion: "",
  isAltPressed: false,
  isShiftPressed: false,
  isCommandPressed: false,
  selectedIndex: null,
  colorTheme: null,
  chosenEmoji: null,
  selectionCount: 0,
  emojiMode: false,
  clipboardText: null
};

const AppContext = React.createContext(initialState);

function AppProvider({ children }) {
  const [state, setState] = useState(initialState);
  const [corrections, setCorrections] = useState(new Set());

  const updateContext = useCallback(payload => {
    setState(oldState => ({ ...oldState, ...payload }));
  }, []);

  const resetContext = useCallback(() => {
    updateContext({
      query: "",
      emojiMode: false,
      suggestion: "",
      isAltPressed: false,
      isShiftPressed: false,
      selectedIndex: null,
      selectionCount: 0,
      clipboardText: null
    });
  }, [updateContext]);

  useEffect(() => {
    const diff = Diff.diffWords(state.query, state.suggestion, {
      ignoreCase: true
    });
    setCorrections(new Set());
    diff.forEach(({ added, value }) => {
      if (added) {
        setCorrections(corr => {
          corr.add(strip(value));
          return corr;
        });
      }
    });
  }, [state.query, state.suggestion, updateContext]);

  return (
    <AppContext.Provider
      value={{
        ...state,
        updateContext,
        resetContext,
        corrections
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export default AppContext;
export { AppProvider };
