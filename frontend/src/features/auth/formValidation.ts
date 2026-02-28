export function validateUsername(username: string): string | null {
  const normalized = username.trim();
  if (!normalized) {
    return "El nombre de usuario es obligatorio";
  }
  if (normalized.length < 3 || normalized.length > 40) {
    return "El nombre de usuario debe tener entre 3 y 40 caracteres";
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) {
    return "La contraseña es obligatoria";
  }
  if (password.length < 8 || password.length > 72) {
    return "La contraseña debe tener entre 8 y 72 caracteres";
  }
  return null;
}
