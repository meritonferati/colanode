export type ChatCreateMutationInput = {
  type: 'chat_create';
  workspaceId: string;
  userId: string;
  otherUserId: string;
};

export type ChatCreateMutationOutput = {
  id: string;
};

declare module '@/operations/mutations' {
  interface MutationMap {
    chat_create: {
      input: ChatCreateMutationInput;
      output: ChatCreateMutationOutput;
    };
  }
}
