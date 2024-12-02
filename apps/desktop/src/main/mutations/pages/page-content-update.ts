import { Block } from '@colanode/core';

import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import { mapContentsToBlocks } from '@/shared/lib/editor';
import {
  PageContentUpdateMutationInput,
  PageContentUpdateMutationOutput,
} from '@/shared/mutations/pages/page-content-update';

export class PageContentUpdateMutationHandler
  implements MutationHandler<PageContentUpdateMutationInput>
{
  async handleMutation(
    input: PageContentUpdateMutationInput
  ): Promise<PageContentUpdateMutationOutput> {
    await nodeService.updateNode(input.pageId, input.userId, (attributes) => {
      if (attributes.type !== 'page') {
        throw new Error('Invalid node type');
      }

      const blocksMap = new Map<string, Block>();
      if (attributes.content) {
        for (const [key, value] of Object.entries(attributes.content)) {
          blocksMap.set(key, value);
        }
      }

      const blocks = mapContentsToBlocks(
        input.pageId,
        input.content.content ?? [],
        blocksMap
      );

      attributes.content = blocks.reduce(
        (acc, block) => {
          acc[block.id] = block;
          return acc;
        },
        {} as Record<string, Block>
      );

      return attributes;
    });

    return {
      success: true,
    };
  }
}
