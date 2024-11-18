import { generateId, IdType, EditorNodeTypes, NodeTypes } from '@colanode/core';
import { MutationHandler } from '@/main/types';
import {
  MessageCreateMutationInput,
  MessageCreateMutationOutput,
} from '@/shared/mutations/message-create';
import { mapBlocksToContents, mapContentsToBlocks } from '@/shared/lib/editor';
import { fileService } from '@/main/services/file-service';
import { Block, FileAttributes, MessageAttributes } from '@colanode/core';
import { CreateNodeInput, nodeService } from '@/main/services/node-service';

export class MessageCreateMutationHandler
  implements MutationHandler<MessageCreateMutationInput>
{
  async handleMutation(
    input: MessageCreateMutationInput
  ): Promise<MessageCreateMutationOutput> {
    const inputs: CreateNodeInput[] = [];

    const messageContent = input.content.content ?? [];
    if (input.referenceId) {
      const referenceNode = await nodeService.fetchNode(
        input.referenceId,
        input.userId
      );

      if (!referenceNode || referenceNode.type !== 'message') {
        throw new Error('Reference node not found');
      }

      const referenceContent = mapBlocksToContents(
        referenceNode.id,
        Object.values(referenceNode.attributes.content)
      );

      messageContent.unshift({
        type: 'messageReference',
        attrs: {
          id: input.referenceId,
          conversationId: input.conversationId,
        },
        content: referenceContent,
      });
    }

    const messageId = generateId(IdType.Message);
    const createdAt = new Date().toISOString();
    const blocks = mapContentsToBlocks(messageId, messageContent, new Map());

    // check if there are nested nodes (files, pages, folders etc.)
    for (const block of blocks) {
      if (block.type === EditorNodeTypes.FilePlaceholder) {
        const path = block.attrs?.path;
        const metadata = fileService.getFileMetadata(path);
        if (!metadata) {
          throw new Error('Invalid file');
        }

        const fileId = generateId(IdType.File);

        block.id = fileId;
        block.type = NodeTypes.File;
        block.attrs = null;

        fileService.copyFileToWorkspace(
          path,
          fileId,
          metadata.extension,
          input.userId
        );

        const fileAttributes: FileAttributes = {
          type: 'file',
          parentId: messageId,
          name: metadata.name,
          fileName: metadata.name,
          mimeType: metadata.mimeType,
          size: metadata.size,
          extension: metadata.extension,
        };

        inputs.push({
          id: fileId,
          attributes: fileAttributes,
          download: {
            node_id: fileId,
            created_at: createdAt,
            progress: 100,
            retry_count: 0,
          },
          upload: {
            node_id: fileId,
            created_at: createdAt,
            progress: 0,
            retry_count: 0,
          },
        });
      }
    }

    const messageAttributes: MessageAttributes = {
      type: 'message',
      parentId: input.conversationId,
      content: blocks.reduce(
        (acc, block) => {
          acc[block.id] = block;
          return acc;
        },
        {} as Record<string, Block>
      ),
      reactions: {},
    };

    inputs.unshift({ id: messageId, attributes: messageAttributes });
    await nodeService.createNode(input.userId, inputs);

    return {
      id: messageId,
    };
  }
}
