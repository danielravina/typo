import React from "react";
import "./App.css";
import emoji from "node-emoji";
import classnames from "classnames";
import fetchJsonp from "fetch-jsonp";
import titleCase from "ap-style-title-case";

const SUGGESTIONS_URL =
  "https://suggestqueries.google.com/complete/search?client=firefox&q=";

const defaultState = {
  word: "",
  suggestion: "",
  isTitleized: false,
  emojis: [],
  selectedEmojiIndex: 0,
  mode: "lazy"
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
      this.setState({ mode: "lazy", emojis: [] });
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
        this.onArrowRight();
        break;
      case "ArrowLeft":
        this.onArrowLeft();
        break;
      default:
        break;
    }
  };

  onArrowLeft = () => {
    const { emojis, selectedEmojiIndex } = this.state;
    if (!emojis.length) return
    if (selectedEmojiIndex > 0) {
      this.setState({ selectedEmojiIndex: selectedEmojiIndex - 1 });
    } else {
      this.setState({ selectedEmojiIndex: emojis.length - 1 });
    }
  };

  onArrowRight = () => {
    const { emojis, selectedEmojiIndex } = this.state;
    if(!emojis.length) return
    if (selectedEmojiIndex < emojis.length - 1) {
      this.setState({ selectedEmojiIndex: selectedEmojiIndex + 1 });
    } else {
      this.setState({ selectedEmojiIndex: 0 });
    }
  };

  onEnterPress = () => {
    const { mode, emojis, selectedEmojiIndex } = this.state;
    let target = "";

    if (mode === "emoji") {
      target = emojis[selectedEmojiIndex];
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
    if (value.length < 2) { // include the ':' which is stripped by node-emoji
      this.setState({ emojis: [], selectedEmojiIndex: 0 })
      return
    }

    let results = emoji.search(value).map(e => e.emoji).slice(0, 8);

    this.setState({ emojis: results, selectedEmojiIndex: 0 });
  }

  async fetchSuggestions(value) {
    if (!value.length) {
      this.setState({ suggestion: "" });
      return;
    }

    const response = await fetchJsonp(SUGGESTIONS_URL + value);
    const results = await response.json();

    this.setState({
      suggestion: results[1][0] || "",
      emojis: []
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
    return <span className="suggestion-text">{this.suggestion || '...'}</span>;
  }

  renderEmojis() {
    if (!this.state.emojis.length) return null;

    return (
      <div className="emoji-wrapper">
        {this.state.emojis.map((e, i) => (
          <span
            key={i}
            className={classnames("emoji", {
              selected: i === this.state.selectedEmojiIndex
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
