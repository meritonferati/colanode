import {
  canCreateFile,
  CreateFileMutationData,
  FileStatus,
  generateId,
  IdType,
} from '@colanode/core';

import { fileService } from '@/main/services/file-service';
import { MutationHandler } from '@/main/types';
import {
  FileCreateMutationInput,
  FileCreateMutationOutput,
} from '@/shared/mutations/files/file-create';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import { databaseService } from '@/main/data/database-service';
import { eventBus } from '@/shared/lib/event-bus';
import {
  fetchEntry,
  fetchUser,
  fetchUserStorageUsed,
  mapEntry,
  mapFile,
} from '@/main/utils';
import { formatBytes } from '@/shared/lib/files';
import { DownloadStatus, UploadStatus } from '@/shared/types/files';

export class FileCreateMutationHandler
  implements MutationHandler<FileCreateMutationInput>
{
  async handleMutation(
    input: FileCreateMutationInput
  ): Promise<FileCreateMutationOutput> {
    const metadata = fileService.getFileMetadata(input.filePath);
    if (!metadata) {
      throw new MutationError(
        MutationErrorCode.FileInvalid,
        'File is invalid or could not be read.'
      );
    }

    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const user = await fetchUser(workspaceDatabase, input.userId);
    if (!user) {
      throw new MutationError(
        MutationErrorCode.UserNotFound,
        'There was an error while fetching the user. Please make sure you are logged in.'
      );
    }

    if (metadata.size > user.max_file_size) {
      throw new MutationError(
        MutationErrorCode.FileTooLarge,
        'The file you are trying to upload is too large. The maximum file size is ' +
          formatBytes(user.max_file_size)
      );
    }

    const storageUsed = await fetchUserStorageUsed(
      workspaceDatabase,
      input.userId
    );

    if (storageUsed + BigInt(metadata.size) > user.storage_limit) {
      throw new MutationError(
        MutationErrorCode.StorageLimitExceeded,
        'You have reached your storage limit. You have used ' +
          formatBytes(storageUsed) +
          ' and you are trying to upload a file of size ' +
          formatBytes(metadata.size) +
          '. Your storage limit is ' +
          formatBytes(user.storage_limit)
      );
    }

    const entry = await fetchEntry(workspaceDatabase, input.entryId);
    if (!entry) {
      throw new MutationError(
        MutationErrorCode.EntryNotFound,
        'There was an error while fetching the entry. Please make sure you have access to this entry.'
      );
    }

    const root = await fetchEntry(workspaceDatabase, input.rootId);
    if (!root) {
      throw new MutationError(
        MutationErrorCode.RootNotFound,
        'There was an error while fetching the root. Please make sure you have access to this root.'
      );
    }

    const fileId = generateId(IdType.File);
    if (
      !canCreateFile({
        user: {
          userId: input.userId,
          role: user.role,
        },
        root: mapEntry(root),
        entry: mapEntry(entry),
        file: {
          id: fileId,
          parentId: input.parentId,
        },
      })
    ) {
      throw new MutationError(
        MutationErrorCode.FileCreateForbidden,
        'You are not allowed to upload a file in this entry.'
      );
    }

    fileService.copyFileToWorkspace(
      input.filePath,
      fileId,
      metadata.extension,
      input.userId
    );

    const mutationData: CreateFileMutationData = {
      id: fileId,
      type: metadata.type,
      parentId: input.parentId,
      entryId: input.entryId,
      rootId: input.rootId,
      name: metadata.name,
      originalName: metadata.name,
      extension: metadata.extension,
      mimeType: metadata.mimeType,
      size: metadata.size,
      createdAt: new Date().toISOString(),
    };

    const createdFile = await workspaceDatabase
      .transaction()
      .execute(async (tx) => {
        const createdFile = await tx
          .insertInto('files')
          .returningAll()
          .values({
            id: fileId,
            type: metadata.type,
            parent_id: input.parentId,
            entry_id: input.entryId,
            root_id: input.rootId,
            name: metadata.name,
            original_name: metadata.name,
            mime_type: metadata.mimeType,
            size: metadata.size,
            extension: metadata.extension,
            created_at: new Date().toISOString(),
            created_by: input.userId,
            status: FileStatus.Pending,
            version: 0n,
          })
          .executeTakeFirst();

        if (!createdFile) {
          throw new Error('Failed to create file.');
        }

        await tx
          .insertInto('file_states')
          .values({
            file_id: fileId,
            created_at: new Date().toISOString(),
            download_progress: 100,
            download_status: DownloadStatus.Completed,
            download_retries: 0,
            upload_progress: 0,
            upload_status: UploadStatus.Pending,
            upload_retries: 0,
          })
          .execute();

        await tx
          .insertInto('mutations')
          .values({
            id: generateId(IdType.Mutation),
            type: 'create_file',
            data: JSON.stringify(mutationData),
            created_at: new Date().toISOString(),
            retries: 0,
          })
          .execute();

        return createdFile;
      });

    if (!createdFile) {
      throw new Error('Failed to create file.');
    }

    eventBus.publish({
      type: 'file_created',
      userId: input.userId,
      file: mapFile(createdFile),
    });

    eventBus.publish({
      type: 'mutation_created',
      userId: input.userId,
    });

    eventBus.publish({
      type: 'file_state_created',
      userId: input.userId,
      fileState: {
        fileId: fileId,
        downloadProgress: 100,
        downloadStatus: DownloadStatus.Completed,
        downloadRetries: 0,
        uploadProgress: 10,
        uploadStatus: UploadStatus.Pending,
        uploadRetries: 0,
        createdAt: new Date().toISOString(),
        updatedAt: null,
      },
    });

    return {
      id: fileId,
    };
  }
}
