export * from './messages';
export * from './transactions';
export * from './users';
export * from './files';
export * from './message-reactions';
export * from './message-interactions';
export * from './file-interactions';
export * from './entry-interactions';
export * from './collaborations';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SynchronizerMap {}

export type SynchronizerInput = SynchronizerMap[keyof SynchronizerMap]['input'];
