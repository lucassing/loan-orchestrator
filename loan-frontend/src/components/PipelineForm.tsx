/* eslint-disable @typescript-eslint/no-explicit-any */
import { FormProvider } from "react-hook-form";
import { useState } from "react";
import { StepEditor } from "@/components/StepEditor";
import { TerminalRuleEditor } from "@/components/TerminalRuleEditor";
import { usePipelineForm } from "@/hooks/usePipelineForm";

export function PipelineForm() {
  const [selectedId, setSelectedId] = useState<string>("");
  const {
    methods,
    onSubmit,
    pipelines,
    loadPipeline,
    newPipeline,
    stepsFA,
    rulesFA,
    msg,
  } = usePipelineForm(selectedId, setSelectedId);

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center mb-3 gap-3">
        <select
          className="form-select w-auto"
          value={selectedId}
          onChange={(e) => {
            const id = e.target.value;
            setSelectedId(id);
            if (id) void loadPipeline(id);
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

      <FormProvider {...methods}>
        <form className="border p-4 rounded" onSubmit={onSubmit}>
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Name</label>
              <input
                className={`form-control ${
                  methods.formState.errors.name ? "is-invalid" : ""
                }`}
                placeholder="e.g. My pipeline"
                {...methods.register("name")}
              />
              {methods.formState.errors.name && (
                <div className="invalid-feedback">
                  {(methods.formState.errors.name as any).message ??
                    "Invalid value"}
                </div>
              )}
            </div>
            <div className="col-md-6 d-flex align-items-center gap-2">
              <input type="checkbox" {...methods.register("is_active")} />
              <label className="form-check-label">Active</label>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Description</label>
            <input
              className={`form-control ${
                methods.formState.errors.description ? "is-invalid" : ""
              }`}
              {...methods.register("description")}
            />
            {methods.formState.errors.description && (
              <div className="invalid-feedback">
                {(methods.formState.errors.description as any).message ??
                  "Invalid value"}
              </div>
            )}
          </div>

          <section className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5>Steps</h5>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() =>
                  stepsFA.append({
                    order: stepsFA.fields.length + 1,
                    step_type: "dti_rule",
                    params_text: "{}",
                  })
                }
              >
                + Add Step
              </button>
            </div>

            <div className="d-flex flex-column gap-3">
              {stepsFA.fields.map((f, idx) => (
                <StepEditor
                  key={f.id}
                  index={idx}
                  onRemove={() => stepsFA.remove(idx)}
                  onMove={(dir) => {
                    const to = dir === "up" ? idx - 1 : idx + 1;
                    if (to < 0 || to >= stepsFA.fields.length) return;
                    stepsFA.swap(idx, to);
                  }}
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
                onClick={() =>
                  rulesFA.append({
                    order: rulesFA.fields.length + 1,
                    condition: "",
                    final_status: "NEEDS_REVIEW",
                  })
                }
              >
                + Add Rule
              </button>
            </div>

            <div className="d-flex flex-column">
              {rulesFA.fields.map((f, idx) => (
                <TerminalRuleEditor
                  key={f.id}
                  index={idx}
                  onRemove={() => rulesFA.remove(idx)}
                  onMove={(dir) => {
                    const to = dir === "up" ? idx - 1 : idx + 1;
                    if (to < 0 || to >= rulesFA.fields.length) return;
                    rulesFA.swap(idx, to);
                  }}
                />
              ))}
            </div>
          </section>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={methods.formState.isSubmitting}
          >
            {methods.formState.isSubmitting ? "Saving..." : "Save"}
          </button>
          {msg && (
            <p
              className={`mt-2 ${
                msg === "Error" ? "text-danger" : "text-success"
              }`}
            >
              {msg}
            </p>
          )}
        </form>
      </FormProvider>
    </div>
  );
}
