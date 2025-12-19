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
    public readonly name: string;
    public readonly price: number;
    public readonly image: string;
    public readonly url: string;
    public readonly category: string;
    public readonly rank: number;

    public constructor(props: ProductProps, id?: string, createdAt?: Date) {
        this.id = id ?? crypto.randomUUID();
        this.createdAt = createdAt ?? new Date();
        this.name = props.name;
        this.price = props.price;
        this.image = props.image;
        this.url = props.url;
        this.category = props.category;
        this.rank = props.rank;
    }
}