import type { TerminalRule } from "@/types";

export function TerminalRuleEditor({
  rule,
  index,
  onChange,
  onRemove,
  onMove,
}: {
  rule: TerminalRule;
  index: number;
  onChange: (patch: Partial<TerminalRule>) => void;
  onRemove: () => void;
  onMove: (dir: "up" | "down") => void;
}) {
  return (
    <div className="border rounded p-3 mb-2" data-index={index}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <strong>Rule #{rule.order}</strong>
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
      <div className="mb-2">
        <label className="form-label">Condition</label>
        <input
          className="form-control"
          placeholder="e.g. dti_rule.outcome == 'FAIL'"
          value={rule.condition}
          onChange={(e) => onChange({ condition: e.target.value })}
        />
      </div>
      <div>
        <label className="form-label">Final Status</label>
        <select
          className="form-select w-auto"
          value={rule.final_status}
          onChange={(e) =>
            onChange({
              final_status: e.target.value as TerminalRule["final_status"],
            })
          }
        >
          <option value="APPROVED">APPROVED</option>
          <option value="REJECTED">REJECTED</option>
          <option value="NEEDS_REVIEW">NEEDS_REVIEW</option>
        </select>
      </div>
    </div>
  );
}