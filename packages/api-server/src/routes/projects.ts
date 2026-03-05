import { Router } from 'express';
import pool from '../db.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM projects ORDER BY created_at DESC'
    );
    res.json({ success: true, data: rows });
  } catch (err: unknown) {
    console.error('GET /projects error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch projects' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO projects (name, description) VALUES (?, ?)',
      [name, description ?? null]
    );
    res.json({ success: true, data: { id: result.insertId, name, description } });
  } catch (err: unknown) {
    console.error('POST /projects error:', err);
    res.status(500).json({ success: false, message: 'Failed to create project' });
  }
});

export default router;
