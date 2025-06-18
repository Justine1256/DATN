"use client";
import { useParams } from "next/navigation";
import ProductDetail from "@/app/components/product/ProductDetail";

export default function ProductPage() {
  const params = useParams();
  const shopslug = params?.shopslug as string;
  const productslug = params?.productslug as string;

  return <ProductDetail shopslug={shopslug} productslug={productslug} />;
}
