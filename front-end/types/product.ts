export interface Variant {
  id: number;
  product_id: number;
  option1: string;
  value1: string;
  option2: string;
  value2: string;
  price: number;
  sale_price?: number;
  stock: number;
  image: string[];
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  category_id: number;
  shop_id: number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  sale_price?: number;
  stock: number;
  sold: number;
  image: string[]; // ✅ ép luôn về mảng
  option1?: string;
  value1?: string;
  option2?: string;
  value2?: string;
  variants: Variant[]; // ✅ thêm mảng variant
  status: 'activated' | 'deleted';
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}
