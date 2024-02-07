export class TransactionRecord {
  owner_id: string;
  transaction_id: string;
  transaction_created_at: string;
  content_hash: string;

  constructor(
    owner_id: string,
    transaction_id: string,
    transaction_created_at: string,
    content_hash: string
  ) {
    this.owner_id = owner_id;
    this.transaction_id = transaction_id;
    this.transaction_created_at = transaction_created_at;
    this.content_hash = content_hash;
  }
}
