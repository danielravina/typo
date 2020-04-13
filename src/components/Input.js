import React, { useState, useCallback, useRef, useEffect } from "react";
import useAppContext from "../hooks/useAppContext";
import { DEFAULT_HEIGHT } from "../lib/constants";
import { changeHeight } from "../lib/utils";
import { usePubSub } from "usepubsub";

export default function ({ onKeyDown, onKeyUp, onChange }) {
  const input = useRef(null);
  const { subscribe } = usePubSub();
  const { suggestion, isAltPressed, updateContext } = useAppContext();
  const [value, setValue] = useState("");

  const _onKeyDown = useCallback(
    (e) => {
      // TAB IS A S PECIAL CASE
      if (e.key === "Tab") {
        e.preventDefault();
        input.current.focus();
        const val = suggestion;
        input.current.value = "";
        input.current.value = val;
        setValue(val);
        updateContext({ query: val });
      }
      onKeyDown(e);
    },
    [onKeyDown, suggestion, updateContext]
  );

  const _onChange = useCallback(
    (e) => {
      setValue(e.target.value);
      const ee = { ...e };
      // this is done to not lag the typing
      setTimeout(() => {
        onChange(ee);
      }, 0);
    },
    [onChange]
  );

  useEffect(() => {
    window.ipcRenderer.on("window-shown", () => {
      input.current.focus();
      changeHeight(DEFAULT_HEIGHT);
    });
  }, [input]);

  return (
    <div className="input-wrapper">
      <header />
      <input
        placeholder={"HyperText"}
        autoFocus
        ref={input}
        className="main-input"
        value={value}
        onChange={_onChange}
        onKeyDown={_onKeyDown}
        onKeyUp={onKeyUp}
      />
    </div>
  );
}
