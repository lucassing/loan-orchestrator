import type { PipelineStep } from "@/types";

// Single-step editor (no add button; add lives in PipelineForm)
export function StepEditor({
  step,
  index,
  onChange,
  onRemove,
  onMove,
}: {
  step: PipelineStep;
  index: number;
  onChange: (patch: Partial<PipelineStep>) => void;
  onRemove: () => void;
  onMove: (dir: "up" | "down") => void;
}) {
  const update = (patch: Partial<PipelineStep>) => onChange(patch);
  const paramsText =
    typeof step.params === "string"
      ? step.params
      : JSON.stringify(step.params ?? {}, null, 2);

  return (
    <div className="border rounded p-3 mb-2" data-index={index}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="d-flex align-items-center gap-2">
          <strong>Step #{step.order}</strong>
          <select
            className="form-select form-select-sm w-auto"
            value={step.step_type}
            onChange={(e) => update({ step_type: e.target.value })}
          >
            <option value="dti_rule">dti_rule</option>
            <option value="amount_policy">amount_policy</option>
            <option value="risk_scoring">risk_scoring</option>
            <option value="sentiment_check">sentiment_check</option>
          </select>
        </div>
        <div className="btn-group btn-group-sm">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => onMove("up")}
          >
            ↑
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => onMove("down")}
          >
            ↓
          </button>
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={onRemove}
          >
            Remove
          </button>
        </div>
      </div>

      <div>
        <label className="form-label">Params (JSON)</label>
        <textarea
          className="form-control font-monospace"
          rows={4}
          value={paramsText}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value || "{}");
              update({ params: parsed });
            } catch {
              // keep raw string while the JSON is invalid; normalized on submit
              update({ params: e.target.value });
            }
          }}
        />
        <div className="form-text">
          Examples: dti_rule → {'{"max_dti_threshold":"0.40"}'} · amount_policy
          → {'{"DE":"35000","OTHER":"25000"}'}
        </div>
      </div>
    </div>
  );
}
