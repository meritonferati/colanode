import { Router } from 'express';

import {
  accountSyncHandler,
  loginWithEmailHandler,
  loginWithGoogleHandler,
  logoutHandler,
  registerWithEmailHandler,
  accountUpdateHandler,
  userCreateHandler,
  userRoleUpdateHandler,
  workspaceCreateHandler,
  workspaceDeleteHandler,
  workspaceGetHandler,
  workspaceUpdateHandler,
  avatarUploadHandler,
  avatarDownloadHandler,
  configGetHandler,
  fileDownloadGetHandler,
  fileUploadInitHandler,
  fileUploadCompleteHandler,
  avatarUploadParameter,
  mutationsSyncHandler,
} from '@/controllers/client';
import { workspaceMiddleware } from '@/middlewares/workspace';
import { authMiddleware } from '@/middlewares/auth';

export const clientRouter = Router();

clientRouter.get('/v1/config', configGetHandler);

clientRouter.post('/v1/accounts/login/email', loginWithEmailHandler);

clientRouter.post('/v1/accounts/login/google', loginWithGoogleHandler);

clientRouter.post('/v1/accounts/register/email', registerWithEmailHandler);

clientRouter.delete('/v1/accounts/logout', authMiddleware, logoutHandler);

clientRouter.put(
  '/v1/accounts/:accountId',
  authMiddleware,
  accountUpdateHandler
);

clientRouter.get('/v1/accounts/sync', authMiddleware, accountSyncHandler);

clientRouter.post(
  '/v1/avatars',
  authMiddleware,
  avatarUploadParameter,
  avatarUploadHandler
);

clientRouter.get(
  '/v1/avatars/:avatarId',
  authMiddleware,
  avatarDownloadHandler
);

clientRouter.post('/v1/workspaces', authMiddleware, workspaceCreateHandler);

clientRouter.put(
  '/v1/workspaces/:workspaceId',
  authMiddleware,
  workspaceMiddleware,
  workspaceUpdateHandler
);

clientRouter.delete(
  '/v1/workspaces/:workspaceId',
  authMiddleware,
  workspaceMiddleware,
  workspaceDeleteHandler
);

clientRouter.get(
  '/v1/workspaces/:workspaceId',
  authMiddleware,
  workspaceMiddleware,
  workspaceGetHandler
);

clientRouter.post(
  '/v1/workspaces/:workspaceId/users',
  authMiddleware,
  workspaceMiddleware,
  userCreateHandler
);

clientRouter.put(
  '/v1/workspaces/:workspaceId/users/:userId',
  authMiddleware,
  workspaceMiddleware,
  userRoleUpdateHandler
);

clientRouter.get(
  '/v1/workspaces/:workspaceId/downloads/:fileId',
  authMiddleware,
  workspaceMiddleware,
  fileDownloadGetHandler
);

clientRouter.post(
  '/v1/workspaces/:workspaceId/files',
  authMiddleware,
  workspaceMiddleware,
  fileUploadInitHandler
);

clientRouter.put(
  '/v1/workspaces/:workspaceId/files/:fileId',
  authMiddleware,
  workspaceMiddleware,
  fileUploadCompleteHandler
);

clientRouter.post(
  '/v1/workspaces/:workspaceId/mutations',
  authMiddleware,
  workspaceMiddleware,
  mutationsSyncHandler
);
