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
  user_id: number;
  product_id: number;
  variant_id?: number | null;
  quantity: number;
  is_active: boolean;

  product_option?: string | null;
  product_value?: string | null;

  product: Product;
  variant?: ProductVariant | null;
}
