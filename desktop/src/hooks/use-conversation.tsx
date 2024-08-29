import { LocalNode, NodeBlock } from '@/types/nodes';
import { useWorkspace } from '@/contexts/workspace';
import { JSONContent } from '@tiptap/core';
import { NeuronId } from '@/lib/id';
import { LeafNodeTypes, NodeTypes } from '@/lib/constants';
import {
  buildNodeWithChildren,
  compareNodeId,
  generateNodeIndex,
  mapNode,
} from '@/lib/nodes';
import { useQuery } from '@tanstack/react-query';
import { sql } from 'kysely';
import { CreateNode, SelectNode } from '@/data/schemas/workspace';
import { MessageNode } from '@/types/messages';

interface useConversationResult {
  isLoading: boolean;
  messages: MessageNode[];
  hasMore: boolean;
  loadMore: () => void;
  isLoadingMore: boolean;
  createMessage: (content: JSONContent) => void;
}

export const useConversation = (
  conversationId: string,
): useConversationResult => {
  const workspace = useWorkspace();

  const messagesQuery = useQuery({
    queryKey: [`conversation:messages:${conversationId}`],
    queryFn: async ({ queryKey }) => {
      const query = sql<SelectNode>`
        SELECT *
        FROM nodes
        WHERE parent_id = ${conversationId} AND type = ${NodeTypes.Message}
        ORDER BY id DESC
        LIMIT 50
      `.compile(workspace.schema);

      const queryId = queryKey[0];
      return await workspace.queryAndSubscribe(queryId, query);
    },
  });
  const messageIds = messagesQuery.data?.rows.map((row) => row.id) ?? [];
  const messageDescendantsQuery = useQuery({
    queryKey: [`conversation:descendants:${messageIds.join(',')}`],
    enabled: messageIds.length > 0,
    queryFn: async ({ queryKey }) => {
      const query = sql<SelectNode>`
        WITH RECURSIVE conversation_hierarchy AS (
            SELECT *
            FROM nodes
            WHERE parent_id IN (${sql.join(messageIds)})
            UNION ALL
            
            SELECT child.*
            FROM nodes child
            INNER JOIN conversation_hierarchy parent ON child.parent_id = parent.id
        )
        SELECT *
        FROM conversation_hierarchy;
      `.compile(workspace.schema);

      const queryId = queryKey[0];
      return await workspace.queryAndSubscribe(queryId, query);
    },
  });

  const authorIds = [
    ...new Set(messagesQuery.data?.rows.map((row) => row.created_by) ?? []),
  ].sort();

  const authorsQuery = useQuery({
    queryKey: [`nodes:${authorIds.join(',')}`],
    enabled: authorIds.length > 0,
    queryFn: async ({ queryKey }) => {
      const query = workspace.schema
        .selectFrom('nodes')
        .selectAll()
        .where('id', 'in', authorIds)
        .compile();

      const queryId = queryKey[0];
      return await workspace.queryAndSubscribe(queryId, query);
    },
  });

  const createMessage = async (content: JSONContent) => {
    const nodesToInsert: CreateNode[] = [];

    buildMessageCreateNodes(
      nodesToInsert,
      workspace.userId,
      workspace.id,
      conversationId,
      content,
    );

    const query = workspace.schema
      .insertInto('nodes')
      .values(nodesToInsert)
      .compile();
    await workspace.mutate(query);
  };

  const messageNodes =
    messagesQuery.data?.rows.map((row) => mapNode(row)) ?? [];
  const descendentNodes =
    messageDescendantsQuery.data?.rows.map((row) => mapNode(row)) ?? [];
  const authorNodes = authorsQuery.data?.rows.map((row) => mapNode(row)) ?? [];
  const messages = buildMessages(messageNodes, descendentNodes, authorNodes);

  return {
    isLoading: messagesQuery.isPending,
    messages: messages,
    hasMore: false,
    loadMore: () => console.log('load more'),
    isLoadingMore: false,
    createMessage: createMessage,
  };
};

const buildMessages = (
  messageNodes: LocalNode[],
  descendentNodes: LocalNode[],
  authorNodes: LocalNode[],
): MessageNode[] => {
  const messages: MessageNode[] = [];
  const authorMap = new Map<string, LocalNode>();

  for (const author of authorNodes) {
    authorMap.set(author.id, author);
  }

  for (const node of messageNodes) {
    const messageNode = buildNodeWithChildren(node, descendentNodes);
    const author = authorMap.get(node.createdBy);
    const message: MessageNode = {
      ...messageNode,
      author,
    };

    messages.push(message);
  }

  return messages.sort((a, b) => compareNodeId(a, b));
};

const buildMessageCreateNodes = (
  nodes: CreateNode[],
  userId: string,
  workspaceId: string,
  parentId: string,
  content: JSONContent,
  index?: string | null,
) => {
  const id =
    content.attrs?.id ??
    NeuronId.generate(NeuronId.getIdTypeFromNode(content.type));

  let attrs = content.attrs ? { ...content.attrs } : null;
  if (attrs) {
    delete attrs.id;

    if (Object.keys(attrs).length === 0) {
      attrs = null;
    }
  }

  let nodeContent: NodeBlock[] | null = null;
  if (LeafNodeTypes.includes(content.type)) {
    nodeContent = [];
    for (const child of content.content) {
      nodeContent.push({
        type: child.type,
        text: child.text,
        marks: child.marks?.map((mark) => {
          return {
            type: mark.type,
            attrs: mark.attrs,
          };
        }),
      });
    }
  }

  if (nodeContent && nodeContent.length === 0) {
    nodeContent = null;
  }

  nodes.push({
    id: id,
    parent_id: parentId,
    type: content.type,
    attrs: attrs ? JSON.stringify(attrs) : null,
    index: index,
    content: nodeContent ? JSON.stringify(nodeContent) : null,
    created_at: new Date().toISOString(),
    created_by: userId,
    version_id: NeuronId.generate(NeuronId.Type.Version),
  });

  if (nodeContent == null && content.content && content.content.length > 0) {
    let lastIndex: string | null = null;
    for (const child of content.content) {
      lastIndex = generateNodeIndex(lastIndex, null);
      buildMessageCreateNodes(nodes, userId, workspaceId, id, child, lastIndex);
    }
  }
};
