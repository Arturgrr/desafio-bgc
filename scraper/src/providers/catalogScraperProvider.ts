export type ScrapedProduct = {
  name: string
  price: string
  imageUrl: string
  productUrl: string
  category: string
  rank: number
}

export interface CatalogScraperProvider {
  scrape(): Promise<ScrapedProduct[]>
}

