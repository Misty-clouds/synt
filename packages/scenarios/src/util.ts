/** Helpers for generating realistic seed events with coherent timestamps. */

/** Fixed demo anchor so seeded data + ground truth are deterministic. */
export const DEMO_NOW = new Date('2026-06-15T14:00:00.000Z');

/** ISO timestamp `minutesAgo` before the demo anchor. */
export function minutesAgo(minutes: number, anchor: Date = DEMO_NOW): string {
  return new Date(anchor.getTime() - minutes * 60_000).toISOString();
}

export function secondsAgo(seconds: number, anchor: Date = DEMO_NOW): string {
  return new Date(anchor.getTime() - seconds * 1000).toISOString();
}

let counter = 0;
export function uid(prefix = 'ev'): string {
  counter += 1;
  return `${prefix}_${counter.toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}
