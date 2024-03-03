import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { TransactionRecord } from './models';

class TransactionRepo {
  private dynamo: DynamoDBDocument;
  private readonly tableName = 'uptrack';

  constructor(dynamo: DynamoDBDocument) {
    this.dynamo = dynamo;
  }

  async list(userID: string, trxRecordIDs: string[]) {
    const keys = trxRecordIDs.map((transactionID) => ({
      pk: `user#${userID}`,
      sk: `transaction#${transactionID}`,
    }));
    const params = {
      RequestItems: {
        [this.tableName]: {
          Keys: keys,
        },
      },
    };

    const data = await this.dynamo.batchGet(params);
    if (!data.Responses || !data.Responses[this.tableName]) {
      throw new Error(`No responses found for table ${this.tableName}`);
    }
    return data.Responses[this.tableName].map(
      (item) =>
        ({
          owner_id: userID,
          transaction_id: item.transaction_id,
          transaction_created_at: item.transaction_created_at,
          content_hash: item.content_hash,
          created_at: item.created_at,
        }) as TransactionRecord
    );
  }

  async batchCreate(userID: string, transactions: TransactionRecord[]) {
    const params = {
      RequestItems: {
        [this.tableName]: transactions.map((transaction) => ({
          PutRequest: {
            Item: {
              pk: `user#${userID}`,
              sk: `transaction#${transaction.transaction_id}`,
              transaction_id: transaction.transaction_id,
              transaction_created_at: transaction.transaction_created_at,
              content_hash: transaction.content_hash,
              created_at: transaction.transaction_created_at,
            },
          },
        })),
      },
    };
    await this.dynamo.batchWrite(params);
  }
}

export { TransactionRepo };
