export function isUnauthorizedError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = String((error as { message?: unknown }).message ?? '');
    return /^401: .*Unauthorized/.test(msg);
  }
  return false;
}