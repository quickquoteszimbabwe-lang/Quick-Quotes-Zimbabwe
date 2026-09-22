import { Link } from "wouter";
import { ArrowRight, Bell, Bookmark, CalendarDays, MessageCircle, Newspaper, Settings2 } from "lucide-react";

const links = [
  { href: "/news", label: "QQZ newsroom", description: "Read useful updates and marketplace guidance.", icon: Newspaper },
  { href: "/notifications", label: "Notifications", description: "Review updates for your QQZ activity.", icon: Bell },
  { href: "/bookings", label: "Bookings", description: "Manage future booking and rental activity.", icon: CalendarDays },
  { href: "/messages", label: "Messages", description: "Keep request conversations together.", icon: MessageCircle },
  { href: "/saved", label: "Saved", description: "Return to providers and services you bookmarked.", icon: Bookmark },
  { href: "/settings", label: "Account & security", description: "Review your account settings and security.", icon: Settings2 },
];

export default function More() {
  return (
    <div className="qqz-enter max-w-3xl space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[.16em] text-accent">Workspace</p>
        <h1 className="mt-2 text-3xl font-bold text-primary">More</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Everything that does not fit in the main mobile navigation.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {links.map(({ href, label, description, icon: Icon }) => (
          <Link key={href} href={href} className="group flex min-w-0 items-start gap-3 rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary"><Icon size={18} /></span>
            <span className="min-w-0 flex-1">
              <span className="block whitespace-nowrap text-sm font-bold text-foreground">{label}</span>
              <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{description}</span>
            </span>
            <ArrowRight size={16} className="mt-1 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </Link>
        ))}
      </div>
    </div>
  );
}