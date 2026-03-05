import { useAgents } from '@/hooks/useAgents';
import { cn } from '@/lib/utils';
import { Bot } from 'lucide-react';
import type { AgentStatus } from '@/types';

const STATUS_INDICATOR: Record<AgentStatus, string> = {
  idle: 'bg-green-400',
  working: 'bg-amber-400 animate-pulse',
  offline: 'bg-gray-500',
};

const STATUS_LABELS: Record<AgentStatus, string> = {
  idle: 'Idle',
  working: 'Working',
  offline: 'Offline',
};

interface AgentStatusPanelProps {
  projectId: number;
}

export function AgentStatusPanel({ projectId }: AgentStatusPanelProps) {
  const { data: agents = [] } = useAgents(projectId);

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Bot size={16} className="text-[var(--color-primary)]" />
        <h3 className="font-semibold text-sm">Agents</h3>
      </div>
      <div className="flex flex-col gap-2">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="flex items-center gap-2 text-sm p-2 rounded-lg bg-[var(--color-background)]"
          >
            <span className={cn('w-2 h-2 rounded-full shrink-0', STATUS_INDICATOR[agent.status])} />
            <span className="font-medium truncate">{agent.name}</span>
            <span className="text-[10px] text-[var(--color-muted-foreground)] ml-auto shrink-0">
              {agent.role}
            </span>
            <span className="text-[10px] text-[var(--color-muted-foreground)]">
              {STATUS_LABELS[agent.status]}
            </span>
          </div>
        ))}
        {agents.length === 0 && (
          <p className="text-xs text-[var(--color-muted-foreground)] text-center py-4">
            No agents registered yet
          </p>
        )}
      </div>
    </div>
  );
}
