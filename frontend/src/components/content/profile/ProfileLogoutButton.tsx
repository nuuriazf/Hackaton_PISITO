import { dangerButtonClass } from "../../ui/styles";

type ProfileLogoutButtonProps = {
  onLogout: () => void;
};

export function ProfileLogoutButton({ onLogout }: ProfileLogoutButtonProps) {
  return (
    <button type="button" className={`${dangerButtonClass} mt-2 w-full`} onClick={onLogout}>
      Cerrar sesion
    </button>
  );
}
