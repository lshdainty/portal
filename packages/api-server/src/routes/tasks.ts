import { Router } from 'express';
import pool from '../db.js';
import { broadcastEvent } from '../websocket.js';
import type { RowDataPacket } from 'mysql2/promise';

const router = Router();

router.get('/', async (req, res) => {
  const projectId = Number(req.query.project_id) || 1;
  const status = req.query.status as string | undefined;
  let query = `
    SELECT t.*, a.name AS assignee_name, c.name AS created_by_name
    FROM tasks t
    LEFT JOIN agents a ON t.assignee_id = a.id
    LEFT JOIN agents c ON t.created_by_id = c.id
    WHERE t.project_id = ?
  `;
  const params: (string | number)[] = [projectId];
  if (status) { query += ' AND t.status = ?'; params.push(status); }
  query += ' ORDER BY t.sort_order ASC';

  const [rows] = await pool.execute<RowDataPacket[]>(query, params);
  res.json({ success: true, data: rows });
});

router.patch('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { status, sort_order } = req.body as { status?: string; sort_order?: number };
  const setClauses: string[] = [];
  const params: (string | number)[] = [];

  if (status) { setClauses.push('status = ?'); params.push(status); }
  if (sort_order !== undefined) { setClauses.push('sort_order = ?'); params.push(sort_order); }

  if (setClauses.length === 0) {
    res.status(400).json({ success: false, message: 'No fields to update' });
    return;
  }

  setClauses.push('updated_at = NOW()');
  params.push(id);

  await pool.execute(`UPDATE tasks SET ${setClauses.join(', ')} WHERE id = ?`, params);

  const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM tasks WHERE id = ?', [id]);
  const task = rows[0];

  if (task) {
    broadcastEvent({
      event: 'task:updated',
      project_id: task.project_id as number,
      data: task as Record<string, unknown>,
    });
  }

  res.json({ success: true, data: task });
});

export default router;
