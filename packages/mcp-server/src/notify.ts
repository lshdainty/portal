import type { NotifyPayload } from '@agent-kanban/shared';

const NOTIFY_URL = process.env.API_NOTIFY_URL || 'http://localhost:3001/api/notify';

export async function notifyApiServer(payload: NotifyPayload): Promise<void> {
  try {
    const response = await fetch(NOTIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      console.error(`Notify failed: ${response.status} ${response.statusText}`);
    }
  } catch {
    // Fire-and-forget: DB write already succeeded
    console.error('Failed to notify API server');
  }
}
