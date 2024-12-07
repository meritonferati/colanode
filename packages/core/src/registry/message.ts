import { isEqual } from 'lodash-es';
import { z } from 'zod';

import { blockSchema } from './block';
import { NodeModel } from './core';

import { extractText } from '../lib/blocks';

const standardMessageAttributesSchema = z.object({
  type: z.literal('message'),
  subtype: z.literal('standard'),
  parentId: z.string(),
  content: z.record(z.string(), blockSchema),
  reactions: z.record(z.string(), z.array(z.string())),
});

const replyMessageAttributesSchema = z.object({
  type: z.literal('message'),
  subtype: z.literal('reply'),
  parentId: z.string(),
  content: z.record(z.string(), blockSchema),
  reactions: z.record(z.string(), z.array(z.string())),
  referenceId: z.string(),
});

export const messageAttributesSchema = z.discriminatedUnion('subtype', [
  standardMessageAttributesSchema,
  replyMessageAttributesSchema,
]);

export type MessageAttributes = z.infer<typeof messageAttributesSchema>;

export const messageModel: NodeModel = {
  type: 'message',
  schema: messageAttributesSchema,
  getName: () => {
    return undefined;
  },
  getText: (id, attributes) => {
    if (attributes.type !== 'message') {
      return undefined;
    }

    return extractText(id, attributes.content);
  },
  canCreate: async (context, attributes) => {
    if (attributes.type !== 'message') {
      return false;
    }

    return context.hasCollaboratorAccess();
  },
  canUpdate: async (context, node, attributes) => {
    if (attributes.type !== 'message' || node.type !== 'message') {
      return false;
    }

    if (!isEqual(attributes.content, node.attributes.content)) {
      return context.userId === node.createdBy;
    }

    return context.hasCollaboratorAccess();
  },
  canDelete: async (context, node) => {
    if (node.type !== 'message') {
      return false;
    }

    if (context.userId === node.createdBy) {
      return true;
    }

    return context.hasAdminAccess();
  },
};
