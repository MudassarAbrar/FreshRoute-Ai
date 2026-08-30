import { useEffect, useState } from "react"
import { useApp } from "@/store/useApp"
import { updateProfile, fetchCustomerMetrics, fetchReviews } from "@/lib/db"
import { Star, Calendar, MapPin, Phone, Mail, Hash, Loader2, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

export default function ProfilePage() {
  const profile = useApp((s) => s.profile)
  const setAuth = useApp((s) => s.setAuth)
  const session = useApp((s) => s.session)
  const [metrics, setMetrics] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ full_name: "", phone: "", city: "", address: "" })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) {
      setLoading(false)
      return
    }
    Promise.all([fetchCustomerMetrics(profile.id), fetchReviews(profile.id)])
      .then(([m, r]) => { setMetrics(m); setReviews(r) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [profile?.id])

  useEffect(() => {
    if (profile) {
      setForm({ full_name: profile.fullName, phone: profile.phone, city: profile.city, address: profile.address })
    }
  }, [profile])

  const handleSave = async () => {
    if (!profile?.id) return
    setSaving(true)
    try {
      await updateProfile(profile.id, form)
      // Refresh profile in store
      if (session) {
        const { fetchProfile } = await import("@/lib/auth")
        const updated = await fetchProfile(session.user.id)
        setAuth(session, updated)
      }
      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 2000)
    } catch {} finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground">View and manage your account information.</p>
      </div>

      {/* Profile card */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-xl font-extrabold text-primary-700">
            {profile?.fullName?.charAt(0)?.toUpperCase() ?? "?"}
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-foreground">{profile?.fullName}</h2>
            <p className="text-[12px] text-muted-foreground">{profile?.customerCode} · {profile?.role}</p>
          </div>
          {saved && (
            <span className="ml-auto flex items-center gap-1 text-[12px] font-bold text-good">
              <CheckCircle2 className="h-4 w-4" /> Saved
            </span>
          )}
        </div>

        {editing ? (
          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-[12px] font-bold text-foreground">Full Name</label>
              <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-[13px] font-medium text-foreground outline-none ring-primary-400 focus:ring-2" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[12px] font-bold text-foreground">Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-[13px] font-medium text-foreground outline-none ring-primary-400 focus:ring-2" />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-bold text-foreground">City</label>
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-[13px] font-medium text-foreground outline-none ring-primary-400 focus:ring-2" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-bold text-foreground">Address</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-[13px] font-medium text-foreground outline-none ring-primary-400 focus:ring-2" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving} className="flex h-10 items-center gap-2 rounded-xl bg-primary-600 px-5 text-[13px] font-bold text-white hover:bg-primary-700 disabled:opacity-60">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
              </button>
              <button onClick={() => { setEditing(false); setForm({ full_name: profile!.fullName, phone: profile!.phone, city: profile!.city, address: profile!.address }) }} className="h-10 rounded-xl border border-border px-5 text-[13px] font-bold text-muted-foreground hover:bg-muted">Cancel</button>
            </div>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow icon={Mail} label="Email" value={profile?.email ?? ""} />
              <InfoRow icon={Phone} label="Phone" value={profile?.phone ?? "—"} />
              <InfoRow icon={MapPin} label="City" value={profile?.city ?? "—"} />
              <InfoRow icon={MapPin} label="Address" value={profile?.address ?? "—"} />
              <InfoRow icon={Calendar} label="Member Since" value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—"} />
              <InfoRow icon={Hash} label="Customer Code" value={profile?.customerCode ?? "—"} />
            </div>
            <button onClick={() => setEditing(true)} className="mt-4 rounded-xl border border-border px-4 py-2 text-[13px] font-bold text-primary-600 hover:bg-primary-50">
              Edit Profile
            </button>
          </div>
        )}
      </div>

      {/* Metrics */}
      {metrics && (
        <div className="mb-6 rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 text-[15px] font-extrabold text-foreground">Customer Metrics</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            <MetricBox label="Total Orders" value={metrics.total_orders} />
            <MetricBox label="Completed" value={metrics.completed_orders} />
            <MetricBox label="Cancelled" value={metrics.cancelled_orders} />
            <MetricBox label="Avg Rating" value={metrics.avg_rating ? metrics.avg_rating.toFixed(1) : "—"} />
            <MetricBox label="Total Earned" value={`PKR ${(metrics.total_earned / 1000).toFixed(0)}k`} />
            <MetricBox label="Score" value={metrics.customer_score?.toFixed(0) ?? "—"} highlight />
          </div>
        </div>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 text-[15px] font-extrabold text-foreground">Reviews</h2>
          <div className="flex flex-col gap-2">
            {reviews.map((r: any) => (
              <div key={r.id} className="rounded-xl border border-border px-4 py-3">
                <div className="mb-1 flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={cn("h-3.5 w-3.5", i < r.rating ? "fill-accent text-accent" : "text-muted-foreground/30")} />
                    ))}
                  </div>
                  <span className="text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-[13px] text-foreground">{r.feedback}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
      <div>
        <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
        <p className="text-[13px] font-bold text-foreground">{value}</p>
      </div>
    </div>
  )
}

function MetricBox({ label, value, highlight }: { label: string; value: any; highlight?: boolean }) {
  return (
    <div className={cn("rounded-xl p-3 text-center", highlight ? "bg-primary-50" : "bg-muted/30")}>
      <p className={cn("text-lg font-extrabold", highlight ? "text-primary-700" : "text-foreground")}>{value}</p>
      <p className="text-[10px] font-medium text-muted-foreground">{label}</p>
    </div>
  )
}
