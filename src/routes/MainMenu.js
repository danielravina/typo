import React, { useEffect, useState } from "react";
import classnames from "classnames";
import useAppContext from "../hooks/useAppContext";
import "../styles/slash-menu.scss";
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

  useEffect(() => {
    // if (!menuMode) return;
    // switch (key) {
    //   case "ArrowDown": {
    //     setSelectedIndex((oldIndex) => {
    //       if (oldIndex < OPTIONS.length - 1) {
    //         return oldIndex + 1;
    //       } else {
    //         return 0;
    //       }
    //     });
    //     break;
    //   }
    //   case "ArrowUp": {
    //     setSelectedIndex((oldIndex) => {
    //       if (oldIndex > 0) {
    //         return oldIndex - 1;
    //       } else {
    //         return OPTIONS.length - 1;
    //       }
    //     });
    //     break;
    //   }
    //   case "Enter": {
    //     setSelectedIndex((oldIndex) => {
    //       updateCountext({ dataSource: OPTIONS[oldIndex] });
    //       return oldIndex;
    //     });
    //     break;
    //   }
    //   default:
    //     break;
    // }
  }, [menuMode, updateCountext]);

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
