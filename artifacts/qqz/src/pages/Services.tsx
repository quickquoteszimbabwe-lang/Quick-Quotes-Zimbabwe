import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useGetCategoryTree } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Search, X, ChevronRight, Grid3X3, Layers3 } from "lucide-react";
import { getCategoryIcon, getCategoryColor } from "@/lib/iconMap";
import { cn } from "@/lib/utils";

interface FlatService {
  serviceId: number;
  serviceName: string;
  description: string | null;
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
  categorySortOrder: number;
  subcategoryId: number | null;
  subcategoryName: string | null;
}

export default function Services() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { data: tree, isLoading } = useGetCategoryTree();

  const [search, setSearch] = useState("");
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [selectedSubId, setSelectedSubId] = useState<number | null>(null);
  const [view, setView] = useState<"categories" | "services">("categories");

  const selectedCategory = tree?.find((c) => c.id === selectedCatId);

  // Flatten entire tree into a list of services for search/filter
  const allServices = useMemo<FlatService[]>(() => {
    if (!tree) return [];
    const results: FlatService[] = [];
    for (const cat of tree) {
      for (const sub of cat.subcategories ?? []) {
        for (const svc of (sub as any).services ?? []) {
          results.push({
            serviceId: svc.id,
            serviceName: svc.name,
            description: svc.description ?? null,
            categoryId: cat.id,
            categoryName: cat.name,
            categoryIcon: cat.icon,
            categorySortOrder: cat.sortOrder,
            subcategoryId: sub.id,
            subcategoryName: sub.name,
          });
        }
      }
      for (const svc of (cat as any).services ?? []) {
        results.push({
          serviceId: svc.id,
          serviceName: svc.name,
          description: svc.description ?? null,
          categoryId: cat.id,
          categoryName: cat.name,
          categoryIcon: cat.icon,
          categorySortOrder: cat.sortOrder,
          subcategoryId: null,
          subcategoryName: null,
        });
      }
    }
    return results;
  }, [tree]);

  const filteredServices = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allServices.filter((s) => {
      if (selectedCatId !== null && s.categoryId !== selectedCatId) return false;
      if (selectedSubId !== null && s.subcategoryId !== selectedSubId) return false;
      if (q) {
        return (
          s.serviceName.toLowerCase().includes(q) ||
          s.categoryName.toLowerCase().includes(q) ||
          (s.subcategoryName?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [allServices, search, selectedCatId, selectedSubId]);

  function selectCategory(id: number) {
    setSelectedCatId(id);
    setSelectedSubId(null);
    setView("services");
    setSearch("");
  }

  function clearCategory() {
    setSelectedCatId(null);
    setSelectedSubId(null);
    setView("categories");
    setSearch("");
  }

  function handleServiceClick(svc: FlatService) {
    if (user?.role === "customer") {
      navigate(`/jobs/create?category=${encodeURIComponent(svc.categoryName)}&service=${encodeURIComponent(svc.serviceName)}`);
    } else {
      navigate(`/jobs?category=${encodeURIComponent(svc.categoryName)}`);
    }
  }

  const isSearching = search.trim().length > 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Browse Services</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {allServices.length} services across {tree?.length ?? 0} categories
        </p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (e.target.value.trim()) setView("services");
          }}
          placeholder="Search services, e.g. 'bricklaying', 'wedding photography'…"
          className="w-full pl-9 pr-9 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {search && (
          <button
            onClick={() => { setSearch(""); if (!selectedCatId) setView("categories"); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Breadcrumb / category filter strip */}
      {(selectedCatId !== null || isSearching) && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={clearCategory}
            className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
          >
            <Grid3X3 size={13} /> All categories
          </button>
          {selectedCatId !== null && selectedCategory && (
            <>
              <ChevronRight size={13} className="text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">{selectedCategory.name}</span>
            </>
          )}
          {selectedSubId !== null && (
            <>
              <ChevronRight size={13} className="text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">
                {selectedCategory?.subcategories?.find((s) => s.id === selectedSubId)?.name}
              </span>
              <button onClick={() => setSelectedSubId(null)} className="text-xs text-muted-foreground hover:text-foreground ml-1">
                <X size={12} />
              </button>
            </>
          )}
        </div>
      )}

      {/* Subcategory chips (when category selected, no search) */}
      {selectedCatId !== null && !isSearching && (selectedCategory?.subcategories?.length ?? 0) > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setSelectedSubId(null)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
              selectedSubId === null
                ? "bg-primary text-white"
                : "bg-card border border-border text-muted-foreground hover:border-primary/50"
            )}
          >
            All subcategories
          </button>
          {selectedCategory?.subcategories?.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubId(sub.id === selectedSubId ? null : sub.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1",
                selectedSubId === sub.id
                  ? "bg-primary text-white"
                  : "bg-card border border-border text-muted-foreground hover:border-primary/50"
              )}
            >
              <Layers3 size={11} />
              {sub.name}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Category grid view */}
      {!isLoading && view === "categories" && !isSearching && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {tree?.map((cat) => {
            const Icon = getCategoryIcon(cat.icon);
            const color = getCategoryColor(cat.sortOrder);
            const totalServices = (cat.subcategories ?? []).reduce(
              (sum, sub) => sum + ((sub as any).services?.length ?? 0),
              0
            ) + ((cat as any).services?.length ?? 0);
            return (
              <button
                key={cat.id}
                onClick={() => selectCategory(cat.id)}
                className={cn(
                  "flex flex-col items-start p-4 rounded-xl border text-left transition-all hover:shadow-md group",
                  color.bg,
                  color.border
                )}
              >
                <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-105", color.iconBg)}>
                  <Icon size={22} className={color.icon} />
                </div>
                <div className={cn("font-semibold text-sm leading-tight mb-1", color.icon.replace("text-", "text-").replace("-600", "-900"))}>
                  {cat.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {totalServices} service{totalServices !== 1 ? "s" : ""}
                  {(cat.subcategories?.length ?? 0) > 0 && ` · ${cat.subcategories!.length} subcategories`}
                </div>
                {cat.featured && (
                  <span className={cn("mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full", color.badge)}>
                    Featured
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Services list view */}
      {!isLoading && (view === "services" || isSearching) && (
        <div className="space-y-3">
          {filteredServices.length === 0 ? (
            <div className="text-center py-12">
              <Search size={40} className="mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground font-medium">No services found</p>
              <p className="text-sm text-muted-foreground mt-1">Try a different search term</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground font-medium">
                {filteredServices.length} service{filteredServices.length !== 1 ? "s" : ""}
                {isSearching ? ` matching "${search}"` : selectedCatId ? ` in ${selectedCategory?.name}` : ""}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredServices.map((svc) => {
                  const Icon = getCategoryIcon(svc.categoryIcon);
                  const color = getCategoryColor(svc.categorySortOrder);
                  return (
                    <button
                      key={`${svc.categoryId}-${svc.subcategoryId ?? 0}-${svc.serviceId}`}
                      onClick={() => handleServiceClick(svc)}
                      className="flex items-start gap-3 p-4 bg-card border border-border rounded-xl text-left hover:shadow-sm hover:border-primary/40 transition-all group"
                    >
                      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", color.iconBg)}>
                        <Icon size={17} className={color.icon} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-foreground leading-tight group-hover:text-primary transition-colors">
                          {svc.serviceName}
                        </div>
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", color.badge)}>
                            {svc.categoryName}
                          </span>
                          {svc.subcategoryName && (
                            <span className="text-[10px] text-muted-foreground">· {svc.subcategoryName}</span>
                          )}
                        </div>
                        {svc.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{svc.description}</p>
                        )}
                      </div>
                      <ChevronRight size={15} className="text-muted-foreground group-hover:text-primary flex-shrink-0 mt-1 transition-colors" />
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
