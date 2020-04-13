import "../styles/auto-complete.scss";
import React, { useState, useMemo, useEffect, useRef } from "react";
import classnames from "classnames";
import { strip } from "../lib/utils";
import useAppContext from "../hooks/useAppContext";
import { MODE_KEYS, modes } from "../lib/modes";
import Sliding from "./Sliding";
import useGoogleSuggestion from "../hooks/useGoogleSuggestion";
import { changeHeight } from "../lib/utils";
import { DEFAULT_HEIGHT } from "../lib/constants";
import titleCase from "ap-style-title-case";
import useKeyboardEvent from "../hooks/useKeyboardEvent";
import useIndexSelection from "../hooks/useIndexSelection";

export default function () {
  const {
    query,
    corrections,
    suggestionWords,
    currentMode,
    updateContext,
    contentHeight,
    suggestion,
  } = useAppContext();

  const fetchGoogle = useGoogleSuggestion();
  const ref = useRef();
  const rawSuggestion = useRef();

  const { key: keyDown } = useKeyboardEvent("keyDown");
  const { key: keyUp } = useKeyboardEvent("keyUp");
  const { index, setUpperBound, up, down } = useIndexSelection();
  const [wordSelectionMode, setWordSelectionMode] = useState(false);

  useEffect(() => {
    switch (keyUp) {
      case "Shift":
        updateContext({
          suggestion: rawSuggestion.current,
        });
        break;
      default:
        break;
    }
  }, [keyUp, rawSuggestion, suggestion, updateContext]);

  useEffect(() => {
    switch (keyDown) {
      case "Shift":
        rawSuggestion.current = suggestion;
        setTimeout(() => {
          updateContext({
            suggestion: titleCase(suggestion),
          });
        }, 0);
        break;
      case "Meta":
        setWordSelectionMode(true);
      default:
        break;
    }
  }, [keyDown, rawSuggestion, suggestion, updateContext]);

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

  // useEffect(() => {
  //   if (suggestion.length) {
  //   } else {
  //     changeHeight(DEFAULT_HEIGHT);
  //   }
  // }, []);

  const suggestionBody = useMemo(() => {
    return suggestionWords.map((word, i) => (
      <React.Fragment key={word + i}>
        <span
          className={classnames("word", {
            selected: query.length && i === index,
            corrected: corrections.has(strip(word.toLowerCase())),
          })}
        >
          {word}
        </span>
        {i === suggestionWords.length - 1 ? null : <span className="spacer" />}
      </React.Fragment>
    ));
  }, [corrections, index, query.length, suggestionWords]);

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
  }, [fetchGoogle, query, updateContext]);

  return (
    <Sliding modeKey={MODE_KEYS.AUTO_COMPLETE}>
      <div className="suggestion-text" ref={ref}>
        {suggestionBody}
      </div>
    </Sliding>
  );
}
