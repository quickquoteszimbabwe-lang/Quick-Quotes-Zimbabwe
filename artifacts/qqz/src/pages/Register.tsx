import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, AlertCircle, User, Briefcase } from "lucide-react";

export default function Register() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"customer" | "professional" | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!role) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone: phone || undefined, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        setStep(1);
        return;
      }
      login(data.token, data.user);
      navigate("/home");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Quick Quotes Zimbabwe" className="h-14 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
          <p className="text-muted-foreground text-sm mt-1">Step {step} of 2</p>
          <div className="flex gap-2 mt-3 justify-center">
            <div className={`h-1.5 w-16 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
            <div className={`h-1.5 w-16 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-destructive/10 text-destructive px-3 py-2 rounded-lg text-sm mb-4">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {step === 1 && (
          <form
            onSubmit={e => { e.preventDefault(); setStep(2); }}
            className="bg-card rounded-2xl shadow-sm border border-border p-6 space-y-4"
          >
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="John Doe"
                required
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Phone (optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+263 77 123 4567"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full border border-border rounded-lg px-3 py-2.5 pr-10 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
            >
              Continue
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <h2 className="font-semibold text-foreground mb-1">I am joining as a...</h2>
            <p className="text-sm text-muted-foreground mb-4">Choose how you'll use QQZ</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setRole("customer")}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${
                  role === "customer" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${role === "customer" ? "bg-primary" : "bg-muted"}`}>
                  <User size={24} className={role === "customer" ? "text-white" : "text-muted-foreground"} />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-foreground">Customer</div>
                  <div className="text-xs text-muted-foreground mt-1">Post jobs & hire professionals</div>
                </div>
              </button>

              <button
                onClick={() => setRole("professional")}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${
                  role === "professional" ? "border-secondary bg-secondary/5" : "border-border hover:border-secondary/40"
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${role === "professional" ? "bg-secondary" : "bg-muted"}`}>
                  <Briefcase size={24} className={role === "professional" ? "text-white" : "text-muted-foreground"} />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-foreground">Professional</div>
                  <div className="text-xs text-muted-foreground mt-1">Offer services & earn</div>
                </div>
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-border py-3 rounded-xl font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!role || loading}
                className="flex-1 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Account"}
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
