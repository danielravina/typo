export const strip = (t = "") => t.replace(/[,;:!?]+$/, "").trim();

export const changeHeight = height => {
  window.ipcRenderer.send("changeHeight", height);
};
