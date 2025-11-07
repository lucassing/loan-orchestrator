import type { PipelineRun } from "@/types";

export function RunsTable({ runs }: { runs: PipelineRun[] }) {
  return (
    <div className="overflow-auto">
      <table className="min-w-full border text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="border px-2 py-1">ID</th>
            <th className="border px-2 py-1">Application</th>
            <th className="border px-2 py-1">Pipeline</th>
            <th className="border px-2 py-1">Start</th>
            <th className="border px-2 py-1">End</th>
            <th className="border px-2 py-1">Final Status</th>
            <th className="border px-2 py-1">Steps</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((r) => (
            <tr key={r.id}>
              <td className="border px-2 py-1">{r.id}</td>
              <td className="border px-2 py-1">{r.application}</td>
              <td className="border px-2 py-1">{r.pipeline}</td>
              <td className="border px-2 py-1">
                {new Date(r.start_time).toLocaleString()}
              </td>
              <td className="border px-2 py-1">
                {r.end_time ? new Date(r.end_time).toLocaleString() : "—"}
              </td>
              <td className="border px-2 py-1 font-semibold">
                {r.final_status ?? "—"}
              </td>
              <td className="border px-2 py-1">
                <details>
                  <summary>{r.step_logs.length} logs</summary>
                  <ul className="list-disc ml-4">
                    {r.step_logs.map((s, i) => (
                      <li key={i}>
                        <strong>{s.step_type}</strong>: {s.outcome}
                        <pre className="bg-gray-50 p-2 rounded mt-1 whitespace-pre-wrap text-[11px]">
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

