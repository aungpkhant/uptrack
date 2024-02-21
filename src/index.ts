import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { REGION, getParameter } from './env';
import { UpbankAPIClient } from './client/upbank/client';
import { subtractDaysFromDate } from './util';
import { TransactionRepo } from './repository/transactions';
import { SheetsAPIClient } from './client/gsheet/client';
import { Credentials } from './client/gsheet/models';
import { UptrackService } from './service/uptrack/service';
import { google } from 'googleapis';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { UserRepo } from './repository/users';
import { MetricPublisherService } from './service/metric-publisher/service';
import { CloudWatchClient } from '@aws-sdk/client-cloudwatch';

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

interface CustomAPIGatewayEvent extends APIGatewayEvent {
  action: 'sync';
  details: {
    user: string;
    sync_days_ago: number;
  };
}

export const handler = async (
  event: CustomAPIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const { action, details } = event;

  // Initialize services
  const gsheetClient = await init();
  const ddbClient = new DynamoDB({ region: REGION });
  const dynamo = DynamoDBDocument.from(ddbClient);
  const transactionRepo = new TransactionRepo(dynamo);
  const userRepo = new UserRepo(dynamo);
  const upbankClient = new UpbankAPIClient();
  const cloudWatchClient = new CloudWatchClient({ region: REGION });
  const metricPublisher = new MetricPublisherService(cloudWatchClient);
  const uptrackService = new UptrackService(
    upbankClient,
    gsheetClient,
    transactionRepo,
    metricPublisher
  );

  if (action === 'sync') {
    const { sync_days_ago, user } = details;

    const current = new Date();
    const since = subtractDaysFromDate(current, sync_days_ago);

    const u = await userRepo.getByID(user);

    const results = await uptrackService.syncTransactions(
      u.user_id,
      u.account_id,
      u.spreadsheet_id,
      u.up_token,
      since,
      current
    );
    await metricPublisher.flush();

    return {
      statusCode: 200,
      body: JSON.stringify({
        action,
        details: results,
      }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(action),
  };
};
