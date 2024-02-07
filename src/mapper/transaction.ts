import { Transaction } from "../client/upbank/models";
import { TransactionRecord } from "../repository/models";
import { hashTransaction } from "../util";

export function mapToTransactionRecord(
  t: Transaction,
  userID: string
): TransactionRecord {
  return new TransactionRecord(
    userID,
    t.id,
    t.attributes.createdAt.toISOString(),
    hashTransaction(t)
  );
}
