import React, { useEffect, useState } from 'react';
import { api } from '@/services/api'; // 假設你的api服務是這樣匯入的
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RocketIcon } from '@radix-ui/react-icons';

// --- TypeScript Interfaces ---
type OverviewStats = {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  totalProducts: number;
  lowStockProducts: number;
};

type TrendData = {
  date: string;
  orderCount: number;
  revenue: number;
};

type PopularProduct = {
  name: string;
  totalSold: number;
};

type StatusDistribution = {
  status: string;
  count: number;
};

type DashboardData = {
  overview: OverviewStats;
  trend: TrendData[];
  popularProducts: PopularProduct[];
  statusDistribution: StatusDistribution[];
};

// --- Chart Colors ---
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19AF'];

// --- Main Component ---
const DashboardOverview: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/stats/dashboard');
        if (response.data.success) {
          setData(response.data.data);
        } else {
          throw new Error(response.data.message || '獲取儀表板數據失敗');
        }
      } catch (err: any) {
        setError(err.message || '發生未知錯誤');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><p>載入中...</p></div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <RocketIcon className="h-4 w-4" />
        <AlertTitle>錯誤</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return <p>沒有可顯示的數據。</p>;
  }

  const { overview, trend, popularProducts, statusDistribution } = data;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader><CardTitle>總訂單數</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{overview.totalOrders}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>總收入</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">NT$ {overview.totalRevenue.toLocaleString()}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>今日收入</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">NT$ {overview.todayRevenue.toLocaleString()}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>低庫存產品</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{overview.lowStockProducts}</p></CardContent></Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Order Trend Chart */}
        <Card>
          <CardHeader><CardTitle>最近7天訂單趨勢</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="orderCount" name="訂單數" stroke="#8884d8" />
                <Line type="monotone" dataKey="revenue" name="收入" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Popular Products Chart */}
        <Card>
          <CardHeader><CardTitle>熱門產品 Top 5</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={popularProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={80} />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalSold" name="總銷量" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Order Status Distribution Chart */}
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>訂單狀態分佈</CardTitle></CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={statusDistribution} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;
