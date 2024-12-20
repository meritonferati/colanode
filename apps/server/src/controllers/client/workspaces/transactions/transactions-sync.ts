import { Request, Response } from 'express';
import {
  LocalCreateTransaction,
  LocalDeleteTransaction,
  LocalTransaction,
  LocalUpdateTransaction,
  SyncTransactionResult,
  SyncTransactionsInput,
  SyncTransactionStatus,
} from '@colanode/core';

import { SelectUser } from '@/data/schema';
import { nodeService } from '@/services/node-service';

export const transactionsSyncHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const input = req.body as SyncTransactionsInput;

  const results: SyncTransactionResult[] = [];
  for (const transaction of input.transactions) {
    try {
      const status = await handleLocalTransaction(res.locals.user, transaction);
      results.push({
        id: transaction.id,
        status: status,
      });
    } catch (error) {
      console.error('Error handling local transaction', error);
      results.push({
        id: transaction.id,
        status: 'error',
      });
    }
  }

  console.log('executed mutations', results);
  res.status(200).json({ results });
};

const handleLocalTransaction = async (
  user: SelectUser,
  transaction: LocalTransaction
): Promise<SyncTransactionStatus> => {
  if (transaction.operation === 'create') {
    return await handleCreateTransaction(user, transaction);
  } else if (transaction.operation === 'update') {
    return await handleUpdateTransaction(user, transaction);
  } else if (transaction.operation === 'delete') {
    return await handleDeleteTransaction(user, transaction);
  } else {
    return 'error';
  }
};

const handleCreateTransaction = async (
  user: SelectUser,
  transaction: LocalCreateTransaction
): Promise<SyncTransactionStatus> => {
  const output = await nodeService.applyCreateTransaction(user, {
    id: transaction.id,
    nodeId: transaction.nodeId,
    data: transaction.data,
    createdAt: new Date(transaction.createdAt),
  });

  if (!output) {
    return 'error';
  }

  return 'success';
};

const handleUpdateTransaction = async (
  user: SelectUser,
  transaction: LocalUpdateTransaction
): Promise<SyncTransactionStatus> => {
  const output = await nodeService.applyUpdateTransaction(user, {
    id: transaction.id,
    nodeId: transaction.nodeId,
    userId: transaction.createdBy,
    data: transaction.data,
    createdAt: new Date(transaction.createdAt),
  });

  if (!output) {
    return 'error';
  }

  return 'success';
};

const handleDeleteTransaction = async (
  user: SelectUser,
  transaction: LocalDeleteTransaction
): Promise<SyncTransactionStatus> => {
  const output = await nodeService.applyDeleteTransaction(user, {
    id: transaction.id,
    nodeId: transaction.nodeId,
    createdAt: new Date(transaction.createdAt),
  });

  if (!output) {
    return 'error';
  }

  return 'success';
};
