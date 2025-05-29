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
  image: string[];
  option1?: string;
  value1?: string;
  option2?: string;
  value2?: string;
  status: "activated" | "deleted";
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  size?: string[];
  category?: string;
  rating?: number;
}