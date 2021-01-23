import React, { useCallback, useEffect } from "react";
import useAppContext from "../hooks/useAppContext";
import { DEFAULT_HEIGHT } from "../lib/constants";
import { changeHeight } from "../lib/utils";
import useInputContext from "../hooks/useInputContext";

export default React.forwardRef((props, inputRef) => {
  const { suggestion, isDefaultPrevented } = useAppContext();
  const { query, setQuery } = useInputContext();

  const onKeyDown = useCallback(
    (e) => {
      const { key } = e;
      if (key === "Tab" && suggestion.length) {
        e.preventDefault();
        inputRef.current.focus();
        const val = suggestion;
        inputRef.current.value = "";
        inputRef.current.value = val;
        setQuery(val);
        return;
      }
      if ((key === "Escape" || key === "Backspace") && !query.length) {
        window.ipcRenderer.send("hide");
      }
      if (isDefaultPrevented) {
        e.preventDefault();
      }
    },
    [inputRef, isDefaultPrevented, query.length, setQuery, suggestion]
  );

  const onChange = useCallback(
    (e) => {
      const { value } = e.target;
      setQuery(value);
    },
    [setQuery]
  );

  useEffect(() => {
    window.ipcRenderer.on("window-shown", () => {
      inputRef.current.focus();
      changeHeight(DEFAULT_HEIGHT);
    });
    window.ipcRenderer.on("window-hidden", () => {
      setQuery("");
    });
  }, [inputRef, setQuery]);

  return (
    <div className="input-wrapper">
      <header />
      <input
        placeholder={"HyperText"}
        autoFocus
        ref={inputRef}
        className="main-input"
        value={query}
        onChange={onChange}
        onKeyDown={onKeyDown}
      />
    </div>
  );
});
