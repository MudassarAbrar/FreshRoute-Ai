import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { fetchOrderById } from "@/lib/db"
import { ArrowLeft, Package, Loader2, CheckCircle2, Clock, AlertTriangle, Truck } from "lucide-react"
import { cn } from "@/lib/utils"

export default function TrackOrderPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetchOrderById(id)
      .then(setOrder)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-[14px] font-bold text-foreground">Order not found</p>
          <Link to="/orders" className="mt-3 inline-block text-[13px] font-bold text-primary-600 hover:underline">
            Back to orders
          </Link>
        </div>
      </div>
    )
  }

  const steps = order.steps ?? []

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <Link to="/orders" className="mb-4 inline-flex items-center gap-2 text-[13px] font-bold text-primary-600 hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Back to Orders
      </Link>

      {/* Header */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-foreground">{order.id}</h1>
            <p className="text-[13px] text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
          </div>
          <span className={cn(
            "rounded-full px-3 py-1 text-[11px] font-bold",
            order.status === "completed" ? "bg-good/15 text-good" :
            order.status === "active" ? "bg-warn/15 text-warn" : "bg-risk/15 text-risk"
          )}>
            {order.status.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <InfoItem label="Crop" value={order.crop} />
          <InfoItem label="Quantity" value={`${Number(order.quantity_kg).toLocaleString()} kg`} />
          <InfoItem label="Buyer" value={order.buyer_name || "—"} />
          <InfoItem label="Destination" value={order.destination} />
          <InfoItem label="Price/kg" value={`PKR ${Number(order.price_per_kg).toLocaleString()}`} />
          <InfoItem label="Gross" value={`PKR ${Number(order.gross).toLocaleString()}`} />
          <InfoItem label="Net" value={`PKR ${Number(order.final_net ?? order.net).toLocaleString()}`} />
          <InfoItem label="Payment" value={`${order.payment_status} · ${order.payment_terms}`} />
        </div>
      </div>

      {/* Tracking steps */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 text-[15px] font-extrabold text-foreground">Tracking</h2>
        <div className="flex flex-col gap-0">
          {steps.map((step: any, i: number) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full",
                  step.state === "done" ? "bg-good/15" :
                  step.state === "active" ? "bg-warn/15" :
                  step.state === "alert" ? "bg-risk/15" : "bg-muted"
                )}>
                  {step.state === "done" ? <CheckCircle2 className="h-4 w-4 text-good" /> :
                   step.state === "active" ? <Truck className="h-4 w-4 text-warn" /> :
                   step.state === "alert" ? <AlertTriangle className="h-4 w-4 text-risk" /> :
                   <Clock className="h-4 w-4 text-muted-foreground" />}
                </div>
                {i < steps.length - 1 && (
                  <div className={cn("my-1 w-0.5 flex-1", step.state === "done" ? "bg-good/30" : "bg-border")} />
                )}
              </div>
              <div className="pb-5">
                <p className={cn("text-[13px] font-bold", step.state === "pending" ? "text-muted-foreground" : "text-foreground")}>
                  {step.label}
                </p>
                {step.time && step.time !== "—" && (
                  <p className="text-[11px] text-muted-foreground">{step.time}</p>
                )}
                {step.detail && (
                  <p className="mt-0.5 text-[12px] text-muted-foreground">{step.detail}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer info (if admin view) */}
      {order.profiles && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 text-[15px] font-extrabold text-foreground">Customer</h2>
          <div className="grid grid-cols-2 gap-3">
            <InfoItem label="Name" value={order.profiles.full_name} />
            <InfoItem label="Code" value={order.profiles.customer_code} />
            <InfoItem label="City" value={order.profiles.city} />
          </div>
        </div>
      )}
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="text-[13px] font-bold text-foreground">{value}</p>
    </div>
  )
}
