import { useEffect, useState } from "react";
import { listRuns } from "@/api/api";
import type { PipelineRun } from "@/types";
import { RunsTable } from "@/components/RunsTable";

export default function RunsPage() {
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      setRuns(await listRuns());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <div className="p-4">
      <header className="mb-3">
        <h1 className="h4 fw-bold mb-1">Runs</h1>
        <p className="text-body-secondary small mb-0">
          All runs with step logs.
        </p>
      </header>
      {loading ? <p className="mb-0">Loading…</p> : <RunsTable runs={runs} />}
    </div>
  );
}
