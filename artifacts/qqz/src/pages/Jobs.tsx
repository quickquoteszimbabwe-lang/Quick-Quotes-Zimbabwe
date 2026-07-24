import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useGetJobs, useGetCategories } from "@workspace/api-client-react";
import { Plus, MapPin, Clock, ChevronRight, Briefcase } from "lucide-react";
import { formatDate, getStatusColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function Jobs() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("All");

  const { data: categories } = useGetCategories();
  const { data: jobs, isLoading, error } = useGetJobs({
    category: selectedCategory !== "All" ? selectedCategory : undefined,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">
          {user?.role === "customer" ? "My Jobs" : "Available Jobs"}
        </h1>
        {user?.role === "customer" && (
          <Link
            href="/jobs/create"
            className="flex items-center gap-1.5 bg-primary text-white py-2 px-3 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} />
            Post Job
          </Link>
        )}
      </div>

      {/* Dynamic category filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setSelectedCategory("All")}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
            selectedCategory === "All"
              ? "bg-primary text-white"
              : "bg-card border border-border text-muted-foreground hover:border-primary/50"
          )}
        >
          All
        </button>
        {categories?.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.name)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              selectedCategory === cat.name
                ? "bg-primary text-white"
                : "bg-card border border-border text-muted-foreground hover:border-primary/50"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Failed to load jobs. Please try again.</p>
        </div>
      )}

      {!isLoading && !error && jobs?.length === 0 && (
        <div className="text-center py-12">
          <Briefcase size={48} className="mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">No jobs found</p>
          {user?.role === "customer" && (
            <Link href="/jobs/create" className="text-primary text-sm hover:underline mt-1 block">
              Post your first job
            </Link>
          )}
          {user?.role === "professional" && (
            <p className="text-sm text-muted-foreground mt-1">Try selecting a different category</p>
          )}
        </div>
      )}

      <div className="space-y-3">
        {jobs?.map((job) => (
          <Link key={job.id} href={`/jobs/${job.id}`}>
            <div className="bg-card rounded-xl border border-border p-4 hover:shadow-sm transition-all group">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {job.category}
                    </span>
                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", getStatusColor(job.status))}>
                      {job.status.replace("_", " ")}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground text-sm line-clamp-1">{job.service}</h3>
                </div>
                <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary flex-shrink-0 mt-1 transition-colors" />
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{job.description}</p>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin size={12} /> {job.location}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} /> {formatDate(job.createdAt)}
                </span>
                {job.customerName && user?.role === "professional" && (
                  <span className="text-foreground/60">by {job.customerName}</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
