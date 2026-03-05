import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { Agent, ApiResponse } from '@/types';

const api = axios.create({ baseURL: '/api' });

export function useAgents(projectId: number) {
  return useQuery({
    queryKey: ['agents', projectId],
    queryFn: async () => {
      const resp = await api.get<ApiResponse<Agent[]>>('/agents', {
        params: { project_id: projectId },
      });
      return resp.data.data;
    },
  });
}
