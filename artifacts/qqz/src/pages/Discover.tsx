import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetCategoryTree } from "@workspace/api-client-react";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  CarFront,
  Check,
  ChevronRight,
  CircleHelp,
  Construction,
  Home,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Wrench,
} from "lucide-react";
import { getCategoryColor, getCategoryIcon } from "@/lib/iconMap";
import { cn } from "@/lib/utils";

type DiscoveryKind = "all" | "services" | "rentals" | "properties" | "vehicles" | "equipment" | "providers";
type DiscoverService = {
  id: number;
  name: string;
  categoryName: string;
  categoryIcon: string;
  sortOrder: number;
  subcategoryName?: string;
};

const discoveryTabs: { value: DiscoveryKind; label: string; icon: typeof Search }[] = [
  { value: "all", label: "All marketplace", icon: Sparkles },
  { value: "services", label: "Services", icon: Wrench },
  { value: "rentals", label: "Rentals", icon: CalendarDays },
  { value: "properties", label: "Properties", icon: Home },
  { value: "vehicles", label: "Vehicles", icon: CarFront },
  { value: "equipment", label: "Equipment", icon: Construction },
  { value: "providers", label: "Providers", icon: BadgeCheck },
];

const futureCollections = [
  { value: "rentals", title: "Rentals", text: "Book homes, offices, rooms and venues with clear terms.", icon: CalendarDays, tone: "bg-[#eef5ff] border-[#cfe0ff] text-[#1f5a9c]" },
  { value: "properties", title: "Property listings", text: "Explore spaces for living, work and events.", icon: Home, tone: "bg-[#f4f0ff] border-[#ddd2ff] text-[#6448a8]" },
  { value: "vehicles", title: "Car rentals", text: "Compare available vehicles for the dates you need.", icon: CarFront, tone: "bg-[#fff4e8] border-[#ffd7ae] text-[#a45b16]" },
  { value: "equipment", title: "Equipment hire", text: "Find practical equipment for projects and events.", icon: Construction, tone: "bg-[#edf9f4] border-[#c5ecda] text-[#18764f]" },
];

