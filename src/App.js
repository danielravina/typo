import "./App.scss";

import React, { useRef, useCallback, useEffect, useMemo } from "react";

import "emoji-mart/css/emoji-mart.css";
import classnames from "classnames";

import EmojiPicker from "./components/EmojiPicker";
import { strip, changeHeight } from "./lib/utils";
import { DEFAULT_HEIGHT, EMOJI_HEIGHT } from "./lib/constants";
import useClipboard from "./hooks/useClipboard";
import useAppContext from "./hooks/useAppContext";
import useGoogleSuggestion from "./hooks/useGoogleSuggestion";
// import Mark from "./components/Mark";
import Input from "./components/Input";
import useEmojiContext from "./hooks/useEmojiContext";
import SlashMenu from "./components/SlashMenu";

export default function () {
  const appRef = useRef(null);
  const processClipboard = useClipboard();
  const fetchGoogle = useGoogleSuggestion();
  const { setSelectedIndex } = useEmojiContext();
  const {
    query,
    suggestion,
    selectedIndex,
    colorTheme,
    updateContext,
    resetContext,
    clipboardText,
    corrections,
    suggestionWords,
    finalResult,
  } = useAppContext();

  const onEnterPress = useCallback(async () => {
    if (clipboardText && query.length === 0) {
      updateContext({
        isLoading: true,
      });

      processClipboard(clipboardText.trim());
    } else {
      window.ipcRenderer.send("type", finalResult);
      window.ipcRenderer.send("hide");
    }
  }, [
    clipboardText,
    finalResult,
    processClipboard,
    query.length,
    updateContext,
  ]);

  const onChange = useCallback(
    async (value) => {
      updateContext({ emojiMode: false, menuMode: false });
      if (value.length === 0) {
        changeHeight(DEFAULT_HEIGHT);
        updateContext({ suggestion: "" });
        return;
      }

      switch (value.charAt(0)) {
        case ":": {
          updateContext({ emojiMode: true });
          changeHeight(EMOJI_HEIGHT);
          break;
        }
        case "/": {
          updateContext({ menuMode: true });
          changeHeight(EMOJI_HEIGHT);
          break;
        }
        default:
          const googleResult = await fetchGoogle(value);

          updateContext({
            clipboardText: null,
            suggestion: googleResult,
            selectionCount: googleResult.split(" ").length,
          });
      }
    },
    [fetchGoogle, updateContext]
  );

  useEffect(() => {
    if (suggestion.length > 2) {
      setTimeout(() => {
        changeHeight(appRef.current.offsetHeight);
      }, 100);
    } else {
      changeHeight(DEFAULT_HEIGHT);
    }
  }, [suggestion]);

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
      setSelectedIndex(0);
    });
  }, [clipboardText, resetContext, setSelectedIndex, updateContext]);

  const suggestionBody = useMemo(() => {
    return suggestionWords.map((word, i) => (
      <React.Fragment key={word + i}>
        <span
          className={classnames("word", {
            selected: query.length && i === selectedIndex,
            corrected: corrections.has(strip(word)),
          })}
        >
          {word}
        </span>
        {i === suggestionWords.length - 1 ? null : <span className="spacer" />}
      </React.Fragment>
    ));
  }, [corrections, query.length, selectedIndex, suggestionWords]);

  return (
    <div className={`app ${colorTheme}`} ref={appRef}>
      <EmojiPicker />
      <SlashMenu />
      <div className="input-wrapper">
        <header />
        <Input onEnterPress={onEnterPress} onChange={onChange} />
      </div>
      <div className="suggestion-wrapper">
        <span className="suggestion-text">{suggestionBody}</span>
      </div>
      <footer>{clipboardText ? <i>Paste: {clipboardText}</i> : null}</footer>
    </div>
  );
}
