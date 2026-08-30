import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { signIn } from "@/lib/auth"
import { Leaf, Loader2, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await signIn(email, password)
      navigate("/dashboard")
    } catch (err: any) {
      setError(err.message ?? "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 shadow-glow">
            <Leaf className="h-7 w-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-foreground">FreshRoute</h1>
            <p className="text-sm text-muted-foreground">Produce Trading Platform</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="mb-1 text-lg font-extrabold text-foreground">Sign In</h2>
          <p className="mb-5 text-[13px] text-muted-foreground">
            Welcome back. Sign in to access your dashboard.
          </p>

          {error && (
            <div className="mb-4 rounded-xl border border-risk/30 bg-risk/5 px-4 py-3 text-[13px] font-medium text-risk">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-foreground">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-11 w-full rounded-xl border border-input bg-background px-4 text-[14px] font-medium text-foreground outline-none ring-primary-400 transition-shadow placeholder:text-muted-foreground/60 focus:ring-2"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-foreground">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-11 w-full rounded-xl border border-input bg-background px-4 pr-11 text-[14px] font-medium text-foreground outline-none ring-primary-400 transition-shadow placeholder:text-muted-foreground/60 focus:ring-2"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-600 text-[14px] font-bold text-white shadow-glow transition-colors hover:bg-primary-700 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-between text-[12px]">
            <Link to="/forgot-password" className="font-semibold text-primary-600 hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>

        <p className="mt-5 text-center text-[13px] text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="font-bold text-primary-600 hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  )
}
