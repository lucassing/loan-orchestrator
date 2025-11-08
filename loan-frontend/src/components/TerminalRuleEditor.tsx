// src/components/TerminalRuleEditor.tsx
import { useFormContext } from "react-hook-form";
import type { PipelineFormValues } from "@/types";

export function TerminalRuleEditor({
  index,
  onRemove,
  onMove,
}: {
  index: number;
  onRemove: () => void;
  onMove: (dir: "up" | "down") => void;
}) {
  const { register, formState } = useFormContext<PipelineFormValues>();
  const order = index + 1;

  const fieldErr = formState.errors.terminal_rules?.[index];
  const conditionError = fieldErr?.condition?.message as string | undefined;

  const examples = [
    "dti_rule.outcome == 'FAIL' or amount_policy.outcome == 'FAIL'",
    "sentiment_check.outcome == 'RISKY'",
    "risk_scoring.outcome == 'PASS'",
  ];

  return (
    <div className="border rounded p-3 mb-2" data-index={index}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <strong>Rule #{order}</strong>
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

      <input
        type="hidden"
        {...register(`terminal_rules.${index}.order` as const)}
        value={order}
      />

      <div className="mb-2">
        <label className="form-label">Condition</label>
        <input
          className={`form-control ${conditionError ? "is-invalid" : ""}`}
          placeholder="e.g. dti_rule.outcome == 'FAIL'"
          {...register(`terminal_rules.${index}.condition` as const)}
        />
        {conditionError && (
          <div className="invalid-feedback">{conditionError}</div>
        )}

        <div className="form-text mt-1">
          <span>Examples:</span>
          <ul className="mb-0">
            {examples.map((ex, i) => (
              <li key={i}>
                <code>{ex}</code>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <label className="form-label">Final Status</label>
        <select
          className="form-select w-auto"
          {...register(`terminal_rules.${index}.final_status` as const)}
        >
          <option value="APPROVED">APPROVED</option>
          <option value="REJECTED">REJECTED</option>
          <option value="NEEDS_REVIEW">NEEDS_REVIEW</option>
        </select>
      </div>
    </div>
  );
}
