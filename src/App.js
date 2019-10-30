import React from "react";
import "./App.css";
import emoji from "node-emoji";
import classnames from "classnames";
import fetchJsonp from "fetch-jsonp";
import titleCase from "ap-style-title-case";
import loader from "./three-dots.svg";
const SUGGESTIONS_URL =
  "https://suggestqueries.google.com/complete/search?client=firefox&q=";

const defaultState = {
  word: "",
  suggestion: "",
  isTitleized: false,
  emojis: [],
  selectedIndex: 0,
  mode: "lazy",
  wordSelection: false,
  selectionCount: 0
};

class App extends React.Component {
  state = defaultState;

  componentDidMount() {
    window.ipcRenderer.on("window-hidden", () => {
      this.setState(defaultState);
    });
    window.ipcRenderer.on("window-shown", () => {
      this.input.focus();
    });
  }

  onInputChange = e => {
    const { value } = e.target;
    this.setState({ word: value });
    if (value.charAt(0) === ":") {
      this.setState({ mode: "emoji" });
      this.fetchEmojis(value);
    } else {
      this.setState({ mode: "lazy", emojis: [], wordSelection: false, selectedIndex: 0 });
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

  onEnterPress = () => {
    const { wordSelection, mode, emojis, selectedIndex } = this.state;
    let target = "";

    if (mode === "emoji") {
      target = emojis[selectedIndex];
    } else if (wordSelection === true) {
      target = this.suggestion.split(' ')[selectedIndex]
    } else {
      target = this.suggestion;
    }

    window.ipcRenderer.send("copyClipBoard", target);
    window.ipcRenderer.send("hide");

    this.setState(defaultState);
  };

  onTabPress() {
    setTimeout(() => {
      this.input.focus();
      var val = this.state.suggestion + " ";
      this.input.value = "";
      this.input.value = val;
      this.setState({ word: val });
    }, 5);
  }

  fetchEmojis(value) {
    if (value.length < 2) {
      // include the ':' which is stripped by node-emoji
      this.setState({ emojis: [], selectedIndex: 0 });
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

    const response = await fetchJsonp(SUGGESTIONS_URL + value);
    const results = await response.json();
    const suggestion = results[1][0] || "";
    this.setState({
      suggestion,
      emojis: [],
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

  renderSuggestion() {
    if (!this.suggestion) return <img src={loader} class="suggestion-loader" />;
    return (
      <span className="suggestion-text">
        {this.suggestion.split(' ').map((w, i) => (
          <>
            <span
              className={classnames("word", {
                selected:
                  this.state.wordSelection && i === this.state.selectedIndex
              })}
            >
              {w}
            </span>
            <span className="spacer" />
          </>
        ))}
      </span>
    );
  }

  renderEmojis() {
    if (!this.state.emojis.length) return null;

    return (
      <div className="emoji-wrapper">
        {this.state.emojis.map((e, i) => (
          <span
            key={i}
            className={classnames("emoji", {
              selected: i === this.state.selectedIndex
            })}
            dangerouslySetInnerHTML={{ __html: e }}
          />
        ))}
      </div>
    );
  }

  render() {
    return (
      <div className="app">
        <div className="suggestion-wrapper">
          <span className="subtitle">{titleCase(this.state.mode)} Mode</span>
          <div className="suggestion-body">
            {this.renderEmojis() || this.renderSuggestion()}
          </div>
        </div>
        <div className="input-wrapper">
          <input
            autoFocus
            ref={r => (this.input = r)}
            className="main-input"
            disabled={this.state.locked}
            value={this.state.word}
            onChange={this.onInputChange}
            placeholder="Type Something..."
            onKeyDown={this.onKeyDown}
            onKeyUp={this.onKeyUp}
          />
        </div>
      </div>
    );
  }
}

export default App;
