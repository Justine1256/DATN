export interface Product {
  id: number;
  name: string;
  image: string[];
  price: number;
  sale_price?: number | null;
  option1?: string;
  value1?: string;
  option2?: string;
  value2?: string;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  price: number;
  sale_price?: number | null;
  stock: number;
  option1?: string;
  value1?: string;
  option2?: string;
  value2?: string;
  image?: string[];
}

export interface CartItem {
  id: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    image: string | string[];
    price: number;
    sale_price?: number | null;
    shop?: {
      id: number;
      slug?: string;
      name: string;
    };
  };
  variant?: {
    id: number;
    option1?: string;
    value1?: string;
    option2?: string;
    value2?: string;
    price?: number;
    sale_price?: number | null;
  };
}

