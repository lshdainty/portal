import { Router } from 'express';
import pool from '../db.js';
import type { RowDataPacket } from 'mysql2/promise';

const router = Router();

router.get('/', async (req, res) => {
  const projectId = Number(req.query.project_id) || 1;
  const limit = Number(req.query.limit) || 50;
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT al.*, a.name AS agent_name, t.title AS task_title
     FROM activity_logs al
     LEFT JOIN agents a ON al.agent_id = a.id
     LEFT JOIN tasks t ON al.task_id = t.id
     WHERE al.project_id = ?
     ORDER BY al.created_at DESC
     LIMIT ?`,
    [projectId, limit]
  );
  res.json({ success: true, data: rows });
});

export default router;
