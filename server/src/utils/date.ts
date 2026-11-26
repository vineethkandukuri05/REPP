// Calendar dates (YYYY-MM-DD) in the server's local time zone. The server runs on the
// user's machine, so "today" rolls over at the user's midnight rather than at UTC midnight.
export function localDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function previousLocalDateString(date: Date = new Date()): string {
  const prev = new Date(date);
  prev.setDate(prev.getDate() - 1);
  return localDateString(prev);
}
