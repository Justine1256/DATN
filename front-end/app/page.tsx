import LandingSlider from "@/app/components/home/LandingSlider";
import FlashSale from "./components/home/FlashSale";

// import ProductList from "@/app/components/home/ProductList";

export default function HomePage() {
  return (
    <main className="bg-white">
      {/* Khoảng cách với header */}
      <section className="max-w-screen-xl mx-auto px-4 pt-16">
        <LandingSlider />
      </section>

      <section className="max-w-screen-xl mx-auto px-4 pt-12">
        <FlashSale />
      </section>
    </main>
  );
}
