import { Router } from 'express';
import { broadcastEvent } from '../websocket.js';
import type { NotifyPayload } from '@agent-kanban/shared';

const router = Router();

router.post('/', (req, res) => {
  const payload = req.body as NotifyPayload;

  if (!payload.event || !payload.project_id) {
    res.status(400).json({ success: false, message: 'Missing event or project_id' });
    return;
  }

  broadcastEvent(payload);
  res.json({ success: true });
});

export default router;
