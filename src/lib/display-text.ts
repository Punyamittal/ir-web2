/** Strip the PLACEHOLDER: prefix for on-screen display (keep it in data files). */
export function displayText(value: string): string {
  return value.replace(/^PLACEHOLDER:\s*/i, "").trim();
}
