import React, {
  useMemo,
  useContext,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { FixedSizeGrid as Grid } from "react-window";
import "emoji-mart/css/emoji-mart.css";
import { emojiIndex, Emoji } from "emoji-mart";
import { categories } from "emoji-mart/data/apple.json";
import classnames from "classnames";
import useEmojiContext from "../hooks/useEmojiContext";
import arrayChunk from "array-chunk";
import randomcolor from "randomcolor";
import { EMOJI_HEIGHT } from "../lib/constants";

const allEmojies = categories.reduce((arr, category) => {
  return [...arr, ...category.emojis];
}, []);

const COLUMNS = 9;
const emojiGrid = arrayChunk(allEmojies, COLUMNS);

const colors = allEmojies.map(() =>
  randomcolor({ format: "rgba", alpha: 0.5, luminosity: "dark" })
);

function EmojiIcon({ style, isSelected, emoji, onMouseOver }) {
  const { onSelect, selectedIndex } = useEmojiContext();
  return (
    <li
      style={{
        ...style,
        backgroundColor: isSelected ? colors[selectedIndex] : null,
      }}
      onClick={() => {
        const selected = emojiIndex.emojis[emoji];
        onSelect(selected.native);
      }}
      onMouseOver={onMouseOver}
      className={classnames({
        "selected-emoji": isSelected,
      })}
    >
      <Emoji emoji={emoji} size={24} native={true} />
    </li>
  );
}
function EmojiPreview({ emoji }) {
  return (
    <div className="emoji-preview">
      <div className="emoji-mart-preview-emoji">
        <Emoji emoji={emoji} size={38} native={true} />
      </div>
      <div className="emoji-mart-preview-data">
        <div className="emoji-mart-preview-name">{emoji.name}</div>
        <div className="emoji-mart-preview-shortname">{emoji.colons}</div>
      </div>
    </div>
  );
}
const EmojiCell = React.memo(({ columnIndex, rowIndex, style }) => {
  const { selectedIndex, setSelectedIndex } = useEmojiContext();
  const row = emojiGrid[rowIndex];

  if (!row) return <div className="last-row" />;

  const emoji = row[columnIndex];

  if (!emoji) return;

  const isSelected = allEmojies.indexOf(emoji) === selectedIndex;

  return (
    <EmojiIcon
      style={style}
      isSelected={isSelected}
      emoji={emoji}
      onMouseOver={() => setSelectedIndex(allEmojies.indexOf(emoji))}
    />
  );
});

export default function ({ search = "", visible }) {
  const { selectedIndex, setSelectedIndex, onSelect } = useEmojiContext();

  const gridRef = useRef();

  const filtered = useMemo(() => {
    if (search.length < 2) return [];

    return emojiIndex.search(search.replace(":", "")).map((o) => o.id);
  }, [search]);

  const selectedEmoji = useMemo(() => {
    let emojiName;
    if (filtered.length) {
      emojiName = filtered[selectedIndex];
    } else {
      emojiName = allEmojies[selectedIndex];
    }

    return (
      emojiIndex.emojis[emojiName][1] || emojiIndex.emojis[emojiName] // [1] selects the default skin-tone
    );
  }, [filtered, selectedIndex]);

  const onKeyDown = useCallback(
    (e) => {
      if (!visible) return;
      const total = filtered.length || allEmojies.length;
      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          if (selectedIndex + COLUMNS <= total - 1) {
            setSelectedIndex(selectedIndex + COLUMNS);
          }
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          if (selectedIndex - COLUMNS >= 0) {
            setSelectedIndex(selectedIndex - COLUMNS);
          }
          break;
        }
        case "ArrowRight": {
          e.preventDefault();
          if (selectedIndex === total - 1) {
            setSelectedIndex(0);
          } else {
            setSelectedIndex(selectedIndex + 1);
          }
          break;
        }
        case "ArrowLeft": {
          e.preventDefault();
          if (selectedIndex <= 0) {
            setSelectedIndex(total - 1);
          } else {
            setSelectedIndex(selectedIndex - 1);
          }
          break;
        }
        case "Enter": {
          onSelect(selectedEmoji.native);
          break;
        }
        default:
          break;
      }
    },
    [
      filtered.length,
      onSelect,
      selectedEmoji,
      selectedIndex,
      setSelectedIndex,
      visible,
    ]
  );

  const searchResults = useMemo(() => {
    if (search.length > 1) {
      return (
        <div className="emoji-mart-category">
          <div className="emoji-mart-category-list">
            {filtered.length ? (
              filtered.map((emoji, i) => (
                <EmojiIcon
                  isSelected={i === selectedIndex}
                  emoji={emoji}
                  onMouseOver={() => setSelectedIndex(i)}
                />
              ))
            ) : (
              <div style={{ color: "#acacac", padding: 15 }}>No Results</div>
            )}
          </div>
        </div>
      );
    }
  }, [filtered, search.length, selectedIndex, setSelectedIndex]);

  const grid = useMemo(() => {
    return (
      <Grid
        ref={gridRef}
        columnCount={COLUMNS}
        columnWidth={36}
        height={EMOJI_HEIGHT}
        rowCount={emojiGrid.length + 4} // 4 to give space at the bottom
        rowHeight={35}
        width={339}
      >
        {EmojiCell}
      </Grid>
    );
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onKeyDown]);

  useEffect(() => {
    if (search.length) {
      setSelectedIndex(0);
    }
  }, [search.length, setSelectedIndex]);

  return (
    <div
      className={classnames("emoji-mart", {
        active: visible,
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
      {selectedEmoji && <EmojiPreview emoji={selectedEmoji} />}
    </div>
  );
}
