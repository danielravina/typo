import "./App.scss";

import React, {
  useMemo,
  useRef,
  useContext,
  useCallback,
  useEffect,
  useState
} from "react";

import "emoji-mart/css/emoji-mart.css";
import classnames from "classnames";
import Mark from "./components/Mark";
import titleCase from "ap-style-title-case";
import EmojiPicker from "./components/EmojiPicker";
import AppContext from "./context/AppContext";
import processClipboard from "./lib/processClipboard";
import fetchAutocomplete from "./lib/fetchAutocomplete";
import { strip, changeHeight } from "./lib/utils";
import { DEFAULT_HEIGHT } from "./lib/constants";

export default function() {
  const input = useRef(null);
  const appRef = useRef(null);

  const {
    query,
    suggestion,
    isAltPressed,
    isShiftPressed,
    isCommandPressed,
    selectedIndex,
    colorTheme,
    chosenEmoji,
    selectionCount,
    emojiMode,
    updateContext,
    resetContext,
    clipboardText,
    corrections
  } = useContext(AppContext);

  const onTabPress = useCallback(() => {
    input.current.focus();
    const val = suggestion;
    input.current.value = "";
    input.current.value = val;

    updateContext({ query: val + " ", selectedIndex: null });
  }, [suggestion, updateContext]);

  const formattedSuggestion = useMemo(() => {
    if (isShiftPressed) {
      return titleCase(suggestion);
    } else {
      return suggestion;
    }
  }, [isShiftPressed, suggestion]);

  const suggestionWords = useMemo(() => {
    return formattedSuggestion.split(" ");
  }, [formattedSuggestion]);

  const finalResult = useMemo(() => {
    if (selectedIndex === null) {
      return formattedSuggestion;
    }
    return suggestionWords[selectedIndex];
  }, [formattedSuggestion, selectedIndex, suggestionWords]);

  useEffect(() => {
    window.ipcRenderer.on("clipboard-text", (e, text) => {
      if (!text.length) return;
      setTimeout(() => {
        changeHeight(DEFAULT_HEIGHT + 25);
        updateContext({ clipboardText: text });
      }, 100);
    });

    window.ipcRenderer.on("window-shown", () => {
      input.current.focus();
      changeHeight(DEFAULT_HEIGHT);
    });

    window.ipcRenderer.on("window-hidden", () => {
      resetContext();
    });
  }, [resetContext, updateContext]);

  const onExternalSelect = useCallback(
    source => {
      window.ipcRenderer.send("hide");
      window.ipcRenderer.send("openExternal", {
        value: finalResult,
        source
      });
    },
    [finalResult]
  );

  const onInputChange = useCallback(
    async e => {
      const { value } = e.target;

      updateContext({ query: value });
      if (value.charAt(0) === ":") {
        updateContext({ emojiMode: true });
        changeHeight(368);
      } else {
        updateContext({ emojiMode: false });

        if (value.length === 0) {
          changeHeight(DEFAULT_HEIGHT);
          updateContext({ suggestion: "" });
        } else {
          const result = await fetchAutocomplete(value);

          updateContext({
            suggestion: result,
            selectionCount: result.split(" ").length
          });

          changeHeight(appRef.current.offsetHeight);
        }
      }
    },
    [updateContext]
  );

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
          updateContext({ isCommandPressed: false });
          break;
        default:
          break;
      }
    },
    [updateContext]
  );

  const onEnterPress = useCallback(async () => {
    if (clipboardText && query.length === 0) {
      updateContext({
        isLoading: true,
        query: clipboardText
      });

      const suggestion = await processClipboard(clipboardText);
      // galapagos islands is a marvelous place
      updateContext({ suggestion });

      changeHeight(appRef.current.offsetHeight);
    } else {
      window.ipcRenderer.send("type", finalResult);
      window.ipcRenderer.send("hide");
    }
  }, [clipboardText, finalResult, query.length, updateContext]);

  const onEmojiSelect = useCallback(emoji => {
    window.ipcRenderer.send("type", emoji);
    window.ipcRenderer.send("hide");
  }, []);

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

  const onKeyDown = useCallback(
    e => {
      if (emojiMode) return;
      switch (e.key) {
        case "Shift":
          updateContext({ isShiftPressed: true });
          break;
        case "Meta":
          updateContext({ isCommandPressed: true });
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
        case "1":
          if (isCommandPressed) onExternalSelect("wikipedia.org");
          break;
        case "2":
          if (isCommandPressed) onExternalSelect("dictionary.com");
          break;
        case "3":
          if (isCommandPressed) onExternalSelect("thesaurus.com");
          break;
        case "4":
          if (isCommandPressed) onExternalSelect("google.com");
          break;
        default:
          break;
      }
    },
    [
      emojiMode,
      isAltPressed,
      isCommandPressed,
      onArrowLeft,
      onArrowRight,
      onEnterPress,
      onExternalSelect,
      onTabPress,
      query.length,
      updateContext
    ]
  );
  return (
    <div className={`app ${colorTheme}`} ref={appRef}>
      <header />
      <div className="input-wrapper">
        <input
          placeholder={"Start typing to see results"}
          autoFocus
          ref={input}
          className="main-input"
          value={query}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
        />
      </div>
      <div className="suggestion-wrapper" style={{ paddingBottom: "25px" }}>
        <div className="suggestion-body">
          <span className="suggestion-text animated fadeIn">
            {suggestionWords.map((w, i) => (
              <React.Fragment key={w + i}>
                <span
                  className={classnames("word", {
                    selected: query.length && i === selectedIndex,
                    corrected: corrections.has(strip(w))
                  })}
                >
                  {w}
                </span>
                {i === suggestionWords.length - 1 ? null : (
                  <span className="spacer" />
                )}
              </React.Fragment>
            ))}
          </span>
        </div>
        <footer>{clipboardText ? <i>Paste: {clipboardText}</i> : null}</footer>
      </div>
      {/* <div
        className={classnames("alt-options", {
          active: isAltPressed && query.length
        })}
      >
        {Object.keys(altOptions).map(alt => {
          const { icon, key, label, address } = altOptions[alt];
          return (
            <div className="alt-option" key={alt}>
              <div className="option-icon">
                <img src={icon} alt={address} />
              </div>
              <span className="alt-option-key">{key}</span>
              {label}
              <i className="material-icons open-in-new">open_in_new</i>
            </div>
          );
        })}
      </div>
       */}
      <EmojiPicker
        search={query}
        onSelect={onEmojiSelect}
        visible={emojiMode}
      />
    </div>
  );
}
