export type ApiErrorOutput = {
  message: string;
  code: ApiErrorCode;
};

export enum ApiErrorCode {
  AccountNotFound = 'account_not_found',
  AccountMismatch = 'account_mismatch',
  AccountPendingActivation = 'account_pending_activation',
  EmailOrPasswordIncorrect = 'email_or_password_incorrect',
  GoogleAuthFailed = 'google_auth_failed',
  AccountCreationFailed = 'account_creation_failed',
  EmailAlreadyExists = 'email_already_exists',
  AvatarNotFound = 'avatar_not_found',
  AvatarDownloadFailed = 'avatar_download_failed',
  AvatarFileNotUploaded = 'avatar_file_not_uploaded',
  AvatarUploadFailed = 'avatar_upload_failed',
  WorkspaceNameRequired = 'workspace_name_required',
  WorkspaceDeleteNotAllowed = 'workspace_delete_not_allowed',
  WorkspaceNotFound = 'workspace_not_found',
  WorkspaceNoAccess = 'workspace_no_access',
  WorkspaceUpdateNotAllowed = 'workspace_update_not_allowed',
  WorkspaceUpdateFailed = 'workspace_update_failed',
  FileNotFound = 'file_not_found',
  FileNoAccess = 'file_no_access',
  FileOwnerMismatch = 'file_owner_mismatch',
  WorkspaceMismatch = 'workspace_mismatch',
  FileError = 'file_error',
  FileSizeMismatch = 'file_size_mismatch',
  FileMimeTypeMismatch = 'file_mime_type_mismatch',
  FileUploadCompleteFailed = 'file_upload_complete_failed',
  UserEmailRequired = 'user_email_required',
  UserInviteNoAccess = 'user_invite_no_access',
  UserUpdateNoAccess = 'user_update_no_access',
  UserNotFound = 'user_not_found',
  TokenMissing = 'token_missing',
  TokenInvalid = 'token_invalid',

  Unauthorized = 'unauthorized',
  Forbidden = 'forbidden',
  NotFound = 'not_found',
  BadRequest = 'bad_request',
  Unknown = 'unknown',
}
