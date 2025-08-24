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
  slug: string;
  image: string[];

  price: number;
  sale_price?: number | null;
  oldPrice?: number;
  discount?: number;

  stock?: number;

  rating?: number | string;
  rating_avg?: number;
  review_count?: number;
  sold?: number;

  option1?: string;
  option2?: string;
  value1?: string | string[];
  value2?: string | string[];

  description?: string;

  shop: { id: number; name: string; slug?: string };
  category: {
    id?: number;
    name: string;
    slug: string;
    parent?: { id?: number; name: string; slug: string } | null;
  };

  variants: Variant[];

  /** ⬇️ thêm 2 dòng này */
  sale_starts_at?: string | null;
  sale_ends_at?: string | null;
}


