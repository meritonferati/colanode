import { Block, PageAttributes } from '@colanode/core';

import { entryService } from '@/main/services/entry-service';
import { MutationHandler } from '@/main/types';
import { mapContentsToBlocks } from '@/shared/lib/editor';
import {
  PageContentUpdateMutationInput,
  PageContentUpdateMutationOutput,
} from '@/shared/mutations/pages/page-content-update';
import { MutationError, MutationErrorCode } from '@/shared/mutations';

export class PageContentUpdateMutationHandler
  implements MutationHandler<PageContentUpdateMutationInput>
{
  async handleMutation(
    input: PageContentUpdateMutationInput
  ): Promise<PageContentUpdateMutationOutput> {
    const result = await entryService.updateEntry<PageAttributes>(
      input.pageId,
      input.userId,
      (attributes) => {
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
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        MutationErrorCode.PageUpdateForbidden,
        "You don't have permission to update this page."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        MutationErrorCode.PageUpdateFailed,
        'Something went wrong while updating the page content.'
      );
    }

    return {
      success: true,
    };
  }
}
