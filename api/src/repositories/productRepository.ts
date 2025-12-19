import { Product } from "../models/productModel.ts"

export interface ProductRepository {
    findAll(category?: string): Promise<Product[]>
}