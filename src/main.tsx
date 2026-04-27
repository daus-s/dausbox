import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import Terminal from "./Terminal.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Terminal />
  </StrictMode>,
);
