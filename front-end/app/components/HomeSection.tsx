import React, { useState, useEffect } from 'react';
import './ProductGrid.css'; // Import file CSS
import { fetchProducts } from './api'; // Import hàm fetch API

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  // ... các thuộc tính khác
}

const ProductGrid: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchProducts()
      .then(data => setProducts(data))
      .catch(error => console.error('Error fetching products:', error));
  }, []);

  return (
    <div className="product-grid">
      <div className="product-grid-header">
        <h2>TOP DEAL SIÊU RẺ</h2>
        <a href="#">Xem tất cả</a>
      </div>
      <div className="product-grid-items">
        {products.map(product => (
          <div key={product.id} className="product-item">
            <img src={product.image} alt={product.name} />
            <h3>{product.name}</h3>
            <p>{product.price} ₫</p>
            {/* ... các thông tin sản phẩm khác */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductGrid;