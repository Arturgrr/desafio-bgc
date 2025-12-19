import { dynamoClient } from "../database/dynamoClient.ts"
import { DynamoProductsRepository } from "../database/dynamoproductsRepository.ts"
import { env } from "../env/index.ts"

type HttpEvent = {
    queryStringParameters?: Record<string, string | undefined>
}

const repository = new DynamoProductsRepository(dynamoClient, env.PRODUCTS_TABLE)

export const handler = async (event: HttpEvent) => {
    const category = event.queryStringParameters?.category
    const products = await repository.findAll(category)

    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: products }),
    }
}

