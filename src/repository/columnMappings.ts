import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { ColumnMappingSchema } from './models';

class ColumnMappingRepo {
  private dynamo: DynamoDBDocument;
  private readonly tableName = 'uptrack';

  constructor(dynamo: DynamoDBDocument) {
    this.dynamo = dynamo;
  }

  async getColumnMapping(userID: string, year: number, month: number) {
    const yearMonth = `${year}/${String(month).padStart(2, '0')}`;
    const params = {
      TableName: this.tableName,
      KeyConditionExpression: 'pk = :pk AND sk <= :sk',
      ExpressionAttributeValues: {
        ':pk': `user#${userID}`,
        ':sk': `column_mapping#${yearMonth}`,
      },
      ScanIndexForward: false,
      Limit: 1,
    };

    const data = await this.dynamo.query(params);
    if (!data.Items || data.Items.length === 0) {
      return null;
    }
    const colMapping = ColumnMappingSchema.parse(data.Items[0]);
    return colMapping.column_mappings;
  }
}

export { ColumnMappingRepo };
