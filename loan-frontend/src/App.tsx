// ============================
// File: src/App.tsx
// ============================
import React from "react";
import { Link, Outlet } from "react-router-dom";

export default function App() {
  return (
    <div className="max-w-6xl mx-auto">
      <nav className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-bold">
            Loan Orchestrator
          </Link>
          <Link to="/" className="text-sm">
            Pipelines
          </Link>
          <Link to="/run" className="text-sm">
            Run
          </Link>
          <Link to="/runs" className="text-sm">
            Runs
          </Link>
        </div>
        <div className="text-xs text-gray-600">MVP • React + Vite</div>
      </nav>
      <Outlet />
    </div>
  );
}
