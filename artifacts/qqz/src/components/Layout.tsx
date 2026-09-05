import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Home, FileText, CreditCard, User, Shield, Send, LayoutGrid, LogOut, Plus, BadgeCheck, Search, Sun, Moon, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRole } from "@/lib/pricingModels";
import { InstallAppPrompt } from "@/components/InstallAppPrompt";

interface LayoutProps { children: ReactNode; }

const baseNav = [
  { href: "/home", icon: Home, label: "Overview" },
  { href: "/services", icon: LayoutGrid, label: "Discover services" },
  { href: "/requests", icon: FileText, label: "Requests" },
  { href: "/payments", icon: CreditCard, label: "Payments" },
  { href: "/profile", icon: User, label: "Your profile" },
];

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [location, navigate] = useLocation();
  const [dark, setDark] = useState(() => localStorage.getItem("qqz-theme") === "dark");
  const navItems = [...baseNav];
  if (user?.role === "professional") navItems.splice(3, 0, { href: "/offers", icon: Send, label: "My offers" });
  if (user?.role === "admin") navItems.push({ href: "/admin", icon: Shield, label: "Admin console" });
  const active = (href: string) => location === href || location.startsWith(`${href}/`);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("qqz-theme", dark ? "dark" : "light");
  }, [dark]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("qqz_token") ?? ""}` },
      });
    } finally {
      queryClient.clear();
      logout();
      navigate("/");
    }
  }

  return (
    <div className="qqz-shell min-h-[100dvh] flex flex-col md:flex-row">
      <aside className="hidden md:flex w-[244px] shrink-0 bg-sidebar text-sidebar-foreground flex-col sticky top-0 h-[100dvh] px-4 py-5">
        <Link href="/home" data-testid="link-brand" className="flex items-center gap-3 px-3 mb-9">
          <span className="h-12 w-[164px] overflow-hidden rounded-lg bg-sidebar px-2 py-1">
            <img src="/logo.png" alt="Quick Quotes Zimbabwe" className="h-full w-full scale-[1.45] object-contain object-left" />
          </span>
        </Link>
        <div className="px-3 mb-3 text-[10px] uppercase tracking-[.18em] text-sidebar-foreground/45">Workspace</div>
        <nav className="space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href} data-testid={`link-nav-${label.toLowerCase().replace(/\s+/g, "-")}`} className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
              active(href) ? "bg-sidebar-accent text-white shadow-sm" : "text-sidebar-foreground/65 hover:text-white hover:bg-white/8"
            )}>
              <Icon size={17} strokeWidth={active(href) ? 2.4 : 1.8} />
              {label}
              {href === "/requests" && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />}
            </Link>
          ))}
        </nav>
        {user?.role === "customer" && (
          <Link href="/requests/create" data-testid="link-sidebar-new-request" className="mt-7 flex items-center justify-center gap-2 rounded-xl bg-accent text-primary py-3 text-sm font-bold hover:bg-accent/90 transition-colors">
            <Plus size={16} /> Post a request
          </Link>
        )}
        <div className="mt-auto rounded-2xl bg-white/7 border border-white/10 p-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold">{user?.name?.slice(0, 1).toUpperCase()}</div>
            <div className="min-w-0">
              <div data-testid="text-sidebar-username" className="text-sm font-semibold truncate">{user?.name}</div>
              <div className="text-[11px] text-sidebar-foreground/50 capitalize">{formatRole(user?.role ?? "")}</div>
            </div>
            <button type="button" onClick={handleLogout} data-testid="button-sidebar-logout" aria-label="Log out" className="ml-auto flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-sidebar-foreground/60 hover:bg-sidebar-foreground/10 hover:text-accent"><LogOut size={16} /><span>Log out</span></button>
          </div>
          {user?.role === "professional" && <Link href="/verify" data-testid="link-verification" className="mt-3 flex items-center gap-2 text-[11px] text-accent/90"><BadgeCheck size={14} /> Complete verification</Link>}
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="h-[68px] bg-card/85 backdrop-blur-md border-b border-border sticky top-0 z-40">
          <div className="max-w-[1180px] h-full mx-auto px-4 sm:px-7 flex items-center justify-between">
            <Link href="/home" data-testid="link-mobile-brand" className="md:hidden flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-primary text-accent flex items-center justify-center font-bold">Q</span>
              <span className="font-semibold tracking-tight">QQZ<span className="text-accent">.</span></span>
            </Link>
            <div className="hidden md:block">
              <p className="text-[10px] uppercase tracking-[.18em] text-muted-foreground">Zimbabwe marketplace</p>
              <p className="text-sm font-semibold text-foreground">{location === "/home" ? "Good to see you" : navItems.find(item => active(item.href))?.label ?? "Your workspace"}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/discover" data-testid="link-header-discover" className="hidden sm:flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"><Search size={14} /> Search marketplace</Link>
              <button type="button" onClick={handleLogout} data-testid="button-mobile-logout" aria-label="Log out" className="md:hidden text-muted-foreground hover:text-destructive transition-colors"><LogOut size={17} /></button>
              <button onClick={() => setDark((value) => !value)} data-testid="button-toggle-theme" aria-label="Toggle theme" className="text-muted-foreground hover:text-primary transition-colors">{dark ? <Sun size={17} /> : <Moon size={17} />}</button>
              <Link href="/notifications" data-testid="link-header-notifications" aria-label="Notifications" className="text-muted-foreground hover:text-primary transition-colors"><Bell size={17} /></Link>
              <Link href="/verify" data-testid="link-header-verify" className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-secondary hover:text-primary transition-colors"><BadgeCheck size={15} /> Verified matters</Link>
              <Link href="/profile" data-testid="link-header-profile" className="w-9 h-9 rounded-full bg-primary text-accent flex items-center justify-center text-sm font-bold hover:ring-4 hover:ring-accent/20 transition-all">{user?.name?.slice(0, 1).toUpperCase()}</Link>
            </div>
          </div>
        </header>
        <main className="max-w-[1180px] mx-auto w-full px-4 sm:px-7 py-6 md:py-8 pb-24 md:pb-10">{children}</main>
      </div>

      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-card/95 backdrop-blur-md border-t border-border z-50 px-1 py-2">
        <div className="flex justify-around">
          {navItems.slice(0, 5).map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href} data-testid={`link-mobile-nav-${label.toLowerCase().replace(/\s+/g, "-")}`} className={cn("flex min-w-[58px] flex-col items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors", active(href) ? "text-primary" : "text-muted-foreground")}>
              <Icon size={19} strokeWidth={active(href) ? 2.4 : 1.7} />
              {label.split(" ")[0]}
            </Link>
          ))}
        </div>
      </nav>
      <InstallAppPrompt />
    </div>
  );
}