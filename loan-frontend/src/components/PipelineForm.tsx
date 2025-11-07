import React, { useEffect, useState } from "react";
import type { Pipeline, PipelineStep, TerminalRule } from "@/types";
import { StepEditor } from "@/components/StepEditor";
import {
  listPipelines,
  createPipeline,
  getPipeline,
  updatePipeline,
} from "@/api/api";
import { TerminalRuleEditor } from "./TerminalRuleEditor";


export function PipelineForm() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [pipeline, setPipeline] = useState<Pipeline>({
    name: "",
    is_active: true,
    description: "",
    steps: [],
    terminal_rules: [],
  });
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setPipelines(await listPipelines());
    })();
  }, []);

  async function loadPipeline(id: string) {
    if (!id) return;
    const p = await getPipeline(Number(id));
    setPipeline(p);
  }

  function newPipeline() {
    setSelectedId("");
    setPipeline({
      name: "",
      is_active: true,
      description: "",
      steps: [],
      terminal_rules: [],
    });
  }

  function updateField<K extends keyof Pipeline>(key: K, value: Pipeline[K]) {
    setPipeline((prev) => ({ ...prev, [key]: value }));
  }

  // Steps
  function addStep() {
    const nextOrder = (pipeline.steps.at(-1)?.order ?? 0) + 1;
    updateField("steps", [
      ...pipeline.steps,
      { order: nextOrder, step_type: "dti_rule", params: {} },
    ]);
  }
  function changeStep(idx: number, patch:any) {
    const arr = [...pipeline.steps]
    console.log(patch)
    arr[idx] = { ...arr[idx], ...patch };
    updateField("steps", arr);
  }
  function removeStep(idx: number) {
    const arr = [...pipeline.steps];
    arr.splice(idx, 1);
    updateField(
      "steps",
      arr.map((s, i) => ({ ...s, order: i + 1 }))
    );
  }
  function moveStep(idx: number, dir: "up" | "down") {
    const arr = [...pipeline.steps].sort((a, b) => a.order - b.order);
    const newIdx = dir === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= arr.length) return;
    const tmp = arr[idx].order;
    arr[idx].order = arr[newIdx].order;
    arr[newIdx].order = tmp;
    updateField("steps", arr);
  }

  // Terminal rules
  function addRule() {
    const nextOrder = (pipeline.terminal_rules.at(-1)?.order ?? 0) + 1;
    updateField("terminal_rules", [
      ...pipeline.terminal_rules,
      { order: nextOrder, condition: "", final_status: "NEEDS_REVIEW" },
    ]);
  }
  function changeRule(idx: number, patch: Partial<TerminalRule>) {
    const arr = [...pipeline.terminal_rules];
    arr[idx] = { ...arr[idx], ...patch };
    updateField("terminal_rules", arr);
  }
  function removeRule(idx: number) {
    const arr = [...pipeline.terminal_rules];
    arr.splice(idx, 1);
    updateField(
      "terminal_rules",
      arr.map((r, i) => ({ ...r, order: i + 1 }))
    );
  }
  function moveRule(idx: number, dir: "up" | "down") {
    const arr = [...pipeline.terminal_rules].sort((a, b) => a.order - b.order);
    const newIdx = dir === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= arr.length) return;
    // swap orders
    const temp = arr[idx].order;
    arr[idx].order = arr[newIdx].order;
    arr[newIdx].order = temp;
    updateField("terminal_rules", arr);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedId) {
      await updatePipeline(Number(selectedId), {
        ...pipeline,
        terminal_rules: [...pipeline.terminal_rules].sort(
          (a, b) => a.order - b.order
        ),
      });
      setMsg("Pipeline updated.");
    } else {
      await createPipeline({
        ...pipeline,
        terminal_rules: [...pipeline.terminal_rules].sort(
          (a, b) => a.order - b.order
        ),
      });
      setMsg("Pipeline created.");
    }
    setPipelines(await listPipelines());
  }

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center mb-3 gap-3">
        <select
          className="form-select w-auto"
          value={selectedId}
          onChange={(e) => {
            setSelectedId(e.target.value);
            if (e.target.value) void loadPipeline(e.target.value);
          }}
        >
          <option value="">Select pipeline...</option>
          {pipelines.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={newPipeline}
        >
          New
        </button>
      </div>

      <form className="border p-4 rounded" onSubmit={submit}>
        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label">Name</label>
            <input
              className="form-control"
              value={pipeline.name}
              onChange={(e) => updateField("name", e.target.value)}
            />
          </div>
          <div className="col-md-6 d-flex align-items-center gap-2">
            <input
              type="checkbox"
              checked={pipeline.is_active}
              onChange={(e) => updateField("is_active", e.target.checked)}
            />
            <label className="form-check-label">Active</label>
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Description</label>
          <input
            className="form-control"
            value={pipeline.description ?? ""}
            onChange={(e) => updateField("description", e.target.value)}
          />
        </div>

        <section className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5>Steps</h5>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={addStep}
            >
              + Add Step
            </button>
          </div>
          <div className="d-flex flex-column gap-3">
            {[...pipeline.steps]
              .sort((a, b) => a.order - b.order)
              .map((s, idx) => (
                <StepEditor
                  key={idx}
                  step={s}
                  index={idx}
                  onChange={(patch) => changeStep(idx, patch)}
                  onRemove={() => removeStep(idx)}
                  onMove={(dir) => moveStep(idx, dir)}
                />
              ))}
          </div>
        </section>

        <section className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5>Terminal Rules</h5>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={addRule}
            >
              + Add Rule
            </button>
          </div>
          <div className="d-flex flex-column">
            {[...pipeline.terminal_rules]
              .sort((a, b) => a.order - b.order)
              .map((r, idx) => (
                <TerminalRuleEditor
                  key={idx}
                  rule={r}
                  index={idx}
                  onChange={(patch) => changeRule(idx, patch)}
                  onRemove={() => removeRule(idx)}
                  onMove={(dir) => moveRule(idx, dir)}
                />
              ))}
          </div>
        </section>

        <button type="submit" className="btn btn-primary">
          Save
        </button>
        {msg && <p className="text-success mt-2">{msg}</p>}
      </form>
    </div>
  );
}
