import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useApp } from "@/store/useApp"
import { fetchOrders, fetchCustomerMetrics } from "@/lib/db"
import {
  Package,
  TrendingUp,
  Star,
  Clock,
  ArrowRight,
  Loader2,
  MessageCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
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
      .then(([o, m]) => {
        setOrders(o)
        setMetrics(m)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [profile?.id])

  const activeOrders = orders.filter((o) => o.status === "active")
  const recentOrders = orders.slice(0, 5)
  const totalEarned = metrics?.total_earned ?? 0
  const customerScore = metrics?.customer_score ?? 0

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-foreground">
          Welcome, {profile?.fullName?.split(" ")[0] ?? "User"}
        </h1>
        <p className="text-sm text-muted-foreground">Here&apos;s an overview of your produce trading activity.</p>
      </div>

      {/* Stats grid */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={Package}
          label="Total Orders"
          value={metrics?.total_orders ?? 0}
          color="text-primary-600"
          bg="bg-primary-50"
        />
        <StatCard
          icon={TrendingUp}
          label="Total Earned"
          value={`PKR ${(totalEarned / 1000).toFixed(0)}k`}
          color="text-good"
          bg="bg-good/10"
        />
        <StatCard
          icon={Star}
          label="Customer Score"
          value={customerScore.toFixed(0)}
          sub="out of 100"
          color="text-accent"
          bg="bg-accent/10"
        />
        <StatCard
          icon={Clock}
          label="Active Orders"
          value={activeOrders.length}
          color="text-warn"
          bg="bg-warn/10"
        />
      </div>

      {/* Quick action */}
      <Link
        to="/chat"
        className="mb-6 flex items-center gap-3 rounded-2xl border border-primary-200 bg-primary-50 px-5 py-4 transition-shadow hover:shadow-card"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600">
          <MessageCircle className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-bold text-primary-800">Start a New Lot</p>
          <p className="text-[12px] text-primary-600">Tell the AI assistant what produce you have to sell</p>
        </div>
        <ArrowRight className="h-5 w-5 text-primary-400" />
      </Link>

      {/* Active orders */}
      {activeOrders.length > 0 && (
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-extrabold text-foreground">Active Orders</h2>
            <Link to="/orders" className="text-[12px] font-bold text-primary-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {activeOrders.map((o) => (
              <OrderRow key={o.id} order={o} />
            ))}
          </div>
        </div>
      )}

      {/* Recent orders */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-extrabold text-foreground">Recent Orders</h2>
          <Link to="/orders" className="text-[12px] font-bold text-primary-600 hover:underline">
            View all
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-[14px] font-bold text-foreground">No orders yet</p>
            <p className="text-[12px] text-muted-foreground">Start by chatting with the AI assistant to create your first lot.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recentOrders.map((o) => (
              <OrderRow key={o.id} order={o} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  bg,
}: {
  icon: any
  label: string
  value: string | number
  sub?: string
  color: string
  bg: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className={cn("mb-2 flex h-9 w-9 items-center justify-center rounded-xl", bg)}>
        <Icon className={cn("h-[18px] w-[18px]", color)} />
      </div>
      <p className="text-xl font-extrabold text-foreground">{value}</p>
      <p className="text-[11px] font-medium text-muted-foreground">
        {label}
        {sub && <span className="text-muted-foreground/60"> {sub}</span>}
      </p>
    </div>
  )
}

function OrderRow({ order }: { order: any }) {
  const statusColors: Record<string, string> = {
    active: "bg-warn/15 text-warn",
    completed: "bg-good/15 text-good",
    cancelled: "bg-risk/15 text-risk",
  }
  return (
    <Link
      to={`/orders/${order.id}`}
      className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/50"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-foreground">{order.id}</span>
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", statusColors[order.status] ?? "bg-muted text-muted-foreground")}>
            {order.status.toUpperCase()}
          </span>
        </div>
        <p className="text-[12px] text-muted-foreground">
          {order.crop} · {order.quantityKg.toLocaleString()} kg · {order.destination}
        </p>
      </div>
      <div className="text-right">
        <p className="text-[13px] font-bold text-foreground">PKR {order.net.toLocaleString()}</p>
        <p className="text-[11px] text-muted-foreground">
          {new Date(order.createdAt).toLocaleDateString()}
        </p>
      </div>
    </Link>
  )
}
