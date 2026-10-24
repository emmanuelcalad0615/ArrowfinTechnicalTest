interface SelectFieldProps<T extends string> {
  readonly id: string
  readonly label: string
  readonly value: T
  readonly options: readonly T[]
  readonly onChange: (value: T) => void
}

export function SelectField<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
}: SelectFieldProps<T>) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        onChange={(event) => {
          const selected = options.find(
            (option) => option === event.target.value,
          )
          if (selected !== undefined) onChange(selected)
        }}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}
