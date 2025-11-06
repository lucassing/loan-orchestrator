// ============================
// File: src/routes.tsx
// ============================
import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "@/App";
import PipelinesPage from "@/pages/PipelinesPage";
import RunPage from "@/pages/RunPage";
import RunsPage from "@/pages/RunsPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <PipelinesPage /> },
      { path: "run", element: <RunPage /> },
      { path: "runs", element: <RunsPage /> },
    ],
  },
]);

export default function Routes() {
  return <RouterProvider router={router} />;
}
