const DATABASE_PATTERN =
  /PGRST|postgres|permission denied|row-level|violates|duplicate key|column |relation |JWT|syntax error|undefined column|failed to fetch/i;

export function publicErrorMessage(message?: string | null): string {
  void message;
  return "This information is unavailable right now. Try again in a moment.";
}

export function publicActionError(error?: string | null): string {
  if (!error) return "Something went wrong. Please try again.";
  if (DATABASE_PATTERN.test(error) || error.length > 140) {
    return "Something went wrong. Please try again.";
  }
  return error;
}
