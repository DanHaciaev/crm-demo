"use client";

import {
  LineChart, Line,
  BarChart, Bar,
  AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const salesData = [
  { month: "Янв", "выручка": 4000, "расходы": 2400 },
  { month: "Фев", "выручка": 3000, "расходы": 1398 },
  { month: "Мар", "выручка": 5000, "расходы": 3200 },
  { month: "Апр", "выручка": 4800, "расходы": 2900 },
  { month: "Май", "выручка": 7000, "расходы": 3800 },
  { month: "Июн", "выручка": 6200, "расходы": 4100 },
];

const pieData = [
  { name: "Органика", value: 400 },
  { name: "Реклама", value: 300 },
  { name: "Реферал", value: 200 },
  { name: "Прямой", value: 100 },
];

const PIE_COLORS = ["#3B82F6", "#22C55E", "#F59E0B", "#EF4444"];

export default function Charts() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">

      {/* Line chart */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h3 className="text-sm font-medium text-gray-500 mb-4">Выручка vs расходы</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="выручка" stroke="#3B82F6" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="расходы" stroke="#EF4444" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h3 className="text-sm font-medium text-gray-500 mb-4">Продажи по месяцам</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="выручка" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Area chart */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h3 className="text-sm font-medium text-gray-500 mb-4">Динамика роста</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Area type="monotone" dataKey="выручка" stroke="#3B82F6" fill="#EFF6FF" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Pie chart */}
      <div className="bg-white rounded-xl border border-gray-100 pb-10 pt-4 px-4">
        <h3 className="text-sm font-medium text-gray-500 mb-4">Источники трафика</h3>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={80} dataKey="value">
              {pieData.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}