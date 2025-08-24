export interface Variant {
  id: number;
  product_id: number;
  option1?: string;
  option2?: string;
  value1: string;
  value2: string;
  price: string;                 // API trả "33000000.00"
  sale_price?: string | null;
  stock: number;
  image: string[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Product {
  id: number;
  category_id: number;
  shop_id: number;

  name: string;
  slug: string;
  description: string;

  price: string;                 // API → string
  sale_price?: string | null;

  // ⬇️ Thêm 2 trường thời gian sale
  sale_starts_at?: string | null;
  sale_ends_at?: string | null;

  stock: number;
  sold: number;

  image: string[] | string | null;
  oldPrice?: number;

  option1?: string;
  value1?: string;
  option2?: string;
  value2?: string;

  rating: string;
  rating_avg?: number;           // dùng khi hiển thị sao
  review_count?: number;

  status: 'activated' | 'pending' | 'suspended';
  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  shop: {
    id: number;
    user_id: number;
    name: string;
    slug: string;
    description: string;
    logo: string | null;
    phone: string;
    email: string;
    total_sales: number;
    rating: string;
    status: 'activated' | 'pending' | 'suspended';
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  };

  category: {
    id: number;
    shop_id: number;
    parent_id: number;
    name: string;
    slug: string;
    description: string;
    image: string;
    status: 'activated' | 'pending' | 'suspended';
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    parent?: {
      id: number;
      shop_id: number | null;
      parent_id: number | null;
      name: string;
      slug: string;
      description: string;
      image: string;
      status: 'activated' | 'pending' | 'suspended';
      created_at: string;
      updated_at: string;
      deleted_at: string | null;
    };
  };

  variants: Variant[];
}

export interface ProductDetailProps {
  shopslug: string;
  productslug: string;
}

export interface Shop {
  id: number;
  user_id: number;
  name: string;
  slug: string;
  description: string;
  logo: string | null;
  phone: string;
  email: string;
  total_sales: number;
  rating: string;
  status: 'activated' | 'pending' | 'suspended';
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
