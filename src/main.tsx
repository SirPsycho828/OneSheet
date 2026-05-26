import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/index.css";

// Console branding
console.log(
  "%c OneSheet ",
  "background:#292524;color:#EA580C;font-size:20px;font-weight:bold;padding:8px 16px;border-radius:4px;font-family:Georgia,serif"
);
console.log(
  "%cYour career, one page at a time. %chttps://onesheet.cv",
  "color:#78716C;font-size:12px;font-style:italic",
  "color:#292524;font-size:12px;font-weight:bold"
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
