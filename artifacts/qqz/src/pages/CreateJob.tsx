import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateJob } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetJobsQueryKey } from "@workspace/api-client-react";
import { AlertCircle, ChevronLeft } from "lucide-react";

const CATEGORIES: Record<string, string[]> = {
  Construction: ["Building", "Plumbing", "Electrical", "Painting", "Tiling", "Other Construction"],
  "Borehole Services": ["Drilling", "Deepening", "Pump Installation", "Other Borehole"],
  Transport: ["Moving", "Truck Hire", "Delivery", "Other Transport"],
  Cleaning: ["Home Cleaning", "Office Cleaning", "Post-Construction Cleaning", "Other Cleaning"],
  Agriculture: ["Irrigation", "Farm Labor", "Other Agriculture"],
  "Property Services": ["Property Inspection", "Supervision", "Diaspora Management", "Other Property"],
};

export default function CreateJob() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const params = new URLSearchParams(window.location.search);
  const initialCategory = params.get("category") || "";

  const [category, setCategory] = useState(initialCategory);
  const [service, setService] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [timeline, setTimeline] = useState("");
  const [error, setError] = useState("");

  const createJob = useCreateJob({
    mutation: {
      onSuccess: (job) => {
        queryClient.invalidateQueries({ queryKey: getGetJobsQueryKey() });
        navigate(`/jobs/${job.id}`);
      },
      onError: (err: any) => {
        setError(err?.data?.error || "Failed to create job");
      },
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!category || !service) {
      setError("Please select a category and service");
      return;
    }
    createJob.mutate({
      data: { category, service, description, location, timeline: timeline || undefined },
    });
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/jobs")} className="text-muted-foreground hover:text-foreground">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-foreground">Post a Job</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-5 space-y-4">
        {error && (
          <div className="flex items-center gap-2 bg-destructive/10 text-destructive px-3 py-2 rounded-lg text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Category *</label>
          <select
            value={category}
            onChange={e => { setCategory(e.target.value); setService(""); }}
            required
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          >
            <option value="">Select category</option>
            {Object.keys(CATEGORIES).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {category && (
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Service *</label>
            <select
              value={service}
              onChange={e => setService(e.target.value)}
              required
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="">Select service</option>
              {(CATEGORIES[category] || []).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Description *</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe your job in detail. Include measurements, materials needed, access requirements, etc."
            required
            rows={4}
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Location *</label>
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="e.g. Borrowdale, Harare"
            required
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Timeline (optional)</label>
          <input
            type="text"
            value={timeline}
            onChange={e => setTimeline(e.target.value)}
            placeholder="e.g. Within 2 weeks, ASAP, Next month"
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        <button
          type="submit"
          disabled={createJob.isPending}
          className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {createJob.isPending ? "Posting..." : "Post Job"}
        </button>
      </form>
    </div>
  );
}
