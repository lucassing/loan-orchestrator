import React, { useEffect, useState } from "react";
import type { Pipeline } from "@/types";
import { createPipeline, listPipelines } from "@/api/api";
import { PipelineForm } from "@/components/PipelineForm";

export default function PipelinesPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await listPipelines();
      setPipelines(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const onSubmit = async (payload: Pipeline) => {
    setMsg(null);
    await createPipeline(payload);
    setMsg("Pipeline saved.");
    await refresh();
  };

  return (
    <div className="p-4 space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-bold">Pipeline Builder</h1>
        <p className="text-sm text-gray-600">
          Add/remove/reorder steps, edit params, configure terminal rules.
        </p>
      </header>

      <section>
        <PipelineForm onSubmit={onSubmit} />
        {msg && <p className="text-green-700 mt-2">{msg}</p>}
      </section>

    </div>
  );
}
