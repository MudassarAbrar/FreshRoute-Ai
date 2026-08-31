import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useApp } from "@/store/useApp"
import { addUserRole } from "@/lib/db"
import { Check, Loader2, Leaf, Truck, Warehouse, ShoppingCart } from "lucide-react"
import { cn } from "@/lib/utils"
import type { UserRoleType } from "@/types"

const ROLES: {
  role: UserRoleType
  label: string
  description: string
  icon: typeof Leaf
}[] = [
  {
    role: "farmer",
    label: "Farmer / Seller",
    description: "List produce lots, get AI recommendations, sell to buyers",
    icon: Leaf,
  },
  {
    role: "buyer",
    label: "Buyer",
    description: "Post purchase requests, browse available lots, place offers",
    icon: ShoppingCart,
  },
  {
    role: "transporter",
    label: "Transporter",
    description: "Offer transport services, receive booking requests",
    icon: Truck,
  },
  {
    role: "storage_provider",
    label: "Storage Provider",
    description: "List cold/dry storage capacity, accept storage bookings",
    icon: Warehouse,
  },
]

export default function RoleSelectPage() {
  const navigate = useNavigate()
  const profile = useApp((s) => s.profile)
  const [selected, setSelected] = useState<Set<UserRoleType>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const toggle = (role: UserRoleType) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(role)) next.delete(role)
      else next.add(role)
      return next
    })
  }

  const handleContinue = async () => {
    if (selected.size === 0) {
      setError("Select at least one role to continue.")
      return
    }
    if (!profile?.id) {
      setError("You must be signed in to select roles.")
      return
    }
    setError("")
    setLoading(true)
    try {
      for (const role of selected) {
        await addUserRole(profile.id, role)
      }
      // Navigate to the profile form for the first selected role
      const firstRole = Array.from(selected)[0]
      navigate(`/role-profile?role=${firstRole}`)
    } catch (err: any) {
      setError(err.message ?? "Failed to save roles")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 shadow-glow">
            <Leaf className="h-7 w-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-foreground">What do you want to do?</h1>
            <p className="text-sm text-muted-foreground">
              Select one or more roles. You can add more later.
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          {error && (
            <div className="mb-4 rounded-xl border border-risk/30 bg-risk/5 px-4 py-3 text-[13px] font-medium text-risk">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2.5">
            {ROLES.map(({ role, label, description, icon: Icon }) => {
              const isSelected = selected.has(role)
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggle(role)}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border-2 px-4 py-3.5 text-left transition-all",
                    isSelected
                      ? "border-primary-600 bg-primary-50"
                      : "border-border bg-background hover:border-primary-200 hover:bg-muted/50",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                      isSelected ? "bg-primary-600" : "bg-muted",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        isSelected ? "text-white" : "text-muted-foreground",
                      )}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-[14px] font-bold",
                          isSelected ? "text-primary-800" : "text-foreground",
                        )}
                      >
                        {label}
                      </span>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary-600" />
                      )}
                    </div>
                    <p
                      className={cn(
                        "text-[12px]",
                        isSelected ? "text-primary-600" : "text-muted-foreground",
                      )}
                    >
                      {description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={handleContinue}
            disabled={loading}
            className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary-600 text-[14px] font-bold text-white shadow-glow transition-colors hover:bg-primary-700 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Saving…" : `Continue (${selected.size} selected)`}
          </button>
        </div>
      </div>
    </div>
  )
}
