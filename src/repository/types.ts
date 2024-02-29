import { Leaves } from '../types';
import { Transaction } from '../client/upbank/models';

type ColumnConstant = { field: null; type: 'string'; value: string };

type UpbankFields = Leaves<Transaction> | 'attributes.createdAt';
type ColumnUpbank = {
  field: UpbankFields;
  type: 'string' | 'timestamp';
  format?: string;
};

type ColumnMapping = ColumnConstant | ColumnUpbank;

type UppercaseLetter =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'I'
  | 'J'
  | 'K'
  | 'L'
  | 'M'
  | 'N'
  | 'O'
  | 'P'
  | 'Q'
  | 'R'
  | 'S'
  | 'T'
  | 'U'
  | 'V'
  | 'W'
  | 'X'
  | 'Y'
  | 'Z';

export type GSheetColumnMapping = Record<UppercaseLetter, ColumnMapping>;
