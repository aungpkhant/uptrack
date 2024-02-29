import { describe, vi, it, expect, beforeEach } from 'vitest';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { ColumnMappingRepo } from './columnMappings';
import { GSheetColumnMapping } from './types';

const queryMock = vi.fn();

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const mapping: GSheetColumnMapping = {
  A: {
    field: 'id',
    type: 'string',
  },
  B: {
    field: 'attributes.amount.value',
    type: 'string',
  },
  C: {
    field: 'attributes.createdAt',
    type: 'string',
    format: 'yyyy-MM-dd',
  },
  D: {
    field: null,
    type: 'string',
    value: 'bot',
  },
};

describe('ColumnMappingRepo', () => {
  const dynamo = {
    query: queryMock,
  } as unknown as DynamoDBDocument;
  const repo = new ColumnMappingRepo(dynamo);

  beforeEach(() => {
    queryMock.mockReset();
  });

  describe('getColumnMapping', () => {
    it('should throw error if query throws error', async () => {
      queryMock.mockRejectedValueOnce(new Error('error'));

      await expect(repo.getColumnMapping('1', 2022, 0)).rejects.toThrow(/error/);
    });

    it('should throw error if record is missing column_mappings', async () => {
      queryMock.mockResolvedValueOnce({ Items: [{ pk: 'user#1', sk: 'column_mapping#2022/00' }] });

      await expect(repo.getColumnMapping('1', 2022, 0)).rejects.toThrow();
    });

    it('should return the GSheet format for the given user ID, year, and month', async () => {
      dynamo.query = queryMock.mockReturnValue({
        Items: [{ pk: 'user#1', sk: 'column_mapping#2022/00', column_mappings: mapping }],
      });

      const result = await repo.getColumnMapping('1', 2022, 0);

      expect(result).toBe(mapping);
    });
  });
});
