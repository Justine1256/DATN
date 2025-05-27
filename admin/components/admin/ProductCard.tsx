import React from 'react';

type Props = {
  product: any;
};

export default function ProductCard({ product }: Props) {
  return (
    <div className="bg-white p-4 rounded-xl shadow hover:shadow-lg hover:-translate-y-1 transition-all">
      <img src={product.image} alt={product.name} className="h-32 mx-auto mb-4 object-contain" />
      <h3 className="font-semibold text-lg text-center">{product.name}</h3>
      <p className="text-sm text-gray-500 text-center">Size: {product.size}</p>
      <div className="mt-2 text-center text-blue-600 font-bold">{product.price}</div>
    </div>
  );
}
