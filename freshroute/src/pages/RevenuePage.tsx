import { useEffect, useState } from "react"
import { useApp } from "@/store/useApp"
import { fetchOrders, fetchCustomerMetrics } from "@/lib/db"
import { TrendingUp, Loader2, DollarSign, ArrowUpRight } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

export default function RevenuePage() {
  const profile = useApp((s) => s.profile)
  const [orders, setOrders] = useState<any[]>([])
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) {
      setLoading(false)
      return
    }
    Promise.all([fetchOrders(profile.id), fetchCustomerMetrics(profile.id)])
      .then(([o, m]) => { setOrders(o); setMetrics(m) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [profile?.id])

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>
  }

  const completed = orders.filter((o) => o.status === "completed")
  const totalEarned = metrics?.total_earned ?? 0
  const totalSalesValue = metrics?.total_sales_value ?? 0

  // Group completed orders by month for chart
  const monthlyData: Record<string, number> = {}
  completed.forEach((o) => {
    const month = new Date(o.createdAt).toLocaleDateString("en", { month: "short", year: "2-digit" })
    monthlyData[month] = (monthlyData[month] ?? 0) + (o.net ?? 0)
  })
  const chartData = Object.entries(monthlyData).map(([month, net]) => ({ month, net }))

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-foreground">Revenue</h1>
        <p className="text-sm text-muted-foreground">Your earnings and financial overview.</p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-good/10">
            <TrendingUp className="h-[18px] w-[18px] text-good" />
          </div>
          <p className="text-xl font-extrabold text-foreground">PKR {(totalEarned / 1000).toFixed(0)}k</p>
          <p className="text-[11px] font-medium text-muted-foreground">Total Earned (net)</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50">
            <DollarSign className="h-[18px] w-[18px] text-primary-600" />
          </div>
          <p className="text-xl font-extrabold text-foreground">PKR {(totalSalesValue / 1000).toFixed(0)}k</p>
          <p className="text-[11px] font-medium text-muted-foreground">Total Sales Value</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 col-span-2 sm:col-span-1">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-warn/10">
            <ArrowUpRight className="h-[18px] w-[18px] text-warn" />
          </div>
          <p className="text-xl font-extrabold text-foreground">PKR {completed.length > 0 ? Math.round(totalEarned / completed.length).toLocaleString() : "0"}</p>
          <p className="text-[11px] font-medium text-muted-foreground">Avg Order Net</p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="mb-6 rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 text-[15px] font-extrabold text-foreground">Revenue Over Time</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(44 22% 86%)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6b7280" }} />
                <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [`PKR ${Number(v).toLocaleString()}`, "Net Revenue"]} />
                <Bar dataKey="net" fill="hsl(152 60% 32%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Transaction list */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 text-[15px] font-extrabold text-foreground">Completed Transactions</h2>
        {completed.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-muted-foreground">No completed orders yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {completed.map((o) => (
              <div key={o.id} className="flex items-center gap-3 rounded-xl border border-border px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-foreground">{o.id} — {o.crop}</p>
                  <p className="text-[11px] text-muted-foreground">{o.quantityKg.toLocaleString()} kg · {o.destination} · {new Date(o.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-bold text-good">PKR {o.net.toLocaleString()}</p>
                  <p className="text-[11px] text-muted-foreground">Gross: PKR {o.gross.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
