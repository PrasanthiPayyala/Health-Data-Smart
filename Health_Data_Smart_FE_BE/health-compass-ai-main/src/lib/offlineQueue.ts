// Offline submission queue — stores field signals in localStorage when offline,
// auto-syncs to backend when connection returns.

const QUEUE_KEY = "ap_health_iq_offline_queue";

export type QueuedSubmission = {
  id: string;
  endpoint: string;
  payload: Record<string, unknown>;
  timestamp: string;
};

export function readQueue(): QueuedSubmission[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch { return []; }
}

export function enqueue(endpoint: string, payload: Record<string, unknown>) {
  const queue = readQueue();
  queue.push({
    id: crypto.randomUUID(),
    endpoint,
    payload,
    timestamp: new Date().toISOString(),
  });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function clearQueue() {
  localStorage.removeItem(QUEUE_KEY);
}

export async function flushQueue(apiBase: string): Promise<{ sent: number; failed: number }> {
  const queue = readQueue();
  if (queue.length === 0) return { sent: 0, failed: 0 };
  let sent = 0, failed = 0;
  const remaining: QueuedSubmission[] = [];
  for (const item of queue) {
    try {
      const res = await fetch(`${apiBase}${item.endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.payload),
      });
      if (res.ok) sent++;
      else { failed++; remaining.push(item); }
    } catch {
      failed++;
      remaining.push(item);
    }
  }
  localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  return { sent, failed };
}

export function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}
