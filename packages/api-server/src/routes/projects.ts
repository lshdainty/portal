import { Router } from 'express';
import pool from '../db.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

const router = Router();

router.get('/', async (_req, res) => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM projects ORDER BY created_at DESC'
  );
  res.json({ success: true, data: rows });
});

router.post('/', async (req, res) => {
  const { name, description } = req.body;
  const [result] = await pool.execute<ResultSetHeader>(
    'INSERT INTO projects (name, description) VALUES (?, ?)',
    [name, description ?? null]
  );
  res.json({ success: true, data: { id: result.insertId, name, description } });
});

export default router;
