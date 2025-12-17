export interface ProductProps {
    name: string;
    price: number;
    image: string;
    url: string;
    category: string;
    rank: number;
}

export class Product {
    public readonly id: string;
    public readonly createdAt: Date;
    public readonly props: ProductProps;

    public constructor(props: ProductProps, id?: string, createdAt?: Date) {
        this.id = id ?? crypto.randomUUID();
        this.createdAt = createdAt ?? new Date();
        this.props = props;
    }
}