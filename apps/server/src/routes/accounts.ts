import { Request, Response, Router } from 'express';
import {
  AccountStatus,
  AccountUpdateInput,
  AccountUpdateOutput,
  EmailLoginInput,
  EmailRegisterInput,
  GoogleLoginInput,
  GoogleUserInfo,
  LoginOutput,
} from '@/types/accounts';
import axios from 'axios';
import { ApiError, ColanodeRequest, ColanodeResponse } from '@/types/api';
import { generateId, IdType } from '@colanode/core';
import { database } from '@/data/database';
import bcrypt from 'bcrypt';
import { WorkspaceOutput, WorkspaceRole } from '@/types/workspaces';
import { authMiddleware } from '@/middlewares/auth';
import { generateToken } from '@/lib/tokens';
import { mapNode } from '@/lib/nodes';
import { enqueueTask } from '@/queues/tasks';
import * as Y from 'yjs';
import { fromUint8Array, toUint8Array } from 'js-base64';
import { CompiledQuery } from 'kysely';
import { ServerNodeAttributes } from '@/types/nodes';
import { NodeUpdatedEvent } from '@/types/events';
import { enqueueEvent } from '@/queues/events';
import { SelectAccount } from '@/data/schema';
import { createDefaultWorkspace } from '@/lib/workspaces';
import { sha256 } from 'js-sha256';

const GoogleUserInfoUrl = 'https://www.googleapis.com/oauth2/v1/userinfo';
const SaltRounds = 10;

export const accountsRouter = Router();

accountsRouter.post('/register/email', async (req: Request, res: Response) => {
  const input: EmailRegisterInput = req.body;
  const email = input.email.toLowerCase();

  let existingAccount = await database
    .selectFrom('accounts')
    .selectAll()
    .where('email', '=', email)
    .executeTakeFirst();

  const salt = await bcrypt.genSalt(SaltRounds);
  const preHashedPassword = sha256(input.password);
  const password = await bcrypt.hash(preHashedPassword, salt);

  let account: SelectAccount | null | undefined = null;
  if (existingAccount) {
    if (existingAccount.status !== AccountStatus.Pending) {
      return res.status(400).json({
        code: ApiError.EmailAlreadyExists,
        message: 'Email already exists.',
      });
    }

    account = await database
      .updateTable('accounts')
      .set({
        password: password,
        name: input.name,
        updated_at: new Date(),
        status: AccountStatus.Active,
      })
      .where('id', '=', existingAccount.id)
      .returningAll()
      .executeTakeFirst();
  } else {
    account = await database
      .insertInto('accounts')
      .values({
        id: generateId(IdType.Account),
        name: input.name,
        email: email,
        password: password,
        status: AccountStatus.Active,
        created_at: new Date(),
      })
      .returningAll()
      .executeTakeFirst();
  }

  if (!account) {
    return res.status(500).json({
      code: ApiError.InternalServerError,
      message: 'Failed to create account.',
    });
  }

  const output = await buildLoginOutput(account);
  return res.status(200).json(output);
});

accountsRouter.post('/login/email', async (req: Request, res: Response) => {
  const input: EmailLoginInput = req.body;
  const email = input.email.toLowerCase();

  let account = await database
    .selectFrom('accounts')
    .where('email', '=', email)
    .selectAll()
    .executeTakeFirst();

  if (!account) {
    return res.status(400).json({
      code: ApiError.EmailOrPasswordIncorrect,
      message: 'Invalid credentials.',
    });
  }

  if (account.status === AccountStatus.Pending) {
    return res.status(400).json({
      code: ApiError.UserPendingActivation,
      message: 'User is pending activation.',
    });
  }

  if (!account.password) {
    return res.status(400).json({
      code: ApiError.EmailOrPasswordIncorrect,
      message: 'Invalid credentials.',
    });
  }

  const preHashedPassword = sha256(input.password);
  const passwordMatch = await bcrypt.compare(
    preHashedPassword,
    account.password
  );

  if (!passwordMatch) {
    return res.status(400).json({
      code: ApiError.EmailOrPasswordIncorrect,
      message: 'Invalid credentials.',
    });
  }

  const output = await buildLoginOutput(account);
  return res.status(200).json(output);
});

