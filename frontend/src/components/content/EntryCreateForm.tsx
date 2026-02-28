import { FormEvent } from "react";
import { useI18n } from "../../i18n/I18nProvider";
import { formStackClass, inputClass, primaryButtonClass } from "../ui/styles";

type EntryCreateFormProps = {
  value: string;
  submitting: boolean;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function EntryCreateForm({ value, submitting, onChange, onSubmit }: EntryCreateFormProps) {
  const { t } = useI18n();

  return (
    <form className={formStackClass} onSubmit={onSubmit}>
      <input
        type="text"
        placeholder={t("entryCreate.placeholder")}
        className={inputClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <button type="submit" className={primaryButtonClass} disabled={submitting}>
        {t("entryCreate.submit")}
      </button>
    </form>
  );
}
