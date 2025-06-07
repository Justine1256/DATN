import Breadcrumb from "@/app/components/cart/CartBreadcrumb";
import CartItemsSection from "@/app/components/cart/CartItemsSection";
import CartSummarySection from "@/app/components/cart/CartSummarySection";

export default function CartPage() {
  return (
      <div className="bg-white container mx-auto px-4 pt-[80px] pb-[80px]">
        <Breadcrumb
        items={[
            { label: "Account", href: "/account" },
            { label: "My Account", href: "/account/profile" },
            { label: "Product", href: "/products" },
            { label: "Cart" }, // không có href -> là trang hiện tại
        ]}
        />

        <div className="md:col-span-2 mb-4 pt-[40px]">
          <CartItemsSection />
        </div>
        <div>
          <CartSummarySection />
        </div>
      </div>
  );
}
