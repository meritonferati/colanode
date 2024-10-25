import { FieldNode, FieldDataType } from '@/types/databases';
import { createContext, useContext } from 'react';

interface TableViewContext {
  id: string;
  name: string;
  avatar: string | null;
  fields: FieldNode[];
  hideField: (id: string) => void;
  showField: (id: string) => void;
  isHiddenField: (id: string) => boolean;
  getNameWidth: () => number;
  resizeName: (width: number) => void;
  getFieldWidth: (id: string, type: FieldDataType) => number;
  resizeField: (id: string, width: number) => void;
  moveField: (id: string, after: string) => void;
}

export const TableViewContext = createContext<TableViewContext>(
  {} as TableViewContext,
);

export const useTableView = () => useContext(TableViewContext);
