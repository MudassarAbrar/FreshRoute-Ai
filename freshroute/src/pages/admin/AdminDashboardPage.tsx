import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { fetchSystemStats, fetchAllOrders } from "@/lib/db"
import { Users, Package, TrendingUp, Activity, Loader2, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchSystemStats(), fetchAllOrders()])
      .then(([s, o]) => {
        setStats(s)
        setRecentOrders(o.slice(0, 8))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-foreground">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">System-wide overview and management quick access.</p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Users} label="Total Users" value={stats?.totalUsers ?? 0} color="text-primary-600" bg="bg-primary-50" />
        <StatCard icon={Package} label="Total Orders" value={stats?.totalOrders ?? 0} color="text-good" bg="bg-good/10" />
        <StatCard icon={Activity} label="Active Orders" value={stats?.activeOrders ?? 0} color="text-warn" bg="bg-warn/10" />
        <StatCard icon={TrendingUp} label="Total Revenue" value={`PKR ${((stats?.totalRevenue ?? 0) / 1000).toFixed(0)}k`} color="text-accent" bg="bg-accent/10" />
      </div>

      {/* Quick links */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { to: "/admin/users", label: "Manage Users", icon: Users },
          { to: "/admin/orders", label: "Manage Orders", icon: Package },
          { to: "/admin/analytics", label: "View Analytics", icon: TrendingUp },
        ].map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-shadow hover:shadow-card">
            <Icon className="h-5 w-5 text-primary-600" />
            <span className="text-[13px] font-bold text-foreground">{label}</span>
            <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-extrabold text-foreground">Recent Orders</h2>
          <Link to="/admin/orders" className="text-[12px] font-bold text-primary-600 hover:underline">View all</Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-muted-foreground">No orders in the system.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-[11px] font-bold uppercase text-muted-foreground">Order</th>
                  <th className="px-3 py-2 text-[11px] font-bold uppercase text-muted-foreground">Customer</th>
                  <th className="hidden px-3 py-2 text-[11px] font-bold uppercase text-muted-foreground sm:table-cell">Crop</th>
                  <th className="px-3 py-2 text-[11px] font-bold uppercase text-muted-foreground">Status</th>
                  <th className="px-3 py-2 text-[11px] font-bold uppercase text-muted-foreground">Net</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o: any) => (
                  <tr key={o.id} className="border-b border-border last:border-b-0 hover:bg-muted/20">
                    <td className="px-3 py-2">
                      <Link to={`/orders/${o.id}`} className="text-[12px] font-bold text-primary-600 hover:underline">{o.id}</Link>
                    </td>
                    <td className="px-3 py-2 text-[12px] text-foreground">{o.profiles?.full_name ?? "—"}</td>
                    <td className="hidden px-3 py-2 text-[12px] text-foreground sm:table-cell">{o.crop}</td>
                    <td className="px-3 py-2">
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold",
                        o.status === "completed" ? "bg-good/15 text-good" :
                        o.status === "active" ? "bg-warn/15 text-warn" : "bg-risk/15 text-risk"
                      )}>{o.status.toUpperCase()}</span>
                    </td>
                    <td className="px-3 py-2 text-[12px] font-bold text-foreground">PKR {Number(o.final_net ?? o.net).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, bg }: { icon: any; label: string; value: any; color: string; bg: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className={cn("mb-2 flex h-9 w-9 items-center justify-center rounded-xl", bg)}>
        <Icon className={cn("h-[18px] w-[18px]", color)} />
      </div>
      <p className="text-xl font-extrabold text-foreground">{value}</p>
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
    </div>
  )
}
