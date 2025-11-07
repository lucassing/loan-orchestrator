import { Link, Outlet } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

export default function App() {
  return (
    <div className="container">
      <nav className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom">
        <div className="d-flex align-items-center gap-3">
          <Link to="/" className="fw-bold text-decoration-none">
            Loan Orchestrator
          </Link>
          <Link to="/" className="small text-decoration-none">
            Pipelines
          </Link>
          <Link to="/run" className="small text-decoration-none">
            Run
          </Link>
          <Link to="/runs" className="small text-decoration-none">
            Runs
          </Link>
        </div>
        <div className="small text-body-secondary">MVP • React + Vite</div>
      </nav>
      <Outlet />
    </div>
  );
}
