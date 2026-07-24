import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useGetCategoryTree } from "@workspace/api-client-react";
import { ChevronRight, Plus, Star, Search } from "lucide-react";
import { getCategoryIcon, getCategoryColor } from "@/lib/iconMap";
import { cn } from "@/lib/utils";

export default function Home() {
  const { user } = useAuth();
  const { data: tree, isLoading } = useGetCategoryTree();

  const featuredCategories = tree?.filter((c) => c.featured) ?? [];

  return (
    <div className="space-y-6">
      {/* Hero card */}
      <div className="bg-primary rounded-2xl p-5 text-white">
        <p className="text-white/70 text-sm">Good day,</p>
        <h1 className="text-xl font-bold mt-0.5">{user?.name}</h1>
        <p className="text-white/80 text-sm mt-1 capitalize">Logged in as {user?.role}</p>
        {user?.role === "customer" && (
          <Link
            href="/jobs/create"
            className="mt-4 flex items-center gap-2 bg-accent text-primary font-semibold py-2.5 px-4 rounded-xl w-fit hover:bg-accent/90 transition-colors text-sm"
          >
            <Plus size={18} />
            Post a Job
          </Link>
        )}
      </div>

      {/* Quick search */}
      <Link
        href="/services"
        className="flex items-center gap-3 w-full px-4 py-3 bg-card border border-border rounded-xl text-muted-foreground hover:border-primary/50 hover:bg-primary/5 transition-all text-sm"
      >
        <Search size={16} />
        <span>Search services — plumbing, photography, cleaning…</span>
      </Link>

      {/* Featured categories */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-foreground text-lg">Featured Categories</h2>
          <Link href="/services" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
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
              const href =
                user?.role === "customer"
                  ? `/jobs/create?category=${encodeURIComponent(cat.name)}`
                  : `/jobs?category=${encodeURIComponent(cat.name)}`;
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
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105", color.iconBg)}>
                    <Icon size={22} className={color.icon} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-foreground">{cat.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {totalServices} service{totalServices !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors" />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Star size={18} className="text-accent fill-accent" />
          <h3 className="font-semibold text-foreground">How it works</h3>
        </div>
        <div className="space-y-3">
          {user?.role === "customer" ? (
            <>
              <Step num={1} text="Post your job with a description and location" />
              <Step num={2} text="Receive quotes from verified professionals" />
              <Step num={3} text="Choose the best quote and get the job done" />
              <Step num={4} text="Pay securely and leave a review" />
            </>
          ) : (
            <>
              <Step num={1} text="Browse available jobs in your service category" />
              <Step num={2} text="Submit competitive quotes with your price and timeline" />
              <Step num={3} text="Get selected by the customer and do the work" />
              <Step num={4} text="Build your reputation with positive reviews" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Step({ num, text }: { num: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
        {num}
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
