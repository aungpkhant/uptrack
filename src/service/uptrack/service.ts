import { formatDate } from 'date-fns';
import { SheetsAPIClient } from '../../client/gsheet/client';
import { UpbankAPIClient } from '../../client/upbank/client';
import { Transaction } from '../../client/upbank/models';
import { mapToTransactionRecord } from '../../mapper/transaction';
import { ColumnMappingRepo } from '../../repository/columnMappings';
import { TransactionRepo } from '../../repository/transactions';
import { GSheetColumnMapping } from '../../repository/types';
import { getMonthShortName, hashTransaction, resolve } from '../../util';
import { MetricPublisherService } from '../metric-publisher/service';

class UptrackService {
  private upbankClient: UpbankAPIClient;
  private gsheetClient: SheetsAPIClient;
  private transactionRepo: TransactionRepo;
  private columnMappingRepo: ColumnMappingRepo;
  private metricPublisher: MetricPublisherService;

  constructor(
    upbankClient: UpbankAPIClient,
    gsheetClient: SheetsAPIClient,
    transactionRepo: TransactionRepo,
    columnMappingRepo: ColumnMappingRepo,
    metricPublisher: MetricPublisherService
  ) {
    this.upbankClient = upbankClient;
    this.gsheetClient = gsheetClient;
    this.transactionRepo = transactionRepo;
    this.columnMappingRepo = columnMappingRepo;
    this.metricPublisher = metricPublisher;
  }

  private filterExpenseTransasctions(transactions: Transaction[]) {
    return transactions.filter((t) => t.attributes.amount.valueInBaseUnits < 0);
  }

  // categorizeTransactions will categorize transactions into two categories:
  // 1. Transactions that need to be created in the Google Sheet
  // 2. Transactions that need to be updated in the Google Sheet
  private async categorizeTransactions(userID: string, transactions: Transaction[]) {
    const toCreate = [] as Transaction[];
    const toUpdate = [] as Transaction[];

    const createdTransactions = await this.transactionRepo.list(
      userID,
      transactions.map((t) => t.id)
    );

    transactions.forEach((t) => {
      const existing = createdTransactions.find((ct) => ct.transaction_id === t.id);
      if (!existing) {
        toCreate.push(t);
        return;
      }

      // Transaction exists in database, but need to check if update is needed
      const hash = hashTransaction(t);
      if (hash !== existing.content_hash) {
        toUpdate.push(t);
      }
    });

    return {
      toCreate,
      toUpdate,
    };
  }

  private groupTransactionsByMonthAndYear(transactions: Transaction[]) {
    const transactionByMonthMap = {} as Record<string, Transaction[]>;

    transactions.forEach((t) => {
      const m = t.attributes.createdAt.getMonth();
      const y = t.attributes.createdAt.getFullYear();

      const key = `${y}-${m}`;

      if (!transactionByMonthMap[key]) {
        transactionByMonthMap[key] = [];
      }
      transactionByMonthMap[key].push(t);
    });

    return transactionByMonthMap;
  }

  private formatTransactionToGoogleSheetRow(t: Transaction, format: GSheetColumnMapping) {
    const row = [] as string[];

    for (const [letter, mapping] of Object.entries(format)) {
      // turn A to index 0, B to index 2
      const columnIndex = letter.charCodeAt(0) - 65;

      // Constant value case
      if (mapping.field === null) {
        row[columnIndex] = mapping.value;
        continue;
      }

      // Upbank field case
      let value: any = resolve(mapping.field, t);
      if (mapping.type === 'timestamp' && mapping.format) {
        value = formatDate(value, mapping.format);
      }
      if (mapping.field === 'attributes.amount.value') {
        // Unsign the amount as only expenses are tracked
        value = value.split('-')[1];
      }

      row[columnIndex] = value;
    }

    return row;
  }

