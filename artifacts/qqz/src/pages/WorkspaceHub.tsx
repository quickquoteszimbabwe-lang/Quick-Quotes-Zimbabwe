import { Link, useLocation } from "wouter";
import { Bell, Bookmark, CalendarDays, ChevronRight, CircleHelp, LockKeyhole, MessageCircle, Settings2, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const modules = {
  notifications: {
    title: "Notifications",
    eyebrow: "Stay in the loop",
    description: "Updates for requests, offers, payments and verification will appear here as your QQZ activity grows.",
    icon: Bell,
  },
  bookings: {
    title: "Bookings",
    eyebrow: "Your calendar",
    description: "Direct booking flows for fixed-price services and rentals are being connected to the same QQZ account and payment ledger.",
    icon: CalendarDays,
  },
  messages: {
    title: "Messages",
    eyebrow: "Keep conversations together",
    description: "Provider and client conversations will stay linked to their request or booking, so important details are easy to find.",
    icon: MessageCircle,
  },
  saved: {
    title: "Saved",
    eyebrow: "Your shortlist",
    description: "Save providers, services and listings you want to revisit. Saved marketplace collections are coming next.",
    icon: Bookmark,
  },
  settings: {
    title: "Account & security",
    eyebrow: "Your account",
    description: "Manage account preferences and security from the same QQZ identity used across the website and mobile app.",
    icon: Settings2,
  },
} as const;

type ModuleKey = keyof typeof modules;

export default function WorkspaceHub({ section }: { section: ModuleKey }) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const module = modules[section];
  const Icon = module.icon;

  return (
    <div className="qqz-enter max-w-4xl space-y-6">
      <button onClick={() => navigate("/home")} data-testid="button-workspace-back" className="text-sm font-semibold text-muted-foreground hover:text-primary">← Back to overview</button>
      <section className="rounded-[1.65rem] bg-primary p-7 md:p-10 text-white relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full border-[32px] border-white/10" />
        <div className="relative">
          <div className="flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-[.16em]"><Icon size={15} /> {module.eyebrow}</div>
          <h1 className="mt-4 text-3xl md:text-4xl font-bold">{module.title}</h1>
          <p className="mt-3 max-w-xl text-white/70 leading-relaxed">{module.description}</p>
        </div>
      </section>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <ShieldCheck className="text-secondary" size={22} />
          <h2 className="mt-5 font-bold text-primary">One account, one history</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">Your website, mobile app and future integrations use the same QQZ account. Nothing here creates a separate profile or ledger.</p>
          <Link href="/profile" data-testid="link-workspace-profile" className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-secondary">Review your profile <ChevronRight size={15} /></Link>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <Sparkles className="text-accent" size={22} />
          <h2 className="mt-5 font-bold text-primary">Keep using QQZ today</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{user?.role === "customer" ? "Post a request, compare provider offers and keep payments visible from one workspace." : "Browse open requests, complete verification and send clear offers to clients."}</p>
          <Link href={user?.role === "customer" ? "/requests/create" : "/requests"} data-testid="link-workspace-primary-action" className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-secondary">{user?.role === "customer" ? "Post a request" : "Browse requests"} <ChevronRight size={15} /></Link>
        </div>
      </div>
      <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-5 flex items-start gap-3">
        {section === "settings" ? <LockKeyhole className="text-secondary mt-0.5" size={19} /> : <CircleHelp className="text-secondary mt-0.5" size={19} />}
        <p className="text-sm text-muted-foreground leading-relaxed">{section === "settings" ? "Account security remains tied to the existing QQZ authentication service. Use Profile to update your visible account details." : "This entry point is ready in the web workspace while its deeper data service is being connected to the existing QQZ core."}</p>
      </div>
    </div>
  );
}