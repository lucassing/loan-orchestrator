import { useEffect, useState } from "react";
import {
  listApplications,
  listPipelines,
  listRuns,
  runPipeline,
} from "@/lib/api";
import type { Application, Pipeline, PipelineRun } from "@/types";
import { Select } from "@/components/Select";
import { RunsTable } from "@/components/RunsTable";

export default function RunPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [applicationId, setApplicationId] = useState<string>("");
  const [pipelineId, setPipelineId] = useState<string>("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshRuns = async () => {
    const data = await listRuns();
    setRuns(data);
  };

  useEffect(() => {
    (async () => {
      const [apps, pipes] = await Promise.all([
        listApplications(),
        listPipelines(),
      ]);
      setApplications(apps);
      setPipelines(pipes);
      await refreshRuns();
    })();
  }, []);

  const onRun = async () => {
    if (!applicationId || !pipelineId) return;
    setLoading(true);
    setMsg(null);
    try {
      await runPipeline(Number(applicationId), Number(pipelineId));
      setMsg("Run requested. Fetching history…");
      await refreshRuns();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setMsg(e?.message || "Failed to run pipeline");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-bold">Run Panel</h1>
        <p className="text-sm text-gray-600">
          Pick application + pipeline, execute, and view logs & final status.
        </p>
      </header>

      <section
        className="grid gap-4"
        style={{ gridTemplateColumns: "1fr 1fr" }}
      >
        <Select
          label="Application"
          value={applicationId}
          onChange={setApplicationId}
          options={applications.map((a) => ({
            label: `${a.id} – ${a.applicant_name}`,
            value: a.id,
          }))}
        />
        <Select
          label="Pipeline"
          value={pipelineId}
          onChange={setPipelineId}
          options={pipelines.map((p) => ({
            label: `${p.id} – ${p.name}`,
            value: p.id!,
          }))}
        />
        <div>
          <button
            className="px-4 py-2 border rounded"
            disabled={!applicationId || !pipelineId || loading}
            onClick={onRun}
          >
            {loading ? "Running…" : "Run"}
          </button>
          {msg && <p className="text-sm mt-2">{msg}</p>}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Run History</h2>
        <RunsTable runs={runs} />
      </section>
    </div>
  );
}
