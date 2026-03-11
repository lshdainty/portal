import { useActivities } from '@/hooks/useActivities';
import { formatDistanceToNow } from 'date-fns';
import { Activity } from 'lucide-react';

const ACTION_ICONS: Record<string, string> = {
  task_created: '+',
  task_claimed: '>>',
  task_updated: '~',
  task_completed: '✓',
  log: '•',
};

interface ActivityLogProps {
  projectId: number;
}

export function ActivityLog({ projectId }: ActivityLogProps) {
  const { data: activities = [] } = useActivities(projectId);

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 flex-1 min-h-0">
      <div className="flex items-center gap-2 mb-3">
        <Activity size={16} className="text-[var(--color-primary)]" />
        <h3 className="font-semibold text-sm">Activity</h3>
      </div>
      <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-2 text-xs p-2 rounded-lg bg-[var(--color-background)]"
          >
            <span className="text-[var(--color-muted-foreground)] font-mono w-4 text-center shrink-0 mt-0.5">
              {ACTION_ICONS[activity.action] || '•'}
            </span>
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-[var(--color-card-foreground)] leading-relaxed break-words [overflow-wrap:anywhere]">
                {activity.agent_name && (
                  <span className="font-medium text-[var(--color-primary)]">
                    {activity.agent_name}
                  </span>
                )}{' '}
                {activity.message}
              </p>
              <p className="text-[var(--color-muted-foreground)] mt-0.5">
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <p className="text-xs text-[var(--color-muted-foreground)] text-center py-4">
            No activity yet
          </p>
        )}
      </div>
    </div>
  );
}
