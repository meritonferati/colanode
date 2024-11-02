import { z } from 'zod';
import { NodeModel } from '@/registry/core';
import { isEqual } from 'lodash';

export const channelAttributesSchema = z.object({
  type: z.literal('channel'),
  name: z.string(),
  avatar: z.string().nullable().optional(),
  parentId: z.string(),
  index: z.string(),
  collaborators: z.record(z.string()).nullable().optional(),
});

export type ChannelAttributes = z.infer<typeof channelAttributesSchema>;

export const channelModel: NodeModel = {
  type: 'channel',
  schema: channelAttributesSchema,
  canCreate: async (context, attributes) => {
    if (attributes.type !== 'channel') {
      return false;
    }

    if (context.ancestors.length !== 1) {
      return false;
    }

    const parent = context.ancestors[0];
    if (parent.type !== 'space') {
      return false;
    }

    const collaboratorIds = Object.keys(attributes.collaborators ?? {});
    if (collaboratorIds.length > 0 && !context.hasAdminAccess()) {
      return false;
    }

    return context.hasEditorAccess();
  },
  canUpdate: async (context, node, attributes) => {
    if (attributes.type !== 'channel' || node.type !== 'channel') {
      return false;
    }

    if (!isEqual(node.attributes.collaborators, attributes.collaborators)) {
      return context.hasAdminAccess();
    }

    return context.hasEditorAccess();
  },
  canDelete: async (context, node) => {
    return context.hasEditorAccess();
  },
};
