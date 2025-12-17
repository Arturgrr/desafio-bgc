import { env } from "@/infra/env/index"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"

export const dynamoClient = new DynamoDBClient({
  region: env.AWS_REGION,
  endpoint: env.DYNAMO_ENDPOINT,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

