export interface Variant {
  id: number;
  product_id: number;
  option1?: string;  // thêm
  option2?: string;  // thêm
  value1: string;
  value2: string;
  price: string;           // vì API trả về "33000000.00" → string
  sale_price?: string;
  stock: number;
  image: string[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Product {
  [x: string]: Review[];
  id: number;
  category_id: number;
  shop_id: number;
  name: string;
  slug: string;
  description: string;
  price: string;          // từ API → string
  sale_price?: string;
  stock: number;
  sold: number;
  image: string[];
  option1?: string;
  value1?: string;
  option2?: string;
  value2?: string;
  rating: string;
  rating_avg?: number;     // 👈 thêm
  review_count?: number;   // 👈 thường đi kèm
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
  logo: string | null;  // Allow logo to be null
  phone: string;
  email: string;
  total_sales: number;
  rating: string;
  status: 'activated' | 'pending' | 'suspended';
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}