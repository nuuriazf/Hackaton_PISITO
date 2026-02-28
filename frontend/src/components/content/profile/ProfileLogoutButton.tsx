import { useI18n } from "../../../i18n/I18nProvider";
import { Button } from "../../ui/Button";

type ProfileLogoutButtonProps = {
  onLogout: () => void;
};

export function ProfileLogoutButton({ onLogout }: ProfileLogoutButtonProps) {
  const { t } = useI18n();

  return (
    <Button type="button" variant="danger" className="mt-2" onClick={onLogout}>
      {t("profile.logout")}
    </Button>
  );
}
