import { dynamoClient } from "./infra/database/dynamoClient.ts"
import { DynamoProductsRepository } from "./infra/database/dynamoproductsRepository.ts"
import { AmazonBestSellersScraper } from "./infra/scrapers/amazonBestSellersScraper.ts"

async function main(): Promise<void> {
  const productsRepository = new DynamoProductsRepository(dynamoClient)
  const amazonScraper = new AmazonBestSellersScraper()

  await amazonScraper.scrape(productsRepository)
}

await main()