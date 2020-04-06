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
import Mark from "./components/Mark";
import Input from "./components/Input";
import MetaOptions from "./components/MetaOptions";

export default function() {
  const appRef = useRef(null);
  const { process } = useClipboard();
  const fetchGoogle = useGoogleSuggestion();

  const {
    query,
    suggestion,
    selectedIndex,
    colorTheme,
    emojiMode,
    updateContext,
    resetContext,
    clipboardText,
    corrections,
    suggestionWords,
    finalResult
  } = useAppContext();

  const onEnterPress = useCallback(async () => {
    if (clipboardText && query.length === 0) {
      updateContext({
        isLoading: true
      });

      process(query);
    } else {
      window.ipcRenderer.send("type", finalResult);
      window.ipcRenderer.send("hide");
    }
  }, [clipboardText, finalResult, process, query, updateContext]);

  const onChange = useCallback(
    value => {
      if (value.charAt(0) === ":") {
        updateContext({ emojiMode: true });
        changeHeight(EMOJI_HEIGHT);
      } else {
        updateContext({ emojiMode: false });

        if (value.length === 0) {
          changeHeight(DEFAULT_HEIGHT);
          updateContext({ suggestion: "" });
        } else {
          fetchGoogle(value);
        }
      }
    },
    [fetchGoogle, updateContext]
  );

  useEffect(() => {
    if (suggestion.length) {
      changeHeight(appRef.current.offsetHeight);
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
    });
  }, [resetContext, updateContext]);

  const suggestionBody = useMemo(() => {
    return suggestionWords.map((word, i) => (
      <React.Fragment key={word + i}>
        <span
          className={classnames("word", {
            selected: query.length && i === selectedIndex,
            corrected: corrections.has(strip(word))
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
      <EmojiPicker search={query} visible={emojiMode} />
      <header />
      <div className="input-wrapper">
        <Input onEnterPress={onEnterPress} onChange={onChange} />
      </div>
      <div className="suggestion-wrapper" style={{ paddingBottom: "25px" }}>
        <div className="suggestion-body">
          <span className="suggestion-text animated fadeIn">
            {suggestionBody}
          </span>
        </div>
        <footer>{clipboardText ? <i>Paste: {clipboardText}</i> : null}</footer>
      </div>
      <MetaOptions />
    </div>
  );
}
