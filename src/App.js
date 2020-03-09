import "./App.scss";

import React, {
  useMemo,
  useRef,
  useState,
  useCallback,
  useEffect
} from "react";
import "emoji-mart/css/emoji-mart.css";
import classnames from "classnames";
import fetchJsonp from "fetch-jsonp";
import titleCase from "ap-style-title-case";
import EmojiPicker from "./EmojiPicker";
import Diff from "diff";
const DEFAULT_HEIGHT = 61;
const SUGGESTIONS_URL =
  "https://suggestqueries.google.com/complete/search?client=firefox&q=";

const altOptions = {
  google: {
    key: "G",
    address: "google.com",
    label: "oogle",
    icon: require("./images/google_logo.png")
  },
  wikipedia: {
    key: "W",
    address: "wikipedia.org",
    label: "ikipedia",
    icon: require("./images/wiki_logo.png")
  },
  thesaurus: {
    key: "T",
    address: "thesaurus.com",
    label: "hesaurus",
    icon: require("./images/theasaurus_logo.png")
  },
  dictionary: {
    key: "D",
    address: "dictionary.com",
    label: "ictionary",
    icon: require("./images/dict_logo.png")
  }
};

export default function() {
  const [query, setQuery] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [altPressed, setAltPressed] = useState(false);
  const [shiftPressed, setShiftPressed] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [colorTheme, setColorTheme] = useState(null);
  const [chosenEmoji, setChosenEmoji] = useState(null);
  const [selectionCount, setSelectionCount] = useState(0);
  const [emojiMode, setEmojiMode] = useState(0);
  const [bulkCorrections, setBulkCorrections] = useState(new Set());

  const resetState = useCallback(() => {
    setQuery("");
    setEmojiMode(false);
    setSuggestion("");
    setAltPressed(false);
    setShiftPressed(false);
    setSelectedIndex(null);
    setSelectionCount(0);
  }, []);

  const input = useRef(null);
  const appRef = useRef(null);

  const isTwoLines = useMemo(() => suggestion.length > 20, [suggestion]);

  const changeHeight = useCallback(height => {
    window.ipcRenderer.send("changeHeight", height);
  }, []);

  const isCapitalized = useCallback(word => {
    if (!word) return null;
    if (/^\d+$/.test(word)) return false; // number
    return word[0].toUpperCase() === word[0];
  }, []);

  const onTabPress = useCallback(() => {
    input.current.focus();
    const val = suggestion;
    input.current.value = "";
    input.current.value = val;
    setQuery(val + " ");
    setSelectedIndex(null);
  }, [suggestion]);

  const fetchAutocomplete = useCallback(async value => {
    const response = await fetchJsonp(SUGGESTIONS_URL + value);
    const results = await response.json();
    return results[1][0] || "";
  }, []);

  const formattedSuggestion = useMemo(() => {
    if (shiftPressed) {
      return titleCase(suggestion);
    } else {
      return suggestion;
    }
  }, [suggestion, shiftPressed]);

  const suggestionWords = useMemo(() => {
    return formattedSuggestion.split(" ");
  }, [formattedSuggestion]);

  const finalResult = useMemo(() => {
    if (selectedIndex === null) {
      return formattedSuggestion;
    }
    return suggestionWords[selectedIndex];
  }, [formattedSuggestion, selectedIndex, suggestionWords]);

  const processClipboardText = useCallback(
    async clipboardText => {
      resetState();
      const chunks = [];
      const words = clipboardText.replace(/\u21b5|\n/g, "").split(" ");
      setQuery(clipboardText);

      words.forEach((word, i) => {
        const lastWord = words[i - 1];
        if (isCapitalized(word) && isCapitalized(lastWord)) {
          chunks[chunks.length - 1] = `${lastWord} ${word}`;
        } else {
          chunks.push(word);
        }
      });

      for (let i = 0; i < chunks.length; ++i) {
        const toFetch = chunks[i];
        let fetchedChunk = "";

        if (toFetch.length === 1) {
          fetchedChunk = toFetch;
        } else {
          for (let j = 2; j <= toFetch.length; ++j) {
            const warmup = toFetch
              .split("")
              .slice(0, j)
              .join("");

            if (warmup.length) {
              const result = await fetchAutocomplete(warmup + " ");
              if (!result.length) continue;
              fetchedChunk = result;
            }
          }
        }

        let selectedPortion = fetchedChunk
          .split(" ")
          .slice(0, toFetch.split(" ").length)
          .join(" ");

        const punctMatch = toFetch.match(/[,;:]+$/);
        if (punctMatch !== null) {
          selectedPortion = selectedPortion.concat(punctMatch[0]);
        }

        if (isCapitalized(toFetch)) {
          selectedPortion = titleCase(selectedPortion);
        }

        if (
          selectedPortion.trim().toLowerCase() !== toFetch.trim().toLowerCase()
        ) {
          setBulkCorrections(bulkSet => {
            selectedPortion.split(" ").forEach(w => {
              bulkSet.add(w);
            });

            return bulkSet;
          });
        }

        setSuggestion(sugg => (sugg + " " + selectedPortion).trim());
        changeHeight(appRef.current.offsetHeight);
      }

      setSelectedIndex(null);
    },
    [changeHeight, fetchAutocomplete, isCapitalized, resetState]
  );

  useEffect(() => {
    window.ipcRenderer.on("clipboard-text", (e, text) => {
      if (!text.length) return;
      processClipboardText(text);
    });

    window.ipcRenderer.on("window-shown", () => {
      input.current.focus();
      changeHeight(DEFAULT_HEIGHT);
    });
    window.ipcRenderer.on("window-hidden", () => {
      resetState();
    });

    window.ipcRenderer.on("set-emoji-mode", () => {
      setQuery(":");
      setEmojiMode(true);
    });
  }, [changeHeight, processClipboardText, resetState]);

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

      setBulkCorrections(new Set());
      setQuery(value);
      if (value.charAt(0) === ":") {
        setSelectedIndex(0);
        setEmojiMode(true);
        changeHeight(368);
      } else {
        setEmojiMode(false);
        setSelectionCount(0);

        if (value.length === 0) {
          changeHeight(DEFAULT_HEIGHT);
          setSuggestion("");
        } else {
          const result = await fetchAutocomplete(value);
          setSuggestion(result);
          setSelectionCount(result.split(" ").length);
          changeHeight(appRef.current.offsetHeight);
        }
      }
    },
    [changeHeight, fetchAutocomplete]
  );

  const onKeyUp = useCallback(e => {
    switch (e.key) {
      case "Shift":
        setShiftPressed(false);
        break;
      case "Alt":
        setAltPressed(false);
        break;
      default:
        break;
    }
  }, []);

  const onKeyPress = useCallback(
    e => {
      if (altPressed) {
        e.preventDefault();
        switch (e.key) {
          case "∑":
            onExternalSelect("wikipedia.org");
            break;
          case "∂":
            onExternalSelect("dictionary.com");
            break;
          case "†":
            onExternalSelect("thesaurus.com");
            break;
          case "©":
            onExternalSelect("google.com");
            break;
          default:
            break;
        }
      }
    },
    [altPressed, onExternalSelect]
  );

  const onEnterPress = useCallback(() => {
    window.ipcRenderer.send("type", finalResult);
    window.ipcRenderer.send("hide");
  }, [finalResult]);

  const onEmojiSelect = useCallback(emoji => {
    window.ipcRenderer.send("type", emoji);
    window.ipcRenderer.send("hide");
  }, []);

  const onArrowLeft = useCallback(() => {
    if (selectedIndex === null) {
      setSelectedIndex(0);
    } else if (selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    } else {
      setSelectedIndex(selectionCount - 1);
    }
  }, [selectedIndex, selectionCount]);

  const onArrowRight = useCallback(() => {
    if (selectedIndex === null || selectedIndex < selectionCount - 1) {
      setSelectedIndex(selectedIndex + 1);
    } else {
      setSelectedIndex(0);
    }
  }, [selectedIndex, selectionCount]);

  const onKeyDown = useCallback(
    e => {
      if (emojiMode) return;
      console.log(e.key);
      switch (e.key) {
        case "Shift":
          setShiftPressed(true);
          break;
        case "Alt":
          setAltPressed(true);
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
          e.preventDefault();
          onArrowRight();
          break;
        case "ArrowLeft":
          e.preventDefault();
          onArrowLeft();
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
      emojiMode,
      onArrowLeft,
      onArrowRight,
      onEnterPress,
      onTabPress,
      query.length
    ]
  );
  return (
    <div className={`app ${colorTheme}`} ref={appRef}>
      <header></header>
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
          onKeyPress={onKeyPress}
        />
      </div>
      <div className="suggestion-wrapper">
        <div className="suggestion-body">
          <span
            className={classnames("suggestion-text animated fadeIn", {
              reduced: isTwoLines,
              selected: selectedIndex === null
            })}
          >
            {suggestionWords.map((w, i) => (
              <React.Fragment key={w + i}>
                <span
                  className={classnames("word", {
                    selected: query.length && i === selectedIndex,
                    corrected: bulkCorrections.has(w)
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
      </div>
      {/* <div
        className={classnames("alt-options", {
          active: altPressed && query.length
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
      <EmojiPicker
        search={query}
        onSelect={onEmojiSelect}
        visible={emojiMode}
      /> */}
    </div>
  );
}
