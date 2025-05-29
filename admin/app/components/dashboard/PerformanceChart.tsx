import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', uv: 400, pv: 2400 },
  { name: 'Feb', uv: 300, pv: 1398 },
  { name: 'Mar', uv: 200, pv: 9800 },
  { name: 'Apr', uv: 278, pv: 3908 },
  { name: 'May', uv: 189, pv: 4800 },
  { name: 'Jun', uv: 239, pv: 3800 },
  { name: 'Jul', uv: 349, pv: 4300 },
];

export default function DashboardChart() {
  return (
    // Thay đổi col-span-8 thành col-span-12 để chiếm toàn bộ chiều rộng có thể
    <div className="bg-white rounded-xl shadow p-6 col-span-12">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Product Performance</h2>
      {/* Quay lại width="100%" vì ResponsiveContainer sẽ tự điều chỉnh theo cha */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="pv" stroke="#3b82f6" strokeWidth={2} />
          <Line type="monotone" dataKey="uv" stroke="#10b981" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 