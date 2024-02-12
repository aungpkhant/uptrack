import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { UpbankAPIClient } from "./client";
import { ListTransactionParams, ListTransactionResponse } from "./models";

let _fetch = global.fetch;
let mockFetch = vi.fn();

describe("UpbankAPIClient", () => {
  beforeAll(() => {
    global.fetch = mockFetch;
  });

  afterAll(() => {
    global.fetch = _fetch;
  });

  const upToken = "TEST_UP_TOKEN";
  const client = new UpbankAPIClient(upToken);

  describe("listTransactionsByAccount", () => {
    it("should return a list of transactions for a given account", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: "1",
              attributes: {
                createdAt: "2021-01-02T00:00:00Z",
                amount: 1000,
                description: "Test transaction",
                status: "SETTLED",
              },
            },
          ],
        }),
      });

      const accountID = "TEST_ACCOUNT_ID";
      const params: ListTransactionParams = {
        size: 10,
        since: new Date("2021-01-01"),
        until: new Date("2021-01-31"),
        status: "SETTLED",
      };

      const response: ListTransactionResponse =
        await client.listTransactionsByAccount(accountID, params);

      expect(mockFetch).toBeCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.up.com.au/api/v1/accounts/TEST_ACCOUNT_ID/transactions?page%5Bsize%5D=10&filter%5Bsince%5D=2021-01-01T00%3A00%3A00.000Z&filter%5Buntil%5D=2021-01-31T00%3A00%3A00.000Z&filter%5Bstatus%5D=SETTLED",
        {
          headers: {
            Authorization: `Bearer ${upToken}`,
          },
          method: "GET",
        }
      );
      expect(response.data).toHaveLength(1);
      expect(response.data[0].id).toBe("1");
      expect(response.data[0].attributes.createdAt).toEqual(
        new Date("2021-01-02T00:00:00Z")
      );
    });
  });
});
