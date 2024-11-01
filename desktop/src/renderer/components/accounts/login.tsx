import React from 'react';
import { LoginForm } from '@/renderer/components/accounts/login-form';
import { useQuery } from '@/renderer/hooks/use-query';

export const Login = () => {
  const { data, isPending } = useQuery({
    type: 'server_list',
  });

  return (
    <div className="grid h-screen min-h-screen w-full grid-cols-5">
      <div className="col-span-2 flex items-center justify-center bg-zinc-950">
        <h1 className="font-neotrax text-6xl text-white">colanode</h1>
      </div>
      <div className="col-span-3 flex items-center justify-center py-12">
        <div className="mx-auto grid w-96 gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Login to Colanode
            </h1>
            <p className="text-sm text-muted-foreground">
              Use one of the following methods to login
            </p>
          </div>
          {isPending ? null : <LoginForm servers={data ?? []} />}
        </div>
      </div>
    </div>
  );
};
