import { GSheetColumnMapping } from './types';
import { z } from 'zod';

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

export const UserSchema = z.object({
  pk: z.string(),
  sk: z.string(),
  account_id: z.string(),
  spreadsheet_id: z.string(),
  up_token: z.string(),
});

export interface User extends Exclude<z.infer<typeof UserSchema>, 'pk' | 'sk'> {
  user_id: string;
}

const mapping = z.custom<GSheetColumnMapping>((data: any) => {
  Object.keys(data).forEach((key) => {
    if (!key.match(/[A-Z]/)) {
      throw new Error('Key must be a single letter');
    }
  });
  return true;
});

export const ColumnMappingSchema = z.object({
  pk: z.string(),
  sk: z.string(),
  column_mappings: mapping,
});

export interface ColumnMapping extends Exclude<z.infer<typeof ColumnMappingSchema>, 'pk' | 'sk'> {}

export class UserSheetColumnMapping {
  user_id: string;
  year_month: number;
  column_mappings: GSheetColumnMapping;

  constructor(user_id: string, year_month: number, column_mappings: GSheetColumnMapping) {
    this.user_id = user_id;
    this.year_month = year_month;
    this.column_mappings = column_mappings;
  }
}
