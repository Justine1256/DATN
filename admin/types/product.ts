import { Category } from "./category";
export interface Product {
  id: number;
  category_id: number;
  shop_id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  sale_price: number | null;
  stock: number;
  sold: number;
  image: string[];
  option1?: string | null;
  value1?: string | null;
  option2?: string | null;
  value2?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  size: string[];
  category: Category | string;
  rating: number;
}