import React from "react";
import "./App.css";

import fetchJsonp from "fetch-jsonp";
import Mousetrap from "mousetrap";

Mousetrap.bind('4', function() { console.log('4'); });

const SUGGESTIONS_URL =
  "https://suggestqueries.google.com/complete/search?client=firefox&q=";

const defaultState = {
  word: "",
  suggestion: ""
};

class App extends React.Component {
  constructor() {
    super();
    this.h = null;
  }

  state = defaultState;

  onInputChange = e => {
    const { value } = e.target;
    this.setState({ word: value });
    this.fetchSuggestions(value);
  };

  onKeyDown = e => {
    switch (e.key) {
      case "Escape":
        window.ipcRenderer.send("hide");
        this.setState(defaultState);
        break;
      case "Tab":
        this.completeWord();
        this.moveCursorToEnd()
        break;
      case "Enter":
        window.ipcRenderer.send("copyClipBoard", this.fullWord);
        window.ipcRenderer.send("hide");
        this.setState(defaultState);
        break;
      default:
        break;
    }
  };

  get suggestionDistance() {
    if (!this.state.word.length) {
      return 0;
    }

    return this.h.offsetWidth + 1;
  }

  get suggestionCompletion() {
    return this.state.suggestion.substring(this.state.word.length);
  }

  get fullWord() {
    return this.state.word + this.suggestionCompletion;
  }

  /*
    When pressing "Tab", the input is selected which degrades the UI
    this will "deselect" the input and move cursor to the end so user can keep typing
  */
  moveCursorToEnd() {
    setTimeout(() => {
      this.input.focus();
      var val = this.input.value;
      this.input.value = '';
      this.input.value = val;
    }, 5);
  }

  completeWord() {
    this.setState({
      word: this.fullWord,
      suggestion: ""
    });
  }

  async fetchSuggestions(value) {
    if (value.length < 2) {
      this.setState({ suggestion: "" });
      return;
    }

    const response = await fetchJsonp(SUGGESTIONS_URL + value);
    const results = await response.json();

    this.setState({
      suggestion: results[1][0] || ""
    });
  }

  render() {
    return (
      <div className="app dark">
        <span
          className="hidden"
          ref={h => { this.h = h; }}
          dangerouslySetInnerHTML={{
            __html: this.state.word.replace(/\s/g, "&nbsp;")
          }}
        />
        <div className="input-wrapper">
          <input
            ref={(r) => this.input = r}
            className="main-input"
            autoFocus
            autoBlur
            value={this.state.word}
            onChange={this.onInputChange}
            placeholder="Type Something..."
            onKeyDown={this.onKeyDown}
          />
          {this.h && (
            <input
              className="autocomplete"
              disabled
              style={{
                transform: `translateX(${this.suggestionDistance}px)`
              }}
              value={this.suggestionCompletion}
            />
          )}
        </div>
      </div>
    );
  }
}

export default App;
