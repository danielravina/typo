import { useState, useCallback } from "react";
export default function (initialIndex = 0) {
  const [index, setIndex] = useState(initialIndex);
  const [upperBound, setUpperBound] = useState(Infinity);

  const up = useCallback(() => {
    if (index > upperBound) {
      setIndex(0);
    } else {
      setIndex((oldIndex) => oldIndex + 1);
    }
  }, [index, upperBound]);

  const down = useCallback(() => {
    if (index < 0) {
      setIndex(upperBound);
    } else {
      setIndex((oldIndex) => oldIndex - 1);
    }
  }, [index, upperBound]);

  return {
    index,
    setUpperBound,
    up,
    down,
  };
}
