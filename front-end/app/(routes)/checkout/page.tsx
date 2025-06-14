'use client';

import Breadcrumb from '@/app/components/cart/CartBreadcrumb';
import CartAndPayment from '@/app/components/checkout/CartAndPayment';
import CheckoutForm from '@/app/components/checkout/CheckoutForm';
import OrderSummary from '@/app/components/checkout/OrderSummary';
import { useState } from 'react';

interface CartItem {
  id: number;
  quantity: number;
  product: {
    name: string;
    image: string;
    price: number;
    original_price?: number;
  };
}

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [totalPrice, setTotalPrice] = useState(0);
  const [manualAddressData, setManualAddressData] = useState<any>(null);
  const [addressId, setAddressId] = useState<number | null>(null);
  const [voucherCode, setVoucherCode] = useState<string | null>(null);

  return (
    <div className="container my-10 px-4">
      <Breadcrumb
        items={[
          { label: 'Tài khoản', href: '/account' },
          { label: 'Tài khoản của tôi', href: '/account/profile' },
          { label: 'Sản Phẩm', href: '/products' },
          { label: 'Giỏ hàng', href: '/cart' },
          { label: 'Thanh toán' },
        ]}
      />

      <div className="text-black mx-auto py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="pr-6">
          <CheckoutForm
            onAddressSelect={(selectedId) => {
              setAddressId(selectedId);
            }}
            onAddressChange={(manualData) => {
              setManualAddressData(manualData);
            }}
          />
          
        </div>
        <div className="space-y-8 pl-6">
          <CartAndPayment
            onPaymentInfoChange={({ paymentMethod, totalPrice }) => {
              setPaymentMethod(paymentMethod);
              setTotalPrice(totalPrice);
            }}
            onCartChange={setCartItems}
          />
          <OrderSummary
            cartItems={cartItems}
            paymentMethod={paymentMethod}
            addressId={addressId}
            voucherCode={voucherCode}
            manualAddressData={manualAddressData}
          />
        </div>
      </div>
    </div>
  );
}
