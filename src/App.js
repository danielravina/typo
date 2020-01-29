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
import RegexEscape from "regex-escape";
import Highlighter from "react-highlight-words";
import fuzzy from "fuzzy";
import logo from "./images/logo.svg";
import logoBright from "./images/logo-bright.svg";
import EmojiPicker from "./EmojiPicker";
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
  const [word, setWord] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [altPressed, setAltPressed] = useState(false);
  const [shiftPressed, setShiftPressed] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [wordSelectionMode, setWordSelectionMode] = useState(false);
  const [colorTheme, setColorTheme] = useState(null);
  const [suggestionHistory, setSuggestionHistory] = useState([]);
  const [chosenEmoji, setChosenEmoji] = useState(null);
  const [selectionCount, setSelectionCount] = useState(0);
  const [emojiMode, setEmojiMode] = useState(0);
  const resetState = useCallback(() => {
    setWord("");
    setEmojiMode(false);
    setSuggestion("");
    setAltPressed(false);
    setShiftPressed(false);
    setSelectedIndex(0);
    setWordSelectionMode(false);
    setSelectionCount(0);
  }, []);

  const input = useRef(null);

  const fetchSuggestions = useCallback(
    async value => {
      if (!value.length) {
        setSuggestion("");
        return;
      }

      let newSuggestion;

      const history = fuzzy
        .filter(value, suggestionHistory)
        .map(s => s.original);

      if (history.length) {
        newSuggestion = history[0];
      } else {
        const response = await fetchJsonp(SUGGESTIONS_URL + value);
        const results = await response.json();

        newSuggestion = results[1][0] || "";
      }

      setSuggestion(newSuggestion);
      setSelectionCount(newSuggestion.split(" ").length);
    },
    [suggestionHistory]
  );

  const formattedSuggestion = useMemo(() => {
    if (shiftPressed) {
      return titleCase(suggestion);
    } else {
      return suggestion;
    }
  }, [suggestion, shiftPressed]);

  const selectedWord = useMemo(() => {
    if (wordSelectionMode === true) {
      return formattedSuggestion.split(" ")[selectedIndex];
    } else {
      return formattedSuggestion;
    }
  }, [formattedSuggestion, selectedIndex, wordSelectionMode]);

  useEffect(() => {
    window.ipcRenderer.on("window-shown", () => {
      input.current.focus();
    });
    window.ipcRenderer.on("window-hidden", () => {
      resetState();
    });

    window.ipcRenderer.on("set-emoji-mode", () => {
      setWord(":");
      setEmojiMode(true);
    });
  }, [resetState]);

  const onExternalSelect = useCallback(
    source => {
      window.ipcRenderer.send("hide");
      window.ipcRenderer.send("openExternal", {
        value: selectedWord,
        source
      });

      const newHistory = Array.from(
        new Set([...suggestionHistory, selectedWord.toLowerCase()])
      );

      setSuggestionHistory(newHistory);
    },
    [selectedWord, suggestionHistory]
  );

  const onTabPress = useCallback(() => {
    input.current.focus();
    const val = suggestion + " ";
    input.current.value = "";
    input.current.value = val;
    setWord(val);
    setWordSelectionMode(false);
  }, [suggestion]);

  const onInputChange = useCallback(
    e => {
      const { value } = e.target;
      setWord(value);

      if (value.charAt(0) === ":") {
        setSelectedIndex(0);
        setEmojiMode(true);
      } else {
        setEmojiMode(false);
        setSelectedIndex(0);
        setSelectionCount(0);
        fetchSuggestions(value);
      }
    },
    [fetchSuggestions]
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
    window.ipcRenderer.send("copyClipBoard", selectedWord);
    window.ipcRenderer.send("hide");

    const newHistory = Array.from(
      new Set([...suggestionHistory, selectedWord.toLowerCase()])
    );

    setSuggestionHistory(newHistory);
  }, [selectedWord, suggestionHistory]);

  const onEmojiSelect = useCallback(emoji => {
    console.log(emoji);
    window.ipcRenderer.send("copyClipBoard", emoji);
    window.ipcRenderer.send("hide");
  }, []);

  const onArrowUp = useCallback(() => {
    setWordSelectionMode(false);
    setSelectedIndex(0);
  }, []);

  const onArrowDown = useCallback(() => {
    setWordSelectionMode(true);
  }, []);

  const onArrowLeft = useCallback(() => {
    if (selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    } else {
      setSelectedIndex(selectionCount - 1);
    }
  }, [selectedIndex, selectionCount]);

  const onArrowRight = useCallback(() => {
    if (!wordSelectionMode) {
      setWordSelectionMode(true);
    }

    if (selectedIndex < selectionCount - 1) {
      setSelectedIndex(selectedIndex + 1);
    } else {
      setSelectedIndex(0);
    }
  }, [selectedIndex, selectionCount, wordSelectionMode]);

  const onKeyDown = useCallback(
    e => {
      if (emojiMode) return;
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
          if (wordSelectionMode) e.preventDefault();
          onArrowRight();
          break;
        case "ArrowLeft":
          if (wordSelectionMode) e.preventDefault();
          onArrowLeft();
          break;
        case "ArrowUp":
          e.preventDefault();
          onArrowUp();
          break;
        case "ArrowDown":
          e.preventDefault();
          onArrowDown();
          break;
        default:
          break;
      }
    },
    [
      emojiMode,
      onArrowDown,
      onArrowLeft,
      onArrowRight,
      onArrowUp,
      onEnterPress,
      onTabPress,
      wordSelectionMode
    ]
  );

  const twoLines = useMemo(() => suggestion.length > 30, [suggestion]);

  const isWordMatchSuggestion = useMemo(
    () =>
      word.length &&
      suggestion.length &&
      suggestion.trim().toLowerCase() === word.trim().toLowerCase(),

    [suggestion, word]
  );

  return (
    <div className={`app ${colorTheme}`}>
      <div className="input-wrapper">
        <input
          autoFocus
          ref={input}
          className="main-input"
          value={word}
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
              reduced: twoLines,
              selected: !wordSelectionMode && isWordMatchSuggestion
            })}
          >
            {formattedSuggestion.split(" ").map((w, i) => (
              <>
                <span
                  className={classnames("word", {
                    selected:
                      word.length && wordSelectionMode && i === selectedIndex
                  })}
                >
                  <Highlighter
                    highlightClassName={"selected"}
                    searchWords={
                      wordSelectionMode ? [] : word.split("").map(RegexEscape)
                    }
                    textToHighlight={w}
                  />
                </span>
                <span className="spacer" />
              </>
            ))}
          </span>
        </div>
      </div>
      <div
        className={classnames("alt-options", {
          active: altPressed && word.length
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
      <EmojiPicker search={word} onSelect={onEmojiSelect} visible={emojiMode} />
    </div>
  );
}
