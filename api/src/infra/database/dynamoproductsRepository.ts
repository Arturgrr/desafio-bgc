import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb"
import { Product } from "../../models/productModel.ts"
import type { ProductRepository } from "../../repositories/productRepository.ts"

type ProductItem = {
    id: string
    name: string
    price: number
    image: string
    url: string
    category: string
    rank: number
    createdAt?: string
}

export class DynamoProductsRepository implements ProductRepository {
    private readonly docClient: DynamoDBDocumentClient
    private readonly tableName: string

    constructor(dynamoClient: DynamoDBClient, tableName: string) {
        this.docClient = DynamoDBDocumentClient.from(dynamoClient)
        this.tableName = tableName
    }

    public async findAll(category?: string): Promise<Product[]> {
        const command = new ScanCommand({
            TableName: this.tableName,
            FilterExpression: category ? "#category = :category" : undefined,
            ExpressionAttributeNames: category ? { "#category": "category" } : undefined,
            ExpressionAttributeValues: category ? { ":category": category } : undefined,
        })

        const response = await this.docClient.send(command)
        const items = (response.Items ?? []) as ProductItem[]

        return items.map((item) => new Product(
            {
                name: item.name,
                price: item.price,
                image: item.image,
                url: item.url,
                category: item.category,
                rank: item.rank,
            },
            item.id,
            item.createdAt ? new Date(item.createdAt) : undefined,
        ))
    }
}