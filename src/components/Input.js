import React, { useCallback, useRef, useEffect } from "react";
import useAppContext from "../hooks/useAppContext";
import { DEFAULT_HEIGHT } from "../lib/constants";
import { changeHeight } from "../lib/utils";
export default function({ onEnterPress, onChange }) {
  const input = useRef(null);

  const {
    query,
    suggestion,
    isAltPressed,
    selectedIndex,
    selectionCount,
    updateContext
  } = useAppContext();

  const onTabPress = useCallback(() => {
    input.current.focus();
    const val = suggestion;
    input.current.value = "";
    input.current.value = val;

    updateContext({ query: val + " ", selectedIndex: null });
  }, [input, suggestion, updateContext]);

  const _onChange = useCallback(
    e => {
      const { value } = e.target;
      updateContext({ query: value });
      onChange(value);
    },
    [onChange, updateContext]
  );

  const onArrowLeft = useCallback(() => {
    if (selectedIndex === null) {
      updateContext({ selectedIndex: 0 });
    } else if (selectedIndex > 0) {
      updateContext({ selectedIndex: selectedIndex - 1 });
    } else {
      updateContext({ selectedIndex: selectionCount - 1 });
    }
  }, [selectedIndex, selectionCount, updateContext]);

  const onArrowRight = useCallback(() => {
    if (selectedIndex === null || selectedIndex < selectionCount - 1) {
      updateContext({ selectedIndex: selectedIndex + 1 });
    } else {
      updateContext({ selectedIndex: 0 });
    }
  }, [selectedIndex, selectionCount, updateContext]);

  const onKeyUp = useCallback(
    e => {
      switch (e.key) {
        case "Shift":
          updateContext({ isShiftPressed: false });
          break;
        case "Alt":
          updateContext({ isAltPressed: false });
          break;
        case "Meta":
          updateContext({ isMetaPressed: false });
          break;
        default:
          break;
      }
    },
    [updateContext]
  );

  const onKeyDown = useCallback(
    e => {
      switch (e.key) {
        case "Shift":
          updateContext({ isShiftPressed: true });
          break;
        case "Meta":
          updateContext({ isMetaPressed: true });
          break;
        case "Alt":
          updateContext({ isAltPressed: true });
          break;
        case "Escape":
          window.ipcRenderer.send("hide");
          break;
        case "Tab":
          e.preventDefault();
          onTabPress();
          break;
        case "Enter":
          onEnterPress();
          break;
        case "ArrowRight":
          if (isAltPressed) {
            e.preventDefault();
            onArrowRight();
          }
          break;
        case "ArrowLeft":
          if (isAltPressed) {
            e.preventDefault();
            onArrowLeft();
          }
          break;
        case "Backspace":
          if (query.length === 0) {
            window.ipcRenderer.send("hide");
          }
          break;
        default:
          break;
      }
    },
    [
      isAltPressed,
      onArrowLeft,
      onArrowRight,
      onEnterPress,
      onTabPress,
      query.length,
      updateContext
    ]
  );

  useEffect(() => {
    window.ipcRenderer.on("window-shown", () => {
      input.current.focus();
      changeHeight(DEFAULT_HEIGHT);
    });
  }, [input]);

  return (
    <input
      placeholder={"HyperText"}
      autoFocus
      ref={input}
      className="main-input"
      value={query}
      onChange={_onChange}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
    />
  );
}
