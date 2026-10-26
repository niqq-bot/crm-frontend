import { apiClient } from './client';
import { ActivityTimeline, PageActivityTimeline } from '@/types/api';

export const activityTimelineApi = {
  getTimeline: async (
    entityType: string,
    entityId: string
  ): Promise<ActivityTimeline[]> => {
    const res = await apiClient.get<ActivityTimeline[]>('/api/activity-timeline', {
      params: { entityType, entityId },
    });
    if (Array.isArray(res.data)) return res.data;
    if (res.data && Array.isArray((res.data as any).content)) {
      return (res.data as any).content;
    }
    return [];
  },

  getOrganizationFeed: async (
    page = 0,
    size = 50
  ): Promise<PageActivityTimeline> => {
    const res = await apiClient.get<PageActivityTimeline>(
      '/api/activity-timeline/organization',
      {
        params: { page, size },
      }
    );
    return res.data;
  },
};
