import React from 'react';
import { EmailLogin } from '@/components/accounts/email-login';
import { LoginOutput } from '@/types/accounts';
import { saveAccount } from '@/lib/storage';
import { EmailRegister } from '@/components/accounts/email-register';
import { useDispatch } from "react-redux";
import { setAccount } from "@/store/account-slice";

export function Login() {
  const [showRegister, setShowRegister] = React.useState(false);
  const dispatch = useDispatch();

  function handleLogin(output: LoginOutput) {
    saveAccount(output);
    dispatch(setAccount(output));
  }

  return (
    <div className="grid h-screen min-h-screen w-full grid-cols-5">
      <div className="col-span-2 flex items-center justify-center bg-zinc-950">
        <h1 className="font-neotrax text-6xl text-white">neuron</h1>
      </div>
      <div className="col-span-3 flex items-center justify-center py-12">
        <div className="mx-auto grid w-96 gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Login to Neuron
            </h1>
            <p className="text-sm text-muted-foreground">
              Use one of the following methods to login
            </p>
          </div>
          <div className="flex flex-col gap-4">
            {showRegister ? (
              <EmailRegister onRegister={handleLogin} />
            ) : (
              <EmailLogin onLogin={handleLogin} />
            )}
            <p
              className="text-center text-sm text-muted-foreground hover:cursor-pointer hover:underline"
              onClick={() => {
                setShowRegister(!showRegister);
              }}
            >
              {showRegister
                ? 'Already have an account? Login'
                : 'No account yet? Register'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
