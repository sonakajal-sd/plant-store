// 5 → "LC-0005"
export function formatOrderId(id: number): string {
  return "LC-" + String(id).padStart(4, "0");
}

// "2026-11-26T10:30:00.000Z" → "26 Nov 2026"
export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
