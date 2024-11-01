import React from 'react';
import { toast } from '@/renderer/hooks/use-toast';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { useAccount } from '@/renderer/contexts/account';
import { useNavigate } from 'react-router-dom';
import { WorkspaceForm } from '@/renderer/components/workspaces/workspace-form';

export const WorkspaceCreate = () => {
  const account = useAccount();
  const navigate = useNavigate();

  const { mutate, isPending } = useMutation();

  const handleCancel =
    account.workspaces.length > 0 ? () => navigate('/') : undefined;

  return (
    <div className="container flex flex-row justify-center">
      <div className="w-full max-w-[700px]">
        <div className="flex flex-row justify-center py-8">
          <h1 className="text-center text-4xl font-bold leading-tight tracking-tighter lg:leading-[1.1]">
            Setup your workspace
          </h1>
        </div>
        <WorkspaceForm
          onSubmit={(values) => {
            mutate({
              input: {
                type: 'workspace_create',
                name: values.name,
                description: values.description,
                accountId: account.id,
                avatar: values.avatar ?? null,
              },
              onSuccess(output) {
                navigate(`/${output.id}`);
              },
              onError() {
                toast({
                  title: 'Failed to create workspace',
                  description:
                    'Somewthing went wrong creating the workspace. Please try again!',
                  variant: 'destructive',
                });
              },
            });
          }}
          isSaving={isPending}
          onCancel={handleCancel}
          saveText="Create"
        />
      </div>
    </div>
  );
};
