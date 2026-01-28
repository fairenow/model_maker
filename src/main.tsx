import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const rootTag = document.getElementById("root");

if (rootTag) {
  const root = createRoot(rootTag);
  root.render(<App />);
}
