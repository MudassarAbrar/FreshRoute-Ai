import { useEffect, useState } from "react"
import { fetchAllProfiles, fetchAllCustomerMetrics } from "@/lib/db"
import { Search, Loader2, Star } from "lucide-react"
import { cn } from "@/lib/utils"

export default function AdminUsersPage() {
  const [profiles, setProfiles] = useState<any[]>([])
  const [metrics, setMetrics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    Promise.all([fetchAllProfiles(), fetchAllCustomerMetrics()])
      .then(([p, m]) => { setProfiles(p); setMetrics(m) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const metricsMap: Record<string, any> = {}
  metrics.forEach((m: any) => { metricsMap[m.user_id] = m })

  const filtered = profiles.filter((p) =>
    !search || `${p.full_name} ${p.email} ${p.customer_code} ${p.city}`.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-foreground">Users</h1>
        <p className="text-sm text-muted-foreground">Manage all registered customers ({profiles.length} total).</p>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users…"
          className="h-10 w-full max-w-md rounded-xl border border-input bg-background pl-10 pr-4 text-[13px] font-medium text-foreground outline-none ring-primary-400 focus:ring-2"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-[11px] font-bold uppercase text-muted-foreground">Customer</th>
                <th className="hidden px-4 py-3 text-[11px] font-bold uppercase text-muted-foreground sm:table-cell">City</th>
                <th className="hidden px-4 py-3 text-[11px] font-bold uppercase text-muted-foreground md:table-cell">Orders</th>
                <th className="hidden px-4 py-3 text-[11px] font-bold uppercase text-muted-foreground md:table-cell">Earned</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase text-muted-foreground">Score</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase text-muted-foreground">Role</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p: any) => {
                const m = metricsMap[p.id]
                return (
                  <tr key={p.id} className="border-b border-border last:border-b-0 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-bold text-foreground">{p.full_name}</p>
                      <p className="text-[11px] text-muted-foreground">{p.email}</p>
                      <p className="text-[10px] text-muted-foreground/70">{p.customer_code}</p>
                    </td>
                    <td className="hidden px-4 py-3 text-[12px] text-foreground sm:table-cell">{p.city}</td>
                    <td className="hidden px-4 py-3 text-[12px] text-foreground md:table-cell">{m?.total_orders ?? 0}</td>
                    <td className="hidden px-4 py-3 text-[12px] font-bold text-foreground md:table-cell">PKR {((m?.total_earned ?? 0) / 1000).toFixed(0)}k</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                        <span className="text-[12px] font-bold text-foreground">{m?.customer_score?.toFixed(0) ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold",
                        p.role === "admin" ? "bg-primary-50 text-primary-700" : "bg-muted text-muted-foreground"
                      )}>{p.role}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
