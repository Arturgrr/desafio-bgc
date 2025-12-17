import { ProductRepository } from "../repositories/productRepository.ts"

export interface CatalogScraperProvider {
  scrape(productsRepository: ProductRepository): Promise<void>
}

