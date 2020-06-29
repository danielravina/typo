import "./App.scss";

import React, { useRef, useCallback, useEffect, useMemo } from "react";

import "emoji-mart/css/emoji-mart.css";

import { changeHeight } from "./lib/utils";
import { DEFAULT_HEIGHT } from "./lib/constants";
import useClipboard from "./hooks/useClipboard";
import useAppContext from "./hooks/useAppContext";
import { useNavigate, Router, useLocation } from "@reach/router";
import Input from "./components/Input";
import useEmojiContext from "./hooks/useEmojiContext";

import { modes, MODE_KEYS } from "./lib/modes";
import AutoComplete from "./routes/AutoComplete";
import EmojiPicker from "./routes/EmojiPicker";
import MainMenu from "./routes/MainMenu";
import useInputContext from "./hooks/useInputContext";

export default function () {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const processClipboard = useClipboard();
  const location = useLocation();
  const { query } = useInputContext();
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

  useEffect(() => {
    if (query.length === 0) {
      navigate("");
      changeHeight(DEFAULT_HEIGHT);
      return;
    }

    switch (query.charAt(0)) {
      case ":": {
        navigate("/emoji");
        changeHeight(400);
        break;
      }
      case "/": {
        navigate("/main-menu");
        break;
      }
      default:
        navigate("/auto-complete");
    }
  }, [navigate, query]);

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
      <Input ref={inputRef} />
      <Router>
        <AutoComplete default />
        <EmojiPicker path="emoji" />
      </Router>
      {/* <footer>{clipboardText ? <i>Paste: {clipboardText}</i> : null}</footer> */}
    </div>
  );
}
