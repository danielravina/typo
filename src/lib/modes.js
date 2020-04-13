import EmojiPicker from "../components/EmojiPicker";
import MainMenu from "../components/MainMenu";
import AutoComplete from "../components/AutoComplete";

export const MODE_KEYS = {
  AUTO_COMPLETE: "AUTO_COMPLETE",
  EMOJI: "EMOJI",
  MENU: "MENU",
};

export const modes = {
  AUTO_COMPLETE: {
    height: 50,
    key: MODE_KEYS.AUTO_COMPLETE,
    component: AutoComplete,
    preventDefaultKeys: new Set(["Tab"]),
  },
  EMOJI: {
    height: 320,
    key: MODE_KEYS.EMOJI,
    component: EmojiPicker,
    preventDefaultKeys: new Set(),
  },
  MENU: {
    height: 320,
    key: MODE_KEYS.MENU,
    component: MainMenu,
    preventDefaultKeys: new Set(),
  },
};
