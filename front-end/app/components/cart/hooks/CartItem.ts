export interface CartItem {
  id: number;
  quantity: number;
  price: number;
  product: {
    id: number;
    name: string;
    image: string[];
    price: number;
    sale_price?: number | null;
    option1?: string;
    value1?: string;
    option2?: string;
    value2?: string;
  };
}
