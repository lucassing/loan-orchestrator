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
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium">{label}</span>
      <select
        id={id}
        className="border rounded px-2 py-1"
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
    </label>
  );
}