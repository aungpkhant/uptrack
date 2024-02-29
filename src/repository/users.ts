import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { User, UserSchema } from './models';

class UserRepo {
  private dynamo: DynamoDBDocument;

  constructor(dynamo: DynamoDBDocument) {
    this.dynamo = dynamo;
  }

  async getByID(user_id: string) {
    const { Item } = await this.dynamo.get({
      TableName: 'uptrack',
      Key: { pk: `user#${user_id}`, sk: `user#${user_id}` },
    });
    const userRecord = UserSchema.parse(Item);
    return {
      user_id: userRecord.pk.split('user#')[1],
      account_id: userRecord.account_id,
      spreadsheet_id: userRecord.spreadsheet_id,
      up_token: userRecord.up_token,
    } as User;
  }
}

export { UserRepo };
