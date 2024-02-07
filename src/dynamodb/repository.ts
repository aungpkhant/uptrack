import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { REGION } from "../env";
import { Transaction } from "./models";

const client = new DynamoDB({ region: REGION });
const dynamo = DynamoDBDocument.from(client);

async function listTransactions(userID: string, transactionIDs: string[]) {
  const keys = transactionIDs.map((transactionID) => ({
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

  try {
    const data = await dynamo.batchGet(params);
    if (!data.Responses || !data.Responses["uptrack_transactions"]) {
      throw new Error("No transactions found.");
    }
    console.log(data.Responses);
    return data.Responses["uptrack_transactions"].map(
      (item) =>
        ({
          owner_id: item.owner_id,
          transaction_id: item.transaction_id,
          transaction_created_at: item.transaction_created_at,
          content_hash: item.content_hash,
          created_at: item.created_at,
          updated_at: item.updated_at,
        }) as Transaction
    );
  } catch (error) {
    console.error("Error fetching transactions from dynamodb:", error);
    throw new Error("Failed to fetch transactions.");
  }
}

const repository = {
  listTransactions,
};

export default repository;
