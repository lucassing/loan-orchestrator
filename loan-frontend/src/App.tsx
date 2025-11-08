import { Link, Outlet } from "react-router-dom";

export default function App() {
  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-light bg-light border-bottom">
        <div className="container-fluid px-4">
          <Link className="navbar-brand fw-bold" to="/">
            Loan Orchestrator
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link className="nav-link" to="/">
                  Builder
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/run">
                  Run
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/runs">
                  Runs
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <div className="container mt-4">
        <Outlet />
      </div>
    </div>
  );
}