/* eslint-disable @typescript-eslint/no-explicit-any */
import { useFormContext, Controller, useWatch } from "react-hook-form";
import type { PipelineFormValues } from "@/types";

const EXAMPLES: Record<string, string> = {
  dti_rule: '{ "max_dti_threshold": 0.4 }',
  amount_policy:
    '{"cap_for_country": { "ES": 30000, "FR": 25000, "DE": 35000, "OTHER": 20000 }}',
  risk_scoring: '{ "approve_threshold": 45 }',
  sentiment_check: '{ "risky_keywords": ["gambling", "crypto", "casino"] }',
};

export function StepEditor({
  index,
  onRemove,
  onMove,
}: {
  index: number;
  onRemove: () => void;
  onMove: (dir: "up" | "down") => void;
}) {
  const { control, register, setValue, formState } =
    useFormContext<PipelineFormValues>();
  const step = useWatch({ control, name: `steps.${index}` as const });
  const example = EXAMPLES[step?.step_type ?? ""] ?? "{}";
  const order = index + 1;

  const fieldErr = formState.errors.steps?.[index];
  const paramsError = fieldErr?.params_text?.message as string | undefined;

  return (
    <div className="border rounded p-3 mb-2" data-index={index}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="d-flex align-items-center gap-2">
          <strong>Step #{order}</strong>
          <select
            className="form-select form-select-sm w-auto"
            {...register(`steps.${index}.step_type` as const)}
            onChange={(e) =>
              setValue(`steps.${index}.step_type`, e.target.value as any, {
                shouldDirty: true,
              })
            }
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

      <input
        type="hidden"
        {...register(`steps.${index}.order` as const)}
        value={order}
      />

      <div>
        <label className="form-label">Params (JSON)</label>
        <Controller
          control={control}
          name={`steps.${index}.params_text` as const}
          render={({ field }) => (
            <textarea
              className={`form-control font-monospace ${
                paramsError ? "is-invalid" : ""
              }`}
              rows={4}
              {...field}
            />
          )}
        />
        {paramsError && <div className="invalid-feedback">{paramsError}</div>}
        <div className="form-text">
          Example for <code>{step?.step_type}</code> → <code>{example}</code>
        </div>
      </div>
    </div>
  );
}
