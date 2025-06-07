'use client';
import { useParams } from 'next/navigation';
import ProductDetail from '@/app/components/product/ProductDetail';

export default function ProductPage() {
  const { shopslug, productslug } = useParams() as {
    shopslug: string;
    productslug: string;
  };

  return <ProductDetail shopslug={shopslug} productslug={productslug} />;
}
