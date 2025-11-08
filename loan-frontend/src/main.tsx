import React from "react";
import { createRoot } from "react-dom/client";
import Routes from "@/routes";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <Routes />
  </React.StrictMode>,
);
