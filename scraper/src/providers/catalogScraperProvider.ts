import { ProductRepository } from "@/repositories/productRepository"

export interface CatalogScraperProvider {
  scrape(productsRepository: ProductRepository): Promise<void>
}

