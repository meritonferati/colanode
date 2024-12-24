import FormData from 'form-data';
import axios from 'axios';
import { LoginOutput } from '@colanode/core';

import fs from 'fs';
import path from 'path';

import { FakerAccount, User } from './types';
import { NodeGenerator } from './node-generator';

const SERVER_DOMAIN = 'http://localhost:3000';

const uploadAvatar = async (
  token: string,
  avatarPath: string
): Promise<string> => {
  const avatarStream = fs.createReadStream(avatarPath);

  const formData = new FormData();
  formData.append('avatar', avatarStream);

  try {
    const { data } = await axios.post<{ id: string }>(
      `${SERVER_DOMAIN}/client/v1/avatars`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          ...formData.getHeaders(),
        },
      }
    );

    return data.id;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
};

const createAccount = async (account: FakerAccount): Promise<LoginOutput> => {
  const url = `${SERVER_DOMAIN}/client/v1/accounts/register/email`;
  const { data } = await axios.post<LoginOutput>(url, {
    name: account.name,
    email: account.email,
    password: account.password,
  });

  const avatarPath = path.resolve(`src/seed/avatars/${account.avatar}`);
  const avatarId = await uploadAvatar(data.token, avatarPath);
  data.account.avatar = avatarId;

  const updateAccountUrl = `${SERVER_DOMAIN}/client/v1/accounts/${data.account.id}`;
  await axios.put(
    updateAccountUrl,
    {
      name: account.name,
      avatar: avatarId,
    },
    {
      headers: {
        Authorization: `Bearer ${data.token}`,
      },
    }
  );

  return data;
};

const createMainAccountAndWorkspace = async (
  account: FakerAccount
): Promise<LoginOutput> => {
  const login = await createAccount(account);
  const workspace = login.workspaces[0];
  if (!workspace) {
    throw new Error('Workspace not created.');
  }

  const avatarPath = path.resolve('src/seed/avatars/workspace_avatar.png');
  const avatarId = await uploadAvatar(login.token, avatarPath);

  workspace.name = 'Colanode';
  workspace.description =
    'This is a workspace for Colanode generated by the "seed" script';
  workspace.avatar = avatarId;

  // update workspace name and description here
  const updateWorkspaceUrl = `${SERVER_DOMAIN}/client/v1/workspaces/${workspace.id}`;
  await axios.put(
    updateWorkspaceUrl,
    {
      name: workspace.name,
      description: workspace.description,
      avatar: avatarId,
    },
    {
      headers: {
        Authorization: `Bearer ${login.token}`,
      },
    }
  );

  return login;
};

const inviteAccountsToWorkspace = async (
  mainAccount: LoginOutput,
  otherFakerAccounts: FakerAccount[]
) => {
  const workspace = mainAccount.workspaces[0];
  if (!workspace) {
    throw new Error('Workspace not found');
  }

  const url = `${SERVER_DOMAIN}/client/v1/workspaces/${workspace.id}/users`;
  await axios.post(
    url,
    {
      emails: otherFakerAccounts.map((account) => account.email),
      role: 'admin',
    },
    {
      headers: {
        Authorization: `Bearer ${mainAccount.token}`,
      },
    }
  );
};

const sendMutations = async (user: User, workspaceId: string) => {
  const url = `${SERVER_DOMAIN}/client/v1/workspaces/${workspaceId}/mutations`;
  const batchSize = 100;
  const totalBatches = Math.ceil(user.mutations.length / batchSize);
  let currentBatch = 1;

  // Create a copy of the transactions array to modify
  const remainingMutations = [...user.mutations];

  while (remainingMutations.length > 0) {
    const batch = remainingMutations.splice(0, batchSize);

    console.log(
      `Sending batch ${currentBatch} of ${totalBatches} mutations for user ${user.login.account.email}`
    );

    await axios.post(
      url,
      {
        mutations: batch,
      },
      {
        headers: { Authorization: `Bearer ${user.login.token}` },
      }
    );

    currentBatch++;
  }
};

const seed = async () => {
  const fakerAccountsJson = fs.readFileSync(
    path.resolve('src/seed/accounts.json'),
    'utf8'
  );
  const fakerAccounts: FakerAccount[] = JSON.parse(fakerAccountsJson);
  const users: User[] = [];

  const mainFakkerAccount = fakerAccounts[0];
  if (!mainFakkerAccount) {
    throw new Error('Main account not found');
  }

  console.log(
    'Creating main account and workspace',
    mainFakkerAccount.name,
    mainFakkerAccount.email
  );
  const mainAccount = await createMainAccountAndWorkspace(mainFakkerAccount);
  const workspace = mainAccount.workspaces[0];
  if (!workspace) {
    throw new Error('Workspace not found');
  }

  users.push({
    login: mainAccount,
    userId: workspace.user.id,
    mutations: [],
  });

  const otherAccounts = fakerAccounts.slice(1);
  console.log('Inviting other accounts to workspace');
  await inviteAccountsToWorkspace(mainAccount, otherAccounts);

  for (const fakerAccount of otherAccounts) {
    console.log('Creating account', fakerAccount.name, fakerAccount.email);
    const account = await createAccount(fakerAccount);

    const accountWorkspace = account.workspaces[0];
    if (!accountWorkspace) {
      throw new Error('Workspace not found');
    }

    users.push({
      login: account,
      userId: accountWorkspace.user.id,
      mutations: [],
    });
  }

  console.log('Generating nodes');
  const nodeGenerator = new NodeGenerator(workspace.id, users);
  nodeGenerator.generate();

  console.log('Sending mutations');
  for (const user of users) {
    console.log('Sending mutations for user', user.login.account.email);
    await sendMutations(user, workspace.id);
  }

  console.log('Done');
};

seed();
