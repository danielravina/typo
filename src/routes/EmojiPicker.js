import React, { useMemo, useCallback, useEffect, useRef } from "react";
import { FixedSizeGrid as Grid } from "react-window";
import "emoji-mart/css/emoji-mart.css";
import { emojiIndex, Emoji } from "emoji-mart";
import classnames from "classnames";
import useEmojiContext from "../hooks/useEmojiContext";
import "../styles/emoji-picker.scss";
import { EMOJI_HEIGHT } from "../lib/constants";
import useAppContext from "../hooks/useAppContext";

import { WINDOW_WIDTH } from "../shared/constants";
import useInputContext from "../hooks/useInputContext";
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
  const {
    selectedIndex,
    setSelectedIndex,
    filteredGrid,
    fullGrid,
    allEmojies,
    onSelect,
    colors,
    filteredQueryResult,
  } = useEmojiContext();

  const row = filteredGrid.length ? filteredGrid[rowIndex] : fullGrid[rowIndex];

  if (!row) return <div className="last-row" />;

  const emoji = row[columnIndex];

  if (!emoji) return null;
  const source = filteredQueryResult.length ? filteredQueryResult : allEmojies;

  const isSelected = source.indexOf(emoji) === selectedIndex;

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
      onMouseOver={() => setSelectedIndex(source.indexOf(emoji))}
      className={classnames({
        "selected-emoji": isSelected,
      })}
    >
      <Emoji emoji={emoji} size={24} native={true} />
    </li>
  );
});

export default function () {
  console.log("emoji component render");
  const {
    selectedIndex,
    setSelectedIndex,
    onSelect,
    GRID_COLUMNS,
    fullGrid,
    filteredGrid,
    filteredQueryResult,
    allEmojies,
  } = useEmojiContext();

  const { query } = useInputContext();
  const { emojiMode } = useAppContext();
  const gridRef = useRef();

  const selectedEmoji = useMemo(() => {
    let emojiName;
    if (filteredQueryResult.length) {
      emojiName = filteredQueryResult[selectedIndex];
    } else {
      emojiName = allEmojies[selectedIndex];
    }

    if (!emojiName) return null;

    return (
      emojiIndex.emojis[emojiName][1] || emojiIndex.emojis[emojiName] // [1] selects the default skin-tone if exists
    );
  }, [allEmojies, filteredQueryResult, selectedIndex]);

  useEffect(() => {
    // if (!emojiMode) return;
    // const total = filteredQueryResult.length || allEmojies.length;
    // switch (key) {
    //   case "ArrowDown": {
    //     setSelectedIndex((oldIndex) => {
    //       if (oldIndex + GRID_COLUMNS <= total - 1) {
    //         return oldIndex + GRID_COLUMNS;
    //       }
    //       return oldIndex;
    //     });
    //     break;
    //   }
    //   case "ArrowUp": {
    //     setSelectedIndex((oldIndex) => {
    //       if (oldIndex - GRID_COLUMNS >= 0) {
    //         return oldIndex - GRID_COLUMNS;
    //       }
    //       return oldIndex;
    //     });
    //     break;
    //   }
    //   case "ArrowRight": {
    //     setSelectedIndex((oldIndex) => {
    //       if (oldIndex === total - 1) {
    //         return 0;
    //       } else {
    //         return oldIndex + 1;
    //       }
    //     });
    //     break;
    //   }
    //   case "ArrowLeft": {
    //     setSelectedIndex((oldIndex) => {
    //       if (oldIndex <= 0) {
    //         return total - 1;
    //       } else {
    //         return oldIndex - 1;
    //       }
    //     });
    //     break;
    //   }
    //   case "Enter": {
    //     if (selectedEmoji) {
    //       onSelect(selectedEmoji.native);
    //     }
    //     break;
    //   }
    //   default:
    //     break;
    // }
  }, [
    GRID_COLUMNS,
    allEmojies.length,
    emojiMode,
    filteredQueryResult.length,
    onSelect,
    selectedEmoji,
    setSelectedIndex,
  ]);

  const grid = useMemo(() => {
    const rowCount = filteredGrid.length || fullGrid.length;
    return (
      <Grid
        ref={gridRef}
        columnCount={GRID_COLUMNS}
        rowCount={rowCount + 4} // 4 to give space at the bottom
        columnWidth={36}
        rowHeight={35}
        height={EMOJI_HEIGHT}
        width={WINDOW_WIDTH}
      >
        {EmojiCell}
      </Grid>
    );
  }, [GRID_COLUMNS, filteredGrid.length, fullGrid.length]);

  useEffect(() => {
    if (query.length) {
      setSelectedIndex(0);
    }
  }, [query.length, setSelectedIndex]);

  return (
    <div
      className={classnames("emoji-mart", {
        active: emojiMode,
      })}
    >
      <div className="emoji-mart-scroll">
        <div className="emoji-mart-category">
          <div className="emoji-mart-category-list">{grid}</div>
        </div>
      </div>
      {selectedEmoji && <EmojiPreview emoji={selectedEmoji} />}
    </div>
  );
}
