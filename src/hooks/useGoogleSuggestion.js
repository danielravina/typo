import { useCallback } from "react";
import fetchJsonp from "fetch-jsonp";

const SUGGESTIONS_URL =
  "https://suggestqueries.google.com/complete/search?client=firefox&q=";

export default function() {
  const fetch = useCallback(async query => {
    if (query.length < 2) return "";
    const response = await fetchJsonp(SUGGESTIONS_URL + query);

    const responseJson = await response.json();
    const result = responseJson[1][0] || "";
    if (result.length) {
      return result;
    }
    return "";
  }, []);

  return fetch;
}
