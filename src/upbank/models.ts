export interface ListTransactionParams {
  size: number;
  since: Date;
  until: Date;
}

export interface ListTransactionResponse {
  data: Transaction[];
}

export interface Transaction {
  type: string;
  id: string;
  attributes: Attributes;
  relationships: Relationships;
}

export interface Attributes {
  status: string;
  rawText: string;
  description: string;
  message: null;
  isCategorizable: boolean;
  holdInfo: HoldInfo;
  roundUp: null;
  cashback: null;
  amount: Amount;
  foreignAmount: null;
  cardPurchaseMethod: null;
  settledAt: null;
  createdAt: Date;
}

export interface Amount {
  currencyCode: string;
  value: string;
  valueInBaseUnits: number;
}

export interface HoldInfo {
  amount: Amount;
  foreignAmount: null;
}

export interface Relationships {
  account: Account;
  transferAccount: TransferAccount;
  category: Category;
  parentCategory: Account;
  tags: Tags;
}

export interface Account {
  data: Data;
}

export interface Data {
  type: string;
  id: string;
}

export interface AccountLinks {
  related: string;
}

export interface Category {
  data: Data;
}

export interface Tags {
  data: any[];
}

export interface TransferAccount {
  data: null;
}
