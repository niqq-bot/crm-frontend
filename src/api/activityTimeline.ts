
import { apiClient } from './client';
import { ActivityTimeline, PageActivityTimeline } from '@/types/api';

export type EntityType = 'Lead' | 'Deal' | 'Contact';

export const activityTimelineApi = {
  /**
   * Fetch activity history for a specific Lead, Deal, or Contact.
   */

   getTimeline: async (
     entityType: EntityType | string,
     entityId: string
   ): Promise<ActivityTimeline[]> => {
     const normalizedEntityType: EntityType = (() => {
       switch (entityType.toUpperCase()) {
         case 'LEAD':
           return 'Lead';
         case 'DEAL':
           return 'Deal';
         case 'CONTACT':
           return 'Contact';
         default:
           throw new Error(`Unsupported entity type: ${entityType}`);
       }
     })();

     const res = await apiClient.get<ActivityTimeline[]>(
       '/api/activity-timeline',
       {
         params: {
           entityType: normalizedEntityType,
           entityId,
         },
       }
     );

     if (Array.isArray(res.data)) {
       return res.data;
     }

     if (
       res.data &&
       Array.isArray((res.data as any).content)
     ) {
       return (res.data as any).content;
     }

     return [];
   },



  /**
   * Fetch the organization-wide activity feed.
   */
  getOrganizationFeed: async (
    page = 0,
    size = 50
  ): Promise<PageActivityTimeline> => {
    const res = await apiClient.get<PageActivityTimeline>(
      '/api/activity-timeline/organization',
      {
        params: {
          page,
          size,
        },
      }
    );

    return res.data;
  },
};

