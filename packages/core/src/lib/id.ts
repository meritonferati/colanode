import { monotonicFactory } from 'ulid';

const ulid = monotonicFactory();

export enum IdType {
  Account = 'ac',
  Workspace = 'wc',
  User = 'us',
  Version = 've',
  Mutation = 'mu',
  Space = 'sp',
  Page = 'pg',
  Channel = 'ch',
  Chat = 'ct',
  Node = 'nd',
  Message = 'ms',
  Subscriber = 'sb',
  Database = 'db',
  DatabaseReplica = 'dr',
  Record = 'rc',
  Folder = 'fl',
  View = 'vw',
  Field = 'fd',
  SelectOption = 'so',
  ViewFilter = 'vf',
  ViewSort = 'vs',
  Query = 'qu',
  Emoji = 'em',
  Avatar = 'av',
  Icon = 'ic',
  File = 'fi',
  FilePlaceholder = 'fp',
  Device = 'dv',
  Upload = 'up',
  Transaction = 'tx',
  Event = 'ev',
  Host = 'ht',
  Block = 'bl',
}

export const generateId = (type: IdType): string => {
  return ulid().toLowerCase() + type;
};

export const isIdOfType = (id: string, type: IdType): boolean => {
  return id.endsWith(type);
};

export const getIdType = (id: string): IdType => {
  return id.substring(id.length - 2) as IdType;
};
