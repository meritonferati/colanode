import { ServerNodeTransaction } from './sync';
import { NodeAttributes } from '../registry';

export type NodeOutput = {
  id: string;
  workspaceId: string;
  parentId: string;
  type: string;
  attributes: NodeAttributes;
  state: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string | null;
  updatedBy?: string | null;
  transactionId: string;
};

export type GetNodeTransactionsOutput = {
  transactions: ServerNodeTransaction[];
};
