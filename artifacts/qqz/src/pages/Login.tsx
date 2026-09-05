import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useLogin } from "@workspace/api-client-react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const signIn = useLogin();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    signIn.mutate({ data: { email: email.trim(), password } }, {
      onSuccess: (result) => { login(result.token, { ...result.user, phone: result.user.phone ?? null, phoneVerified: (result.user as any).phoneVerified ?? false, idVerified: (result.user as any).idVerified ?? false, faceVerified: (result.user as any).faceVerified ?? false }); navigate("/home"); },
      onError: (reason: any) => setError(reason?.data?.error || reason?.message || "We could not sign you in. Check your details and try again."),
    });
  }

  return (
    <div className="min-h-[100dvh] bg-primary flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      <div className="absolute -left-32 -top-32 w-96 h-96 rounded-full border-[44px] border-white/5" />
      <div className="absolute -right-20 -bottom-40 w-[30rem] h-[30rem] rounded-full border-[55px] border-accent/10" />
      <div className="relative w-full max-w-5xl grid lg:grid-cols-[.9fr_1.1fr] rounded-[2rem] overflow-hidden shadow-2xl bg-card">
        <div className="hidden lg:flex bg-secondary text-white p-10 flex-col justify-between">
          <div><Link href="/" data-testid="link-login-brand" className="inline-flex items-center gap-2 font-bold text-lg"><span className="w-10 h-10 rounded-xl bg-accent text-primary flex items-center justify-center">Q</span> QQZ<span className="text-accent">.</span></Link><div className="mt-20"><p className="text-accent text-xs font-bold uppercase tracking-[.18em]">Welcome back</p><h1 className="mt-4 text-4xl font-bold leading-tight">Good work starts with a good connection.</h1><p className="mt-5 text-white/65 leading-relaxed">Your trusted Zimbabwe marketplace for local services, clear quotes and confident decisions.</p></div></div>
          <div className="flex items-center gap-2 text-xs text-white/60"><ShieldCheck size={16} className="text-accent" /> Your account, requests and payments in one place.</div>
        </div>
        <div className="p-6 sm:p-10 lg:p-14">
          <Link href="/" data-testid="link-login-back" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary"><ArrowLeft size={14} /> Back to QQZ</Link>
          <div className="mt-10 max-w-sm mx-auto lg:mx-0">
            <div className="w-11 h-11 rounded-xl bg-accent/15 text-accent flex items-center justify-center"><LockKeyhole size={21} /></div>
            <h2 className="mt-5 text-3xl text-primary">Sign in to QQZ</h2>
            <p className="mt-2 text-sm text-muted-foreground">Pick up where you left off.</p>
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              {error && <div data-testid="status-login-error" className="rounded-xl border border-destructive/20 bg-destructive/8 text-destructive px-3 py-2.5 text-sm">{error}</div>}
              <label className="block"><span className="text-xs font-bold text-primary">Email address</span><input data-testid="input-login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm outline-none focus:border-accent focus:ring-4 focus:ring-accent/10" /></label>
              <label className="block"><span className="text-xs font-bold text-primary">Password</span><span className="relative mt-1.5 block"><input data-testid="input-login-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required className="w-full rounded-xl border border-border bg-background px-3.5 py-3 pr-11 text-sm outline-none focus:border-accent focus:ring-4 focus:ring-accent/10" /><button type="button" data-testid="button-toggle-password" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
              <button type="submit" data-testid="button-login-submit" disabled={signIn.isPending} className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-white py-3.5 text-sm font-bold hover:bg-secondary disabled:opacity-60 transition-colors">{signIn.isPending ? "Signing you in..." : "Continue"} {!signIn.isPending && <ArrowRight size={16} />}</button>
            </form>
            <p className="mt-7 text-sm text-muted-foreground">New to QQZ? <Link href="/register" data-testid="link-login-register" className="font-bold text-secondary hover:text-primary">Create your account</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}