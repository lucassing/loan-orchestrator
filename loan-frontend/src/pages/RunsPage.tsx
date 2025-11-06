import { useEffect, useState } from "react";
import { listRuns } from "@/lib/api";
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
    <div className="p-4 space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-bold">Runs</h1>
        <p className="text-sm text-gray-600">All runs with step logs.</p>
      </header>
      {loading ? <p>Loading…</p> : <RunsTable runs={runs} />}
    </div>
  );
}
