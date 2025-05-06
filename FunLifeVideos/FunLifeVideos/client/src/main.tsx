import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { FunLifeProvider } from "@/lib/context";

createRoot(document.getElementById("root")!).render(
  <FunLifeProvider>
    <App />
  </FunLifeProvider>
);
