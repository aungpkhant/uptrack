import { ListTransactionParams, ListTransactionResponse } from "./models";

const UPBANK_BASE_URL = "https://api.up.com.au/api/v1";

function formatListTransactionsParams(
  params: ListTransactionParams
): URLSearchParams {
  const p = new URLSearchParams();
  p.append("page[size]", params.size.toString());
  p.append("filter[since]", params.since.toISOString());
  p.append("filter[until]", params.until.toISOString());
  return p;
}

function listTransactionsByAccount(
  accountID: string,
  upToken: string,
  params: ListTransactionParams
): Promise<ListTransactionResponse> {
  const url = `${UPBANK_BASE_URL}/accounts/${accountID}/transactions?${formatListTransactionsParams(params)}`;
  return fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${upToken}`,
    },
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error(res.statusText);
      }
      return res.json();
    })
    .then((data) => {
      return data.data;
    });
}

const upbank = {
  listTransactionsByAccount,
};

export default upbank;
