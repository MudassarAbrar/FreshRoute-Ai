import { useNavigate, useSearchParams } from "react-router-dom"
import { useApp } from "@/store/useApp"
import { fetchUserRoles, saveRoleProfile } from "@/lib/db"
import { RoleProfileForm } from "@/components/auth/RoleProfileForm"
import { Leaf, Loader2 } from "lucide-react"
import type { UserRoleType, RoleProfileData } from "@/types"
import { useState } from "react"

const ROLE_LABELS: Record<string, string> = {
  farmer: "Farmer / Seller",
  buyer: "Buyer",
  transporter: "Transporter",
  storage_provider: "Storage Provider",
}

export default function RoleProfilePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const role = (searchParams.get("role") ?? "farmer") as UserRoleType
  const profile = useApp((s) => s.profile)
  const setUserRoles = useApp((s) => s.setUserRoles)
  const [error, setError] = useState("")

  const handleSubmit = async (data: RoleProfileData) => {
    if (!profile?.id) {
      setError("You must be signed in to save your profile.")
      return
    }
    setError("")
    try {
      // Find the user_role row for this role
      const roles = await fetchUserRoles(profile.id)
      const matchingRole = roles.find((r) => r.role === role)
      if (matchingRole) {
        await saveRoleProfile(matchingRole.id, data)
      }
      // Reload roles into store
      setUserRoles(roles)
      navigate("/dashboard")
    } catch (err: any) {
      setError(err.message ?? "Failed to save profile")
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
            <h1 className="text-2xl font-extrabold text-foreground">
              {ROLE_LABELS[role] ?? role} Profile
            </h1>
            <p className="text-sm text-muted-foreground">
              Tell us a bit more about your {ROLE_LABELS[role]?.toLowerCase()} setup.
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

          <RoleProfileForm
            role={role}
            onSubmit={handleSubmit}
            submitLabel="Complete Setup"
          />

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="mt-3 w-full text-center text-[12px] font-medium text-muted-foreground hover:text-foreground"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  )
}
