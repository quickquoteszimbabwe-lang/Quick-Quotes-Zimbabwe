import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetCategoryTree } from "@workspace/api-client-react";
import { ArrowRight, BadgeCheck, BriefcaseBusiness, Building2, CalendarCheck, CarFront, CheckCircle2, ChevronRight, CircleDollarSign, Clock3, Construction, Hammer, HelpCircle, Mail, MapPin, Search, ShieldCheck, Smartphone, Sparkles, UserRound, UsersRound } from "lucide-react";
import { getCategoryIcon, getCategoryColor } from "@/lib/iconMap";
import { cn } from "@/lib/utils";
import ProviderHandshake from "@/components/ProviderHandshake";

const proof = [
  { icon: ShieldCheck, title: "Verified providers", text: "Identity and service profiles you can trust." },
  { icon: CircleDollarSign, title: "Clear quotes", text: "Compare transparent offers before you commit." },
  { icon: Clock3, title: "Built for local life", text: "From Harare to Bulawayo, help is nearby." },
];

export default function Splash() {
  const { data: tree, isLoading } = useGetCategoryTree();
  const featured = tree?.filter((category) => category.featured).slice(0, 6) ?? [];
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    navigate(`/discover${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ""}`);
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground overflow-hidden">
      <header className="relative z-10 border-b border-border/70 bg-card/70 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-[72px] flex items-center justify-between">
          <Link href="/" data-testid="link-public-brand" className="flex items-center gap-2.5">
            <span className="h-12 w-[122px] overflow-hidden rounded-lg bg-primary px-2 py-1">
              <img src="/logo.png" alt="Quick Quotes Zimbabwe" className="h-full w-full scale-[1.45] object-contain" />
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-muted-foreground">
            <Link href="/services" data-testid="link-public-services" className="hover:text-primary transition-colors">Browse services</Link>
            <a href="#how-it-works" data-testid="link-how-it-works" className="hover:text-primary transition-colors">How it works</a>
            <a href="#providers" data-testid="link-for-providers" className="hover:text-primary transition-colors">For providers</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" data-testid="link-public-login" className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5 rounded-lg transition-colors">Sign in</Link>
            <Link href="/register" data-testid="link-public-register" className="inline-flex items-center gap-1.5 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm">Join QQZ <ArrowRight size={14} /></Link>
          </div>
        </div>
      </header>

      <main>
        <section className="qqz-grid relative">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-14 pb-16 md:pt-24 md:pb-24 grid lg:grid-cols-[1.02fr_.98fr] gap-12 items-center">
            <div className="qqz-enter">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 text-primary px-3 py-1.5 text-xs font-bold tracking-wide"><Sparkles size={14} className="text-accent" /> The trusted way to get things done</div>
              <h1 className="mt-6 text-[clamp(2.8rem,7vw,5.5rem)] leading-[.94] font-bold text-primary max-w-[680px]">Good work is <span className="text-secondary">closer</span> than you think.</h1>
              <p className="mt-6 max-w-lg text-base md:text-lg text-muted-foreground leading-relaxed">Find a verified local provider, request exactly what you need, then compare real quotes without the guesswork.</p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link href="/register" data-testid="link-hero-get-started" className="inline-flex items-center justify-center gap-2 bg-accent text-primary px-5 py-3.5 rounded-xl font-bold hover:bg-accent/90 transition-all shadow-[0_8px_20px_hsl(30_92%_55%_/_0.22)]">Start a request <ArrowRight size={17} /></Link>
                <Link href="/services" data-testid="link-hero-explore" className="inline-flex items-center justify-center gap-2 bg-card border border-border text-primary px-5 py-3.5 rounded-xl font-bold hover:border-primary/40 transition-all">Explore services <Search size={17} /></Link>
              </div>
              <form onSubmit={submitSearch} className="mt-5 flex max-w-xl items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm">
                <Search size={18} className="ml-2 text-secondary shrink-0" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} data-testid="input-home-search" placeholder="What do you need?" className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm outline-none placeholder:text-muted-foreground" />
                <button type="submit" data-testid="button-home-search" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90">Search</button>
              </form>
              <div className="mt-8 flex items-center gap-3 text-xs text-muted-foreground"><div className="flex -space-x-2">{["T","M","N"].map((letter) => <span key={letter} className="w-7 h-7 rounded-full border-2 border-background bg-secondary text-white flex items-center justify-center font-bold">{letter}</span>)}</div><span><strong className="text-foreground">Local people, real work.</strong><br />A network growing every day.</span></div>
            </div>
            <div className="relative qqz-enter-delay">
              <div className="absolute -right-12 -top-12 w-48 h-48 bg-accent/20 rounded-full blur-3xl" />
              <div className="relative rounded-[2rem] bg-primary p-5 sm:p-7 shadow-[0_28px_70px_hsl(215_53%_22%_/_0.25)]">
                <div className="flex items-center justify-between text-white/70 text-xs mb-5"><span className="uppercase tracking-[.16em]">Your next project</span><span className="flex items-center gap-1 text-accent"><MapPin size={13} /> Harare</span></div>
                <div className="bg-card rounded-2xl p-4 sm:p-5 text-foreground">
                  <div className="flex items-start justify-between gap-3"><div><p className="text-xs text-muted-foreground">Looking for</p><p className="font-bold text-lg mt-1">A reliable home refresh</p></div><span className="w-10 h-10 bg-accent/15 text-accent rounded-xl flex items-center justify-center"><Hammer size={20} /></span></div>
                  <div className="mt-5 grid grid-cols-2 gap-2"><span className="bg-muted rounded-lg px-3 py-2 text-xs text-muted-foreground">Painting</span><span className="bg-muted rounded-lg px-3 py-2 text-xs text-muted-foreground">Interior work</span></div>
                  <div className="mt-5 pt-4 border-t border-border flex items-center justify-between"><div className="flex items-center gap-2"><span className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center text-xs font-bold">TN</span><div><p className="text-xs font-bold">Trusted providers</p><p className="text-[11px] text-muted-foreground">3 offers ready to compare</p></div></div><ChevronRight size={17} className="text-secondary" /></div>
                </div>
                <div className="flex items-center justify-between mt-5 text-white/65 text-xs"><span className="flex items-center gap-1.5"><BadgeCheck size={14} className="text-accent" /> Verified profiles</span><span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-accent" /> Secure payments</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-5 sm:px-8 py-14 md:py-20">
          <div className="grid md:grid-cols-3 gap-5">
            {proof.map(({ icon: Icon, title, text }, index) => <div key={title} className="qqz-hover rounded-2xl border border-border bg-card p-5"><div className="flex items-center gap-3"><span className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center"><Icon size={20} /></span><div><p className="font-bold text-sm">{title}</p><p className="text-xs text-muted-foreground mt-0.5">{text}</p></div></div><div className="mt-5 text-[10px] uppercase tracking-[.18em] text-muted-foreground">0{index + 1} / QQZ promise</div></div>)}
          </div>
        </section>

        <section className="bg-card border-y border-border" id="how-it-works">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 md:py-20">
            <div className="max-w-xl"><p className="text-xs font-bold uppercase tracking-[.18em] text-accent">A better way to transact</p><h2 className="mt-3 text-3xl md:text-4xl text-primary">From “I need help” to a trusted outcome.</h2><p className="mt-4 text-muted-foreground">No endless calls. No mysterious pricing. Just a clear path from your request to the right provider, service or booking.</p></div>
            <div className="mt-10 grid md:grid-cols-3 gap-8">
              {[{ n: "01", icon: UserRound, title: "Tell us what you need", text: "Share the details, timing and location. It takes less than two minutes." }, { n: "02", icon: BriefcaseBusiness, title: "Compare your options", text: "Local providers send quotes with their experience and timelines." }, { n: "03", icon: CheckCircle2, title: "Choose with confidence", text: "Book the right fit, pay securely and leave a review when it is done." }].map(({ n, icon: Icon, title, text }) => <div key={n} className="relative"><div className="flex items-center gap-3 text-accent"><span className="font-mono text-xs">{n}</span><Icon size={19} /></div><h3 className="mt-4 text-xl text-primary">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground max-w-xs">{text}</p></div>)}
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16" id="providers">
          <div className="flex items-end justify-between gap-4 mb-7"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-accent">Start exploring</p><h2 className="mt-2 text-3xl text-primary">Services people are finding</h2></div><Link href="/services" data-testid="link-public-all-services" className="hidden sm:flex items-center gap-1 text-sm font-bold text-secondary hover:text-primary">See all services <ArrowRight size={15} /></Link></div>
          {isLoading ? <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{[1,2,3,4,5,6].map((item) => <div key={item} className="h-28 rounded-2xl bg-muted animate-pulse" />)}</div> : <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{featured.map((cat) => { const Icon = getCategoryIcon(cat.icon); const colors = getCategoryColor(cat.sortOrder); return <Link href="/services" data-testid={`link-category-${cat.id}`} key={cat.id} className={cn("qqz-hover min-h-28 rounded-2xl border p-4 flex flex-col justify-between", colors.bg, colors.border)}><div className="flex items-start justify-between"><span className={cn("w-9 h-9 rounded-lg flex items-center justify-center", colors.iconBg)}><Icon size={18} className={colors.icon} /></span><ChevronRight size={16} className={colors.icon} /></div><div><p className={cn("text-sm font-bold", colors.icon)}>{cat.name}</p><p className="text-[11px] text-muted-foreground mt-1">{(cat.services?.length ?? 0) + (cat.subcategories?.reduce((sum, sub) => sum + sub.services.length, 0) ?? 0)} ways to get help</p></div></Link>; })}</div>}
        </section>

        <section className="bg-muted/45 border-y border-border">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div><p className="text-xs font-bold uppercase tracking-[.18em] text-accent">One marketplace, more possibilities</p><h2 className="mt-2 text-3xl md:text-4xl text-primary">Explore what is next on QQZ.</h2><p className="mt-3 max-w-xl text-muted-foreground">Use one account for professional services today, with listings, rentals and direct bookings designed to grow with you.</p></div>
              <Link href="/discover" data-testid="link-home-discovery" className="inline-flex items-center gap-2 text-sm font-bold text-secondary hover:text-primary">Open discovery <ArrowRight size={15} /></Link>
            </div>
            <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[{ icon: Building2, title: "Property listings", text: "Homes, rooms, offices and venues." }, { icon: CarFront, title: "Car rentals", text: "Vehicles for the dates you need." }, { icon: Construction, title: "Equipment hire", text: "Practical tools and event equipment." }, { icon: CalendarCheck, title: "Bookable services", text: "Choose a time and confirm directly." }].map(({ icon: Icon, title, text }) => <Link href="/discover" key={title} data-testid={`link-home-collection-${title.toLowerCase().replace(/\s+/g, "-")}`} className="group rounded-2xl border border-border bg-card p-5 hover:-translate-y-0.5 hover:shadow-md transition-all"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary"><Icon size={19} /></span><h3 className="mt-6 font-bold text-primary">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p><span className="mt-5 flex items-center gap-1 text-xs font-bold text-secondary">Explore collection <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" /></span></Link>)}
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16 grid lg:grid-cols-[1.1fr_.9fr] gap-5">
          <div className="rounded-3xl bg-secondary text-white p-7 md:p-10 relative overflow-hidden">
            <div className="absolute -right-14 -top-14 h-48 w-48 rounded-full border-[24px] border-white/10" />
            <Smartphone size={25} className="text-accent" />
            <p className="mt-5 text-xs font-bold uppercase tracking-[.18em] text-accent">Stay connected</p>
            <h2 className="mt-2 text-3xl text-white">Your QQZ account travels with you.</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">Start on the website, continue in the mobile app and keep every request, quote, payment and review in one place.</p>
            <Link href="/register" data-testid="link-home-download-app" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-primary">Create your account <ArrowRight size={15} /></Link>
          </div>
          <div className="rounded-3xl border border-border bg-card p-7 md:p-10">
            <div className="mb-6 max-w-[240px]"><ProviderHandshake /></div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-accent">For providers and owners</p>
            <h2 className="mt-2 text-3xl text-primary">Turn your expertise or asset into opportunity.</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Build a trusted profile, share your services and respond to real requests. Verification and reviews make the right clients easier to find.</p>
            <Link href="/register" data-testid="link-home-become-provider" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-secondary">Become a provider <UsersRound size={16} /></Link>
          </div>
        </section>

        <section className="bg-card border-y border-border" id="faq">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16">
            <div className="flex items-start justify-between gap-5"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-accent">Questions, answered</p><h2 className="mt-2 text-3xl text-primary">Built for clarity.</h2></div><HelpCircle className="text-secondary" size={28} /></div>
            <div className="mt-8 grid md:grid-cols-3 gap-4">
              {[{ q: "How does QQZ work?", a: "Tell us what you need, compare provider offers and keep the transaction visible from request to review." }, { q: "Are providers verified?", a: "Verification is part of the QQZ trust system. Profiles show the checks and reviews available for each provider." }, { q: "Can I use the mobile app?", a: "Yes. Your website and mobile app account are connected to the same QQZ core, so your activity follows you." }].map(({ q, a }) => <div key={q} className="rounded-2xl border border-border p-5"><h3 className="font-bold text-primary">{q}</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a}</p></div>)}
            </div>
          </div>
        </section>
      </main>
      <footer className="bg-primary text-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-8"><div className="sm:col-span-2"><div className="font-bold text-lg">QQZ<span className="text-accent">.</span></div><p className="mt-1 text-sm text-white/55">Better work, closer to home.</p><p className="mt-4 max-w-sm text-sm leading-relaxed text-white/55">A trusted marketplace for services, requests, listings and bookings across Zimbabwe.</p></div><div><p className="text-xs font-bold uppercase tracking-[.16em] text-accent">Explore</p><div className="mt-4 space-y-3 text-sm text-white/65"><Link href="/discover" data-testid="link-footer-discover" className="block hover:text-white">Marketplace discovery</Link><Link href="/services" data-testid="link-footer-services" className="block hover:text-white">Browse services</Link><Link href="/register" data-testid="link-footer-provider" className="block hover:text-white">Become a provider</Link></div></div><div><p className="text-xs font-bold uppercase tracking-[.16em] text-accent">Contact</p><div className="mt-4 space-y-3 text-sm text-white/65"><a href="mailto:hello@qqz.co.zw" data-testid="link-footer-contact" className="flex items-center gap-2 hover:text-white"><Mail size={14} /> hello@qqz.co.zw</a><a href="#faq" data-testid="link-footer-faq" className="flex items-center gap-2 hover:text-white"><HelpCircle size={14} /> FAQ and support</a></div></div></div>
      </footer>
    </div>
  );
}