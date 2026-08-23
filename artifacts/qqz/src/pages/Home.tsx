import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useGetCategoryTree } from "@workspace/api-client-react";
import { ChevronRight, Plus, Search, Briefcase, Building2, CalendarCheck } from "lucide-react";
import { getCategoryIcon, getCategoryColor } from "@/lib/iconMap";
import { formatRole } from "@/lib/pricingModels";
import { cn } from "@/lib/utils";

const transactionTypes = [
  {
    icon: Briefcase,
    label: "Professional Services",
    description: "Construction, Legal, Consulting, Tutoring…",
    href: "/requests/create",
    color: "bg-blue-50 border-blue-200 text-blue-700",
    type: "professional_service",
  },
  {
    icon: Building2,
    label: "Listings & Rentals",
    description: "Houses, Apartments, Cars, Equipment…",
    href: "/requests/create",
    color: "bg-emerald-50 border-emerald-200 text-emerald-700",
    type: "listing_rental",
  },
  {
    icon: CalendarCheck,
    label: "Bookable Services",
    description: "Transfers, Photography, Cleaning, Tours…",
    href: "/requests/create",
    color: "bg-violet-50 border-violet-200 text-violet-700",
    type: "bookable_service",
  },
];

export default function Home() {
  const { user } = useAuth();
  const { data: tree, isLoading } = useGetCategoryTree();

  const featuredCategories = tree?.filter((c) => c.featured) ?? [];
  const isClient = user?.role === "customer";
  const isProvider = user?.role === "professional";

  return (
    <div className="space-y-6">
      {/* Hero card */}
      <div className="bg-primary rounded-2xl p-5 text-white">
        <p className="text-white/70 text-sm">Welcome back,</p>
        <h1 className="text-2xl font-bold mt-0.5">{user?.name}</h1>
        <p className="text-white/70 text-sm mt-0.5 capitalize">
          {formatRole(user?.role ?? "")} Account
        </p>

        {isClient && (
          <Link
            href="/requests/create"
            className="mt-4 inline-flex items-center gap-2 bg-accent text-primary font-bold py-2.5 px-5 rounded-xl hover:bg-accent/90 transition-colors text-sm shadow-sm"
          >
            <Plus size={18} />
            Post a Request
          </Link>
        )}
        {isProvider && (
          <Link
            href="/requests"
            className="mt-4 inline-flex items-center gap-2 bg-white/15 text-white font-semibold py-2.5 px-5 rounded-xl hover:bg-white/25 transition-colors text-sm border border-white/20"
          >
            Browse Open Requests
            <ChevronRight size={16} />
          </Link>
        )}
      </div>

      {/* Quick search */}
      <Link
        href="/services"
        className="flex items-center gap-3 w-full px-4 py-3.5 bg-card border border-border rounded-xl text-muted-foreground hover:border-primary/50 hover:bg-primary/5 transition-all text-sm shadow-sm"
      >
        <Search size={16} className="text-primary" />
        <span>Search services — plumbing, photography, cleaning…</span>
      </Link>

      {/* Transaction types (clients only) */}
      {isClient && (
        <div>
          <h2 className="font-bold text-foreground text-lg mb-3">What do you need?</h2>
          <div className="space-y-2.5">
            {transactionTypes.map((t) => {
              const Icon = t.icon;
              return (
                <Link
                  key={t.type}
                  href={`${t.href}?type=${t.type}`}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-sm",
                    t.color
                  )}
                >
                  <div className="bg-white/70 rounded-lg p-2.5 shrink-0">
                    <Icon size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground">{t.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                  </div>
                  <ChevronRight size={18} className="text-muted-foreground shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Featured categories */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-foreground text-lg">Featured Categories</h2>
          <Link
            href="/services"
            className="text-primary text-sm font-semibold hover:underline flex items-center gap-1"
          >
            All {tree?.length ?? ""} <ChevronRight size={16} />
          </Link>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {featuredCategories.map((cat) => {
              const Icon = getCategoryIcon(cat.icon);
              const color = getCategoryColor(cat.sortOrder);
              const totalServices = (cat.subcategories ?? []).reduce(
                (sum, sub) => sum + ((sub as any).services?.length ?? 0),
                0
              ) + ((cat as any).services?.length ?? 0);
              const href = isClient
                ? `/requests/create?category=${encodeURIComponent(cat.name)}`
                : `/requests?category=${encodeURIComponent(cat.name)}`;
              return (
                <Link
                  key={cat.id}
                  href={href}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border transition-all group hover:shadow-sm",
                    color.bg,
                    color.border
                  )}
                >
                  <div className={cn("p-2.5 rounded-xl shrink-0", color.iconBg)}>
                    <Icon size={20} className={color.icon} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("font-semibold text-sm", color.icon)}>{cat.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {totalServices} service{totalServices !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <ChevronRight
                    size={16}
                    className={cn(
                      "shrink-0 transition-transform group-hover:translate-x-0.5",
                      color.icon
                    )}
                  />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
