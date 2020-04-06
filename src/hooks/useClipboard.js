import { useCallback, useEffect, useState } from "react";
import titleCase from "ap-style-title-case";
import useGoogleSuggestion from "./useGoogleSuggestion";
import useAppContext from "./useAppContext";

export default function() {
  const [clipboardText, setClipboardText] = useState("");
  const fetchGoogle = useGoogleSuggestion();
  const { updateContext } = useAppContext();

  const isCapitalized = useCallback(word => {
    if (!word) return null;
    if (/^\d+$/.test(word)) return false; // number
    return word[0].toUpperCase() === word[0];
  }, []);

  const createChunks = useCallback(
    words => {
      const chunks = [];
      words.forEach((word, i) => {
        const lastWord = words[i - 1];
        const endWithPunct = lastWord && lastWord.match(/[,;:!.-?]+$/);

        if (isCapitalized(word) && isCapitalized(lastWord) && !endWithPunct) {
          chunks[chunks.length - 1] = `${lastWord} ${word}`;
        } else {
          chunks.push(word);
        }
      });

      return chunks;
    },
    [isCapitalized]
  );

  const createWords = useCallback(() => {
    return clipboardText.replace(/\u21b5|\n/g, "").split(" ");
  }, [clipboardText]);

  const process = useCallback(async () => {
    const words = createWords();
    const bulkFetch = await fetchGoogle(clipboardText);

    if (bulkFetch && words.length > 1) {
      updateContext({
        suggestion: bulkFetch,
        clipboardText: null,
        query: clipboardText
      });
      return;
    }

    const chunks = createChunks(words);
    let out = "";

    for (let i = 0; i < chunks.length; ++i) {
      const phrase = chunks[i]; // 1 or many words

      let fetchedChunk = "";

      if (phrase.length === 1) {
        fetchedChunk = phrase;
      } else {
        for (let j = 2; j <= phrase.length; ++j) {
          const warmup = phrase
            .split("")
            .slice(0, j)
            .join("");

          if (warmup.length) {
            if (warmup.match(/[.]/)) continue;

            const result = await fetchGoogle(warmup + " ");

            if (!result.length) continue;

            fetchedChunk = result;
          }
        }
      }

      // if I search for British (1 word), the google returned "British Columbia", then slice
      // Columbia down
      let selectedPortion = fetchedChunk
        .split(" ")
        .slice(0, phrase.split(" ").length)
        .join(" ");

      // Add back missing punctiations
      const punctMatch = phrase.match(/[.,;:!?]+$/);
      if (punctMatch !== null) {
        selectedPortion = selectedPortion.concat(punctMatch[0]);
      }

      // Add back title case if phrase was capitalize
      if (isCapitalized(phrase)) {
        selectedPortion = titleCase(selectedPortion);
      }

      out = `${out} ${selectedPortion}`.trim();

      updateContext({
        suggestion: out,
        clipboardText: null,
        query: clipboardText
      });
    }
  }, [
    clipboardText,
    createChunks,
    createWords,
    fetchGoogle,
    isCapitalized,
    updateContext
  ]);

  useEffect(() => {
    if (clipboardText.length) {
      process();
    }
  }, [clipboardText, process]);

  return setClipboardText;
}
