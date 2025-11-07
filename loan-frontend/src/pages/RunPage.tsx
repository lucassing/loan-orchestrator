import { useEffect, useState } from "react";
import {
  listApplications,
  listPipelines,
  listRuns,
  runPipeline,
} from "@/api/api";
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
    <div className="p-4">
      <header className="mb-3">
        <h1 className="h4 fw-bold mb-1">Run Panel</h1>
        <p className="text-body-secondary small mb-0">
          Pick application + pipeline, execute, and view logs & final status.
        </p>
      </header>

      <section className="row g-3 mb-4">
        <div className="col-md-6">
          <Select
            label="Application"
            value={applicationId}
            onChange={setApplicationId}
            options={applications.map((a) => ({
              label: `${a.id} – ${a.applicant_name}`,
              value: a.id,
            }))}
          />
        </div>
        <div className="col-md-6">
          <Select
            label="Pipeline"
            value={pipelineId}
            onChange={setPipelineId}
            options={pipelines.map((p) => ({
              label: `${p.id} – ${p.name}`,
              value: p.id!,
            }))}
          />
        </div>
        <div className="col-12">
          <button
            className="btn btn-primary"
            disabled={!applicationId || !pipelineId || loading}
            onClick={onRun}
          >
            {loading ? "Running…" : "Run"}
          </button>
          {msg && <p className="small mt-2 mb-0">{msg}</p>}
        </div>
      </section>

      <section>
        <h2 className="h6 fw-semibold mb-2">Run History</h2>
        <RunsTable runs={runs} />
      </section>
    </div>
  );
}
