import { LayoutDashboard, Package } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white shadow h-screen p-6">
      <h2 className="text-xl font-bold mb-8">Venton</h2>
      <ul className="space-y-4">
        <li className="flex items-center space-x-2 text-blue-600 font-medium">
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </li>
        <li className="flex items-center space-x-2 text-gray-700">
          <Package size={18} />
          <span>Products</span>
        </li>
      </ul>
    </aside>
  );
}
