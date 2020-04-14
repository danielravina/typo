import { useState, useCallback } from "react";
export default function (initialIndex = 0) {
  const [index, setIndex] = useState(initialIndex);
  const [upperBound, setUpperBound] = useState(Infinity);

  const incrementIndex = useCallback(() => {
    setIndex((oldIndex) => {
      if (oldIndex >= upperBound) {
        return initialIndex;
      } else {
        return oldIndex + 1;
      }
    });
  }, [initialIndex, upperBound]);

  const decrementIndex = useCallback(() => {
    setIndex((oldIndex) => {
      if (oldIndex <= initialIndex) {
        return upperBound;
      } else {
        return oldIndex - 1;
      }
    });
  }, [initialIndex, upperBound]);

  const resetIndex = useCallback(() => {
    setIndex(initialIndex);
  }, [initialIndex]);

  return {
    index,
    setUpperBound,
    incrementIndex,
    decrementIndex,
    resetIndex,
  };
}
