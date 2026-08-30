import { useEffect, useState } from "react"
import { fetchAllOrders, fetchAllCustomerMetrics } from "@/lib/db"
import { Loader2 } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts"

const COLORS = ["#16a34a", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6366f1"]

export default function AdminAnalyticsPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [metrics, setMetrics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchAllOrders(), fetchAllCustomerMetrics()])
      .then(([o, m]) => { setOrders(o); setMetrics(m) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>
  }

  // Orders by status
  const statusCounts: Record<string, number> = {}
  orders.forEach((o: any) => { statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1 })
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))

  // Revenue by crop
  const cropRevenue: Record<string, { revenue: number; count: number }> = {}
  orders.filter((o: any) => o.status === "completed").forEach((o: any) => {
    const crop = o.crop
    if (!cropRevenue[crop]) cropRevenue[crop] = { revenue: 0, count: 0 }
    cropRevenue[crop].revenue += Number(o.final_net ?? o.net)
    cropRevenue[crop].count += 1
  })
  const cropData = Object.entries(cropRevenue)
    .map(([crop, { revenue, count }]) => ({ crop, revenue, count, avg: Math.round(revenue / count) }))
    .sort((a, b) => b.revenue - a.revenue)

  // Revenue by destination
  const destRevenue: Record<string, number> = {}
  orders.filter((o: any) => o.status === "completed").forEach((o: any) => {
    destRevenue[o.destination] = (destRevenue[o.destination] ?? 0) + Number(o.final_net ?? o.net)
  })
  const destData = Object.entries(destRevenue)
    .map(([city, revenue]) => ({ city, revenue }))
    .sort((a, b) => b.revenue - a.revenue)

  // Monthly revenue
  const monthlyRevenue: Record<string, number> = {}
  orders.filter((o: any) => o.status === "completed").forEach((o: any) => {
    const month = new Date(o.created_at).toLocaleDateString("en", { month: "short", year: "2-digit" })
    monthlyRevenue[month] = (monthlyRevenue[month] ?? 0) + Number(o.final_net ?? o.net)
  })
  const monthlyData = Object.entries(monthlyRevenue).map(([month, revenue]) => ({ month, revenue }))

  // Average order value
  const completedOrders = orders.filter((o: any) => o.status === "completed")
  const avgOrderValue = completedOrders.length > 0
    ? Math.round(completedOrders.reduce((s: number, o: any) => s + Number(o.final_net ?? o.net), 0) / completedOrders.length)
    : 0

  // Top customers
  const topCustomers = metrics.slice(0, 5)

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground">Sales, revenue, and customer performance metrics.</p>
      </div>

      {/* Summary stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xl font-extrabold text-foreground">{orders.length}</p>
          <p className="text-[11px] font-medium text-muted-foreground">Total Orders</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xl font-extrabold text-foreground">{completedOrders.length}</p>
          <p className="text-[11px] font-medium text-muted-foreground">Completed</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xl font-extrabold text-foreground">PKR {(avgOrderValue / 1000).toFixed(0)}k</p>
          <p className="text-[11px] font-medium text-muted-foreground">Avg Order Value</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xl font-extrabold text-foreground">{metrics.length}</p>
          <p className="text-[11px] font-medium text-muted-foreground">Total Customers</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue over time */}
        {monthlyData.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 text-[15px] font-extrabold text-foreground">Revenue Over Time</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(44 22% 86%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6b7280" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => [`PKR ${Number(v).toLocaleString()}`, "Revenue"]} />
                  <Bar dataKey="revenue" fill="hsl(152 60% 32%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Orders by status */}
        {statusData.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 text-[15px] font-extrabold text-foreground">Orders by Status</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusData.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Revenue by crop */}
        {cropData.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 text-[15px] font-extrabold text-foreground">Revenue by Crop</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cropData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(44 22% 86%)" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#6b7280" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="crop" tick={{ fontSize: 11, fill: "#6b7280" }} width={80} />
                  <Tooltip formatter={(v) => [`PKR ${Number(v).toLocaleString()}`, "Revenue"]} />
                  <Bar dataKey="revenue" fill="hsl(36 95% 50%)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Revenue by destination */}
        {destData.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 text-[15px] font-extrabold text-foreground">Revenue by Destination</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={destData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(44 22% 86%)" />
                  <XAxis dataKey="city" tick={{ fontSize: 11, fill: "#6b7280" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => [`PKR ${Number(v).toLocaleString()}`, "Revenue"]} />
                  <Bar dataKey="revenue" fill="hsl(152 65% 25%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Top customers */}
      {topCustomers.length > 0 && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 text-[15px] font-extrabold text-foreground">Top Customers by Revenue</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-[11px] font-bold uppercase text-muted-foreground">#</th>
                  <th className="px-3 py-2 text-[11px] font-bold uppercase text-muted-foreground">Customer</th>
                  <th className="px-3 py-2 text-[11px] font-bold uppercase text-muted-foreground">Orders</th>
                  <th className="px-3 py-2 text-[11px] font-bold uppercase text-muted-foreground">Earned</th>
                  <th className="px-3 py-2 text-[11px] font-bold uppercase text-muted-foreground">Score</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((m: any, i: number) => (
                  <tr key={m.user_id} className="border-b border-border last:border-b-0">
                    <td className="px-3 py-2 text-[12px] font-bold text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2 text-[12px] font-bold text-foreground">{m.full_name}</td>
                    <td className="px-3 py-2 text-[12px] text-foreground">{m.total_orders}</td>
                    <td className="px-3 py-2 text-[12px] font-bold text-foreground">PKR {(m.total_earned / 1000).toFixed(0)}k</td>
                    <td className="px-3 py-2 text-[12px] font-bold text-foreground">{m.customer_score?.toFixed(0) ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
