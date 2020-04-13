import "./App.scss";

import React, {
  useRef,
  useCallback,
  useEffect,
  useMemo,
  useContext,
} from "react";

import "emoji-mart/css/emoji-mart.css";

import { changeHeight } from "./lib/utils";
import { DEFAULT_HEIGHT } from "./lib/constants";
import useClipboard from "./hooks/useClipboard";
import useAppContext from "./hooks/useAppContext";

import Input from "./components/Input";
import useEmojiContext from "./hooks/useEmojiContext";
import { DefaultPubSubContext } from "usepubsub";
import { modes, MODE_KEYS } from "./lib/modes";

import useKeyDown from "./hooks/useKeyboardEvent";

export default function () {
  const inputRef = useRef(null);
  const processClipboard = useClipboard();

  const { setSelectedIndex: setSelectedEmojiIndex } = useEmojiContext();
  const { press: pressKeyUp } = useKeyDown("keyUp");
  const { press: pressKeyDown } = useKeyDown("keyDown");

  const {
    query,
    suggestion,
    colorTheme,
    updateContext,
    resetContext,
    clipboardText,
    finalResult,
    currentMode,
  } = useAppContext();

  // const onKeyUp = useCallback(s
  //   (e) => {
  //     switch (e.key) {
  //       case "Shift":
  //         updateContext({ isShiftPressed: false });
  //         break;
  //       case "Alt":
  //         updateContext({ isAltPressed: false });
  //         break;
  //       case "Meta":
  //         updateContext({ isMetaPressed: false });
  //         break;
  //       default:
  //         break;
  //     }
  //   },
  //   [updateContext]
  // );

  const onKeyDown = useCallback(
    (e) => {
      if (currentMode && currentMode.preventDefaultKeys.has(e.key)) {
        e.preventDefault();
      }
      pressKeyDown(e.key);
    },
    [currentMode, pressKeyDown]
  );

  const onKeyUp = useCallback(
    (e) => {
      pressKeyUp(e.key);
    },
    [pressKeyUp]
  );

  const onChange = useCallback(
    async (e) => {
      const { value } = e.target;
      updateContext({ query: value });

      if (value.length === 0) {
        updateContext({ modeKey: null });
        setTimeout(() => {
          changeHeight(DEFAULT_HEIGHT);
        }, 200); // css transition
        return;
      }

      switch (value.charAt(0)) {
        case ":": {
          updateContext({ modeKey: MODE_KEYS.EMOJI });
          break;
        }
        case "/": {
          updateContext({ modeKey: MODE_KEYS.MENU });
          break;
        }
        default:
          updateContext({ modeKey: MODE_KEYS.AUTO_COMPLETE });
      }
    },
    [updateContext]
  );

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
      {Object.values(modes).map((mode) => mode.component({ inputRef }))}
      <Input
        onKeyUp={onKeyUp}
        onKeyDown={onKeyDown}
        onChange={onChange}
        ref={inputRef}
      />
      <footer>{clipboardText ? <i>Paste: {clipboardText}</i> : null}</footer>
    </div>
  );
}
