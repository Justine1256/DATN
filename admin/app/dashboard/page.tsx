import OverviewCards from "./components/OverviewCards";
import ProductPerformance from "./components/ProductPerformance";
import RecentOrders from "./components/RecentOrders";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <OverviewCards />
      <ProductPerformance />
      <RecentOrders />
    </div>
  );
}
