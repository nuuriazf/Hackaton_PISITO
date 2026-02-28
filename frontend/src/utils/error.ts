export function readErrorMessage(error: unknown, fallbackMessage = "Unexpected error"): string {
  if (error instanceof Error) {
    return error.message;
  }
  return fallbackMessage;
}
