import { useContext } from "react";

import EmojiContext from "../context/EmojiContext";

export default function() {
  return useContext(EmojiContext);
}
