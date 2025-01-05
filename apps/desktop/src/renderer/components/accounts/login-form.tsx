import React from 'react';
import { useNavigate } from 'react-router-dom';

import { EmailLogin } from '@/renderer/components/accounts/email-login';
import { EmailRegister } from '@/renderer/components/accounts/email-register';
import { EmailVerify } from '@/renderer/components/accounts/email-verify';
import { ServerDropdown } from '@/renderer/components/servers/server-dropdown';
import { Separator } from '@/renderer/components/ui/separator';
import { Account } from '@/shared/types/accounts';
import { Server } from '@/shared/types/servers';

interface LoginFormProps {
  accounts: Account[];
  servers: Server[];
}

type LoginPanelState = {
  type: 'login';
};

type RegisterPanelState = {
  type: 'register';
};

type VerifyPanelState = {
  type: 'verify';
  id: string;
  expiresAt: Date;
};

type PanelState = LoginPanelState | RegisterPanelState | VerifyPanelState;

export const LoginForm = ({ accounts, servers }: LoginFormProps) => {
  const navigate = useNavigate();

  const [server, setServer] = React.useState<Server>(servers[0]!);
  const [panel, setPanel] = React.useState<PanelState>({
    type: 'login',
  });

  return (
    <div className="flex flex-col gap-4">
      <ServerDropdown
        value={server}
        onChange={setServer}
        servers={servers}
        readonly={panel.type === 'verify'}
      />
      {panel.type === 'login' && (
        <React.Fragment>
          <EmailLogin
            server={server}
            onSuccess={(output) => {
              if (output.type === 'success') {
                const userId = output.workspaces[0]?.id ?? '';
                navigate(`/${output.account.id}/${userId}`);
              } else if (output.type === 'verify') {
                setPanel({
                  type: 'verify',
                  id: output.id,
                  expiresAt: new Date(output.expiresAt),
                });
              }
            }}
          />
          <p
            className="text-center text-sm text-muted-foreground hover:cursor-pointer hover:underline"
            onClick={() => {
              setPanel({
                type: 'register',
              });
            }}
          >
            No account yet? Register
          </p>
        </React.Fragment>
      )}
      {panel.type === 'register' && (
        <React.Fragment>
          <EmailRegister
            server={server}
            onSuccess={(output) => {
              if (output.type === 'success') {
                const userId = output.workspaces[0]?.id ?? '';
                navigate(`/${output.account.id}/${userId}`);
              } else if (output.type === 'verify') {
                setPanel({
                  type: 'verify',
                  id: output.id,
                  expiresAt: new Date(output.expiresAt),
                });
              }
            }}
          />
          <p
            className="text-center text-sm text-muted-foreground hover:cursor-pointer hover:underline"
            onClick={() => {
              setPanel({
                type: 'login',
              });
            }}
          >
            Already have an account? Login
          </p>
        </React.Fragment>
      )}

      {panel.type === 'verify' && (
        <React.Fragment>
          <EmailVerify
            server={server}
            id={panel.id}
            expiresAt={panel.expiresAt}
            onSuccess={(output) => {
              if (output.type === 'success') {
                const userId = output.workspaces[0]?.id ?? '';
                navigate(`/${output.account.id}/${userId}`);
              }
            }}
          />
          <p
            className="text-center text-sm text-muted-foreground hover:cursor-pointer hover:underline"
            onClick={() => {
              setPanel({
                type: 'login',
              });
            }}
          >
            Back to login
          </p>
        </React.Fragment>
      )}

      {accounts.length > 0 && (
        <React.Fragment>
          <Separator className="w-full" />
          <p
            className="text-center text-sm text-muted-foreground hover:cursor-pointer hover:underline"
            onClick={() => {
              navigate(-1);
            }}
          >
            Cancel
          </p>
        </React.Fragment>
      )}
    </div>
  );
};
