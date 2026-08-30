import { useEffect, useState } from "react"
import { Navigate, useLocation, Outlet } from "react-router-dom"
import { useApp } from "@/store/useApp"
import { fetchProfile, onAuthChange, getSession } from "@/lib/auth"
import { Loader2 } from "lucide-react"

export function ProtectedRoute({ adminOnly }: { adminOnly?: boolean }) {
  const session = useApp((s) => s.session)
  const profile = useApp((s) => s.profile)
  const setAuth = useApp((s) => s.setAuth)
  const location = useLocation()
  const [loading, setLoading] = useState(!session)

  useEffect(() => {
    let mounted = true
    const { data: sub } = onAuthChange(async (sess) => {
      if (!mounted) return
      if (sess) {
        const prof = await fetchProfile(sess.user.id)
        setAuth(sess, prof)
      } else {
        setAuth(null, null)
      }
      setLoading(false)
    })
    if (!session) {
      getSession().then(async (sess) => {
        if (!mounted) return
        if (sess) {
          const prof = await fetchProfile(sess.user.id)
          setAuth(sess, prof)
        }
        setLoading(false)
      })
    }
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
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
