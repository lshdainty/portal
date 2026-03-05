import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { KanbanBoard } from '@/components/KanbanBoard';
import { AgentStatusPanel } from '@/components/AgentStatusPanel';
import { ActivityLog } from '@/components/ActivityLog';
import { useSocket } from '@/hooks/useSocket';
import { LayoutDashboard } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function Dashboard() {
  const [projectId] = useState(1);
  useSocket(projectId);

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b border-[var(--color-border)] px-6 py-3 flex items-center justify-between bg-[var(--color-card)]">
        <div className="flex items-center gap-2">
          <LayoutDashboard size={20} className="text-[var(--color-primary)]" />
          <h1 className="text-lg font-bold">Agent Kanban Dashboard</h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Connected
        </div>
      </header>
      <div className="flex-1 grid grid-cols-[1fr_300px] gap-4 p-4 overflow-hidden">
        <div className="overflow-auto">
          <KanbanBoard projectId={projectId} />
        </div>
        <aside className="flex flex-col gap-4 overflow-auto">
          <AgentStatusPanel projectId={projectId} />
          <ActivityLog projectId={projectId} />
        </aside>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>
  );
}
