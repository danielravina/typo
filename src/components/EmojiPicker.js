import React, { useMemo, useContext, useCallback, useEffect } from "react";
import "emoji-mart/css/emoji-mart.css";
import { emojiIndex, Emoji } from "emoji-mart";
import { categories } from "emoji-mart/data/apple.json";
import classnames from "classnames";
import EmojiContext from "../context/EmojiContext";

const Category = React.memo(({ name, emojis }) => {
  return (
    <div className={"emoji-mart-category"} key={name}>
      <div className="emoji-mart-category-list">
        {emojis.map((emoji, i) => (
          <li
            className={classnames({
              "selected-emoji": i === selectedIndex
            })}
            key={emoji}
          >
            {console.log(name)}
            <Emoji emoji={emoji} size={24} native={true} />
          </li>
        ))}
      </div>
    </div>
  );
});

export default function({ search = "", visible, onSelect }) {
  const { selectedIndex, setSelectedIndex } = useContext(EmojiContext);

  const filtered = useMemo(() => {
    if (search.length < 2) return [];

    return emojiIndex.search(search.replace(":", "")).map(o => o.id);
  }, [search]);

  const onKeyDown = useCallback(
    e => {
      if (!visible) return;
      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          if (selectedIndex + 9 < filtered.length - 1) {
            setSelectedIndex(selectedIndex + 9);
          }
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          if (selectedIndex - 9 > 0) {
            setSelectedIndex(selectedIndex - 9);
          }
          break;
        }
        case "ArrowRight": {
          e.preventDefault();
          if (selectedIndex === filtered.length - 1) {
            setSelectedIndex(0);
          } else {
            setSelectedIndex(selectedIndex + 1);
          }
          break;
        }
        case "ArrowLeft": {
          e.preventDefault();
          if (selectedIndex <= 0) {
            setSelectedIndex(filtered.length - 1);
          } else {
            setSelectedIndex(selectedIndex - 1);
          }
          break;
        }
        case "Enter": {
          const selected = emojiIndex.emojis[filtered[selectedIndex]];
          onSelect(selected.native);
          break;
        }
        default:
          break;
      }
    },
    [filtered, onSelect, selectedIndex, setSelectedIndex, visible]
  );

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onKeyDown]);

  const all = useMemo(() => {
    return categories.map(({ name, emojis }) => {
      return <Category name={name} emojis={emojis} />;
    });
  }, []);

  const searchResults = useMemo(() => {
    if (search.length > 1) {
      return (
        <div className="emoji-mart-category">
          <div className="emoji-mart-category-label">
            <span>Search Reslts</span>
          </div>
          <div className="emoji-mart-category-list">
            {filtered.length ? (
              filtered.map((emoji, i) => (
                <li
                  key={emoji}
                  className={classnames({
                    "selected-emoji": i === selectedIndex
                  })}
                >
                  <Emoji emoji={emoji} size={24} native={true} />
                </li>
              ))
            ) : (
              <span style={{ color: "#acacac", padding: 5 }}>No Results</span>
            )}
          </div>
        </div>
      );
    }
  }, [filtered, search.length, selectedIndex]);

  return (
    <div
      className={classnames("emoji-mart", {
        active: visible
      })}
    >
      <div className="emoji-mart-scroll">
        {searchResults}
        <div className={classnames({ hidden: search.length > 1 })}>{all}</div>
      </div>
    </div>
  );
}
