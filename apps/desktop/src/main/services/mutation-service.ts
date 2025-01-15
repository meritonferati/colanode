import { createDebugger } from '@colanode/core';

import { mutationHandlerMap } from '@/main/mutations';
import { MutationHandler } from '@/main/types';
import {
  MutationError,
  MutationErrorCode,
  MutationInput,
  MutationResult,
} from '@/shared/mutations';

class MutationService {
  private readonly debug = createDebugger('desktop:service:mutation');

  public async executeMutation<T extends MutationInput>(
    input: T
  ): Promise<MutationResult<T>> {
    const handler = mutationHandlerMap[
      input.type
    ] as unknown as MutationHandler<T>;

    this.debug(`Executing mutation: ${input.type}`);

    try {
      if (!handler) {
        throw new Error(`No handler found for mutation type: ${input.type}`);
      }

      const output = await handler.handleMutation(input);
      return { success: true, output };
    } catch (error) {
      this.debug(`Error executing mutation: ${input.type}`, error);
      if (error instanceof MutationError) {
        return {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        };
      }

      return {
        success: false,
        error: {
          code: MutationErrorCode.Unknown,
          message: 'Something went wrong trying to execute the mutation.',
        },
      };
    }
  }
}

export const mutationService = new MutationService();
