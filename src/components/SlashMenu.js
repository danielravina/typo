import React, { useCallback, useState } from "react";
import classnames from "classnames";
import useAppContext from "../hooks/useAppContext";
import "../styles/slash-menu.scss";
import useKeyDown from "../hooks/useKeyDown";
const OPTIONS = [
  {
    label: "Wikipedia",
    dscription: "Show Wikipedia articles",
  },
  {
    label: "Thesaurus",
    dscription: "Show synonyms",
  },
];

export default function () {
  const { menuMode, updateCountext } = useAppContext();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onKeydown = useCallback(
    (e) => {
      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          if (selectedIndex < OPTIONS.length - 1) {
            setSelectedIndex(selectedIndex + 1);
          } else {
            setSelectedIndex(0);
          }
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          if (selectedIndex > 0) {
            setSelectedIndex(selectedIndex - 1);
          } else {
            setSelectedIndex(OPTIONS.length - 1);
          }
          break;
        }
        case "Enter": {
          updateCountext({ dataSource: OPTIONS[selectedIndex] });
        }
        default:
          break;
      }
    },
    [selectedIndex, updateCountext]
  );
  useKeyDown(onKeydown);

  return (
    <div className={classnames("slash-menu", { active: menuMode })}>
      {OPTIONS.map((option, i) => (
        <div
          className={classnames("slash-menu-item", {
            selected: selectedIndex === i,
          })}
        >
          {option.label}
        </div>
      ))}
    </div>
  );
}
