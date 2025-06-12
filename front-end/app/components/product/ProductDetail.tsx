"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
// import ProductComments from "./ProductCommernt";
import BestSelling from "../home/BestSelling";
import Cookies from "js-cookie";
import ShopInfo from "./ShopInfo";
import LoadingProductDetail from "../loading/loading";
import ProductDescriptionAndSpecs from "./ProductDescriptionAndSpecs";
import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";
import { API_BASE_URL } from '@/utils/api';
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
    status: "activated" | "pending" | "suspended";
    email: string;
    slug: string;
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

  const handleAddToCart = async () => {
    const token = localStorage.getItem("token") || Cookies.get("authToken");
    if (!token) {
      setPopupText("Vui lòng đăng nhập để thêm vào giỏ hàng");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/cart`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: product?.id,
          quantity: quantity,
          color: selectedColor,
          size: selectedSize,
        }),
      });

      if (res.ok) {
        setPopupText("Đã thêm vào giỏ hàng!");
      } else {
        const data = await res.json();
        setPopupText(data.message || "Thêm vào giỏ hàng thất bại");
      }
    } catch (err) {
      console.error("❌ Lỗi add to cart:", err);
      setPopupText("Có lỗi xảy ra");
    } finally {
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
    }
  };

  // chạy song song api
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token") || Cookies.get("authToken");
        const productRes = await fetch(
          `${ API_BASE_URL }/${shopslug}/product/${productslug}`
        );

        if (!productRes.ok) {
          router.push("/not-found");
          return;
        }

        const productData = await productRes.json();

        if (!productData.images) {
          productData.images = ["/1.png", "/2.webp", "/3.webp", "/4.webp"];
        }

        // Cập nhật sản phẩm + ảnh chính + option mặc định
        setProduct(productData);
        console.log("📦 Chi tiết sản phẩm:", productData);

        setMainImage(
          productData.image.startsWith("/")
            ? productData.image
            : `/${productData.image}`
        );
        setSelectedColor(productData.value1?.split(",")[0] || "");
        setSelectedSize(productData.value2?.split(",")[0] || "");

        // Nếu có token và shop id thì gọi song song
        if (token && productData.shop?.id) {
          const followRes = await fetch(
            `${API_BASE_URL}/shops/${productData.shop.id}/is-following`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (followRes.ok) {
            const followData = await followRes.json();
            setFollowed(followData.followed);
          }
        }
      } catch (err) {
        console.error("❌ Lỗi khi load product & follow:", err);
      }
    };

    fetchData();
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
        const res = await fetch(
          `${ API_BASE_URL } /shops/${shopId}/unfollow`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        if (res.ok) {
          setFollowed(false);
        } else {
          const data = await res.json();
          console.error("❌ Lỗi unfollow:", data.message || res.statusText);
        }
      } else {
        // FOLLOW
        const res = await fetch(
          `${API_BASE_URL}/shops/${shopId}/follow`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

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
        const res = await fetch(
          `${API_BASE_URL}/shops/${product.shop?.id}/is-following`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

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
        await fetch(`${API_BASE_URL}/wishlist`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ product_id: product.id }),
        });
      } else {
        await fetch(`${ API_BASE_URL } /wishlist/${product.id}`, {
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
  if (!product) return <LoadingProductDetail />;

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
            <div className="flex justify-center items-center w-full bg-gray-100 rounded-lg p-6 min-h-[220px]">
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
                  className={`cursor-pointer border-2 rounded overflow-hidden w-[80px] h-[80px] ${mainImage === thumb ? "border-[#DC4B47]" : "border-gray-300"
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
          <div className="md:col-span-6 space-y-6 ">
            <h1 className="text-[1.5rem] md:text-[2rem] font-bold text-gray-900">
              {product.name}
            </h1>
            {/* ✅ rating */}
            <div className="flex items-center gap-3 text-sm -translate-y-4">
              <div className="flex items-center gap-3 text-sm ">
                <div className="flex items-center gap-2 text-base">
                  {/* ⭐ Số sao (hiển thị thập phân, đã chia 2 nếu cần) */}
                  <span className="text-gray-800 flex items-center">
                    {(parseFloat(product.rating) / 2).toFixed(1)}
                  </span>

                  {/* ⭐ Icon sao (5 ngôi sao, tính theo rating / 2) */}
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) =>
                      i < Math.round(parseFloat(product.rating) / 2) ? (
                        <FaStar key={i} className="text-yellow-400" />
                      ) : (
                        <FaRegStar key={i} className="text-gray-300" />
                      )
                    )}
                  </div>
                </div>
              </div>


              <span className="text-gray-500">(150 Lượt Xem)</span>
              <span className="text-gray-300">|</span>
              <span className="text-emerald-400 font-medium">
                Hàng trong kho: {product.stock || 0} sản phẩm
              </span>
            </div>
            {/* ✅ giá */}
            <div className="flex items-center gap-3 -translate-y-6">
              <span className="text-[1.25rem] md:text-[1.5rem] font-bold text-[#DC4B47]">
                {Number(product.sale_price || product.price).toLocaleString(
                  "vi-VN"
                )}
                ₫
              </span>
              {product.sale_price && (
                <span className="line-through text-gray-400 text-sm ">
                  {Number(product.price).toLocaleString("vi-VN")}₫
                </span>
              )}
            </div>
            {/* ✅ mô tả */}
            <p
              className="text-gray-600 text-sm md:text-base truncate max-w-[300px] -translate-y-8"
              title={product.description}
            >
              {product.description}
            </p>

            {/* ✅ Options màu và size */}
            <div className="flex flex-col gap-2 -translate-y-10">
              <div className="flex items-center gap-3">
                <p className="font-medium text-gray-700 text-sm">Màu Sắc:</p>
                <div className="flex gap-1">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-4 h-4 rounded-full border transition ${selectedColor === color
                        ? "border-black scale-105"
                        : "border-gray-300 hover:border-black"
                        }`}
                      style={{ backgroundColor: color.toLowerCase() }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 ">
                <p className="font-medium text-gray-700 text-sm">Kích cỡ:</p>
                <div className="flex gap-1">
                  {sizeOptions.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`text-xs min-w-[28px] px-2 py-0.5 rounded border text-center font-medium transition ${selectedSize === size
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
            <div className="flex items-center gap-3 mt-4 -translate-y-10">
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
                Mua Ngay
              </button>
              <button
                onClick={handleAddToCart}
                className="w-[165px] h-[44px] text-[#DC4B47] border border-[#DC4B47] text-sm md:text-base rounded hover:bg-[#DC4B47] hover:text-white transition font-medium"
              >
                Thêm Vào Giỏ Hàng
              </button>

              <button
                onClick={toggleLike}
                className={`p-2 border rounded text-lg transition ${liked ? "text-[#DC4B47]" : "text-gray-400"
                  }`}
              >
                {liked ? "❤️" : "🤍"}
              </button>
            </div>

            {/* ✅ Chính sách vận chuyển */}
            <div className="border rounded-lg divide-y text-sm text-gray-700 mt-6 -translate-y-11">
              <div className="flex items-center gap-3 p-4">
                <div className="flex justify-center items-center h-[40px]">
                  <Image src="/ship.png" alt="Logo" width={30} height={40} />
                </div>
                <div>
                  <p className="font-semibold">Giao hàng miễn phí</p>
                  <p>
                    <a className="no-underline" href="#">
                      Giao hàng miễn phí tại nội thành & một số khu vực ngoại thành
                    </a>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4">
                <div className="flex justify-center items-center h-[40px]">
                  <Image src="/trahang.png" alt="Logo" width={30} height={40} />
                </div>
                <div>
                  <p className="font-semibold">Trả hàng</p>
                  <p>Giao hàng miễn phí trong vòng 30 ngày.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ✅ Thông tin cửa hàng */}
      <ShopInfo
        shop={product.shop}
        followed={followed}
        onFollowToggle={handleFollow}
      />
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
      {/* <ProductComments shopslug={shopslug} productslug={productslug} /> */}

      {/* ✅ Gợi ý sản phẩm khác */}
      <div className="w-full max-w-screen-xl mx-auto mt-16 px-">
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
