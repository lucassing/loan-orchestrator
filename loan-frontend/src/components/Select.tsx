type Option = { label: string; value: string | number };

export function Select({
  label,
  value,
  onChange,
  options,
  id,
}: {
  label: string;
  value: string | number | undefined;
  onChange: (val: string) => void;
  options: Option[];
  id?: string;
}) {
  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <select
        id={id}
        className="form-select"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">— select —</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