accountsRouter.post('/login/google', async (req: Request, res: Response) => {
  const input: GoogleLoginInput = req.body;
  const url = `${GoogleUserInfoUrl}?access_token=${input.access_token}`;
  const userInfoResponse = await axios.get(url);

  if (userInfoResponse.status !== 200) {
    return res.status(400).json({
      code: ApiError.GoogleAuthFailed,
      message: 'Failed to authenticate with Google.',
    });
  }

  const googleUser: GoogleUserInfo = userInfoResponse.data;

  if (!googleUser) {
    return res.status(400).json({
      code: ApiError.GoogleAuthFailed,
      message: 'Failed to authenticate with Google.',
    });
  }

  let existingAccount = await database
    .selectFrom('accounts')
    .where('email', '=', googleUser.email)
    .selectAll()
    .executeTakeFirst();

  if (existingAccount) {
    const attrs = existingAccount.attrs
      ? JSON.parse(existingAccount.attrs)
      : {};

    if (attrs?.googleId || existingAccount.status === AccountStatus.Pending) {
      await database
        .updateTable('accounts')
        .set({
          attrs: JSON.stringify({ googleId: googleUser.id }),
          updated_at: new Date(),
          status: AccountStatus.Active,
        })
        .where('id', '=', existingAccount.id)
        .execute();
    }

    const output = await buildLoginOutput(existingAccount);
    return res.status(200).json(output);
  }

  const newAccount = await database
    .insertInto('accounts')
    .values({
      id: generateId(IdType.Account),
      name: googleUser.name,
      email: googleUser.email,
      status: AccountStatus.Active,
      created_at: new Date(),
      password: null,
    })
    .returningAll()
    .executeTakeFirst();

  if (!newAccount) {
    return res.status(500).json({
      code: ApiError.InternalServerError,
      message: 'Failed to create account.',
    });
  }

  const output = await buildLoginOutput(newAccount);
  return res.status(200).json(output);
});

accountsRouter.delete(
  '/logout',
  authMiddleware,
  async (req: ColanodeRequest, res: ColanodeResponse) => {
    if (!req.account) {
      return res.status(401).json({
        code: ApiError.Unauthorized,
        message: 'Unauthorized.',
      });
    }

    await database
      .deleteFrom('devices')
      .where('id', '=', req.account.deviceId)
      .execute();

    await enqueueTask({
      type: 'clean_device_data',
      deviceId: req.account.deviceId,
    });

    return res.status(200).end();
  }
);

