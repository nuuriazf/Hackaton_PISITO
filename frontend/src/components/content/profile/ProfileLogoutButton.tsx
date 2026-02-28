import { Button } from "../../ui/Button";

type ProfileLogoutButtonProps = {
  onLogout: () => void;
};

export function ProfileLogoutButton({ onLogout }: ProfileLogoutButtonProps) {
  return (
    <Button type="button" variant="danger" className="mt-2" onClick={onLogout}>
      Cerrar sesión
    </Button>
  );
}
