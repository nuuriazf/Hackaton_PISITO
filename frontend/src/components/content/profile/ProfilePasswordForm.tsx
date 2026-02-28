import { FormEventHandler } from "react";
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
  return (
    <form className="grid gap-2.5" onSubmit={onSubmit}>
      <h3 className="text-sm font-bold text-ink-800">Cambiar contrasena</h3>
      <input
        type="password"
        minLength={8}
        maxLength={72}
        value={currentPasswordValue}
        disabled={submitting}
        className={inputClass}
        placeholder="Contraseña actual"
        onChange={(event) => onCurrentPasswordChange(event.target.value)}
      />
      <input
        type="password"
        minLength={8}
        maxLength={72}
        value={newPasswordValue}
        disabled={submitting}
        className={inputClass}
        placeholder="Nueva contraseña"
        onChange={(event) => onNewPasswordChange(event.target.value)}
      />
      <Button type="submit" variant="primary" disabled={submitting}>
        {submitting ? "Guardando..." : "Guardar contraseña"}
      </Button>
    </form>
  );
}
