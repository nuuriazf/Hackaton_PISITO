import { FormEventHandler } from "react";
import { useI18n } from "../../../i18n/I18nProvider";
import { Button } from "../../ui/Button";
import { inputClass } from "../../ui/styles";

type ProfilePasswordFormProps = {
  currentPasswordValue: string;
  newPasswordValue: string;
  submitting: boolean;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function ProfilePasswordForm({
  currentPasswordValue,
  newPasswordValue,
  submitting,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onSubmit
}: ProfilePasswordFormProps) {
  const { t } = useI18n();

  return (
    <form className="grid gap-2.5" onSubmit={onSubmit}>
      <input
        type="password"
        minLength={8}
        maxLength={72}
        value={currentPasswordValue}
        disabled={submitting}
        className={inputClass}
        placeholder={t("profile.currentPasswordPlaceholder")}
        onChange={(event) => onCurrentPasswordChange(event.target.value)}
      />
      <input
        type="password"
        minLength={8}
        maxLength={72}
        value={newPasswordValue}
        disabled={submitting}
        className={inputClass}
        placeholder={t("profile.newPasswordPlaceholder")}
        onChange={(event) => onNewPasswordChange(event.target.value)}
      />
      <Button
        type="submit"
        variant="primary"
        className="profile-save-btn !text-[#F2F2F2] [--btn-text-hover:#F2F2F2]"
        disabled={submitting}
      >
        {submitting ? t("common.saving") : t("profile.savePassword")}
      </Button>
    </form>
  );
}
