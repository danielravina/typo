import "./App.scss";

import React from "react";
import emoji from "node-emoji";
import classnames from "classnames";
import fetchJsonp from "fetch-jsonp";
import titleCase from "ap-style-title-case";
import RegexEscape from "regex-escape";
import Highlighter from "react-highlight-words";
import fuzzy from "fuzzy";
import logo from "./images/logo.svg";
import logoBright from "./images/logo-bright.svg";

const SUGGESTIONS_URL =
  "https://suggestqueries.google.com/complete/search?client=firefox&q=";

const defaultEmojis = ["👍", "😂", "🔥", "🙂", "🎉", "😭", "😍", "💥", "🤔"];

const defaultState = {
  word: "",
  suggestion: "",
  isTitleized: false,
  emojis: defaultEmojis,
  selectedIndex: 0,
  mode: "lazy",
  wordSelection: false,
  selectionCount: defaultEmojis.length,
  colorTheme: "dark",
  suggestionHistory: []
};

class App extends React.Component {
  state = defaultState;

  componentDidMount() {
    window.ipcRenderer.on("window-shown", () => {
      this.input.focus();
    });
  }

  onInputChange = e => {
    const { value } = e.target;
    this.setState({ word: value });
    if (value.charAt(0) === ":") {
      this.setState({ mode: "emoji", emojis: defaultEmojis, selectedIndex: 0 });
      this.fetchEmojis(value);
    } else {
      this.setState({
        mode: "lazy",
        emojis: defaultEmojis,
        wordSelection: false,
        selectedIndex: 0,
        selectionCount: defaultEmojis.length
      });
      this.fetchSuggestions(value);
    }
  };

  onKeyUp = e => {
    switch (e.key) {
      case "Shift":
        this.setState({ isTitleized: false });
        break;
      default:
        break;
    }
  };

  onKeyDown = e => {
    switch (e.key) {
      case "Shift":
        this.setState({ isTitleized: true });
        break;
      case "Escape":
        window.ipcRenderer.send("hide");
        this.setState(defaultState);
        break;
      case "Tab":
        this.onTabPress();
        break;
      case "Enter":
        this.onEnterPress();
        break;
      case "ArrowRight":
        if (this.state.wordSelection) e.preventDefault();
        this.onArrowRight();
        break;
      case "ArrowLeft":
        if (this.state.wordSelection) e.preventDefault();
        this.onArrowLeft();
        break;
      case "ArrowUp":
        e.preventDefault();
        this.onArrowUp();
        break;
      case "ArrowDown":
        e.preventDefault();
        this.onArrowDown();
        break;
      default:
        break;
    }
  };

  onArrowUp = () => {
    this.setState({ wordSelection: true });
  };

  onArrowDown = () => {
    this.setState({ wordSelection: false, selectedIndex: 0 });
  };

  onArrowLeft = () => {
    const { selectionCount, selectedIndex } = this.state;

    if (selectedIndex > 0) {
      this.setState({ selectedIndex: selectedIndex - 1 });
    } else {
      this.setState({ selectedIndex: selectionCount - 1 });
    }
  };

  onArrowRight = () => {
    const { selectionCount, selectedIndex } = this.state;

    if (selectedIndex < selectionCount - 1) {
      this.setState({ selectedIndex: selectedIndex + 1 });
    } else {
      this.setState({ selectedIndex: 0 });
    }
  };

  get selectedWord() {
    const { wordSelection, mode, emojis, selectedIndex } = this.state;

    if (mode === "emoji") {
      return emojis[selectedIndex];
    } else if (wordSelection === true) {
      return this.suggestion.split(" ")[selectedIndex];
    } else {
      return this.suggestion;
    }
  }

  onEnterPress = () => {
    const { suggestionHistory } = this.state;

    let target = this.selectedWord;

    window.ipcRenderer.send("copyClipBoard", target);
    window.ipcRenderer.send("hide");
    const newHistory = Array.from(
      new Set([...suggestionHistory, target.toLowerCase()])
    );
    this.setState({
      ...defaultState,
      suggestionHistory: newHistory
    });
  };

  onTabPress() {
    setTimeout(() => {
      this.input.focus();
      var val = this.state.suggestion + " ";
      this.input.value = "";
      this.input.value = val;
      this.setState({ word: val, wordSelection: false });
    }, 5);
  }

