import { Router } from 'express';
import pool from '../db.js';
import type { RowDataPacket } from 'mysql2/promise';

const router = Router();

router.get('/', async (req, res) => {
  const projectId = Number(req.query.project_id) || 1;
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM agents WHERE project_id = ? ORDER BY created_at DESC',
    [projectId]
  );
  res.json({ success: true, data: rows });
});

export default router;
