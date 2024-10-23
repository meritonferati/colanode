import { FileNode } from '@/types/files';

export type FileListQueryInput = {
  type: 'file_list';
  parentId: string;
  page: number;
  count: number;
  userId: string;
};

declare module '@/operations/queries' {
  interface QueryMap {
    file_list: {
      input: FileListQueryInput;
      output: FileNode[];
    };
  }
}
