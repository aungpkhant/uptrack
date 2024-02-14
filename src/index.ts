import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import {
  UP_TOKEN,
  USER_ID,
  ACCOUNT_ID,
  SPREADHSHEET_ID,
  SYNC_DAYS_AGO,
  REGION,
  getParameter,
} from './env';
import { UpbankAPIClient } from './client/upbank/client';
import { subtractDaysFromDate } from './util';
import { TransactionRepo } from './repository/transactions';
import { SheetsAPIClient } from './client/gsheet/client';
import { Credentials } from './client/gsheet/models';
import { UptrackService } from './service/uptrack';
import { google } from 'googleapis';

async function init() {
  const credentialsString = await getParameter(
    '/production/google-cloud-credentials/service-account-json',
    true
  );
  if (credentialsString === undefined) {
    throw new Error(
      'Parameter /production/google-cloud-credentials/service-account-json not found'
    );
  }
  const credentials = JSON.parse(credentialsString) as Credentials;
  const { client_email, private_key } = credentials;
  const googleJWT = new google.auth.JWT(client_email, undefined, private_key, [
    'https://www.googleapis.com/auth/spreadsheets',
  ]);
  return new SheetsAPIClient(google.sheets({ version: 'v4', auth: googleJWT }));
}

export const handler = async (
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const gsheetClient = await init();
  const upbankClient = new UpbankAPIClient(UP_TOKEN);
  const transactionRepo = new TransactionRepo(REGION);
  const uptrackService = new UptrackService(upbankClient, gsheetClient, transactionRepo);

  const current = new Date();
  const since = subtractDaysFromDate(current, SYNC_DAYS_AGO);

  const results = await uptrackService.syncTransactions(
    USER_ID,
    ACCOUNT_ID,
    SPREADHSHEET_ID,
    since,
    current
  );

  return {
    statusCode: 200,
    body: JSON.stringify(results),
  };
};
