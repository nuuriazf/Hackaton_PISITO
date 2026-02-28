import { FormEvent } from "react";
import { formStackClass, inputClass, primaryButtonClass } from "../ui/styles";

type EntryCreateFormProps = {
  value: string;
  submitting: boolean;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function EntryCreateForm({ value, submitting, onChange, onSubmit }: EntryCreateFormProps) {
  return (
    <form className={formStackClass} onSubmit={onSubmit}>
      <input
        type="text"
        placeholder="Nueva Entry (ej: Ideas de producto)"
        className={inputClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <button type="submit" className={primaryButtonClass} disabled={submitting}>
        Crear Entry
      </button>
    </form>
  );
}
