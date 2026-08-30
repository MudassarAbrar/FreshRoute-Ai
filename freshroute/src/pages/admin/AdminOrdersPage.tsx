import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { fetchAllOrders } from "@/lib/db"
import { Search, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchAllOrders()
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = orders.filter((o: any) => {
    if (filter !== "all" && o.status !== filter) return false
    if (search && !`${o.id} ${o.crop} ${o.buyer_name} ${o.destination} ${o.profiles?.full_name ?? ""}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const statusColors: Record<string, string> = {
    active: "bg-warn/15 text-warn",
    completed: "bg-good/15 text-good",
    cancelled: "bg-risk/15 text-risk",
  }

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-foreground">Orders</h1>
        <p className="text-sm text-muted-foreground">All orders across all customers ({orders.length} total).</p>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders…"
            className="h-10 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-[13px] font-medium text-foreground outline-none ring-primary-400 focus:ring-2" />
        </div>
        <div className="flex gap-1.5">
          {["all", "active", "completed", "cancelled"].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={cn("rounded-lg px-3 py-2 text-[12px] font-bold transition-colors",
                filter === s ? "bg-primary-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80")}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-[11px] font-bold uppercase text-muted-foreground">Order</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase text-muted-foreground">Customer</th>
                <th className="hidden px-4 py-3 text-[11px] font-bold uppercase text-muted-foreground sm:table-cell">Crop</th>
                <th className="hidden px-4 py-3 text-[11px] font-bold uppercase text-muted-foreground md:table-cell">Qty</th>
                <th className="hidden px-4 py-3 text-[11px] font-bold uppercase text-muted-foreground md:table-cell">Dest</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase text-muted-foreground">Net</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o: any) => (
                <tr key={o.id} className="border-b border-border last:border-b-0 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <Link to={`/orders/${o.id}`} className="text-[12px] font-bold text-primary-600 hover:underline">{o.id}</Link>
                    <p className="text-[10px] text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</p>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-foreground">{o.profiles?.full_name ?? "—"}</td>
                  <td className="hidden px-4 py-3 text-[12px] text-foreground sm:table-cell">{o.crop}</td>
                  <td className="hidden px-4 py-3 text-[12px] text-foreground md:table-cell">{Number(o.quantity_kg).toLocaleString()} kg</td>
                  <td className="hidden px-4 py-3 text-[12px] text-foreground md:table-cell">{o.destination}</td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", statusColors[o.status])}>{o.status.toUpperCase()}</span>
                  </td>
                  <td className="px-4 py-3 text-[12px] font-bold text-foreground">PKR {Number(o.final_net ?? o.net).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