accountsRouter.put(
  '/:id',
  authMiddleware,
  async (req: ColanodeRequest, res: ColanodeResponse) => {
    const id = req.params.id;
    const input: AccountUpdateInput = req.body;

    if (!req.account) {
      return res.status(401).json({
        code: ApiError.Unauthorized,
        message: 'Unauthorized.',
      });
    }

    if (id !== req.account.id) {
      return res.status(400).json({
        code: ApiError.BadRequest,
        message: 'Invalid account id.',
      });
    }

    const account = await database
      .selectFrom('accounts')
      .where('id', '=', req.account.id)
      .selectAll()
      .executeTakeFirst();

    if (!account) {
      return res.status(404).json({
        code: ApiError.ResourceNotFound,
        message: 'Account not found.',
      });
    }

    const nameChanged = account.name !== input.name;
    const avatarChanged = account.avatar !== input.avatar;

    if (!nameChanged && !avatarChanged) {
      return res.status(400).json({
        code: ApiError.BadRequest,
        message: 'Nothing to update.',
      });
    }

    const users = await database
      .selectFrom('nodes')
      .selectAll()
      .where(
        'id',
        'in',
        database
          .selectFrom('workspace_users')
          .select('id')
          .where('account_id', '=', req.account.id)
      )
      .execute();

    const updates: CompiledQuery[] = [];
    const events: NodeUpdatedEvent[] = [];

    updates.push(
      database
        .updateTable('accounts')
        .set({
          name: input.name,
          avatar: input.avatar,
          updated_at: new Date(),
        })
        .where('id', '=', req.account.id)
        .compile()
    );

    for (const user of users) {
      const name = user.attributes.name;
      const avatar = user.attributes.avatar;

      if (account.name !== name || account.avatar !== avatar) {
        continue;
      }

      const doc = new Y.Doc({ guid: user.id });
      Y.applyUpdate(doc, toUint8Array(user.state));

      const attributesMap = doc.getMap('attributes');
      if (name != input.name) {
        attributesMap.set('name', input.name);
      }

      if (avatar != input.avatar) {
        attributesMap.set('avatar', input.avatar);
      }

      const attributes = attributesMap.toJSON() as ServerNodeAttributes;
      const attributesJson = JSON.stringify(attributes);
      const encodedState = fromUint8Array(Y.encodeStateAsUpdate(doc));

      const updatedAt = new Date();
      const versionId = generateId(IdType.Version);

      updates.push(
        database
          .updateTable('nodes')
          .set({
            attributes: attributesJson,
            state: encodedState,
            updated_at: updatedAt,
            updated_by: user.id,
            version_id: versionId,
            server_updated_at: updatedAt,
          })
          .where('id', '=', user.id)
          .compile()
      );

      const event: NodeUpdatedEvent = {
        type: 'node_updated',
        id: user.id,
        workspaceId: user.workspace_id,
        beforeAttributes: user.attributes,
        afterAttributes: attributes,
        updatedBy: user.id,
        updatedAt: updatedAt.toISOString(),
        serverUpdatedAt: updatedAt.toISOString(),
        versionId,
      };

      events.push(event);
    }

    await database.transaction().execute(async (trx) => {
      for (const update of updates) {
        await trx.executeQuery(update);
      }
    });

    for (const event of events) {
      await enqueueEvent(event);
    }

    const output: AccountUpdateOutput = {
      id: account.id,
      name: input.name,
      avatar: input.avatar,
    };

    return res.status(200).json(output);
  }
);

const buildLoginOutput = async (
  account: SelectAccount
): Promise<LoginOutput> => {
  let workspaceUsers = await database
    .selectFrom('workspace_users')
    .where('account_id', '=', account.id)
    .selectAll()
    .execute();

  if (workspaceUsers.length === 0) {
    await createDefaultWorkspace(account);

    workspaceUsers = await database
      .selectFrom('workspace_users')
      .where('account_id', '=', account.id)
      .selectAll()
      .execute();
  }

  const workspaceOutputs: WorkspaceOutput[] = [];
  if (workspaceUsers.length > 0) {
    const workspaceIds = workspaceUsers.map((wu) => wu.workspace_id);
    const workspaces = await database
      .selectFrom('workspaces')
      .where('id', 'in', workspaceIds)
      .selectAll()
      .execute();

    const userIds = workspaceUsers.map((wu) => wu.id);
    const userNodes = await database
      .selectFrom('nodes')
      .selectAll()
      .where('id', 'in', userIds)
      .execute();

    for (const workspaceUser of workspaceUsers) {
      const workspace = workspaces.find(
        (w) => w.id === workspaceUser.workspace_id
      );

      if (!workspace) {
        continue;
      }

      const userNode = userNodes.find((n) => n.id === workspaceUser.id);
      if (!userNode) {
        continue;
      }

      workspaceOutputs.push({
        id: workspace.id,
        name: workspace.name,
        versionId: workspaceUser.version_id,
        avatar: workspace.avatar,
        description: workspace.description,
        user: {
          id: workspaceUser.id,
          accountId: workspaceUser.account_id,
          role: workspaceUser.role as WorkspaceRole,
          node: mapNode(userNode),
        },
      });
    }
  }

  const deviceId = generateId(IdType.Device);
  const { token, salt, hash } = generateToken(deviceId);

  const device = await database
    .insertInto('devices')
    .values({
      id: deviceId,
      account_id: account.id,
      token_hash: hash,
      token_salt: salt,
      token_generated_at: new Date(),
      type: 1,
      created_at: new Date(),
      version: '0.1.0',
    })
    .returningAll()
    .executeTakeFirst();

  if (!device) {
    throw new Error('Failed to create device.');
  }

  return {
    account: {
      token,
      id: account.id,
      name: account.name,
      email: account.email,
      deviceId: device.id,
    },
    workspaces: workspaceOutputs,
  };
};
