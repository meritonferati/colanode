export type WorkspaceAccountsInviteMutationInput = {
  type: 'workspace_accounts_invite';
  emails: string[];
  userId: string;
};

export type WorkspaceAccountsInviteMutationOutput = {
  success: boolean;
};

declare module '@/types/mutations' {
  interface MutationMap {
    workspace_accounts_invite: {
      input: WorkspaceAccountsInviteMutationInput;
      output: WorkspaceAccountsInviteMutationOutput;
    };
  }
}
