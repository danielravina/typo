import { useCallback } from "react";
import fetchJsonp from "fetch-jsonp";
const cache = {};

const SUGGESTIONS_URL =
  "https://suggestqueries.google.com/complete/search?client=firefox&q=";

export default function () {
  const fetch = useCallback(async (query) => {
    if (cache[query]) {
      return cache[query];
    }

    const response = await fetchJsonp(SUGGESTIONS_URL + query);

    const responseJson = await response.json();
    const result = responseJson[1][0] || "";

    if (result.length) {
      cache[query] = result;
      return result;
    }
    return "";
  }, []);

  return fetch;
}