  fetchEmojis(value) {
    if (value.length < 2) {
      // include the ':' which is stripped by node-emoji
      this.setState({
        selectedIndex: 0,
        selectionCount: defaultEmojis.length
      });
      return;
    }

    const results = emoji
      .search(value)
      .map(e => e.emoji)
      .slice(0, 9);

    this.setState({
      emojis: results,
      selectedIndex: 0,
      selectionCount: results.length
    });
  }

  async fetchSuggestions(value) {
    if (!value.length) {
      this.setState({ suggestion: "" });
      return;
    }

    let suggestion;

    const history = fuzzy
      .filter(value, this.state.suggestionHistory)
      .map(s => s.original);

    if (history.length) {
      suggestion = history[0];
    } else {
      const response = await fetchJsonp(SUGGESTIONS_URL + value);
      const results = await response.json();
      suggestion = results[1][0] || "";
    }

    this.setState({
      suggestion,
      emojis: defaultEmojis,
      selectionCount: suggestion.split(" ").length
    });
  }

  get suggestion() {
    if (this.state.isTitleized) {
      return titleCase(this.state.suggestion);
    } else {
      return this.state.suggestion;
    }
  }

  shouldHighlight() {
    return !this.state.wordSelection;
  }

  isWordMatchSuggestion() {
    return (
      this.suggestion.trim().toLowerCase() ===
        this.state.word.trim().toLowerCase() || this.state.isTitleized //
    );
  }

  renderSuggestion() {
    const twoLines = this.suggestion.length > 20;

    if (this.isWordMatchSuggestion() && !this.state.wordSelection) {
      return (
        <span
          className={classnames("suggestion-text animated fadeIn selected", {
            reduced: twoLines
          })}
        >
          {this.suggestion}
        </span>
      );
    }

    return (
      <span
        className={classnames("suggestion-text animated fadeIn", {
          reduced: twoLines
        })}
      >
        {this.suggestion.split(" ").map((w, i) => (
          <>
            <span
              className={classnames("word", {
                selected:
                  this.state.wordSelection && i === this.state.selectedIndex
              })}
            >
              <Highlighter
                highlightClassName={"selected"}
                searchWords={
                  this.shouldHighlight()
                    ? this.state.word.split("").map(RegexEscape)
                    : []
                }
                textToHighlight={w}
              />
            </span>
            <span className="spacer" />
          </>
        ))}
      </span>
    );
  }

  renderEmojis() {
    if (this.state.mode !== "emoji") return null;
    return (
      <div className="emoji-wrapper">
        {this.state.emojis.map((e, i) => (
          <span
            key={i}
            className={classnames("animated", "bounceIn", "emoji", {
              selected: i === this.state.selectedIndex
            })}
            dangerouslySetInnerHTML={{ __html: e }}
          />
        ))}
      </div>
    );
  }

  render;

  render() {
    return (
      <div className={`app ${this.state.colorTheme}`}>
        <header>
          <button
            onClick={() => {
              window.ipcRenderer.send("openExternal", {
                value: this.selectedWord,
                source: "wikipedia.org"
                // source: "thesaurus.com"
                // source: "dictionary.com"
                // source: "stackoverflow.com"
                // source: "youtube.com"
              });
            }}
          >
            Wikipedia
          </button>
        </header>
        <div className="suggestion-wrapper">
          {this.suggestion || this.state.mode === "emoji" ? (
            <div className="suggestion-body">
              {this.renderEmojis() || this.renderSuggestion()}
            </div>
          ) : (
            <div className="logo-wrapper animated fadeIn faster">
              <img src={this.state.colorTheme === "dark" ? logoBright : logo} />
              <small>Start typing to see results...</small>
            </div>
          )}
        </div>
        <div className="input-wrapper">
          <input
            autoFocus
            ref={r => (this.input = r)}
            className="main-input"
            disabled={this.state.locked}
            value={this.state.word}
            onChange={this.onInputChange}
            onKeyDown={this.onKeyDown}
            placeholder="Type Whatever"
            onKeyUp={this.onKeyUp}
          />
        </div>
      </div>
    );
  }
}

export default App;
