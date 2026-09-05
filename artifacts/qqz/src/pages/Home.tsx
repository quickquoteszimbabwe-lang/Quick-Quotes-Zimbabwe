import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useGetCategoryTree, useGetJobs, useGetPayments, useGetMyQuotes, getGetPaymentsQueryKey, getGetMyQuotesQueryKey } from "@workspace/api-client-react";
import { ArrowUpRight, BadgeCheck, BriefcaseBusiness, Building2, CalendarCheck, ChevronRight, CircleDollarSign, Clock3, FilePlus2, MapPin, Plus, ReceiptText, Search, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import { getCategoryIcon, getCategoryColor } from "@/lib/iconMap";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { formatRole } from "@/lib/pricingModels";
import { cn } from "@/lib/utils";

const requestTypes = [
  { icon: BriefcaseBusiness, label: "Professional service", caption: "Find a skilled local pro", type: "professional_service" },
  { icon: Building2, label: "Listing or rental", caption: "Spaces, cars and equipment", type: "listing_rental" },
  { icon: CalendarCheck, label: "Bookable service", caption: "Make a date and get it done", type: "bookable_service" },
];

export default function Home() {
  const { user } = useAuth();
  const { data: tree, isLoading: treeLoading } = useGetCategoryTree();
  const { data: jobs } = useGetJobs({ limit: 3 });
  const { data: payments } = useGetPayments({ query: { enabled: user?.role === "customer", queryKey: getGetPaymentsQueryKey() } });
  const { data: offers } = useGetMyQuotes({ query: { enabled: user?.role === "professional", queryKey: getGetMyQuotesQueryKey() } });
  const client = user?.role === "customer";
  const featured = tree?.filter((item) => item.featured).slice(0, 4) ?? [];
  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-8 qqz-enter">
      <section className="relative overflow-hidden rounded-[1.65rem] bg-primary px-5 py-7 sm:px-8 sm:py-9 text-white">
        <div className="absolute -right-20 -top-28 w-80 h-80 rounded-full border-[38px] border-accent/10" />
        <div className="absolute right-24 -bottom-28 w-56 h-56 rounded-full border-[22px] border-secondary/30" />
        <div className="relative max-w-2xl">
          <div className="flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-[.16em]"><Sparkles size={14} /> {client ? "Your QQZ workspace" : "Provider workspace"}</div>
          <h1 data-testid="text-welcome-user" className="mt-4 text-3xl sm:text-4xl font-bold">Good morning, {firstName}.</h1>
          <p className="mt-3 text-sm sm:text-base text-white/65 max-w-md leading-relaxed">{client ? "Your next project starts with a clear request. We’ll help the right people find it." : "There are real requests waiting for a provider who cares about the details."}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {client ? <Link href="/requests/create" data-testid="link-home-new-request" className="inline-flex items-center gap-2 bg-accent text-primary px-4 py-3 rounded-xl text-sm font-bold hover:bg-accent/90"><Plus size={17} /> Post a request</Link> : <Link href="/requests" data-testid="link-home-browse-requests" className="inline-flex items-center gap-2 bg-white/12 border border-white/15 px-4 py-3 rounded-xl text-sm font-bold hover:bg-white/18">Browse open requests <ArrowUpRight size={16} /></Link>}
            <Link href="/services" data-testid="link-home-discover" className="inline-flex items-center gap-2 text-white/80 px-3 py-3 text-sm font-semibold hover:text-white">Discover services <ChevronRight size={16} /></Link>
          </div>
        </div>
      </section>

      <div className="grid sm:grid-cols-3 gap-3">
        <MiniStat icon={FilePlus2} label="Active requests" value={jobs?.filter((job) => job.status === "open").length ?? 0} />
        <MiniStat icon={BadgeCheck} label="Verified network" value={tree?.length ? `${tree.length} categories` : "Growing"} />
        <MiniStat icon={WalletCards} label={client ? "Payment records" : "Offers sent"} value={client ? payments?.length ?? 0 : offers?.length ?? 0} />
      </div>

      {client && <section>
        <div className="flex items-end justify-between mb-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-accent">Start here</p><h2 className="mt-1 text-2xl text-primary">What do you need?</h2></div><span className="text-xs text-muted-foreground">Choose a path</span></div>
        <div className="grid md:grid-cols-3 gap-3">
          {requestTypes.map(({ icon: Icon, label, caption, type }) => <Link key={type} href={`/requests/create?type=${type}`} data-testid={`link-request-type-${type}`} className="qqz-hover group rounded-2xl bg-card border border-border p-4 flex md:flex-col lg:flex-row gap-4 items-center md:items-start lg:items-center"><span className="w-11 h-11 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0"><Icon size={21} /></span><span className="flex-1 min-w-0 text-center md:text-left"><span className="block font-bold text-sm text-primary">{label}</span><span className="block mt-1 text-xs text-muted-foreground">{caption}</span></span><ChevronRight size={16} className="text-muted-foreground group-hover:text-accent transition-colors" /></Link>)}
        </div>
      </section>}

      <section>
        <div className="flex items-end justify-between mb-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-accent">Explore the network</p><h2 className="mt-1 text-2xl text-primary">Popular categories</h2></div><Link href="/services" data-testid="link-home-all-categories" className="flex items-center gap-1 text-xs font-bold text-secondary hover:text-primary">View all <ArrowUpRight size={14} /></Link></div>
        {treeLoading ? <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[1,2,3,4].map((n) => <div key={n} className="h-32 rounded-2xl bg-muted animate-pulse" />)}</div> : <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{featured.map((cat) => { const Icon = getCategoryIcon(cat.icon); const color = getCategoryColor(cat.sortOrder); return <Link key={cat.id} href={`/services`} data-testid={`card-home-category-${cat.id}`} className={cn("qqz-hover rounded-2xl border p-4 min-h-32 flex flex-col justify-between", color.bg, color.border)}><div className="flex justify-between"><span className={cn("w-9 h-9 rounded-lg flex items-center justify-center", color.iconBg)}><Icon size={18} className={color.icon} /></span><ArrowUpRight size={15} className={color.icon} /></div><div><p className={cn("font-bold text-sm", color.icon)}>{cat.name}</p><p className="text-[11px] text-muted-foreground mt-1">{cat.services.length + cat.subcategories.reduce((sum, sub) => sum + sub.services.length, 0)} services</p></div></Link>; })}</div>}
      </section>

      <section className="grid lg:grid-cols-[1.35fr_.65fr] gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4"><div><h2 className="text-lg text-primary">Your latest activity</h2><p className="text-xs text-muted-foreground mt-1">Keep your projects moving</p></div><Link href="/requests" data-testid="link-home-activity" className="text-xs font-bold text-secondary">See all</Link></div>
          {(jobs?.length ?? 0) === 0 ? <EmptyActivity client={client} /> : <div className="space-y-2">{jobs?.slice(0, 3).map((job) => <Link href={`/requests/${job.id}`} key={job.id} data-testid={`row-home-job-${job.id}`} className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-muted transition-colors"><span className="w-9 h-9 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center"><ReceiptText size={17} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold truncate">{job.service}</span><span className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground"><MapPin size={11} />{job.location}<span>·</span><Clock3 size={11} />{formatDate(job.createdAt)}</span></span><span className={cn("text-[10px] px-2 py-1 rounded-full font-bold capitalize", getStatusColor(job.status))}>{job.status.replace("_", " ")}</span></Link>)}</div>}
        </div>
        <div className="rounded-2xl bg-secondary text-white p-5 flex flex-col justify-between"><div><span className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><ShieldCheck size={21} className="text-accent" /></span><h2 className="mt-5 text-xl">Trust is built in.</h2><p className="mt-2 text-sm text-white/65 leading-relaxed">We keep identity, quotes and payment milestones visible so every side can work with confidence.</p></div><Link href="/verify" data-testid="link-home-verify" className="mt-6 flex items-center justify-between text-sm font-bold text-accent">Review your verification <ArrowUpRight size={16} /></Link></div>
      </section>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: typeof Search; label: string; value: string | number }) {
  return <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3"><span className="w-9 h-9 rounded-lg bg-accent/12 text-accent flex items-center justify-center"><Icon size={17} /></span><div><p data-testid={`text-stat-${label.toLowerCase().replace(/\s+/g, "-")}`} className="font-bold text-primary">{value}</p><p className="text-[11px] text-muted-foreground">{label}</p></div></div>;
}

function EmptyActivity({ client }: { client: boolean }) {
  return <div className="rounded-xl bg-muted/60 border border-dashed border-border px-4 py-7 text-center"><Search size={22} className="mx-auto text-secondary mb-2" /><p className="text-sm font-semibold text-primary">Nothing here yet</p><p className="text-xs text-muted-foreground mt-1">{client ? "Post a request and your activity will appear here." : "Open requests will appear here as they arrive."}</p></div>;
}