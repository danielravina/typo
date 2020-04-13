import React, { useEffect, useCallback, useState, useMemo } from "react";
import { strip } from "../lib/utils";

import { modes } from "../lib/modes";
import { usePubSub } from "usepubsub";
const Diff = require("diff");

const initialState = {
  query: "",
  suggestion: "",
  selectedWordIndex: null,
  colorTheme: null,
  clipboardText: null,
  modeKey: null,
};

const AppContext = React.createContext(initialState);

function AppProvider({ children }) {
  const [state, setState] = useState(initialState);
  const [corrections, setCorrections] = useState(new Set());
  const { subscribe, publish } = usePubSub();

  const currentMode = useMemo(() => {
    return modes[state.modeKey];
  }, [state.modeKey]);

  const suggestionWords = useMemo(() => {
    return state.suggestion.split(" ");
  }, [state.suggestion]);

  const finalResult = useMemo(() => {
    if (state.selectedWordIndex === null) {
      return state.suggestion;
    }

    return suggestionWords[state.selectedWordIndex];
  }, [state.selectedWordIndex, state.suggestion, suggestionWords]);

  const updateContext = useCallback((payload) => {
    setState((oldState) => ({ ...oldState, ...payload }));
  }, []);

  const resetContext = useCallback(() => {
    updateContext({});
  }, [updateContext]);

  useEffect(() => {
    const diff = Diff.diffWords(state.query, state.suggestion, {
      ignoreCase: true,
    });

    setCorrections(new Set());
    diff.forEach(({ added, value }) => {
      if (added) {
        setCorrections((corr) => {
          corr.add(strip(value.toLowerCase()));
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
        corrections,
        suggestionWords,
        finalResult,
        currentMode,
        subscribe,
        publish,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export default AppContext;
export { AppProvider };
