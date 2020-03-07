const packager = require("electron-packager");
const path = require("path");

const { OS } = process.env;

let arch;
let executableName;
let icon;

const ignore = [
  /^\/bin$/,
  /^\/gh-pages$/,
  /^\/player$/,
  /^\/sig$/,
  /^\/test$/,
  /\.eslintignore$/,
  /\.eslintrc\.json$/,
  /\.gitignore$/,
  /\.travis\.yml$/,
  /appveyor\.yml$/,
  /CONTRIBUTING\.md$/,
  /Procfile$/,
  /README\.md$/
];

if (OS === "darwin") {
  executableName = "EXE";
  icon = path.join(__dirname, "..", "..", "src", "icons", "headset.icns");
  arch = "x64";
}

const options = {
  dir: ".",
  out: "package",
  executableName,
  icon,
  arch,
  platform: OS,
  asar: true,
  prune: true,
  overwrite: true,
  osxSign: true,
  darwinDarkModeSupport: true,
  appBundleId: "...",
  ignore
};

(async function main() {
  try {
    const appPaths = await packager(options);
    console.log(`Successfully created package at ${appPaths}`);
  } catch (error) {
    console.error("Error creating package");
    console.error(error, error.stack);
    process.exit(1);
  }
})();
