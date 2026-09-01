import { useEffect, useState } from "react"
import { Navigate, useLocation, Outlet } from "react-router-dom"
import { useApp } from "@/store/useApp"
import { fetchProfile, onAuthChange } from "@/lib/auth"
import { fetchUserRoles } from "@/lib/db"
import { Loader2 } from "lucide-react"

export function ProtectedRoute({ adminOnly }: { adminOnly?: boolean }) {
  const session = useApp((s) => s.session)
  const profile = useApp((s) => s.profile)
  const setAuth = useApp((s) => s.setAuth)
  const location = useLocation()
  const [loading, setLoading] = useState(!session)

  useEffect(() => {
    let mounted = true
    const { subscription } = onAuthChange(async (user) => {
      if (!mounted) return
      if (user) {
        // Supabase Auth user — fetch profile from public.profiles
        const prof = await fetchProfile(user.id)
        setAuth(
          { user } as any,
          prof ?? {
            id: user.id,
            fullName: user.user_metadata?.fullName ?? user.email ?? "",
            email: user.email ?? "",
            phone: user.user_metadata?.phone ?? "",
            city: user.user_metadata?.city ?? "",
            address: user.user_metadata?.address ?? "",
            role: "farmer",
            customerCode: "",
            createdAt: new Date().toISOString(),
          },
        )
        // Load multi-role data from user_roles table
        try {
          const roles = await fetchUserRoles(user.id)
          useApp.getState().setUserRoles(roles)
        } catch {
          // user_roles may not exist if migration hasn't run
          useApp.getState().setUserRoles([])
        }
      } else {
        setAuth(null, null)
        useApp.getState().setUserRoles([])
      }
      setLoading(false)
    })
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <p className="text-sm font-medium text-muted-foreground">Loading…</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (adminOnly && profile?.role !== "admin") {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
