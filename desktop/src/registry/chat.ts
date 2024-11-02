import { z } from 'zod';
import { NodeModel } from '@/registry/core';

export const chatAttributesSchema = z.object({
  type: z.literal('chat'),
  parentId: z.string(),
  collaborators: z.record(z.string()),
});

export type ChatAttributes = z.infer<typeof chatAttributesSchema>;

export const chatModel: NodeModel = {
  type: 'chat',
  schema: chatAttributesSchema,
  canCreate: async (context, attributes) => {
    if (attributes.type !== 'chat') {
      return false;
    }

    const collaboratorIds = Object.keys(attributes.collaborators ?? {});
    if (collaboratorIds.length !== 2) {
      return false;
    }

    if (!collaboratorIds.includes(context.userId)) {
      return false;
    }

    return true;
  },
  canUpdate: async () => {
    return false;
  },
  canDelete: async () => {
    return false;
  },
};
