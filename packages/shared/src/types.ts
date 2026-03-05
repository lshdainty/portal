export interface Project {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type AgentStatus = 'idle' | 'working' | 'offline';

export interface Agent {
  id: number;
  project_id: number;
  name: string;
  role: string;
  status: AgentStatus;
  last_seen_at: string;
  created_at: string;
}

export interface Task {
  id: number;
  project_id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: number | null;
  created_by_id: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  assignee_name?: string;
  created_by_name?: string;
}

export interface ActivityLog {
  id: number;
  project_id: number;
  task_id: number | null;
  agent_id: number | null;
  action: string;
  message: string;
  created_at: string;
  agent_name?: string;
  task_title?: string;
}

export type NotifyEventType =
  | 'agent:registered'
  | 'agent:status_changed'
  | 'task:created'
  | 'task:updated'
  | 'task:claimed'
  | 'task:completed'
  | 'activity:logged';

export interface NotifyPayload {
  event: NotifyEventType;
  project_id: number;
  data: Record<string, unknown>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}
