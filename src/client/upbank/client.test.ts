import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { UpbankAPIClient } from './client';
import { ListTransactionParams, ListTransactionResponse } from './models';

const _fetch = global.fetch;
const mockFetch = vi.fn();

describe('UpbankAPIClient', () => {
  beforeAll(() => {
    global.fetch = mockFetch;
  });

  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterAll(() => {
    global.fetch = _fetch;
  });

  const client = new UpbankAPIClient();
  const upToken = 'TEST_UP_TOKEN';
  const accountID = 'TEST_ACCOUNT_ID';

  describe('listTransactionsByAccount', () => {
    it('should throw an error when request fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const params: ListTransactionParams = {
        size: 10,
        since: new Date('2021-01-01'),
        until: new Date('2021-01-31'),
        status: 'SETTLED',
      };

      await expect(
        client.listTransactionsByAccount(upToken, accountID, params)
      ).rejects.toThrowError(/listTransactionsByAccount failed with code/);
    });

    it('should return a list of transactions for a given account', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: '1',
              attributes: {
                createdAt: '2021-01-02T00:00:00Z',
                amount: 1000,
                description: 'Test transaction',
                status: 'SETTLED',
              },
            },
          ],
        }),
      });

      const params: ListTransactionParams = {
        size: 10,
        since: new Date('2021-01-01'),
        until: new Date('2021-01-31'),
        status: 'SETTLED',
      };

      const response: ListTransactionResponse = await client.listTransactionsByAccount(
        upToken,
        accountID,
        params
      );

      expect(mockFetch).toBeCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.up.com.au/api/v1/accounts/TEST_ACCOUNT_ID/transactions?page%5Bsize%5D=10&filter%5Bsince%5D=2021-01-01T00%3A00%3A00.000Z&filter%5Buntil%5D=2021-01-31T00%3A00%3A00.000Z&filter%5Bstatus%5D=SETTLED',
        {
          headers: {
            Authorization: `Bearer TEST_UP_TOKEN`,
          },
          method: 'GET',
        }
      );
      expect(response.data).toHaveLength(1);
      expect(response.data[0].id).toBe('1');
      expect(response.data[0].attributes.createdAt).toEqual(new Date('2021-01-02T00:00:00Z'));
    });
  });
});
