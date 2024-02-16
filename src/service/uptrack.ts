import { SheetsAPIClient } from '../client/gsheet/client';
import { UpbankAPIClient } from '../client/upbank/client';
import { Transaction } from '../client/upbank/models';
import { mapToTransactionRecord } from '../mapper/transaction';
import { TransactionRepo } from '../repository/transactions';
import { getMonthShortName, hashTransaction } from '../util';

class UptrackService {
  private upbankClient: UpbankAPIClient;
  private gsheetClient: SheetsAPIClient;
  private transactionRepo: TransactionRepo;

  constructor(
    upbankClient: UpbankAPIClient,
    gsheetClient: SheetsAPIClient,
    transactionRepo: TransactionRepo
  ) {
    this.upbankClient = upbankClient;
    this.gsheetClient = gsheetClient;
    this.transactionRepo = transactionRepo;
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

      const key = `${getMonthShortName(m)} ${y}`;

      if (!transactionByMonthMap[key]) {
        transactionByMonthMap[key] = [];
      }
      transactionByMonthMap[key].push(t);
    });

    return transactionByMonthMap;
  }

  private formatTransactionToGoogleSheetRow(t: Transaction) {
    const date = `${t.attributes.createdAt.getDate()} ${getMonthShortName(t.attributes.createdAt.getMonth())} ${t.attributes.createdAt.getFullYear()}`;
    const unsignedAmount = t.attributes.amount.value.split('-')[1];
    return [
      date,
      t.attributes.description,
      t.attributes.message,
      t.relationships.category?.data?.id,
      unsignedAmount,
      null,
      unsignedAmount,
      'bot',
    ];
  }

  private createTransactionsOnGoogleSheet(spreadsheetID: string, transactions: Transaction[]) {
    if (transactions.length === 0) {
      return null;
    }
    const transactionByMonthMap = this.groupTransactionsByMonthAndYear(transactions);

    return Object.keys(transactionByMonthMap).map((key) => {
      const sheetName = key;
      const transactionsForMonth = transactionByMonthMap[key];
      const rows = transactionsForMonth.map(this.formatTransactionToGoogleSheetRow);

      return this.gsheetClient
        .appendData(spreadsheetID, sheetName, 'A:H', rows)
        .then(() => {
          return transactionsForMonth;
        })
        .catch((e) => {
          console.error(
            `Error appending ${transactionsForMonth.length} rows to gsheet`,
            transactionsForMonth
          );
          return transactionsForMonth;
        });
    });
  }

  async syncTransactions(
    userID: string,
    accountID: string,
    spreadsheetID: string,
    upToken: string,
    since: Date,
    until: Date
  ) {
    const response = await this.upbankClient.listTransactionsByAccount(upToken, accountID, {
      size: 100,
      since,
      until,
      status: 'SETTLED',
    });

    let transactions = response.data;
    if (transactions.length === 0) {
      return;
    }

    transactions = this.filterExpenseTransasctions(transactions);

    // Get oldest transactions first
    transactions.reverse();

    const { toCreate, toUpdate } = await this.categorizeTransactions(userID, transactions);

    let createdTransactionsGoogleSheet = [] as Transaction[];

    if (toCreate.length > 0) {
      const promises = this.createTransactionsOnGoogleSheet(spreadsheetID, toCreate);

      // Maybe better to move this logic to createTransactionsOnGoogleSheet?
      if (promises !== null) {
        await Promise.allSettled(promises).then((results) => {
          results.forEach((result) => {
            if (result.status === 'fulfilled') {
              createdTransactionsGoogleSheet = createdTransactionsGoogleSheet.concat(result.value);
            }
          });
        });
      }
    }

    if (createdTransactionsGoogleSheet.length > 0) {
      await this.transactionRepo.batchCreate(
        userID,
        createdTransactionsGoogleSheet.map((t) => {
          const record = mapToTransactionRecord(t, userID);
          return record;
        })
      );
    }

    return {
      created: createdTransactionsGoogleSheet.length,
      updated: 0,
    };
  }
}

export { UptrackService };
