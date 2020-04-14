import React, { useCallback, useRef, useEffect } from "react";
import useAppContext from "../hooks/useAppContext";
import { DEFAULT_HEIGHT } from "../lib/constants";
import { changeHeight } from "../lib/utils";
import useInputContext from "../hooks/useInputContext";

export default React.forwardRef(({ onChange }, inputRef) => {
  const { suggestion, isDefaultPrevented, publish } = useAppContext();
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
      if (key === "Backspace" && !query.length) {
        window.ipcRenderer.send("hide");
      }
      if (isDefaultPrevented) {
        e.preventDefault();
      }
    },
    [inputRef, isDefaultPrevented, query.length, setQuery, suggestion]
  );

  const _onChange = useCallback(
    (e) => {
      const { value } = e.target;
      setQuery(value);
      setTimeout(() => {
        onChange(value);
      }, 0);
    },
    [onChange, setQuery]
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
        onChange={_onChange}
        onKeyDown={onKeyDown}
      />
    </div>
  );
});
