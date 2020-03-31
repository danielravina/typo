import fetchJsonp from "fetch-jsonp";
const SUGGESTIONS_URL =
  "https://suggestqueries.google.com/complete/search?client=firefox&q=";

export default async function(value) {
  const response = await fetchJsonp(SUGGESTIONS_URL + value);
  const results = await response.json();

  return results[1][0] || "";
}
