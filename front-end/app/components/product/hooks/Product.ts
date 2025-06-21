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
  }
  
 export interface ProductDetailProps {
    shopslug: string;
    productslug: string;
  }
  