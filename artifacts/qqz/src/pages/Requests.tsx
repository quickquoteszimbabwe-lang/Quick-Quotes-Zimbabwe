import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useGetJobs, useGetCategories } from "@workspace/api-client-react";
import { Plus, MapPin, Clock, ChevronRight, FileText, Briefcase, Building2, CalendarCheck } from "lucide-react";
import { formatDate, getStatusColor } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { REQUEST_TYPES, formatRequestType } from "@/lib/pricingModels";

const REQUEST_TYPE_ICONS: Record<string, React.ElementType> = {
  professional_service: Briefcase,
  listing_rental: Building2,
  bookable_service: CalendarCheck,
};

export default function Requests() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedType, setSelectedType] = useState("All");

  const { data: categories } = useGetCategories();
  const { data: requests, isLoading, error, refetch } = useGetJobs({
    category: selectedCategory !== "All" ? selectedCategory : undefined,
  });

  const filtered = selectedType === "All"
    ? requests
    : requests?.filter((r: any) => (r.requestType ?? "professional_service") === selectedType);

  const isClient = user?.role === "customer";
  const isProvider = user?.role === "professional";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-accent">Your workspace</p>
          <h1 className="text-2xl font-bold text-primary mt-1">
            {isClient ? "My Requests" : "Open Requests"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isClient ? "Manage your service requests" : "Browse and submit offers on client requests"}
          </p>
        </div>
        {isClient && (
          <Link
            href="/requests/create"
            data-testid="link-requests-create"
            className="flex items-center gap-1.5 bg-primary text-white py-2 px-3 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus size={16} />
            New Request
          </Link>
        )}
      </div>

      {/* Transaction type filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setSelectedType("All")}
          data-testid="button-filter-type-all"
          className={cn(
            "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
            selectedType === "All"
              ? "bg-primary text-white"
              : "bg-card border border-border text-muted-foreground hover:border-primary/50"
          )}
        >
          All Types
        </button>
        {REQUEST_TYPES.map((t) => {
          const Icon = REQUEST_TYPE_ICONS[t.value] ?? Briefcase;
          return (
            <button
              key={t.value}
              onClick={() => setSelectedType(t.value)}
              data-testid={`button-filter-type-${t.value}`}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                selectedType === t.value
                  ? "bg-primary text-white"
                  : "bg-card border border-border text-muted-foreground hover:border-primary/50"
              )}
            >
              <Icon size={13} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Category filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setSelectedCategory("All")}
          data-testid="button-filter-category-all"
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
            selectedCategory === "All"
              ? "bg-secondary text-white"
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          All Categories
        </button>
        {categories?.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.name)}
            data-testid={`button-filter-category-${cat.id}`}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
              selectedCategory === cat.name
                ? "bg-secondary text-white"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-3" data-testid="state-requests-loading">
          {[1, 2, 3].map((item) => <div key={item} className="h-32 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      )}

      {error && (
        <div className="text-center py-12 text-muted-foreground" data-testid="state-requests-error">
          <p>Failed to load requests. Please try again.</p>
          <button onClick={() => refetch()} data-testid="button-retry-requests" className="mt-3 text-sm font-bold text-secondary hover:text-primary">Try again</button>
        </div>
      )}

      {!isLoading && !error && (filtered?.length ?? 0) === 0 && (
        <div className="text-center py-16 rounded-2xl border border-dashed border-border bg-card/60" data-testid="state-requests-empty">
          <FileText size={48} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground font-semibold">No requests found</p>
          {isClient && (
            <Link href="/requests/create" data-testid="link-empty-create-request" className="text-secondary font-semibold text-sm hover:underline mt-2 block">
              Post your first request
            </Link>
          )}
          {isProvider && (
            <p className="text-sm text-muted-foreground mt-1">Try a different category or type</p>
          )}
        </div>
      )}

      <div className="space-y-3">
        {filtered?.map((request: any) => {
          const TypeIcon = REQUEST_TYPE_ICONS[request.requestType ?? "professional_service"] ?? Briefcase;
          return (
            <Link key={request.id} href={`/requests/${request.id}`} data-testid={`link-request-${request.id}`}>
              <div className="qqz-hover bg-card rounded-2xl border border-border p-4 group hover:border-primary/30">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        <TypeIcon size={11} />
                        {formatRequestType(request.requestType ?? "professional_service")}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {request.category}
                      </span>
                      <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", getStatusColor(request.status))}>
                        {request.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground text-sm line-clamp-1">{request.service}</h3>
                  </div>
                  <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary flex-shrink-0 mt-1 transition-colors" />
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{request.description}</p>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> {request.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {formatDate(request.createdAt)}
                  </span>
                  {request.customerName && isProvider && (
                    <span className="text-foreground/60">by {request.customerName}</span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
