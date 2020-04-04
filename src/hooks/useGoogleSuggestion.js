import { useState, updateContext, useCallback, useEffect } from "react";
import fetchJsonp from "fetch-jsonp";
import useAppContext from "./useAppContext";

const SUGGESTIONS_URL =
  "https://suggestqueries.google.com/complete/search?client=firefox&q=";

export default function() {
  const { updateContext } = useAppContext();
  const [query, setQuery] = useState("");

  const fetch = useCallback(async () => {
    const response = await fetchJsonp(SUGGESTIONS_URL + query);

    const responseJson = await response.json();
    const result = responseJson[1][0] || "";
    if (result.length) {
      updateContext({
        suggestion: result,
        selectionCount: result.split(" ").length
      });
    } else {
      updateContext({
        suggestion: "🙈 Nothing found 🙉",
        selectionCount: null
      });
    }
  }, [query, updateContext]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return setQuery;
}
