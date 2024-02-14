import { describe, vi, it, expect } from 'vitest';
import { TransactionRepo } from './transactions';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';

const batchGetMock = vi.fn();

const transactionRecords = [
  {
    owner_id: 'user_1',
    transaction_id: 'trx_1',
    transaction_created_at: '2021-01-01',
    content_hash: 'hash',
    created_at: '2021-01-01',
    updated_at: '2021-01-01',
  },
  {
    owner_id: 'user_1',
    transaction_id: 'trx_2',
    transaction_created_at: '2021-01-01',
    content_hash: 'hash2',
    created_at: '2021-01-01',
    updated_at: '2021-01-01',
  },
];

describe('TransactionRepo', () => {
  const dynamo = {
    batchGet: batchGetMock,
  } as unknown as DynamoDBDocument;
  const repo = new TransactionRepo(dynamo);

  describe('list', () => {
    it('should throw error if no responses returned', async () => {
      batchGetMock.mockResolvedValue({});
      await expect(repo.list('user_id', ['trx_id'])).rejects.toThrow(
        /No responses found for table/
      );
    });

    it('should list transactions', async () => {
      batchGetMock.mockResolvedValue({
        Responses: {
          uptrack_transactions: [...transactionRecords],
        },
      });

      await expect(repo.list('user_id', ['trx_id'])).resolves.toEqual([...transactionRecords]);
    });
  });
});
