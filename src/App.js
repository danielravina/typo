import "./App.scss";

import React, { useRef, useCallback, useEffect, useMemo } from "react";

import "emoji-mart/css/emoji-mart.css";

import { changeHeight } from "./lib/utils";
import { DEFAULT_HEIGHT } from "./lib/constants";
import useClipboard from "./hooks/useClipboard";
import useAppContext from "./hooks/useAppContext";
import { navigate, Router } from "@reach/router";
import Input from "./components/Input";
import useEmojiContext from "./hooks/useEmojiContext";
import { useLocation } from "@reach/router";
import { modes, MODE_KEYS } from "./lib/modes";

import AutoComplete from "./routes/AutoComplete";
import EmojiPicker from "./routes/EmojiPicker";
import MainMenu from "./routes/MainMenu";

export default function () {
  const inputRef = useRef(null);
  const processClipboard = useClipboard();
  const location = useLocation();

  useEffect(() => {
    inputRef.current.focus();
  }, [location]);

  const { setSelectedIndex: setSelectedEmojiIndex } = useEmojiContext();
  const {
    colorTheme,
    updateContext,
    resetContext,
    clipboardText,
  } = useAppContext();

  const onChange = useCallback(async (value) => {
    if (value.length === 0) {
      navigate("");
      changeHeight(DEFAULT_HEIGHT);
      return;
    }

    switch (value.charAt(0)) {
      case ":": {
        navigate("emoji");
        break;
      }
      case "/": {
        navigate("main-menu");
        break;
      }
      default:
        navigate("auto-complete");
    }
  }, []);

  useEffect(() => {
    window.ipcRenderer.on("clipboard-text", (e, text) => {
      if (!text.length) return;

      setTimeout(() => {
        changeHeight(DEFAULT_HEIGHT + 25);
        updateContext({ clipboardText: text });
      }, 100);
    });

    window.ipcRenderer.on("window-hidden", () => {
      resetContext();
      setSelectedEmojiIndex(0);
    });
  }, [clipboardText, resetContext, setSelectedEmojiIndex, updateContext]);

  return (
    <div className={`app ${colorTheme}`}>
      <Input onChange={onChange} ref={inputRef} />
      <Router>
        <AutoComplete default />
      </Router>
      {/* <footer>{clipboardText ? <i>Paste: {clipboardText}</i> : null}</footer> */}
    </div>
  );
}
