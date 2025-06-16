'use client';
import Image from "next/image";

interface Product {
  id: number;
  name: string;
  option1: string | null;
  value1: string | null;
  option2: string | null;
  value2: string | null;
  quantity: number;
  price: number;
  original_price: number;
  image: string | null;
}

interface Order {
  id: number;
  shop_name: string;
  status: string;
  delivery_date?: string;
  products: Product[];
  total_amount: number;
}

export default function OrderItem({ order }: { order: Order }) {
  return (
    <div className="border mb-4 rounded-md bg-white shadow-sm">
      <div className="flex justify-between items-center px-4 py-2 border-b">
        <div className="font-semibold text-black">{order.shop_name}</div>
        <div className="text-sm text-red-500">{order.status}</div>
      </div>

      {order.products.map((product) => {
        const variant = [product.option1 && product.value1 ? `${product.option1}: ${product.value1}` : "",
        product.option2 && product.value2 ? `${product.option2}: ${product.value2}` : ""]
          .filter(Boolean).join(" | ");

        return (
          <div
            key={product.id}
            className="flex p-4 border-b last:border-none gap-4"
          >
            <Image
              src={product.image || "/default.png"}
              alt={product.name}
              width={80}
              height={80}
              className="rounded-md border"
            />
            <div className="flex-1">
              <div className="font-medium text-black">{product.name}</div>
              {variant && (
                <div className="text-sm text-gray-500">Phân loại: {variant}</div>
              )}
              <div className="text-sm text-black">x{product.quantity}</div>
            </div>
            <div className="text-right text-sm text-red-500">
              {product.original_price !== product.price && (
                <del className="text-gray-400 mr-2">
                  {product.original_price.toLocaleString()}₫
                </del>
              )}
              <div className="text-black">
                {product.price.toLocaleString()}₫
              </div>
            </div>
          </div>
        );
      })}

      {order.delivery_date && (
        <div className="px-4 text-xs text-gray-500">
          Đơn hàng sẽ được chuẩn bị và chuyển đi trước {order.delivery_date}
        </div>
      )}

      <div className="flex justify-end items-center p-4 gap-2 text-sm">
        <div className="font-semibold text-black">
          Thành tiền:{" "}
          <span className="text-red-500 text-lg">
            {order.total_amount.toLocaleString()}₫
          </span>
        </div>
      </div>

      <div className="flex justify-end px-4 pb-4 gap-2 flex-wrap">
        <button className="border px-3 py-1 rounded text-sm hover:bg-gray-100">
          Liên Hệ Người Bán
        </button>
        {order.status === "VẬN CHUYỂN" && (
          <button className="border px-3 py-1 rounded text-sm hover:bg-gray-100">
            Hủy Đơn Hàng
          </button>
        )}
        {order.status === "CHỜ GIAO HÀNG" && (
          <>
            <button className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">
              Đã Nhận Hàng
            </button>
            <button className="border px-3 py-1 rounded text-sm hover:bg-gray-100">
              Yêu Cầu Trả Hàng/Hoàn Tiền
            </button>
          </>
        )}
      </div>
    </div>
  );
}
