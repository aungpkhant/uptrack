import { describe, vi, it, expect, beforeEach } from 'vitest';
import { UserRepo } from './users';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';

const get = vi.fn();

const userRecord = {
  pk: 'user#1',
  sk: 'user#1',
  account_id: 'account_id',
  spreadsheet_id: 'spreadsheet_id',
  up_token: 'up_token',
};

describe('UserRepo', () => {
  const dynamo = {
    get: get,
  } as unknown as DynamoDBDocument;
  const repo = new UserRepo(dynamo);

  beforeEach(() => {
    get.mockReset();
  });

  describe('getByID', () => {
    it('should throw error if get throws error', async () => {
      get.mockRejectedValueOnce(new Error('error'));

      await expect(repo.getByID('1')).rejects.toThrow(/error/);
      expect(get).toBeCalledWith({
        TableName: 'uptrack',
        Key: { pk: 'user#1', sk: 'user#1' },
      });
    });

    it('should throw error if record fails to parse', async () => {
      get.mockResolvedValueOnce({ Item: { pk: 'user#1', sk: null } });

      await expect(repo.getByID('1')).rejects.toThrow();
      expect(get).toBeCalledWith({
        TableName: 'uptrack',
        Key: { pk: 'user#1', sk: 'user#1' },
      });
    });

    it('should list get a user by ID', async () => {
      get.mockResolvedValueOnce({ Item: userRecord });

      await expect(repo.getByID('1')).resolves.toEqual({
        user_id: '1',
        account_id: 'account_id',
        spreadsheet_id: 'spreadsheet_id',
        up_token: 'up_token',
      });
      expect(get).toBeCalledWith({
        TableName: 'uptrack',
        Key: { pk: 'user#1', sk: 'user#1' },
      });
    });
  });
});
