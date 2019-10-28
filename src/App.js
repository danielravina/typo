import React from "react";
import "./App.css";

import fetchJsonp from "fetch-jsonp";
import titleCase from 'ap-style-title-case'

const SUGGESTIONS_URL =
  "https://suggestqueries.google.com/complete/search?client=firefox&q=";

const defaultState = {
  word: "",
  suggestion: "",
  isTitleized: false
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
    this.fetchSuggestions(value);
  };

  onKeyUp = e => {
    switch (e.key) {
      case "Shift":
        this.setState({ isTitleized: false });
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
        window.ipcRenderer.send("copyClipBoard", this.suggestion);
        window.ipcRenderer.send("hide");
        this.setState(defaultState);
        break;
      default:
        break;
    }
  };

  onTabPress() {
    setTimeout(() => {
      this.input.focus();
      var val = this.state.suggestion;
      this.input.value = "";
      this.input.value = val + " ";
    }, 5);
  }

  async fetchSuggestions(value) {
    if (!value.length) {
      this.setState({ suggestion: "" });
      return;
    }

    const response = await fetchJsonp(SUGGESTIONS_URL + value);
    const results = await response.json();

    this.setState({
      suggestion: results[1][0] || ""
    });
  }

  get suggestion() {
    if (this.state.isTitleized) {
      return titleCase(this.state.suggestion)
    } else {
      return this.state.suggestion
    }
  }

  render() {
    return (
      <div className="app">
        <div className="suggestion-wrapper">
          <span className="subtitle"></span>
          <span className="suggestion-text">
            {this.suggestion || "..."}
          </span>
        </div>
        <div className="input-wrapper">
          <input
            ref={r => (this.input = r)}
            className="main-input"
            autoFocus
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
