import React from "react";
import { createRoot } from "react-dom/client";
import { AppRegistry } from "react-native";
import App from "./App";

const rootTag = document.getElementById("root");

AppRegistry.registerComponent("App", () => App);

if (rootTag) {
  const root = createRoot(rootTag);
  root.render(<App />);
}
