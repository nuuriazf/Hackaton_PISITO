import { FormEvent, useEffect, useRef } from "react";
import { useI18n } from "../../../i18n/I18nProvider";
import { Button } from "../../ui/Button";
import { errorTextClass, fieldLabelClass, inputClass } from "../../ui/styles";

type CreateFolderModalProps = {
  open: boolean;
  value: string;
  submitting: boolean;
  error: string | null;
  onChange: (value: string) => void;
  onSubmit: () => void | Promise<void>;
  onClose: () => void;
};

export function CreateFolderModal({
  open,
  value,
  submitting,
  error,
  onChange,
  onSubmit,
  onClose
}: CreateFolderModalProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    inputRef.current?.focus();
  }, [open]);

  if (!open) {
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onSubmit();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/25 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t("storage.createFolderModalTitle")}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section className="w-full max-w-[420px] glass-card p-4 shadow-card md:p-5">
        <h3 className="heading-title text-ink-900">
          {t("storage.createFolderModalTitle")}
        </h3>

        <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
          <label className={fieldLabelClass}>
            <span>{t("storage.createFolderNameLabel")}</span>
            <input
              ref={inputRef}
              type="text"
              value={value}
              disabled={submitting}
              maxLength={120}
              placeholder={t("storage.createFolderNamePlaceholder")}
              className={inputClass}
              onChange={(event) => onChange(event.target.value)}
            />
          </label>

          {error ? <p className={errorTextClass}>{error}</p> : null}

          <div className="mt-1 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              fullWidth={false}
              disabled={submitting}
              onClick={onClose}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" variant="primary" fullWidth={false} disabled={submitting}>
              {submitting ? t("common.saving") : t("storage.createFolderConfirm")}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
