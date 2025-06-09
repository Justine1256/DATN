"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import ProductComments from "./ProductCommernt";
import BestSelling from "../home/BestSelling";
import Cookies from "js-cookie";
import ShopInfo from "./ShopInfo";
//import tậm
import ProductDescriptionAndSpecs from "./ProductDescriptionAndSpecs";
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
        console.log("👉 Product fetched from API:", data);
        // ✅ Nếu không có danh sách ảnh phụ thì gán mặc định
        if (!data.images)
          data.images = ["/1.png", "/2.webp", "/3.webp", "/4.webp"];

        // ✅ Gán dữ liệu sản phẩm
        setProduct(data);

        // ✅ Set ảnh chính
        setMainImage(
          data.image.startsWith("/") ? data.image : `/${data.image}`
        );

        // ✅ Gán màu + size mặc định
        setSelectedColor(data.value1?.split(",")[0] || "");
        setSelectedSize(data.value2?.split(",")[0] || "");

        // ✅ Gán trạng thái Follow từ server
        setFollowed(data.is_followed || false);
      });
  }, [shopslug, productslug, router]);

  // ✅ Xử lý theo dõi shop
  const handleFollow = async () => {
    if (!product?.shop) return;
    const token = localStorage.getItem("token") || Cookies.get("authToken");
    if (!token) return;

    const newFollowed = !followed;
    const url = `http://127.0.0.1:8000/api/shops/${product.shop.id}/${
      newFollowed ? "follow" : "unfollow"
    }`;
    const method = newFollowed ? "POST" : "DELETE";

    try {
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setFollowed(newFollowed); // ✅ Cập nhật trạng thái
        setPopupText(newFollowed ? "Đã theo dõi shop" : "Đã hủy theo dõi shop"); // ✅ Gán text
        setShowPopup(true);
        setTimeout(() => {
          setShowPopup(false);
          setPopupText(""); // ✅ Reset text sau khi ẩn
        }, 2000);
      }
    } catch (err) {
      console.error("❌ Follow error:", err);
    }
  };

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
        <ShopInfo
          shop={product.shop}
          followed={followed}
          onFollowToggle={handleFollow}
        />
      )}
      {/*tạm*/}
      <ProductDescriptionAndSpecs
        breadcrumbs={[
          { name: "Trang chủ", href: "/" },
          { name: "Điện thoại", href: "/dien-thoai" },
          { name: "Apple", href: "/dien-thoai/apple" },
          { name: "iPhone 15 Pro Max" }, // hiện tại
        ]}
        specs={[
          { label: "Loại sản phẩm", value: "Điện thoại" },
          { label: "Tình trạng", value: "Mới 100%" },
          { label: "Bảo hành", value: "12 tháng toàn quốc" },
          { label: "Sản phẩm có sẵn", value: "Có" },
          { label: "Thương hiệu", value: "Apple" },
          { label: "Xuất xứ", value: "Mỹ" },
          { label: "Dung lượng", value: "256GB" },
          { label: "Gửi từ", value: "TP.HCM" },
        ]}
        descriptionLines={[
          "iPhone 15 Pro Max mới nhất chính hãng.",
          "Màn hình 6.7 inch Super Retina XDR.",
          "Camera 48MP ProRAW, chip A17 Bionic.",
          "Bảo hành 12 tháng toàn quốc.",
          "Hỗ trợ đổi trả trong 7 ngày nếu có lỗi.",
        ]}
        hashtags={[
          "iphone15promax",
          "smartphone",
          "apple",
          "dienthoai",
          "hangchinhhang",
          "baohanh12thang",
        ]}
      />

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
