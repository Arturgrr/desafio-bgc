import { BatchWriteItemCommand, DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb"
import { Product } from "../../models/productModel.ts"
import type { ProductRepository } from "../../repositories/productRepository.ts"
import { env } from "../env/index.ts"

export class DynamoProductsRepository implements ProductRepository {
    private readonly dynamoClient: DynamoDBClient;

    constructor(dynamoClient: DynamoDBClient) {
        this.dynamoClient = dynamoClient;
    }

    async save(product: Product): Promise<void> {
        await this.dynamoClient.send(new PutItemCommand({
            TableName: env.PRODUCTS_TABLE,
            Item: {
                id: { S: product.id },
                name: { S: product.props.name },
                price: { N: product.props.price.toString() },
                image: { S: product.props.image },
                url: { S: product.props.url },
                category: { S: product.props.category },
                rank: { N: product.props.rank.toString() },
                createdAt: { S: product.createdAt.toISOString() },
            },
        }));
    }

    async saveMany(products: Product[]): Promise<void> {
        if (products.length === 0) {
            return;
        }

        const putRequests = products.map((product) => ({
            PutRequest: {
                Item: {
                    id: { S: product.id },
                    name: { S: product.props.name },
                    price: { N: product.props.price.toString() },
                    image: { S: product.props.image },
                    url: { S: product.props.url },
                    category: { S: product.props.category },
                    rank: { N: product.props.rank.toString() },
                    createdAt: { S: product.createdAt.toISOString() },
                },
            },
        }));

        await this.dynamoClient.send(
            new BatchWriteItemCommand({
                RequestItems: {
                    [env.PRODUCTS_TABLE]: putRequests,
                },
            }),
        );
    }

}