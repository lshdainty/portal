CREATE DATABASE IF NOT EXISTS agent_kanban
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE agent_kanban;

CREATE TABLE IF NOT EXISTS projects (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  description TEXT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_projects_name (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS agents (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  project_id   BIGINT NOT NULL,
  name         VARCHAR(255) NOT NULL,
  role         VARCHAR(100) NOT NULL DEFAULT 'developer',
  status       ENUM('idle', 'working', 'offline') NOT NULL DEFAULT 'idle',
  last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_agents_project (project_id),
  INDEX idx_agents_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tasks (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  project_id    BIGINT NOT NULL,
  title         VARCHAR(500) NOT NULL,
  description   TEXT NULL,
  status        ENUM('todo', 'in_progress', 'review', 'done') NOT NULL DEFAULT 'todo',
  priority      ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
  assignee_id   BIGINT NULL,
  created_by_id BIGINT NULL,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (assignee_id) REFERENCES agents(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by_id) REFERENCES agents(id) ON DELETE SET NULL,
  INDEX idx_tasks_project (project_id),
  INDEX idx_tasks_status (status),
  INDEX idx_tasks_assignee (assignee_id),
  INDEX idx_tasks_sort (project_id, status, sort_order)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS activity_logs (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  project_id BIGINT NOT NULL,
  task_id    BIGINT NULL,
  agent_id   BIGINT NULL,
  action     VARCHAR(100) NOT NULL,
  message    TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL,
  INDEX idx_activity_project (project_id),
  INDEX idx_activity_created (created_at DESC)
) ENGINE=InnoDB;

INSERT INTO projects (name, description) VALUES
  ('Default Project', 'Auto-created default project for agent kanban');
