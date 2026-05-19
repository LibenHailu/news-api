
export function toGmtDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}


export function getGmtDayRange(dateKey: string): { start: Date; end: Date } {
  return {
    start: new Date(`${dateKey}T00:00:00.000Z`),
    end: new Date(`${dateKey}T23:59:59.999Z`),
  };
}

export function getYesterdayGmtDateKey(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return toGmtDateKey(d);
}
