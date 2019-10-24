import React from "react";
import "./App.css";

import fetchJsonp from "fetch-jsonp";

const SUGGESTIONS_URL =
  "https://suggestqueries.google.com/complete/search?client=firefox&q=";

class App extends React.Component {
  constructor() {
    super();
    this.h = null;
  }

  state = {
    word: "",
    suggestion: ""
  };

  onInputChange = e => {
    const { value } = e.target;
    this.setState({ word: value });
    this.fetchSuggestions(value);
  };

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

  get distance() {
    if (!this.state.word.length) {
      return 0;
    }

    return this.h.offsetWidth + 2;
  }

  render() {
    return (
      <div className="app">
        <span
          class="hidden"
          ref={h => {
            this.h = h;
          }}
          dangerouslySetInnerHTML={{
            __html: this.state.word.replace(/\s/g, "&nbsp;")
          }}
        />
        <div className="input-wrapper">
          <input
            className="main-input"
            autoFocus
            value={this.state.word}
            onChange={this.onInputChange}
            placeholder="Type Something..."
          />
          {this.h && (
            <input
              class="main-input autocomplete"
              disabled
              style={{
                transform: `translateX(${this.distance}px)`
              }}
              value={this.state.suggestion.substring(this.state.word.length)}
            />
          )}
        </div>
      </div>
    );
  }
}

export default App;
