import { useState } from "react"
import { NavLink } from "react-router-dom"
import { useApp } from "@/store/useApp"
import { signOut } from "@/lib/auth"
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  User,
  Bell,
  MessageCircle,
  Settings,
  LogOut,
  Menu,
  X,
  Leaf,
  ShieldCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/orders", icon: Package, label: "Orders" },
  { to: "/revenue", icon: TrendingUp, label: "Revenue" },
  { to: "/profile", icon: User, label: "Profile" },
  { to: "/notifications", icon: Bell, label: "Notifications" },
  { to: "/chat", icon: MessageCircle, label: "AI Assistant" },
  { to: "/settings", icon: Settings, label: "Settings" },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = useApp((s) => s.profile)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch {
      // ignore — redirect will happen via auth listener
    }
  }

  return (
    <div className="flex h-full w-full bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform duration-200 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600">
            <Leaf className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-[15px] font-extrabold text-foreground">FreshRoute</h1>
            <p className="truncate text-[11px] text-muted-foreground">Produce Trading Platform</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto rounded-lg p-1 hover:bg-muted lg:hidden"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <ul className="flex flex-col gap-0.5">
            {navItems.map(({ to, icon: Icon, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors",
                      isActive
                        ? "bg-primary-50 text-primary-700"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )
                  }
                >
                  <Icon className="h-[18px] w-[18px]" />
                  {label}
                </NavLink>
              </li>
            ))}
            {profile?.role === "admin" && (
              <li>
                <NavLink
                  to="/admin/dashboard"
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors",
                      isActive
                        ? "bg-primary-50 text-primary-700"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )
                  }
                >
                  <ShieldCheck className="h-[18px] w-[18px]" />
                  Admin Portal
                </NavLink>
              </li>
            )}
          </ul>
        </nav>

        {/* User section */}
        <div className="border-t border-border px-3 py-3">
          <div className="mb-2 flex items-center gap-3 px-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[13px] font-bold text-primary-700">
              {profile?.fullName?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold text-foreground">
                {profile?.fullName ?? "User"}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {profile?.customerCode ?? ""}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-risk/10 hover:text-risk"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1.5 hover:bg-muted"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-primary-600" />
            <span className="text-[15px] font-extrabold text-foreground">FreshRoute</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
