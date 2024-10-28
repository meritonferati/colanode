import { app } from 'electron';
import { DeleteResult, InsertResult, UpdateResult } from 'kysely';
import path from 'path';

export const appPath = app.getPath('userData');

export const appDatabasePath = path.join(appPath, 'app.db');

export const getWorkspaceDirectoryPath = (userId: string): string => {
  return path.join(appPath, 'workspaces', userId);
};

export const getWorkspaceFilesDirectoryPath = (userId: string): string => {
  return path.join(getWorkspaceDirectoryPath(userId), 'files');
};

export const getAccountAvatarsDirectoryPath = (accountId: string): string => {
  return path.join(appPath, 'avatars', accountId);
};

export const hasInsertChanges = (result: InsertResult[]): boolean => {
  if (result.length === 0) {
    return false;
  }

  return result.some(
    (r) => r.numInsertedOrUpdatedRows && r.numInsertedOrUpdatedRows > 0n,
  );
};

export const hasUpdateChanges = (result: UpdateResult[]): boolean => {
  if (result.length === 0) {
    return false;
  }

  return result.some((r) => r.numUpdatedRows && r.numUpdatedRows > 0n);
};

export const hasDeleteChanges = (result: DeleteResult[]): boolean => {
  return result.some((r) => r.numDeletedRows && r.numDeletedRows > 0n);
};
