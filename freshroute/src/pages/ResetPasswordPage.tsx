import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { updatePassword } from "@/lib/auth"
import { Leaf, Loader2, CheckCircle2 } from "lucide-react"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }
    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }
    setLoading(true)
    try {
      await updatePassword(password)
      setDone(true)
    } catch (err: any) {
      setError(err.message ?? "Failed to update password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 shadow-glow">
            <Leaf className="h-7 w-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-foreground">FreshRoute</h1>
            <p className="text-sm text-muted-foreground">Set a new password</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          {done ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <CheckCircle2 className="h-12 w-12 text-good" />
              <h2 className="text-lg font-extrabold text-foreground">Password updated</h2>
              <p className="text-[13px] text-muted-foreground">Your new password is active.</p>
              <button
                onClick={() => navigate("/dashboard")}
                className="mt-2 flex h-11 items-center justify-center rounded-xl bg-primary-600 px-6 text-[14px] font-bold text-white shadow-glow transition-colors hover:bg-primary-700"
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            <>
              <h2 className="mb-1 text-lg font-extrabold text-foreground">Choose a new password</h2>
              <p className="mb-5 text-[13px] text-muted-foreground">
                You clicked a password reset link — enter a new password below.
              </p>

              {error && (
                <div className="mb-4 rounded-xl border border-risk/30 bg-risk/5 px-4 py-3 text-[13px] font-medium text-risk">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-[12px] font-bold text-foreground">New password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="h-11 w-full rounded-xl border border-input bg-background px-4 text-[14px] font-medium text-foreground outline-none ring-primary-400 transition-shadow placeholder:text-muted-foreground/60 focus:ring-2"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-bold text-foreground">Confirm password</label>
                  <input
                    type="password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat the new password"
                    className="h-11 w-full rounded-xl border border-input bg-background px-4 text-[14px] font-medium text-foreground outline-none ring-primary-400 transition-shadow placeholder:text-muted-foreground/60 focus:ring-2"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-600 text-[14px] font-bold text-white shadow-glow transition-colors hover:bg-primary-700 disabled:opacity-60"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? "Updating…" : "Update Password"}
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
