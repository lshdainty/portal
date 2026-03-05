import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { ActivityLog, ApiResponse } from '@/types';

const api = axios.create({ baseURL: '/api' });

export function useActivities(projectId: number) {
  return useQuery({
    queryKey: ['activities', projectId],
    queryFn: async () => {
      const resp = await api.get<ApiResponse<ActivityLog[]>>('/activities', {
        params: { project_id: projectId, limit: 50 },
      });
      return resp.data.data;
    },
  });
}
