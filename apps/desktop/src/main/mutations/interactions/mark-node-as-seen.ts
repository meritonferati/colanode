import { interactionService } from '@/main/services/interaction-service';
import { MutationHandler } from '@/main/types';
import {
  MarkNodeAsSeenMutationInput,
  MarkNodeAsSeenMutationOutput,
} from '@/shared/mutations/interactions/mark-node-as-seen';

export class MarkNodeAsSeenMutationHandler
  implements MutationHandler<MarkNodeAsSeenMutationInput>
{
  async handleMutation(
    input: MarkNodeAsSeenMutationInput
  ): Promise<MarkNodeAsSeenMutationOutput> {
    await interactionService.setInteraction(
      input.userId,
      input.nodeId,
      input.nodeType,
      [
        {
          attribute: 'lastSeenAt',
          value: new Date().toISOString(),
        },
        {
          attribute: 'firstSeenAt',
          value: new Date().toISOString(),
        },
        {
          attribute: 'lastSeenTransactionId',
          value: input.transactionId,
        },
      ]
    );

    return {
      success: true,
    };
  }
}
