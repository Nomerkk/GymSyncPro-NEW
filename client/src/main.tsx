import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Register the service worker early so Lighthouse can audit PWA in dev
import "./sw-register";

createRoot(document.getElementById("root")!).render(<App />);
