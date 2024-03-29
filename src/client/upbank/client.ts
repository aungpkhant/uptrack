import { ListTransactionParams, ListTransactionResponse } from './models';

export const UPBANK_BASE_URL = 'https://api.up.com.au/api/v1';

class UpbankAPIClient {
  private formatListTransactionsParams(params: ListTransactionParams): URLSearchParams {
    const p = new URLSearchParams();
    p.append('page[size]', params.size.toString());
    p.append('filter[since]', params.since.toISOString());
    p.append('filter[until]', params.until.toISOString());
    p.append('filter[status]', params.status);
    return p;
  }

  listTransactionsByAccount(
    upToken: string,
    accountID: string,
    params: ListTransactionParams
  ): Promise<ListTransactionResponse> {
    const p = this.formatListTransactionsParams(params);
    const url = `${UPBANK_BASE_URL}/accounts/${accountID}/transactions?${p}`;
    return fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${upToken}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`listTransactionsByAccount failed with code ${res.status}`);
        }
        return res.json();
      })
      .then((res: ListTransactionResponse) => {
        res.data.forEach((t) => {
          t.attributes.createdAt = new Date(t.attributes.createdAt);
        });
        return res;
      });
  }
}

export { UpbankAPIClient };
