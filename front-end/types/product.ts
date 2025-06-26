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
  name: string;
  image: string[];
  slug: string;
  price: number;
  oldPrice: number;
  rating: number;
  sold?: number;
  discount: number;
  option1?: string;
  value1?: string;
  sale_price?: number;
  description?: string;
  value2?: string;
  shop: {  // Thêm trường shop
    id: number;
    name: string;  // Trường name cho tên cửa hàng
  };
}

