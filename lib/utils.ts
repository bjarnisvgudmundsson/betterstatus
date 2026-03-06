import type { Client, StatusItem, Workstream } from "./types";

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export const fmtDT = (iso: string) => {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) +
    " · " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  );
};

export const fmtHours = (h: number): string | null => {
  if (!h) return null;
  return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;
};

export const initials = (name: string) =>
  name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

export function countByState(items: StatusItem[]) {
  const c = { on_track: 0, at_risk: 0, blocked: 0, not_started: 0, done: 0 };
  const walk = (list: StatusItem[]) =>
    list.forEach((i) => {
      c[i.state]++;
      if (i.children?.length) walk(i.children);
    });
  walk(items);
  return c;
}

export function lastActivity(item: StatusItem): Date {
  const times = [new Date(item.updatedAt)];
  item.comments?.forEach((c) => {
    times.push(new Date(c.timestamp));
    c.replies?.forEach((r) => times.push(new Date(r.timestamp)));
  });
  return new Date(Math.max(...times.map((t) => t.getTime())));
}

export function isUnread(item: StatusItem): boolean {
  if (!item.seenAt) return false;
  return lastActivity(item) > new Date(item.seenAt);
}

export function totalComments(item: StatusItem): number {
  return (item.comments || []).reduce(
    (n, c) => n + 1 + (c.replies?.length || 0),
    0
  );
}

export function flatItems(workstreams: Workstream[]): StatusItem[] {
  return workstreams.flatMap((ws) => ws.items);
}
