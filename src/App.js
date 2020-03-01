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
  const [query, setQuery] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [altPressed, setAltPressed] = useState(false);
  const [shiftPressed, setShiftPressed] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [colorTheme, setColorTheme] = useState(null);
  const [suggestionHistory, setSuggestionHistory] = useState([]);
  const [chosenEmoji, setChosenEmoji] = useState(null);
  const [selectionCount, setSelectionCount] = useState(0);
  const [emojiMode, setEmojiMode] = useState(0);
  const resetState = useCallback(() => {
    setQuery("");
    setEmojiMode(false);
    setSuggestion("");
    setAltPressed(false);
    setShiftPressed(false);
    setSelectedIndex(0);
    setSelectionCount(0);
  }, []);

  const input = useRef(null);

  const isWordMatchSuggestion = useMemo(
    () =>
      query.length &&
      suggestion.length &&
      suggestion.trim().toLowerCase() === query.trim().toLowerCase(),

    [query, suggestion]
  );

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

  const finalResult = useMemo(() => {
    if (isWordMatchSuggestion && selectedIndex === null) {
      return formattedSuggestion;
    }
    return formattedSuggestion.split(" ")[selectedIndex];
  }, [formattedSuggestion, isWordMatchSuggestion, selectedIndex]);

  useEffect(() => {
    window.ipcRenderer.on("window-shown", () => {
      input.current.focus();
    });
    window.ipcRenderer.on("window-hidden", () => {
      resetState();
    });

    window.ipcRenderer.on("set-emoji-mode", () => {
      setQuery(":");
      setEmojiMode(true);
    });
  }, [resetState]);

  const onExternalSelect = useCallback(
    source => {
      window.ipcRenderer.send("hide");
      window.ipcRenderer.send("openExternal", {
        value: finalResult,
        source
      });

      const newHistory = Array.from(
        new Set([...suggestionHistory, finalResult.toLowerCase()])
      );

      setSuggestionHistory(newHistory);
    },
    [finalResult, suggestionHistory]
  );

  const onTabPress = useCallback(() => {
    input.current.focus();
    const val = suggestion;
    input.current.value = "";
    input.current.value = val;
    setQuery(val);
    setSelectedIndex(null);
  }, [suggestion]);

  const onInputChange = useCallback(
    e => {
      const { value } = e.target;
      setQuery(value);

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
    window.ipcRenderer.send("type", finalResult);
    window.ipcRenderer.send("hide");

    const newHistory = Array.from(
      new Set([...suggestionHistory, finalResult.toLowerCase()])
    );

    setSuggestionHistory(newHistory);
  }, [finalResult, suggestionHistory]);

  const onEmojiSelect = useCallback(emoji => {
    window.ipcRenderer.send("type", emoji);
    window.ipcRenderer.send("hide");
  }, []);

  const onArrowLeft = useCallback(() => {
    if (selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    } else {
      setSelectedIndex(selectionCount - 1);
    }
  }, [selectedIndex, selectionCount]);

  const onArrowRight = useCallback(() => {
    if (selectedIndex < selectionCount - 1) {
      setSelectedIndex(selectedIndex + 1);
    } else {
      setSelectedIndex(0);
    }
  }, [selectedIndex, selectionCount]);

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
          e.preventDefault();
          onArrowRight();
          break;
        case "ArrowLeft":
          e.preventDefault();
          onArrowLeft();
          break;
        default:
          break;
      }
    },
    [emojiMode, onArrowLeft, onArrowRight, onEnterPress, onTabPress]
  );

  const twoLines = useMemo(() => suggestion.length > 30, [suggestion]);

  return (
    <div className={`app ${colorTheme}`}>
      <div className="input-wrapper">
        <input
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
              reduced: twoLines,
              selected: isWordMatchSuggestion && selectedIndex === null
            })}
          >
            {formattedSuggestion.split(" ").map((w, i) => (
              <>
                <span
                  className={classnames("word", {
                    selected: query.length && i === selectedIndex
                  })}
                >
                  {w}
                </span>
                <span className="spacer" />
              </>
            ))}
          </span>
        </div>
      </div>
      <div
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
      />
    </div>
  );
}
