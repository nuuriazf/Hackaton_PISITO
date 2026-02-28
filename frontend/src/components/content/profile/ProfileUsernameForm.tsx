import { FormEventHandler } from "react";
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
  return (
    <form className="grid gap-2.5" onSubmit={onSubmit}>
      <h3 className="text-sm font-bold text-ink-800">Cambiar nombre de usuario</h3>
      <input
        type="text"
        minLength={3}
        maxLength={40}
        value={usernameValue}
        disabled={submitting}
        className={inputClass}
        placeholder="Nuevo nombre de usuario"
        onChange={(event) => onUsernameChange(event.target.value)}
      />
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
      <Button type="submit" variant="primary" disabled={submitting}>
        {submitting ? "Guardando..." : "Guardar usuario"}
      </Button>
    </form>
  );
}
