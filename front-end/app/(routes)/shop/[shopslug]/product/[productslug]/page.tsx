"use client";

import { useParams } from "next/navigation";
import ProductDetail from "@/app/components/product/ProductDetail";

export default function ProductPage() {
    const params = useParams();  // Lấy tham số từ URL
    const shopslug = params?.shopslug as string;  // Tham số shopslug
    const productslug = params?.productslug as string;  // Tham số productslug

    // Kiểm tra nếu shopslug và productslug có giá trị
    if (!shopslug || !productslug) {
        return <div>Không tìm thấy sản phẩm hoặc cửa hàng.</div>;
    }

    // Truyền tham số vào ProductDetail
    return <ProductDetail shopslug={shopslug} productslug={productslug} />;
}
