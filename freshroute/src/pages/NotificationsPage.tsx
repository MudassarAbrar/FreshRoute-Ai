import { useEffect, useState } from "react"
import { useApp } from "@/store/useApp"
import { fetchNotifications, markNotificationRead } from "@/lib/db"
import { BellOff, Loader2, AlertTriangle, TrendingUp, Info, Package } from "lucide-react"
import { cn } from "@/lib/utils"

export default function NotificationsPage() {
  const profile = useApp((s) => s.profile)
  const [notifs, setNotifs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) {
      setLoading(false)
      return
    }
    fetchNotifications(profile.id)
      .then(setNotifs)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [profile?.id])

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id)
    setNotifs((n) => n.map((x) => (x.id === id ? { ...x, read: true } : x)))
  }

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>
  }

  const kindIcon: Record<string, any> = { delay: AlertTriangle, price: TrendingUp, order: Package, info: Info }
  const kindColor: Record<string, string> = { delay: "text-warn bg-warn/10", price: "text-primary-600 bg-primary-50", order: "text-good bg-good/10", info: "text-muted-foreground bg-muted" }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-foreground">Notifications</h1>
        <p className="text-sm text-muted-foreground">Stay updated on your orders and market changes.</p>
      </div>

      {notifs.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <BellOff className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-[14px] font-bold text-foreground">No notifications</p>
          <p className="text-[12px] text-muted-foreground">You&apos;ll receive alerts about order updates, delays, and price changes.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifs.map((n) => {
            const Icon = kindIcon[n.kind] ?? Info
            const color = kindColor[n.kind] ?? kindColor.info
            return (
              <div
                key={n.id}
                className={cn(
                  "flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors",
                  n.read ? "border-border bg-card" : "border-primary-200 bg-primary-50/50",
                )}
              >
                <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl", color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-[13px]", n.read ? "font-medium text-foreground" : "font-bold text-foreground")}>{n.title}</p>
                  {n.body && <p className="mt-0.5 text-[12px] text-muted-foreground">{n.body}</p>}
                  <p className="mt-1 text-[11px] text-muted-foreground/70">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                {!n.read && (
                  <button onClick={() => handleMarkRead(n.id)} className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-bold text-primary-600 hover:bg-primary-100">
                    Mark read
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
