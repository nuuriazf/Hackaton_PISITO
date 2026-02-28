import { FormEventHandler } from "react";
import { useI18n } from "../../../i18n/I18nProvider";
import { Button } from "../../ui/Button";
import { inputClass } from "../../ui/styles";

type ProfileUsernameFormProps = {
  usernameValue: string;
  currentPasswordValue: string;
  submitting: boolean;
  onUsernameChange: (value: string) => void;
  onCurrentPasswordChange: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function ProfileUsernameForm({
  usernameValue,
  currentPasswordValue,
  submitting,
  onUsernameChange,
  onCurrentPasswordChange,
  onSubmit
}: ProfileUsernameFormProps) {
  const { t } = useI18n();

  return (
    <form className="grid gap-2.5" onSubmit={onSubmit}>
      <input
        type="text"
        minLength={3}
        maxLength={40}
        value={usernameValue}
        disabled={submitting}
        className={inputClass}
        placeholder={t("profile.usernamePlaceholder")}
        onChange={(event) => onUsernameChange(event.target.value)}
      />
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
      <Button
        type="submit"
        variant="primary"
        className="profile-save-btn !text-[#F2F2F2] [--btn-text-hover:#F2F2F2]"
        disabled={submitting}
      >
        {submitting ? t("common.saving") : t("profile.saveUsername")}
      </Button>
    </form>
  );
}
