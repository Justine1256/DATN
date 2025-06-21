export interface Variant {
  id: number;
  product_id: number;
  option1: string;  // Ví dụ: Dung lượng
  value1: string;   // Ví dụ: 256GB
  option2: string;  // Ví dụ: Màu sắc
  value2: string;   // Ví dụ: Titan Xám
  price: number;
  stock: number;
  image: string[];
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  sale_price?: number;
  description: string;
  image: string[];
  option1?: string;
  value1?: string;
  option2?: string;
  value2?: string;
  stock?: number;
  rating: string;
  shop_slug: string;
  shop?: {
    id: number;
    name: string;
    description: string;
    logo: string;
    phone: string;
    rating: string;
    total_sales: number;
    created_at: string;
    status: 'activated' | 'pending' | 'suspended';
    email: string;
    address?: string;
    slug: string;
  } | undefined;
  category?: {
    id: number;
    name: string;
    slug: string;
    parent?: {
      id: number;
      name: string;
      slug: string;
    };
  };
  variants: Variant[];  // Thêm mảng variants vào kiểu Product
}

export interface ProductDetailProps {
  shopslug: string;
  productslug: string;
}
