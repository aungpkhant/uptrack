import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { UserSheetColumnMapping } from './models';

class ColumnMappingRepo {
  private dynamo: DynamoDBDocument;
  private readonly tableName = 'uptrack_gsheet_formats';

  constructor(dynamo: DynamoDBDocument) {
    this.dynamo = dynamo;
  }

  async getGSheetFormatForYearAndMonth(userID: string, year: number, month: number) {
    const yearMonth = year * 100 + month;
    const params = {
      TableName: this.tableName,
      KeyConditionExpression: 'user_id = :user_id AND year_month <= :year_month',
      ExpressionAttributeValues: {
        ':user_id': userID,
        ':year_month': yearMonth,
      },
      ScanIndexForward: false,
      Limit: 1,
    };

    const data = await this.dynamo.query(params);
    if (!data.Items || data.Items.length === 0) {
      return null;
    }
    return data.Items[0] as UserSheetColumnMapping;
  }
}

export { ColumnMappingRepo };
