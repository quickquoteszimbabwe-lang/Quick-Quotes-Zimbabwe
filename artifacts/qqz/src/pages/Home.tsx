import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Building2, Droplets, Truck, Sparkles, Leaf, Home as HomeIcon, ChevronRight, Plus, Star } from "lucide-react";

const categories = [
  {
    id: "Construction",
    icon: Building2,
    label: "Construction",
    description: "Building, plumbing, electrical, painting, tiling",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    iconBg: "bg-blue-100",
  },
  {
    id: "Borehole Services",
    icon: Droplets,
    label: "Borehole Services",
    description: "Drilling, deepening, pump installation",
    color: "bg-cyan-50 text-cyan-700 border-cyan-200",
    iconBg: "bg-cyan-100",
  },
  {
    id: "Transport",
    icon: Truck,
    label: "Transport",
    description: "Moving, truck hire, delivery",
    color: "bg-orange-50 text-orange-700 border-orange-200",
    iconBg: "bg-orange-100",
  },
  {
    id: "Cleaning",
    icon: Sparkles,
    label: "Cleaning",
    description: "Home, office, post-construction",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    iconBg: "bg-purple-100",
  },
  {
    id: "Agriculture",
    icon: Leaf,
    label: "Agriculture",
    description: "Irrigation, farm labor",
    color: "bg-green-50 text-green-700 border-green-200",
    iconBg: "bg-green-100",
  },
  {
    id: "Property Services",
    icon: HomeIcon,
    label: "Property Services",
    description: "Inspection, supervision, diaspora management",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    iconBg: "bg-amber-100",
  },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
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

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-foreground text-lg">Service Categories</h2>
          <Link href="/jobs" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
            View jobs <ChevronRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categories.map(({ id, icon: Icon, label, description, color, iconBg }) => (
            <Link
              key={id}
              href={user?.role === "customer" ? `/jobs/create?category=${encodeURIComponent(id)}` : `/jobs?category=${encodeURIComponent(id)}`}
              className={`flex items-center gap-4 p-4 rounded-xl border ${color} hover:shadow-sm transition-all group`}
            >
              <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{label}</div>
                <div className="text-xs opacity-70 mt-0.5 line-clamp-1">{description}</div>
              </div>
              <ChevronRight size={16} className="opacity-50 group-hover:opacity-100 flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>

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
