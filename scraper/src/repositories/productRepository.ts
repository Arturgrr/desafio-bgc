import { Product } from "@/models/productModel"

export interface ProductRepository {
    save(product: Product): Promise<void>;
}