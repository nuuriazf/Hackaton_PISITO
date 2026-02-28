export function readErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Se produjo un error inesperado.";
}
