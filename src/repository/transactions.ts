import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { TransactionRecord } from './models';

class TransactionRepo {
  private dynamo: DynamoDBDocument;

  constructor(dynamo: DynamoDBDocument) {
    this.dynamo = dynamo;
  }

  async list(userID: string, trxRecordIDs: string[]) {
    const keys = trxRecordIDs.map((transactionID) => ({
      owner_id: userID,
      transaction_id: transactionID,
    }));
    const params = {
      RequestItems: {
        uptrack_transactions: {
          Keys: keys,
        },
      },
    };

    const data = await this.dynamo.batchGet(params);
    if (!data.Responses || !data.Responses['uptrack_transactions']) {
      throw new Error('No responses found for table uptrack_transactions');
    }
    return data.Responses['uptrack_transactions'].map(
      (item) =>
        ({
          owner_id: item.owner_id,
          transaction_id: item.transaction_id,
          transaction_created_at: item.transaction_created_at,
          content_hash: item.content_hash,
          created_at: item.created_at,
          updated_at: item.updated_at,
        }) as TransactionRecord
    );
  }

  async batchCreate(userID: string, transactions: TransactionRecord[]) {
    const params = {
      RequestItems: {
        uptrack_transactions: transactions.map((transaction) => ({
          PutRequest: {
            Item: transaction,
          },
        })),
      },
    };
    await this.dynamo.batchWrite(params);
  }
}

export { TransactionRepo };
