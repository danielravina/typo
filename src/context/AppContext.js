import React, { useCallback, useState, useMemo } from "react";

import { modes } from "../lib/modes";

const initialState = {
  suggestion: "",
  selectedWordIndex: null,
  colorTheme: null,
  clipboardText: null,
  modeKey: null,
  isDefaultPrevented: false,
};

const AppContext = React.createContext(initialState);

function AppProvider({ children }) {
  const [state, setState] = useState(initialState);

  const currentMode = useMemo(() => {
    return modes[state.modeKey];
  }, [state.modeKey]);

  const suggestionWords = useMemo(() => {
    return state.suggestion.split(" ");
  }, [state.suggestion]);

  const updateContext = useCallback((payload) => {
    setState((oldState) => ({ ...oldState, ...payload }));
  }, []);

  const resetContext = useCallback(() => {
    updateContext({});
  }, [updateContext]);

  const preventDefault = useCallback(() => {
    updateContext({ isDefaultPrevented: true });
  }, [updateContext]);

  const allowDefault = useCallback(() => {
    updateContext({ isDefaultPrevented: false });
  }, [updateContext]);

  const data = useMemo(
    () => ({
      ...state,
      updateContext,
      resetContext,
      suggestionWords,
      currentMode,
      preventDefault,
      allowDefault,
    }),
    [
      allowDefault,
      currentMode,
      preventDefault,
      resetContext,
      state,
      suggestionWords,
      updateContext,
    ]
  );
  return <AppContext.Provider value={data}>{children}</AppContext.Provider>;
}

export default AppContext;
export { AppProvider };