export default function Discover() {
  const [location] = useLocation();
  const { data: tree, isLoading } = useGetCategoryTree();
  const queryParams = new URLSearchParams(window.location.search);
  const query = queryParams.get("q") ?? "";
  const [search, setSearch] = useState(query);
  const initialTab = (queryParams.get("tab") as DiscoveryKind | null) ?? "all";
  const [activeTab, setActiveTab] = useState<DiscoveryKind>(discoveryTabs.some((tab) => tab.value === initialTab) ? initialTab : "all");
  const [city, setCity] = useState("Anywhere in Zimbabwe");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const services = useMemo<DiscoverService[]>(() => {
    if (!tree) return [];
    return tree.flatMap((category) => [
      ...category.services.map((service) => ({ ...service, categoryName: category.name, categoryIcon: category.icon, sortOrder: category.sortOrder })),
      ...category.subcategories.flatMap((subcategory) =>
        subcategory.services.map((service) => ({ ...service, categoryName: category.name, categoryIcon: category.icon, sortOrder: category.sortOrder, subcategoryName: subcategory.name })),
      ),
    ]);
  }, [tree]);

  const filteredServices = useMemo(() => {
    const term = search.trim().toLowerCase();
    return services.filter((service) => !term || service.name.toLowerCase().includes(term) || service.categoryName.toLowerCase().includes(term));
  }, [search, services]);

  const showServices = activeTab === "all" || activeTab === "services";
  const showFuture = activeTab !== "services" && activeTab !== "all" ? activeTab : activeTab === "all" ? "all" : null;

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <PublicHeader />
      <main>
        <section className="qqz-grid border-b border-border">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 md:py-16">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-secondary">Discover on QQZ</p>
            <h1 className="mt-3 max-w-3xl text-4xl md:text-6xl leading-[.98] font-bold text-primary">Find the right service, space or provider.</h1>
            <p className="mt-5 max-w-2xl text-muted-foreground text-base md:text-lg leading-relaxed">Search one trusted marketplace for local expertise, bookable services and the rentals you need next.</p>
            <div className="mt-8 max-w-4xl rounded-2xl border border-border bg-card p-2 shadow-lg shadow-primary/5">
              <div className="grid md:grid-cols-[1fr_220px_auto] gap-2">
                <label className="flex min-w-0 items-center gap-3 rounded-xl bg-muted/60 px-4 py-3">
                  <Search size={19} className="text-secondary shrink-0" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="What do you need?" data-testid="input-discovery-search" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
                </label>
                <label className="flex items-center gap-2 rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
                  <MapPin size={17} className="text-secondary shrink-0" />
                  <select value={city} onChange={(event) => setCity(event.target.value)} data-testid="select-discovery-location" className="w-full bg-transparent outline-none">
                    <option>Anywhere in Zimbabwe</option>
                    <option>Harare</option>
                    <option>Bulawayo</option>
                    <option>Mutare</option>
                    <option>Gweru</option>
                  </select>
                </label>
                <button onClick={() => document.getElementById("discovery-results")?.scrollIntoView({ behavior: "smooth" })} data-testid="button-discovery-search" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors">
                  Search <ArrowRight size={16} />
                </button>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground py-2">Popular:</span>
              {["Cleaning", "Photography", "Plumbing", "Tutoring"].map((term) => (
                <button key={term} onClick={() => setSearch(term)} data-testid={`button-popular-${term.toLowerCase()}`} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-primary hover:border-secondary/50 hover:bg-secondary/5 transition-colors">{term}</button>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-5 sm:px-8 py-7">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {discoveryTabs.map(({ value, label, icon: Icon }) => (
              <button key={value} onClick={() => setActiveTab(value)} data-testid={`tab-discovery-${value}`} className={cn("shrink-0 inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors", activeTab === value ? "border-primary bg-primary text-white" : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary")}>
                <Icon size={15} /> {label}
              </button>
            ))}
            <button onClick={() => setVerifiedOnly((current) => !current)} data-testid="button-filter-verified" className={cn("shrink-0 ml-auto inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors", verifiedOnly ? "border-secondary bg-secondary/10 text-secondary" : "border-border bg-card text-muted-foreground")}>
              <ShieldCheck size={15} /> Verified only {verifiedOnly && <Check size={14} />}
            </button>
          </div>
        </section>

        <section id="discovery-results" className="max-w-6xl mx-auto px-5 sm:px-8 pb-16">
          {showServices && (
            <div>
              <div className="flex items-end justify-between gap-3 mb-5">
                <div><p className="text-xs font-bold uppercase tracking-[.16em] text-secondary">Live catalogue</p><h2 className="mt-1 text-2xl md:text-3xl text-primary">Services to get you moving</h2></div>
                <Link href="/services" data-testid="link-discover-all-services" className="hidden sm:inline-flex items-center gap-1 text-sm font-bold text-secondary hover:text-primary">Browse all <ChevronRight size={15} /></Link>
              </div>
              {isLoading ? <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">{[1, 2, 3, 4].map((item) => <div key={item} className="h-36 rounded-2xl bg-muted animate-pulse" />)}</div> : filteredServices.length > 0 ? <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">{filteredServices.slice(0, 12).map((service) => { const Icon = getCategoryIcon(service.categoryIcon); const color = getCategoryColor(service.sortOrder); return <Link key={service.id} href={`/register?service=${encodeURIComponent(service.name)}`} data-testid={`card-discovery-service-${service.id}`} className={cn("group min-h-36 rounded-2xl border p-4 flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-md transition-all", color.bg, color.border)}><div className="flex items-start justify-between"><span className={cn("w-10 h-10 rounded-xl flex items-center justify-center", color.iconBg)}><Icon size={19} className={color.icon} /></span><ArrowRight size={15} className={cn("opacity-60 transition-transform group-hover:translate-x-1", color.icon)} /></div><div><p className={cn("font-bold text-sm", color.icon)}>{service.name}</p><p className="mt-1 text-[11px] text-muted-foreground">{service.categoryName}{service.subcategoryName ? ` · ${service.subcategoryName}` : ""}</p></div></Link>; })}</div> : <EmptySearch />}
            </div>
          )}
          {verifiedOnly && <div className="mt-5 rounded-xl border border-secondary/25 bg-secondary/5 px-4 py-3 text-sm text-secondary"><ShieldCheck size={16} className="inline mr-2" />Verification filtering will apply to provider and listing inventory as those marketplace collections are connected to the existing trust service.</div>}

          {activeTab === "all" && (
            <div className="mt-14">
              <div className="flex items-end justify-between gap-3 mb-5"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-secondary">Coming into view</p><h2 className="mt-1 text-2xl md:text-3xl text-primary">More ways to transact</h2></div><span className="text-xs text-muted-foreground">Built on the same QQZ account</span></div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">{futureCollections.map(({ value, title, text, icon: Icon, tone }) => <button key={value} onClick={() => setActiveTab(value as DiscoveryKind)} data-testid={`card-discovery-${value}`} className={cn("text-left rounded-2xl border p-5 min-h-44 hover:-translate-y-0.5 hover:shadow-md transition-all", tone)}><Icon size={22} /><h3 className="mt-7 font-bold text-base">{title}</h3><p className="mt-2 text-xs leading-relaxed opacity-75">{text}</p></button>)}</div>
            </div>
          )}

          {showFuture && activeTab !== "all" && activeTab !== "services" && <FutureCollection kind={activeTab} />}
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

function FutureCollection({ kind }: { kind: DiscoveryKind }) {
  const collection = futureCollections.find((item) => item.value === kind) ?? futureCollections[0];
  const Icon = collection.icon;
  return <div className="rounded-3xl bg-secondary text-white px-6 py-10 md:px-12 md:py-14 overflow-hidden relative"><div className="absolute -right-12 -top-12 w-52 h-52 rounded-full border-[26px] border-white/10" /><Icon size={28} className="text-accent" /><p className="mt-5 text-xs font-bold uppercase tracking-[.16em] text-accent">Marketplace collection</p><h2 className="mt-2 text-3xl md:text-4xl">{collection.title} are coming to QQZ.</h2><p className="mt-4 max-w-xl text-white/70 leading-relaxed">We are preparing verified inventory, availability, deposits and secure booking flows for this collection. Your QQZ account will work across services, listings and bookings.</p><div className="mt-7 flex flex-wrap gap-3"><Link href="/register" data-testid={`link-join-${kind}`} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-primary">Join the marketplace <ArrowRight size={16} /></Link><Link href="/services" data-testid={`link-explore-services-${kind}`} className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-3 text-sm font-bold text-white hover:bg-white/10">Explore live services</Link></div></div>;
}

function EmptySearch() {
  return <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-12 text-center"><CircleHelp size={28} className="mx-auto text-muted-foreground/60" /><p className="mt-3 font-semibold text-primary">No live services match that search yet.</p><p className="mt-1 text-sm text-muted-foreground">Try another phrase or request a quote and we will help you find the right fit.</p><Link href="/register" data-testid="link-empty-discovery-request" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white">Request a quote <ArrowRight size={15} /></Link></div>;
}

export function PublicHeader() {
  return <header className="border-b border-border/70 bg-card/85 backdrop-blur-md sticky top-0 z-40"><div className="max-w-6xl mx-auto px-5 sm:px-8 h-[72px] flex items-center justify-between"><Link href="/" data-testid="link-public-brand" className="flex items-center gap-2.5"><span className="w-10 h-10 rounded-xl bg-primary text-accent flex items-center justify-center font-bold text-xl">Q</span><div><span className="font-bold tracking-tight text-lg text-primary">QQZ</span><span className="text-accent font-bold text-lg">.</span><div className="text-[9px] uppercase tracking-[.18em] text-muted-foreground -mt-1">Zimbabwe</div></div></Link><nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground"><Link href="/discover" data-testid="link-public-discover" className="hover:text-primary transition-colors">Discover</Link><Link href="/services" data-testid="link-public-services" className="hover:text-primary transition-colors">Services</Link><a href="/#how-it-works" data-testid="link-public-how-it-works" className="hover:text-primary transition-colors">How it works</a></nav><div className="flex items-center gap-2"><Link href="/login" data-testid="link-public-login" className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5 rounded-lg">Sign in</Link><Link href="/register" data-testid="link-public-register" className="inline-flex items-center gap-1.5 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90">Join QQZ <ArrowRight size={14} /></Link></div></div></header>;
}

export function PublicFooter() {
  return <footer className="bg-primary text-white"><div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8"><div className="sm:col-span-2"><div className="font-bold text-xl">QQZ<span className="text-accent">.</span></div><p className="mt-2 max-w-xs text-sm leading-relaxed text-white/60">A trusted Zimbabwean marketplace for services, requests, listings and bookings.</p></div><div><p className="text-xs font-bold uppercase tracking-[.16em] text-accent">Explore</p><div className="mt-4 space-y-3 text-sm text-white/70"><Link href="/discover" data-testid="link-footer-discover" className="block hover:text-white">Discovery</Link><Link href="/services" data-testid="link-footer-services" className="block hover:text-white">Services</Link><Link href="/register" data-testid="link-footer-provider" className="block hover:text-white">Become a provider</Link></div></div><div><p className="text-xs font-bold uppercase tracking-[.16em] text-accent">Trust</p><div className="mt-4 space-y-3 text-sm text-white/70"><span className="flex items-center gap-2"><ShieldCheck size={14} /> Verified profiles</span><span className="flex items-center gap-2"><Star size={14} /> Reviews that matter</span><span className="flex items-center gap-2"><CircleHelp size={14} /> Support when needed</span></div></div></div><div className="max-w-6xl mx-auto px-5 sm:px-8 pb-8 text-xs text-white/40">© {new Date().getFullYear()} Quick Quotes Zimbabwe. Built for local life, ready for SADC.</div></footer>;
}