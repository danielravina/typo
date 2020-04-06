import React, { useMemo, useContext, useCallback, useEffect } from "react";
import { FixedSizeGrid as Grid } from "react-window";
import "emoji-mart/css/emoji-mart.css";
import { emojiIndex, Emoji } from "emoji-mart";
import { categories } from "emoji-mart/data/apple.json";
import classnames from "classnames";
import EmojiContext from "../context/EmojiContext";
import arrayChunk from "array-chunk";
import randomcolor from "randomcolor";
import { EMOJI_HEIGHT } from "../lib/constants";
const allEmojies = categories.reduce((arr, category) => {
  return [...arr, ...category.emojis];
}, []);

const emojiGrid = arrayChunk(allEmojies, 10);

const EmojiListItem = React.memo(({ columnIndex, rowIndex, style }) => {
  const { selectedIndex } = useContext(EmojiContext);
  const emoji = emojiGrid[rowIndex][columnIndex];
  if (!emoji) return;
  return (
    <li
      style={style}
      className={classnames({
        "selected-emoji": allEmojies.indexOf(emoji) === selectedIndex
      })}
    >
      <Emoji emoji={emoji} size={24} />
    </li>
  );
});

export default React.memo(({ search = "", visible, onSelect }) => {
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

  const searchResults = useMemo(() => {
    if (search.length > 1) {
      return (
        <div className="emoji-mart-category">
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
              <div style={{ color: "#acacac", padding: 15 }}>No Results</div>
            )}
          </div>
        </div>
      );
    }
  }, [filtered, search.length, selectedIndex]);

  const grid = useMemo(() => {
    return (
      <Grid
        columnCount={10}
        columnWidth={36}
        height={EMOJI_HEIGHT}
        rowCount={emojiGrid.length}
        rowHeight={35}
        width={370}
      >
        {EmojiListItem}
      </Grid>
    );
  }, []);

  return (
    <div
      className={classnames("emoji-mart", {
        active: visible
      })}
    >
      <div className="emoji-mart-scroll">
        {searchResults}
        <div className={classnames({ hidden: search.length > 1 })}>
          <div className="emoji-mart-category">
            <div className="emoji-mart-category-list">{grid}</div>
          </div>
        </div>
      </div>
    </div>
  );
});
