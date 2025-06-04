import LandingSlider from "@/app/components/home/LandingSlider";
import FlashSale from "./components/home/FlashSale";
import BlackBannerWithCountdown from "./components/home/BlackBannerWithCountdown";
import CategoryGrid from "./components/home/CategoryGrid";
import BestSelling from "./components/home/BestSelling";
import NewProducts from "./components/home/NewProduct";
import NewArrivalGrid from "./components/home/NewArrival"
import ServiceBanner from "./components/home/ServiceBanner";
export default function HomePage() {
  return (
    <main className="bg-white !pb-10">
      {/* Banner / Slider */}
      <section className="max-w-screen-xl mx-auto px-4 pt-16">
        <LandingSlider />
      </section>

      {/* Flash Sale or Category Header */}
      <section className="max-w-screen-xl mx-auto px-4 pt-12">
        <FlashSale />
      </section>
       {/* Browse by Category */}
       <section className="pt-10">
        <CategoryGrid />
      </section>
      <section className="pt-10">
        <BestSelling />
      </section>
      <section className="pt-10">
        <BlackBannerWithCountdown />
      </section>
      <section className="pt-10">
        <NewProducts />
      </section>
      <section className="pt-0">
        <NewArrivalGrid />
      </section>
      <section className="pt-0">
        <ServiceBanner/>
      </section>
    </main>
  );
}
