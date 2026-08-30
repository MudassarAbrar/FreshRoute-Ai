import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { signUp } from "@/lib/auth"
import { Leaf, Loader2, Eye, EyeOff } from "lucide-react"

const CITIES = ["Multan", "Lahore", "Faisalabad", "Islamabad", "Karachi", "Rawalpindi", "Vehari", "Khanewal", "Sahiwal", "Other"]

export default function SignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "Multan",
    address: "",
    password: "",
  })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    setLoading(true)
    try {
      await signUp(form.email, form.password, {
        fullName: form.fullName,
        phone: form.phone,
        city: form.city,
        address: form.address,
      })
      navigate("/dashboard")
    } catch (err: any) {
      setError(err.message ?? "Signup failed")
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
            <h1 className="text-2xl font-extrabold text-foreground">FreshRoute</h1>
            <p className="text-sm text-muted-foreground">Create your account</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          {error && (
            <div className="mb-4 rounded-xl border border-risk/30 bg-risk/5 px-4 py-3 text-[13px] font-medium text-risk">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-foreground">Full Name</label>
              <input
                required
                value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                placeholder="Muhammad Ashraf"
                className="h-11 w-full rounded-xl border border-input bg-background px-4 text-[14px] font-medium text-foreground outline-none ring-primary-400 transition-shadow placeholder:text-muted-foreground/60 focus:ring-2"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-foreground">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="you@example.com"
                className="h-11 w-full rounded-xl border border-input bg-background px-4 text-[14px] font-medium text-foreground outline-none ring-primary-400 transition-shadow placeholder:text-muted-foreground/60 focus:ring-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[12px] font-bold text-foreground">Phone</label>
                <input
                  required
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="+92 300 1234567"
                  className="h-11 w-full rounded-xl border border-input bg-background px-4 text-[14px] font-medium text-foreground outline-none ring-primary-400 transition-shadow placeholder:text-muted-foreground/60 focus:ring-2"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-bold text-foreground">City</label>
                <select
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-[14px] font-medium text-foreground outline-none ring-primary-400 transition-shadow focus:ring-2"
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-foreground">Address</label>
              <input
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder="Street, area, landmark"
                className="h-11 w-full rounded-xl border border-input bg-background px-4 text-[14px] font-medium text-foreground outline-none ring-primary-400 transition-shadow placeholder:text-muted-foreground/60 focus:ring-2"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-foreground">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="At least 6 characters"
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
              className="mt-1 flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-600 text-[14px] font-bold text-white shadow-glow transition-colors hover:bg-primary-700 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-[13px] text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-primary-600 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}
