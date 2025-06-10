"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import ProductComments from "./ProductCommernt";
import BestSelling from "../home/BestSelling";
import Cookies from "js-cookie";

// ✅ Interface định nghĩa dữ liệu sản phẩm
interface Product {
  id: number;
  name: string;
  price: number;
  sale_price?: number;
  description: string;
  image: string;
  images?: string[];
  option1?: string;
  value1?: string;
  option2?: string;
  value2?: string;
  stock?: number;
  shop?: {
    id: number;
    name: string;
    description: string;
    logo: string;
    phone: string;
    rating: string;
    total_sales: number;
    created_at: string;
    status: "activated" | "pending" | "suspended";
    email: string;
  };
}

// ✅ Props cho component ProductDetail
interface ProductDetailProps {
  shopslug: string;
  productslug: string;
}

// ✅ Component chi tiết sản phẩm
export default function ProductDetail({
  shopslug,
  productslug,
}: ProductDetailProps) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [liked, setLiked] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupText, setPopupText] = useState("");

  // ✅ Lấy dữ liệu sản phẩm từ API
  useEffect(() => {
    const url = `http://localhost:8000/api/${shopslug}/product/${productslug}`;
    fetch(url)
      .then((res) => {
        if (!res.ok) {
          router.push("/not-found");
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        if (!data.images)
          data.images = ["/1.png", "/2.webp", "/3.webp", "/4.webp"];
        setProduct(data);
        setMainImage(
          data.image.startsWith("/") ? data.image : `/${data.image}`
        );
        setSelectedColor(data.value1?.split(",")[0] || "");
        setSelectedSize(data.value2?.split(",")[0] || "");
      });
  }, [shopslug, productslug, router]);

  // ✅ Xử lý theo dõi shop
const handleFollow = async () => {
  const token = localStorage.getItem("token") || Cookies.get("authToken");

  if (!token) {
    setPopupText("Vui lòng đăng nhập để theo dõi shop");
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 2000);
    return;
  }

  if (!product?.shop?.id) return;

  try {
    const shopId = product.shop.id;

    if (followed) {
      // UNFOLLOW
      const res = await fetch(`http://localhost:8000/api/shops/${shopId}/unfollow`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (res.ok) {
        setFollowed(false);
      } else {
        const data = await res.json();
        console.error("❌ Lỗi unfollow:", data.message || res.statusText);
      }
    } else {
      // FOLLOW
      const res = await fetch(`http://localhost:8000/api/shops/${shopId}/follow`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (res.ok) {
        setFollowed(true);
      } else {
        const data = await res.json();
        console.error("❌ Lỗi follow:", data.message || res.statusText);
      }
    }
  } catch (err) {
    console.error("❌ Lỗi xử lý follow/unfollow:", err);
  }
};

useEffect(() => {
  const checkFollowStatus = async () => {
    const token = localStorage.getItem("token") || Cookies.get("authToken");
    if (!token || !product?.shop?.id) return;

    try {
      const res = await fetch(`http://localhost:8000/api/shops/${product.shop?.id}/is-following`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setFollowed(data.followed); // Cập nhật trạng thái ban đầu
      }
    } catch (err) {
      console.error("❌ Lỗi kiểm tra follow status:", err);
    }
  };

  checkFollowStatus();
}, [product]);


  // ✅ Xử lý thêm/bỏ yêu thích sản phẩm
  const toggleLike = async () => {
    if (!product) return;
    const token = localStorage.getItem("token") || Cookies.get("authToken");
    if (!token) {
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
      return;
    }

    const newLiked = !liked;
    setLiked(newLiked);

    try {
      if (newLiked) {
        await fetch("http://localhost:8000/api/wishlist", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ product_id: product.id }),
        });
      } else {
        await fetch(`http://localhost:8000/api/wishlist/${product.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (err) {
      console.error("❌ Lỗi xử lý wishlist:", err);
    } finally {
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
    }
  };

  if (!product)
    return <div className="p-6 text-base">Đang tải sản phẩm...</div>;

  // ✅ Danh sách thumbnail ảnh
  const thumbnails = product.images?.map((img) =>
    img.startsWith("/") ? img : `/${img}`
  ) || [`/${product.image}`];
  const colorOptions = product.value1?.split(",") || [];
  const sizeOptions = product.value2?.split(",") || [];

  return (
    <div className="max-w-screen-xl mx-auto px-4 pt-[80px] pb-10 relative">
      {/* ✅ Bọc ảnh + info trong cùng 1 box trắng viền đẹp */}
      <div className="rounded-xl border shadow-sm bg-white p-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
          {/* ✅ Hình ảnh sản phẩm bên trái */}
          <div className="md:col-span-6 flex flex-col gap-4">
            <div className="flex justify-center items-center w-full bg-gray-100 rounded-lg p-6 min-h-[320px]">
              <div className="w-full max-w-[400px] h-[320px] relative">
                <Image
                  src={mainImage}
                  alt={product.name}
                  fill
                  className="object-contain rounded-lg"
                  key={mainImage}
                />
              </div>
            </div>

            {/* ✅ Thumbnail nằm ngang bên dưới */}
            <div className="flex justify-center gap-3">
              {thumbnails.map((thumb, idx) => (
                <div
                  key={idx}
                  onClick={() => setMainImage(thumb)}
                  className={`cursor-pointer border-2 rounded overflow-hidden w-[80px] h-[80px] ${
                    mainImage === thumb ? "border-[#DC4B47]" : "border-gray-300"
                  }`}
                >
                  <Image
                    src={thumb}
                    alt={`Thumb ${idx}`}
                    width={80}
                    height={80}
                    className="object-contain w-full h-full"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ✅ Thông tin sản phẩm bên phải */}
          <div className="md:col-span-6 space-y-6">
            <h1 className="text-[1.5rem] md:text-[2rem] font-bold text-gray-900">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center text-yellow-400">
                {"★".repeat(4)}
                <span className="text-gray-300 ml-0.5">★</span>
              </div>
              <span className="text-gray-500">(150 Reviews)</span>
              <span className="text-gray-300">|</span>
              <span className="text-emerald-400 font-medium">
                In Stock: {product.stock || 0}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[1.25rem] md:text-[1.5rem] font-bold text-[#DC4B47]">
                {Number(product.sale_price || product.price).toLocaleString(
                  "vi-VN"
                )}
                ₫
              </span>
              {product.sale_price && (
                <span className="line-through text-gray-400 text-sm">
                  {Number(product.price).toLocaleString("vi-VN")}₫
                </span>
              )}
            </div>

            <p
              className="text-gray-600 text-sm md:text-base truncate max-w-[300px]"
              title={product.description}
            >
              {product.description}
            </p>

            {/* ✅ Options màu và size */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <p className="font-medium text-gray-700 text-sm">Colors:</p>
                <div className="flex gap-1">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-4 h-4 rounded-full border transition ${
                        selectedColor === color
                          ? "border-black scale-105"
                          : "border-gray-300 hover:border-black"
                      }`}
                      style={{ backgroundColor: color.toLowerCase() }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <p className="font-medium text-gray-700 text-sm">Size:</p>
                <div className="flex gap-1">
                  {sizeOptions.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`text-xs min-w-[28px] px-2 py-0.5 rounded border text-center font-medium transition ${
                        selectedSize === size
                          ? "bg-black text-white border-black"
                          : "bg-white text-black border-gray-300 hover:bg-black hover:text-white"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ✅ Số lượng và hành động */}
            <div className="flex items-center gap-3 mt-4">
              <div className="flex border rounded overflow-hidden h-[44px] w-[165px]">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-[55px] text-2xl font-extrabold text-black hover:bg-[#DC4B47] hover:text-white transition"
                >
                  −
                </button>
                <span className="w-[55px] flex items-center justify-center text-base font-extrabold text-black">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-[55px] text-2xl font-extrabold text-black hover:bg-[#DC4B47] hover:text-white transition"
                >
                  +
                </button>
              </div>

              <button className="w-[165px] h-[44px] bg-[#DC4B47] text-white text-sm md:text-base rounded hover:bg-red-600 transition font-medium">
                Buy Now
              </button>
              <button className="w-[165px] h-[44px] text-[#DC4B47] border border-[#DC4B47] text-sm md:text-base rounded hover:bg-[#DC4B47] hover:text-white transition font-medium">
                Add to Cart
              </button>
              <button
                onClick={toggleLike}
                className={`p-2 border rounded text-lg transition ${
                  liked ? "text-[#DC4B47]" : "text-gray-400"
                }`}
              >
                {liked ? "❤️" : "🤍"}
              </button>
            </div>

            {/* ✅ Chính sách vận chuyển */}
            <div className="border rounded-lg divide-y text-sm text-gray-700 mt-6">
              <div className="flex items-start gap-3 p-4">
                <span className="text-xl">🚚</span>
                <div>
                  <p className="font-semibold">Free Delivery</p>
                  <p>
                    <a className="underline" href="#">
                      Enter your postal code for Delivery Availability
                    </a>
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4">
                <span className="text-xl">🔁</span>
                <div>
                  <p className="font-semibold">Return Delivery</p>
                  <p>
                    Free 30 Days Delivery Returns.{" "}
                    <a className="underline" href="#">
                      Details
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Thông tin cửa hàng */}
      {product.shop && (
        <div className="mt-12 border rounded-lg bg-white p-6 relative">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            {/* ✅ Cột trái: Logo shop, tên shop, trạng thái và nút hành động */}
            <div className="flex gap-6 items-start flex-col md:flex-row md:items-center flex-[1.5] relative">
              <div className="flex gap-4 items-start">
                {/* ✅ Logo shop */}
                <div className="relative w-20 h-20">
                  <Image
                    src={`/${product.shop.logo}`}
                    alt="Shop"
                    width={60}
                    height={60}
                    className="rounded-full object-cover"
                  />

                  
                </div>
                {/* ✅ Nút Follow nằm chính giữa ảnh logo */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      onClick={handleFollow}
                      className="bg-[#DC4B47] text-white text-[11px] font-semibold px-2 py-[1px] rounded shadow hover:brightness-110 transition"
                    >
                      {followed ? "Đang theo dõi" : "Theo dõi"}
                    </button>
                  </div>

                {/* ✅ Tên và trạng thái shop */}
                <div className="text-black">
                  <h3 className="text-xl font-semibold mb-1">
                    {product.shop.name}
                  </h3>
                  <p
                    className={`font-medium text-sm ${
                      product.shop.status === "activated"
                        ? "text-green-600"
                        : product.shop.status === "pending"
                        ? "text-yellow-500"
                        : "text-gray-500"
                    }`}
                  >
                    {product.shop.status === "activated" && "Đang hoạt động"}
                    {product.shop.status === "pending" && "Đang chờ duyệt"}
                    {product.shop.status === "suspended" && "Tạm khóa"}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button className="text-sm px-3 py-1 border border-[#DC4B47] text-[#DC4B47] rounded hover:bg-[#DC4B47] hover:text-white transition flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M2 3v18l4-4h14V3H2zm2 2h14v10H6l-2 2V5z" />
                      </svg>
                      Chat Ngay
                    </button>
                    <button className="text-sm px-3 py-1 border border-[#DC4B47] text-[#DC4B47] rounded hover:bg-[#DC4B47] hover:text-white transition flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                      </svg>
                      Xem Shop
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ✅ Cột phải: thông tin thống kê shop */}
            <div className="flex-[1.2] w-full md:max-w-[360px] border-l border-gray-200 pl-4">
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm text-gray-800">
                {/* ✅ Đánh giá */}
                <div>
                  <p className="text-gray-500">Đánh Giá</p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${
                          i <= Math.floor(Number(product.shop?.rating || 0))
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 .587l3.668 7.571L24 9.748l-6 5.853 1.417 8.268L12 19.771l-7.417 4.098L6 15.601 0 9.748l8.332-1.59z" />
                      </svg>
                    ))}
                    <span className="text-red-500 font-semibold ml-1">
                      {Number(product.shop.rating).toFixed(1)} / 5
                    </span>
                  </div>
                </div>

                {/* ✅ Tổng đơn */}
                <div>
                  <p className="text-gray-500">Sản Phẩm</p>
                  <p className="text-red-500 font-semibold">
                    {product.shop.total_sales}
                  </p>
                </div>

                {/* ✅ Tốc độ phản hồi */}
                <div>
                  <p className="text-gray-500">Thời Gian Phản Hồi</p>
                  <p className="text-red-500 font-semibold">Trong vài giờ</p>
                </div>

                {/* ✅ Thời gian tham gia */}
                {product.shop.created_at && (
                  <div>
                    <p className="text-gray-500">Tham Gia</p>
                    <p className="text-red-500 font-semibold">
                      {(() => {
                        const createdAt = new Date(product.shop.created_at);
                        const now = new Date();
                        const diffMs = now.getTime() - createdAt.getTime();
                        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                        const months = Math.floor(days / 30);
                        const years = Math.floor(days / 365);

                        if (days < 30) return `${days} ngày`;
                        if (years >= 1) return `${years} năm`;
                        return `${months} tháng`;
                      })()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Bình luận sản phẩm */}
      <ProductComments shopslug={shopslug} productslug={productslug} />

      {/* ✅ Gợi ý sản phẩm khác */}
      <div className="w-full max-w-screen-xl mx-auto mt-16 px-4">
        <BestSelling />
      </div>
      {/* ✅ Thông báo thêm/xoá yêu thích */}
      {showPopup && (
        <div className="fixed top-20 right-5 z-[9999] bg-white text-black text-sm px-4 py-2 rounded shadow-lg border-b-4 border-[#DC4B47] animate-slideInFade">
          {popupText ||
            (liked ? "Đã thêm vào yêu thích " : "Đã xóa khỏi yêu thích ")}
        </div>
      )}
    </div>
  );
}
