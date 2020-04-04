import React, { useCallback, useEffect } from "react";
import useAppContext from "../hooks/useAppContext";
import classnames from "classnames";

export const EXTRENAL_RESOURCES = {
  "©": {
    key: "G",
    address: "google.com",
    label: "oogle",
    icon: require("../images/google_logo.png")
  },
  "∑": {
    key: "W",
    address: "wikipedia.org",
    label: "ikipedia",
    icon: require("../images/wiki_logo.png")
  },
  "†": {
    key: "T",
    address: "thesaurus.com",
    label: "hesaurus",
    icon: require("../images/theasaurus_logo.png")
  },
  "∂": {
    key: "D",
    address: "dictionary.com",
    label: "ictionary",
    icon: require("../images/dict_logo.png")
  }
};

export default function() {
  const { isAltPressed, suggestion, finalResult } = useAppContext();

  const onSelect = useCallback(
    e => {
      if (!isAltPressed) return;
      e.preventDefault();

      const source = EXTRENAL_RESOURCES[e.key];
      if (!source) return;

      window.ipcRenderer.send("hide");
      window.ipcRenderer.send("openExternal", {
        value: finalResult,
        source: source.address
      });
    },
    [finalResult, isAltPressed]
  );

  useEffect(() => {
    document.addEventListener("keydown", onSelect);
    return () => {
      document.removeEventListener("keydown", onSelect);
    };
  }, [onSelect]);

  return (
    <div
      className={classnames("alt-options", {
        active: isAltPressed && suggestion.length
      })}
    >
      {Object.keys(EXTRENAL_RESOURCES).map(alt => {
        const { icon, key, label, address } = EXTRENAL_RESOURCES[alt];
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
  );
}
