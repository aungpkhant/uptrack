import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { User } from './models';

class UserRepo {
  private dynamo: DynamoDBDocument;

  constructor(dynamo: DynamoDBDocument) {
    this.dynamo = dynamo;
  }

  async getByID(user_id: string) {
    const { Item } = await this.dynamo.get({
      TableName: 'uptrack_users',
      Key: { user_id },
    });
    return Item as User;
  }
}

export { UserRepo };
