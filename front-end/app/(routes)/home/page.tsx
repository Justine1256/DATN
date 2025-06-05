import LandingSlider from "@/app/components/home/LandingSlider";
import FlashSale from "@/app/components/home/FlashSale";
import BlackBannerWithCountdown from "@/app/components/home/BlackBannerWithCountdown";
import CategoryGrid from "@/app/components/home/CategoryGrid";
import BestSelling from "@/app/components/home/BestSelling";
import NewProducts from "@/app/components/home/NewProduct";
import NewArrivalGrid from "@/app/components/home/NewArrival";
import ServiceBanner from "@/app/components/home/ServiceBanner";

export default function HomePage() {
  return (
    <main className="bg-white !pb-10">
      <section className="max-w-screen-xl mx-auto px-4 pt-16">
        <LandingSlider />
      </section>
      <section className="max-w-screen-xl mx-auto px-4 pt-12">
        <FlashSale />
      </section>
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
        <ServiceBanner />
      </section>
    </main>
  );
}
