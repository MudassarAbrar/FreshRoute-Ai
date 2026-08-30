import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { AppLayout } from "@/components/layout/AppLayout"
import { AdminLayout } from "@/components/layout/AdminLayout"
import "./index.css"

// Auth pages
import LoginPage from "@/pages/LoginPage"
import SignupPage from "@/pages/SignupPage"
import ForgotPasswordPage from "@/pages/ForgotPasswordPage"
import ResetPasswordPage from "@/pages/ResetPasswordPage"

// User pages (lazy-loaded for performance)
import { lazy, Suspense } from "react"
import { Loader2 } from "lucide-react"

// Public landing page
const LandingPage = lazy(() => import("@/pages/LandingPage"))

const DashboardPage = lazy(() => import("@/pages/DashboardPage"))
const OrdersPage = lazy(() => import("@/pages/OrdersPage"))
const TrackOrderPage = lazy(() => import("@/pages/TrackOrderPage"))
const RevenuePage = lazy(() => import("@/pages/RevenuePage"))
const ProfilePage = lazy(() => import("@/pages/ProfilePage"))
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage"))
const ChatPage = lazy(() => import("@/pages/ChatPage"))
const SettingsPage = lazy(() => import("@/pages/SettingsPage"))

// Admin pages
const AdminDashboardPage = lazy(() => import("@/pages/admin/AdminDashboardPage"))
const AdminUsersPage = lazy(() => import("@/pages/admin/AdminUsersPage"))
const AdminOrdersPage = lazy(() => import("@/pages/admin/AdminOrdersPage"))
const AdminAnalyticsPage = lazy(() => import("@/pages/admin/AdminAnalyticsPage"))
const AdminSettingsPage = lazy(() => import("@/pages/admin/AdminSettingsPage"))

function PageLoader() {
  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
    </div>
  )
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected user routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout><Outlet /></AppLayout>}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/orders/:id" element={<TrackOrderPage />} />
              <Route path="/revenue" element={<RevenuePage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* Protected admin routes */}
          <Route element={<ProtectedRoute adminOnly />}>
            <Route element={<AdminLayout><Outlet /></AdminLayout>}>
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/orders" element={<AdminOrdersPage />} />
              <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
              <Route path="/admin/settings" element={<AdminSettingsPage />} />
            </Route>
          </Route>

          {/* Public landing page */}
          <Route path="/" element={<LandingPage />} />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>,
)
