import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useApp } from "@/store/useApp"
import { fetchOrders } from "@/lib/db"
import { Package, Search, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export default function OrdersPage() {
  const profile = useApp((s) => s.profile)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (!profile?.id) {
      setLoading(false)
      return
    }
    fetchOrders(profile.id)
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [profile?.id])

  const filtered = orders.filter((o) => {
    if (filter !== "all" && o.status !== filter) return false
    if (search && !`${o.id} ${o.crop} ${o.destination} ${o.buyerName}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const statusColors: Record<string, string> = {
    active: "bg-warn/15 text-warn",
    completed: "bg-good/15 text-good",
    cancelled: "bg-risk/15 text-risk",
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-foreground">Orders</h1>
        <p className="text-sm text-muted-foreground">View and track all your produce orders.</p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders…"
            className="h-10 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-[13px] font-medium text-foreground outline-none ring-primary-400 focus:ring-2"
          />
        </div>
        <div className="flex gap-1.5">
          {["all", "active", "completed", "cancelled"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "rounded-lg px-3 py-2 text-[12px] font-bold transition-colors",
                filter === s ? "bg-primary-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-[14px] font-bold text-foreground">No orders found</p>
          <p className="text-[12px] text-muted-foreground">
            {orders.length === 0
              ? "Start by chatting with the AI assistant to create your first lot."
              : "Try adjusting your filters."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-[11px] font-bold uppercase text-muted-foreground">Order ID</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase text-muted-foreground">Crop</th>
                <th className="hidden px-4 py-3 text-[11px] font-bold uppercase text-muted-foreground sm:table-cell">Quantity</th>
                <th className="hidden px-4 py-3 text-[11px] font-bold uppercase text-muted-foreground md:table-cell">Destination</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase text-muted-foreground">Net</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-b border-border last:border-b-0 transition-colors hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <Link to={`/orders/${o.id}`} className="text-[13px] font-bold text-primary-600 hover:underline">
                      {o.id}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-foreground">{o.crop}</td>
                  <td className="hidden px-4 py-3 text-[13px] text-foreground sm:table-cell">{o.quantityKg.toLocaleString()} kg</td>
                  <td className="hidden px-4 py-3 text-[13px] text-foreground md:table-cell">{o.destination}</td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", statusColors[o.status])}>
                      {o.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] font-bold text-foreground">PKR {o.net.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
