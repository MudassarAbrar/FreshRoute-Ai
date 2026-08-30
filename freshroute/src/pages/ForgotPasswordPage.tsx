import { useState } from "react"
import { Link } from "react-router-dom"
import { resetPassword } from "@/lib/auth"
import { Leaf, Loader2, CheckCircle2 } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await resetPassword(email)
      setSent(true)
    } catch (err: any) {
      setError(err.message ?? "Failed to send reset email")
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
            <p className="text-sm text-muted-foreground">Reset your password</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          {sent ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <CheckCircle2 className="h-12 w-12 text-good" />
              <h2 className="text-lg font-extrabold text-foreground">Check your email</h2>
              <p className="text-[13px] text-muted-foreground">
                We sent a password reset link to <span className="font-bold text-foreground">{email}</span>.
                Click the link in the email to reset your password.
              </p>
              <Link to="/login" className="mt-2 text-[13px] font-bold text-primary-600 hover:underline">
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <h2 className="mb-1 text-lg font-extrabold text-foreground">Forgot Password</h2>
              <p className="mb-5 text-[13px] text-muted-foreground">
                Enter your email and we&apos;ll send you a reset link.
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
                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-600 text-[14px] font-bold text-white shadow-glow transition-colors hover:bg-primary-700 disabled:opacity-60"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? "Sending…" : "Send Reset Link"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-5 text-center text-[13px] text-muted-foreground">
          <Link to="/login" className="font-bold text-primary-600 hover:underline">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}
