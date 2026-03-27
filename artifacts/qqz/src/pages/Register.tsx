import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, AlertCircle, User, Briefcase, Phone, KeyRound, CheckCircle, RefreshCw } from "lucide-react";

const TOTAL_STEPS = 4;

export default function Register() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [phone, setPhone] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [devCode, setDevCode] = useState("");

  const [otp, setOtp] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const [role, setRole] = useState<"customer" | "professional" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSendOtp() {
    if (!phone.trim()) { setError("Enter your phone number first"); return; }
    setError("");
    setSendingOtp(true);
    try {
      const res = await fetch("/api/verification/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to send code"); return; }
      setDevCode(data.code || "");
      setStep(3);
    } catch { setError("Network error. Please try again."); }
    finally { setSendingOtp(false); }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) { setError("Enter the 6-digit code"); return; }
    setError("");
    setVerifyingOtp(true);
    try {
      const res = await fetch("/api/verification/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), code: otp }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Invalid code"); return; }
      setStep(4);
    } catch { setError("Network error. Please try again."); }
    finally { setVerifyingOtp(false); }
  }

  async function handleSubmit() {
    if (!role) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone: phone.trim() || undefined, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        setStep(1);
        return;
      }
      login(data.token, data.user);
      navigate("/verify");
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Quick Quotes Zimbabwe" className="h-14 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
          <p className="text-muted-foreground text-sm mt-1">Step {step} of {TOTAL_STEPS}</p>
          <div className="flex gap-2 mt-3 justify-center">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div key={i} className={`h-1.5 w-12 rounded-full transition-colors ${step >= i + 1 ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-destructive/10 text-destructive px-3 py-2 rounded-lg text-sm mb-4">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="bg-card rounded-2xl shadow-sm border border-border p-6 space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters" required minLength={6}
                  className="w-full border border-border rounded-lg px-3 py-2.5 pr-10 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors">Continue</button>
          </form>
        )}

        {step === 2 && (
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Phone size={18} className="text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Verify your phone</h2>
                <p className="text-xs text-muted-foreground">We'll send a 6-digit verification code</p>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Phone Number</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+263 77 123 4567" required
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 border border-border py-3 rounded-xl font-semibold text-foreground hover:bg-muted transition-colors">Back</button>
              <button onClick={handleSendOtp} disabled={sendingOtp || !phone.trim()}
                className="flex-1 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {sendingOtp ? <><RefreshCw size={15} className="animate-spin" /> Sending…</> : "Send Code"}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={handleVerifyOtp} className="bg-card rounded-2xl shadow-sm border border-border p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <KeyRound size={18} className="text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Enter verification code</h2>
                <p className="text-xs text-muted-foreground">Sent to {phone}</p>
              </div>
            </div>
            {devCode && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 text-sm">
                <span className="text-blue-600 font-medium">Dev Mode — </span>
                <span className="text-blue-700">Your code is </span>
                <span className="font-mono font-bold text-blue-800 text-base tracking-widest">{devCode}</span>
              </div>
            )}
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">6-digit code</label>
              <input type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="000000" required
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background font-mono text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => { setStep(2); setOtp(""); setError(""); }}
                className="flex-1 border border-border py-3 rounded-xl font-semibold text-foreground hover:bg-muted transition-colors">Back</button>
              <button type="submit" disabled={verifyingOtp || otp.length !== 6}
                className="flex-1 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {verifyingOtp ? <><RefreshCw size={15} className="animate-spin" /> Verifying…</> : "Verify"}
              </button>
            </div>
            <button type="button" onClick={handleSendOtp} disabled={sendingOtp}
              className="w-full text-sm text-primary hover:underline disabled:opacity-50">
              {sendingOtp ? "Resending…" : "Resend code"}
            </button>
          </form>
        )}

        {step === 4 && (
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={18} className="text-green-600" />
              <h2 className="font-semibold text-foreground">Phone verified!</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-5">Now, how will you use QQZ?</p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button onClick={() => setRole("customer")}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${role === "customer" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${role === "customer" ? "bg-primary" : "bg-muted"}`}>
                  <User size={24} className={role === "customer" ? "text-white" : "text-muted-foreground"} />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-foreground">Customer</div>
                  <div className="text-xs text-muted-foreground mt-1">Post jobs & hire professionals</div>
                </div>
              </button>
              <button onClick={() => setRole("professional")}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${role === "professional" ? "border-secondary bg-secondary/5" : "border-border hover:border-secondary/40"}`}>
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
              <button onClick={() => setStep(3)} className="flex-1 border border-border py-3 rounded-xl font-semibold text-foreground hover:bg-muted transition-colors">Back</button>
              <button onClick={handleSubmit} disabled={!role || loading}
                className="flex-1 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <><RefreshCw size={15} className="animate-spin" /> Creating…</> : "Create Account"}
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
