import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { KanbanBoard } from '@/components/KanbanBoard';
import { AgentStatusPanel } from '@/components/AgentStatusPanel';
import { ActivityLog } from '@/components/ActivityLog';
import { useSocket } from '@/hooks/useSocket';
import { LayoutDashboard, ChevronDown } from 'lucide-react';
import axios from 'axios';
import type { ApiResponse } from '@/types';

interface Project {
  id: number;
  name: string;
  description: string | null;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const resp = await axios.get<ApiResponse<Project[]>>('/api/projects');
      return resp.data.data;
    },
  });
}

function Dashboard() {
  const [projectId, setProjectId] = useState<number>(() => {
    const saved = localStorage.getItem('selectedProjectId');
    return saved ? Number(saved) : 1;
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { data: projects } = useProjects();
  useSocket(projectId);

  useEffect(() => {
    localStorage.setItem('selectedProjectId', String(projectId));
  }, [projectId]);

  const currentProject = projects?.find((p) => p.id === projectId);

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b border-[var(--color-border)] px-6 py-3 flex items-center justify-between bg-[var(--color-card)]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <LayoutDashboard size={20} className="text-[var(--color-primary)]" />
            <h1 className="text-lg font-bold">Agent Kanban Dashboard</h1>
          </div>
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm bg-[var(--color-bg)] border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
            >
              {currentProject?.name || 'Select Project'}
              <ChevronDown size={14} />
            </button>
            {dropdownOpen && projects && (
              <div className="absolute top-full left-0 mt-1 w-56 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg z-50">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setProjectId(p.id);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--color-bg)] transition-colors ${
                      p.id === projectId ? 'text-[var(--color-primary)] font-medium' : ''
                    }`}
                  >
                    <div>{p.name}</div>
                    {p.description && (
                      <div className="text-xs text-[var(--color-muted-foreground)] truncate">{p.description}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Connected
        </div>
      </header>
      <div className="flex-1 grid grid-cols-[1fr_300px] gap-4 p-4 overflow-hidden min-h-0">
        <div className="overflow-hidden h-full">
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
