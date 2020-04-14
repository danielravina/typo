import "../styles/auto-complete.scss";
import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import classnames from "classnames";
import { strip } from "../lib/utils";
import useAppContext from "../hooks/useAppContext";
import { MODE_KEYS } from "../lib/modes";

import useGoogleSuggestion from "../hooks/useGoogleSuggestion";
import { changeHeight } from "../lib/utils";
import { DEFAULT_HEIGHT } from "../lib/constants";
import titleCase from "ap-style-title-case";

import useIndexSelection from "../hooks/useIndexSelection";
import useInputContext from "../hooks/useInputContext";
const Diff = require("diff");

export default function () {
  const {
    suggestionWords,
    updateContext,
    suggestion,
    preventDefault,
    allowDefault,
  } = useAppContext();

  const { query } = useInputContext();
  const fetchGoogle = useGoogleSuggestion();
  const [corrections, setCorrections] = useState(new Set());
  const ref = useRef();
  const rawSuggestion = useRef();

  const {
    index,
    setUpperBound,
    incrementIndex,
    decrementIndex,
    resetIndex,
  } = useIndexSelection(-1);

  const [wordSelectionMode, setWordSelectionMode] = useState(false);

  const onEnterPress = useCallback(() => {
    let out = suggestion;
    if (index >= 0) {
      out = suggestionWords[index];
    }

    window.ipcRenderer.send("type", out);
    window.ipcRenderer.send("hide");
    allowDefault();
    resetIndex();
  }, [allowDefault, index, resetIndex, suggestion, suggestionWords]);

  useEffect(() => {
    const diff = Diff.diffWords(query, suggestion, {
      ignoreCase: true,
    });

    setCorrections(new Set());

    diff.forEach(({ added, value }) => {
      if (added) {
        setCorrections((corr) => {
          corr.add(strip(value.toLowerCase()));
          return corr;
        });
      }
    });
  }, [query, suggestion]);

  const onKeyDown = useCallback(
    ({ key }) => {
      switch (key) {
        case "Shift":
          rawSuggestion.current = suggestion;
          setTimeout(() => {
            updateContext({
              suggestion: titleCase(suggestion),
            });
          }, 0);
          break;
        case "Alt":
          preventDefault();
          setUpperBound(suggestionWords.length - 1);
          setWordSelectionMode(true);
          break;
        case "Backspace":
          if (wordSelectionMode) {
            resetIndex();
          }
          break;
        case "ArrowLeft":
          console.log(wordSelectionMode);
          if (wordSelectionMode) {
            decrementIndex();
          }
          break;
        case "ArrowRight":
          if (wordSelectionMode) {
            incrementIndex();
          }
          break;
        case "Enter":
          onEnterPress();
          resetIndex();
          break;
        default:
          break;
      }
    },
    [
      decrementIndex,
      incrementIndex,
      onEnterPress,
      preventDefault,
      resetIndex,
      setUpperBound,
      suggestion,
      suggestionWords.length,
      updateContext,
      wordSelectionMode,
    ]
  );

  const onKeyUp = useCallback(
    ({ key }) => {
      switch (key) {
        case "Shift":
          updateContext({
            suggestion: rawSuggestion.current,
          });
          break;
        case "Alt":
          setWordSelectionMode(false);
          allowDefault();
          break;
        default:
          break;
      }
    },
    [allowDefault, updateContext]
  );

  useEffect(() => {
    window.ipcRenderer.on("window-shown", () => {
      resetIndex();
    });
  }, [resetIndex]);

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, [onKeyDown, onKeyUp]);

  // const onEnterPress = useCallback(async () => {
  //   if (clipboardText && query.length === 0) {
  //     updateContext({
  //       isLoading: true,
  //     });

  //     processClipboard(clipboardText.trim());
  //   } else {
  //     window.ipcRenderer.send("type", finalResult);
  //     window.ipcRenderer.send("hide");
  //   }
  // }, [
  //   clipboardText,
  //   finalResult,
  //   processClipboard,
  //   query.length,
  //   updateContext,
  // ]);

  const suggestionBody = useMemo(() => {
    return suggestionWords.map((word, i) => (
      <React.Fragment key={word + i}>
        <span
          className={classnames("word", {
            selected: query.length && i === index,
            corrected: corrections.has(strip(word.toLowerCase())),
            "ready-to-select": wordSelectionMode,
          })}
        >
          {word}
        </span>
      </React.Fragment>
    ));
  }, [corrections, index, query.length, suggestionWords, wordSelectionMode]);

  useEffect(() => {
    (async () => {
      if (query.length) {
        const googleResult = await fetchGoogle(query);
        updateContext({
          suggestion: googleResult,
        });

        setTimeout(() => {
          changeHeight(DEFAULT_HEIGHT + ref.current.offsetHeight);
        }, 0);
      } else {
        updateContext({
          suggestion: "",
        });
      }
    })();
  }, [fetchGoogle, query, resetIndex, updateContext]);

  return (
    <div className="suggestion-text" ref={ref}>
      {suggestionBody}
    </div>
  );
}
