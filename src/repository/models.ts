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

export class User {
  user_id: string;
  account_id: string;
  spreadsheet_id: string;
  up_token: string;

  constructor(user_id: string, account_id: string, spreadsheet_id: string, up_token: string) {
    this.user_id = user_id;
    this.account_id = account_id;
    this.spreadsheet_id = spreadsheet_id;
    this.up_token = up_token;
  }
}
