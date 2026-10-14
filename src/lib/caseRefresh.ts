export function shouldRefreshCaseView(previous: string | null, latest: string, hasUnsavedInput: boolean) {
  return previous !== null && previous !== latest && !hasUnsavedInput;
}
