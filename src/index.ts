import { Context, APIGatewayProxyResult, APIGatewayEvent } from "aws-lambda";
import { UP_TOKEN, USER_ID, ACCOUNT_ID } from "./env";
import upbank from "./upbank/api";
import { subtractDaysFromDate } from "./util";
import dynamo from "./dynamodb/repository";

export const handler = async (
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const currentDate = new Date();

  const transactions = await upbank.listTransactionsByAccount(
    ACCOUNT_ID,
    UP_TOKEN,
    {
      size: 100,
      since: subtractDaysFromDate(currentDate, 4),
      until: currentDate,
    }
  );

  const syncedTransactions = await dynamo.listTransactions(
    USER_ID,
    transactions.data.map((t) => t.id)
  );
  const unsyncedTransactions = transactions.data.filter(
    (t) => !syncedTransactions.find((st) => st.transaction_id === t.id)
  );

  // push unsynced to gsheet

  // save in dynamodb

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "hello world",
    }),
  };
};
