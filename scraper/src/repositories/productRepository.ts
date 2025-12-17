import { Product } from "../models/productModel.ts"

export interface ProductRepository {
    save(product: Product): Promise<void>;
    saveMany(products: Product[]): Promise<void>;
}