  private async updateTransactionsOnGoogleSheet(
    userID: string,
    spreadsheetID: string,
    transactions: Transaction[]
  ): Promise<Transaction[]> {
    if (transactions.length === 0) {
      return [];
    }
    const updatedTransactions = [] as Transaction[];
    const transactionByMonthMap = this.groupTransactionsByMonthAndYear(transactions);

    const promises = Object.keys(transactionByMonthMap).map(async (key) => {
      const [year, month] = key.split('-');
      const transactionsForMonth = transactionByMonthMap[key];

      const columnMapping = await this.columnMappingRepo.getColumnMapping(
        userID,
        Number(year),
        Number(month)
      );

      if (!columnMapping) {
        throw new Error(`No column mapping found for user ${userID} for ${year}-${month}`);
      }

      const sheetName = `${getMonthShortName(Number(month))} ${year}`;

      let idColumn;
      let categoryColumn;

      for (const [column, value] of Object.entries(columnMapping)) {
        if (value.field === 'id') {
          idColumn = column;
        }
        if (value.field === 'relationships.category.data.id') {
          categoryColumn = column;
        }
      }

      if (!idColumn || !categoryColumn) {
        // No id or category column, skip update
        return [];
      }

      let range;
      let indexIDColumn: 0 | -1;
      let categoryColumnIndex: 0 | -1;
      if (idColumn > categoryColumn) {
        range = `${categoryColumn}:${idColumn}`;
        indexIDColumn = idColumn.charCodeAt(0) - categoryColumn.charCodeAt(0);
        categoryColumnIndex = 0;
      } else {
        range = `${idColumn}:${categoryColumn}`;
        indexIDColumn = categoryColumn.charCodeAt(0) - idColumn.charCodeAt(0);
        categoryColumnIndex = -1;
      }

      const startGetDataGSheet = performance.now();
      // Check google sheets for existing transactions
      const res = await this.gsheetClient.get(spreadsheetID, sheetName, range);
      this.metricPublisher.recordExternalAPILatency(
        'GoogleSheets_GetData',
        performance.now() - startGetDataGSheet
      );

      if (res.status !== 200) {
        throw new Error(`Error getting data from google sheet: ${res.statusText}`);
      }

      const rows = res.data.values;

      if (!rows) {
        return [];
      }

      rows?.forEach((r) => {
        const id = r[indexIDColumn];
        const updatedTransaction = transactionsForMonth.find((t) => t.id === id);
        if (!updatedTransaction) {
          return;
        }
        r[categoryColumnIndex] = updatedTransaction.relationships.category.data?.id;
        updatedTransactions.push(updatedTransaction);
      });

      const startUpdateDataGSheet = performance.now();
      const updateRes = await this.gsheetClient
        .update(spreadsheetID, sheetName, range, rows)
        .finally(() => {
          this.metricPublisher.recordExternalAPILatency(
            'GoogleSheets_UpdateData',
            performance.now() - startUpdateDataGSheet
          );
        });
      if (updateRes.status !== 200) {
        throw new Error(`Error updating data in google sheet: ${updateRes.statusText}`);
      }
    });

    await Promise.all(promises);
    return updatedTransactions;
  }

  private async createTransactionsOnGoogleSheet(
    userID: string,
    spreadsheetID: string,
    transactions: Transaction[]
  ) {
    if (transactions.length === 0) {
      return [];
    }

    const transactionByMonthMap = this.groupTransactionsByMonthAndYear(transactions);
    const createdTransactions = [] as Transaction[];
    const promises = Object.keys(transactionByMonthMap).map(async (key) => {
      const [year, month] = key.split('-');
      const transactionsForMonth = transactionByMonthMap[key];

      const columnMapping = await this.columnMappingRepo.getColumnMapping(
        userID,
        Number(year),
        Number(month)
      );

      if (!columnMapping) {
        throw new Error(`No column mapping found for user ${userID} for ${year}-${month}`);
      }

      const rows = transactionsForMonth.map((t) =>
        this.formatTransactionToGoogleSheetRow(t, columnMapping)
      );
      const sheetName = `${getMonthShortName(Number(month))} ${year}`;

      const startAppendDataGSheet = performance.now();
      await this.gsheetClient
        .appendData(spreadsheetID, sheetName, 'A:H', rows)
        .then(() => {
          createdTransactions.push(...transactionsForMonth);
        })
        .catch((e) => {
          console.error(
            `Error appending ${transactionsForMonth.length} rows to gsheet`,
            transactionsForMonth
          );
        })
        .finally(() => {
          const endAppendDataGSheet = performance.now();
          this.metricPublisher.recordExternalAPILatency(
            'GoogleSheets_AppendData',
            endAppendDataGSheet - startAppendDataGSheet
          );
        });
    });

    await Promise.all(promises);
    return createdTransactions;
  }

  async syncTransactions(
    userID: string,
    accountID: string,
    spreadsheetID: string,
    upToken: string,
    since: Date,
    until: Date
  ) {
    const startListTransactionsByAccount = performance.now();
    const response = await this.upbankClient.listTransactionsByAccount(upToken, accountID, {
      size: 100,
      since,
      until,
      status: 'SETTLED',
    });
    const endListTransactionsByAccount = performance.now();
    this.metricPublisher.recordExternalAPILatency(
      'Upbank_ListTransactionsByAccount',
      endListTransactionsByAccount - startListTransactionsByAccount
    );

    let transactions = response.data;
    if (transactions.length === 0) {
      return;
    }

    transactions = this.filterExpenseTransasctions(transactions);

    // Get oldest transactions first
    transactions.reverse();

    const { toCreate, toUpdate } = await this.categorizeTransactions(userID, transactions);

    const updatedTransactionsGoogleSheet = await this.updateTransactionsOnGoogleSheet(
      userID,
      spreadsheetID,
      toUpdate
    );

    if (toUpdate.length > 0) {
      await this.transactionRepo.batchUpsert(
        userID,
        toUpdate.map((t) => {
          const record = mapToTransactionRecord(t, userID);
          return record;
        })
      );
    }

    const createdTransactionsGoogleSheet = await this.createTransactionsOnGoogleSheet(
      userID,
      spreadsheetID,
      toCreate
    );

    if (createdTransactionsGoogleSheet.length > 0) {
      await this.transactionRepo.batchUpsert(
        userID,
        createdTransactionsGoogleSheet.map((t) => {
          const record = mapToTransactionRecord(t, userID);
          return record;
        })
      );
    }

    return {
      created: createdTransactionsGoogleSheet.length,
      updated: updatedTransactionsGoogleSheet.length,
      in_sync: transactions.length - createdTransactionsGoogleSheet.length,
      checked: transactions.length,
    };
  }
}

export { UptrackService };
