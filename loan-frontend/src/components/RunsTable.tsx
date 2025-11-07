import type { PipelineRun } from "@/types";

export function RunsTable({ runs }: { runs: PipelineRun[] }) {
  return (
    <div className="table-responsive">
      <table className="table table-sm table-bordered align-middle">
        <thead className="table-light">
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Application</th>
            <th scope="col">Pipeline</th>
            <th scope="col">Start</th>
            <th scope="col">End</th>
            <th scope="col">Final Status</th>
            <th scope="col">Steps</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((r) => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.application}</td>
              <td>{r.pipeline}</td>
              <td>{new Date(r.start_time).toLocaleString()}</td>
              <td>
                {r.end_time ? new Date(r.end_time).toLocaleString() : "—"}
              </td>
              <td className="fw-semibold">{r.final_status ?? "—"}</td>
              <td>
                <details>
                  <summary>{r.step_logs.length} logs</summary>
                  <ul className="ms-3">
                    {r.step_logs.map((s, i) => (
                      <li key={i} className="mb-2">
                        <strong>{s.step_type}</strong>: {s.outcome}
                        <pre className="bg-light p-2 rounded mt-1 font-monospace small">
                          {JSON.stringify(s.detail, null, 2)}
                        </pre>
                      </li>
                    ))}
                  </ul>
                </details>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
