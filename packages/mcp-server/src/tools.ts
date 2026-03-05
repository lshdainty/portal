import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getPool } from './db.js';
import { notifyApiServer } from './notify.js';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

export function registerTools(server: McpServer): void {
  const pool = getPool();

  // ===== register_agent =====
  server.tool(
    'register_agent',
    'Register this agent with the kanban system. Returns agent_id.',
    {
      project_id: z.number().default(1),
      name: z.string().describe('Agent display name'),
      role: z.string().default('developer').describe('Agent role'),
    },
    async ({ project_id, name, role }) => {
      const [result] = await pool.execute<ResultSetHeader>(
        'INSERT INTO agents (project_id, name, role, status) VALUES (?, ?, ?, ?)',
        [project_id, name, role, 'idle']
      );
      const agentId = result.insertId;

      await notifyApiServer({
        event: 'agent:registered',
        project_id,
        data: { id: agentId, name, role, status: 'idle' },
      });

      return {
        content: [{ type: 'text', text: JSON.stringify({ agent_id: agentId, name, role }) }],
      };
    }
  );

  // ===== create_task =====
  server.tool(
    'create_task',
    'Create a new task on the kanban board.',
    {
      project_id: z.number().default(1),
      title: z.string(),
      description: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
      agent_id: z.number().optional().describe('ID of the agent creating this task'),
    },
    async ({ project_id, title, description, priority, agent_id }) => {
      const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM tasks WHERE project_id = ? AND status = ?',
        [project_id, 'todo']
      );
      const sortOrder = (rows[0]?.next_order as number) ?? 1;

      const [result] = await pool.execute<ResultSetHeader>(
        'INSERT INTO tasks (project_id, title, description, status, priority, created_by_id, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [project_id, title, description ?? null, 'todo', priority, agent_id ?? null, sortOrder]
      );
      const taskId = result.insertId;

      await pool.execute(
        'INSERT INTO activity_logs (project_id, task_id, agent_id, action, message) VALUES (?, ?, ?, ?, ?)',
        [project_id, taskId, agent_id ?? null, 'task_created', `Created task: ${title}`]
      );

      await notifyApiServer({
        event: 'task:created',
        project_id,
        data: { id: taskId, title, description, status: 'todo', priority, sort_order: sortOrder },
      });

      return {
        content: [{ type: 'text', text: JSON.stringify({ task_id: taskId, title, status: 'todo', priority }) }],
      };
    }
  );

  // ===== list_tasks =====
  server.tool(
    'list_tasks',
    'List tasks with optional filters.',
    {
      project_id: z.number().default(1),
      status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
      assignee_id: z.number().optional(),
    },
    async ({ project_id, status, assignee_id }) => {
      let query = 'SELECT t.*, a.name AS assignee_name FROM tasks t LEFT JOIN agents a ON t.assignee_id = a.id WHERE t.project_id = ?';
      const params: (string | number)[] = [project_id];

      if (status) {
        query += ' AND t.status = ?';
        params.push(status);
      }
      if (assignee_id) {
        query += ' AND t.assignee_id = ?';
        params.push(assignee_id);
      }
      query += ' ORDER BY t.status, t.sort_order ASC';

      const [rows] = await pool.execute<RowDataPacket[]>(query, params);
      return {
        content: [{ type: 'text', text: JSON.stringify(rows) }],
      };
    }
  );

  // ===== claim_task =====
  server.tool(
    'claim_task',
    'Claim a task: assigns it to the calling agent and moves it to in_progress.',
    {
      task_id: z.number(),
      agent_id: z.number(),
    },
    async ({ task_id, agent_id }) => {
      await pool.execute(
        'UPDATE tasks SET status = ?, assignee_id = ?, updated_at = NOW() WHERE id = ?',
        ['in_progress', agent_id, task_id]
      );
      await pool.execute(
        'UPDATE agents SET status = ?, last_seen_at = NOW() WHERE id = ?',
        ['working', agent_id]
      );

      const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT t.*, a.name AS assignee_name FROM tasks t LEFT JOIN agents a ON t.assignee_id = a.id WHERE t.id = ?',
        [task_id]
      );
      const task = rows[0];

      await pool.execute(
        'INSERT INTO activity_logs (project_id, task_id, agent_id, action, message) VALUES (?, ?, ?, ?, ?)',
        [task?.project_id, task_id, agent_id, 'task_claimed', `Claimed task: ${task?.title}`]
      );

      await notifyApiServer({
        event: 'task:claimed',
        project_id: task?.project_id as number,
        data: task as Record<string, unknown>,
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(task) }],
      };
    }
  );

  // ===== update_task =====
  server.tool(
    'update_task',
    "Update a task's status, title, description, or priority.",
    {
      task_id: z.number(),
      agent_id: z.number().optional(),
      status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    },
    async ({ task_id, agent_id, status, title, description, priority }) => {
      const setClauses: string[] = [];
      const params: (string | number | null)[] = [];

      if (status) { setClauses.push('status = ?'); params.push(status); }
      if (title) { setClauses.push('title = ?'); params.push(title); }
      if (description !== undefined) { setClauses.push('description = ?'); params.push(description); }
      if (priority) { setClauses.push('priority = ?'); params.push(priority); }

      if (setClauses.length === 0) {
        return { content: [{ type: 'text', text: 'No fields to update' }] };
      }

      setClauses.push('updated_at = NOW()');
      params.push(task_id);

      await pool.execute(`UPDATE tasks SET ${setClauses.join(', ')} WHERE id = ?`, params);

      if (agent_id) {
        await pool.execute('UPDATE agents SET last_seen_at = NOW() WHERE id = ?', [agent_id]);
      }

      const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM tasks WHERE id = ?', [task_id]);
      const task = rows[0];

      await pool.execute(
        'INSERT INTO activity_logs (project_id, task_id, agent_id, action, message) VALUES (?, ?, ?, ?, ?)',
        [task?.project_id, task_id, agent_id ?? null, 'task_updated', `Updated task: ${task?.title}`]
      );

      await notifyApiServer({
        event: 'task:updated',
        project_id: task?.project_id as number,
        data: task as Record<string, unknown>,
      });

      return { content: [{ type: 'text', text: JSON.stringify(task) }] };
    }
  );

  // ===== complete_task =====
  server.tool(
    'complete_task',
    'Mark a task as done.',
    {
      task_id: z.number(),
      agent_id: z.number().optional(),
    },
    async ({ task_id, agent_id }) => {
      await pool.execute(
        'UPDATE tasks SET status = ?, updated_at = NOW() WHERE id = ?',
        ['done', task_id]
      );

      if (agent_id) {
        await pool.execute(
          'UPDATE agents SET status = ?, last_seen_at = NOW() WHERE id = ?',
          ['idle', agent_id]
        );
      }

      const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM tasks WHERE id = ?', [task_id]);
      const task = rows[0];

      await pool.execute(
        'INSERT INTO activity_logs (project_id, task_id, agent_id, action, message) VALUES (?, ?, ?, ?, ?)',
        [task?.project_id, task_id, agent_id ?? null, 'task_completed', `Completed task: ${task?.title}`]
      );

      await notifyApiServer({
        event: 'task:completed',
        project_id: task?.project_id as number,
        data: task as Record<string, unknown>,
      });

      return { content: [{ type: 'text', text: JSON.stringify(task) }] };
    }
  );

  // ===== log_activity =====
  server.tool(
    'log_activity',
    'Log an activity message to the project timeline.',
    {
      project_id: z.number().default(1),
      agent_id: z.number().optional(),
      task_id: z.number().optional(),
      message: z.string(),
    },
    async ({ project_id, agent_id, task_id, message }) => {
      const [result] = await pool.execute<ResultSetHeader>(
        'INSERT INTO activity_logs (project_id, task_id, agent_id, action, message) VALUES (?, ?, ?, ?, ?)',
        [project_id, task_id ?? null, agent_id ?? null, 'log', message]
      );

      if (agent_id) {
        await pool.execute('UPDATE agents SET last_seen_at = NOW() WHERE id = ?', [agent_id]);
      }

      await notifyApiServer({
        event: 'activity:logged',
        project_id,
        data: { id: result.insertId, agent_id, task_id, message },
      });

      return { content: [{ type: 'text', text: JSON.stringify({ logged: true, id: result.insertId }) }] };
    }
  );
}
