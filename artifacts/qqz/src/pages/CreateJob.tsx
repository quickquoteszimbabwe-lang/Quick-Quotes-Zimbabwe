import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useCreateJob, useGetCategoryTree } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetJobsQueryKey } from "@workspace/api-client-react";
import { AlertCircle, ChevronLeft, ImagePlus, X } from "lucide-react";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function CreateJob() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const params = new URLSearchParams(window.location.search);
  const initialCategory = params.get("category") || "";

  const { data: categoryTree } = useGetCategoryTree();

  const [category, setCategory] = useState(initialCategory);
  const [subcategory, setSubcategory] = useState("");
  const [service, setService] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [timeline, setTimeline] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedCategory = categoryTree?.find(c => c.name === category);
  const hasSubcategories = (selectedCategory?.subcategories?.length ?? 0) > 0;
  const selectedSubcategory = selectedCategory?.subcategories?.find(s => s.name === subcategory);
  const availableServices = hasSubcategories
    ? (selectedSubcategory?.services ?? [])
    : (selectedCategory?.services ?? []);

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

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const remaining = Math.max(0, 5 - photos.length);
    const toAdd = files.slice(0, remaining);
    const dataUrls = await Promise.all(toAdd.map(fileToDataUrl));
    setPhotos(prev => [...prev, ...dataUrls]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removePhoto(index: number) {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!category || !service) {
      setError("Please select a category and service");
      return;
    }
    createJob.mutate({
      data: { category, service, description, location, timeline: timeline || undefined, photos: photos.length > 0 ? photos : undefined },
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
            onChange={e => { setCategory(e.target.value); setSubcategory(""); setService(""); }}
            required
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          >
            <option value="">Select category</option>
            {categoryTree?.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>

        {category && hasSubcategories && (
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Subcategory *</label>
            <select
              value={subcategory}
              onChange={e => { setSubcategory(e.target.value); setService(""); }}
              required
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="">Select subcategory</option>
              {selectedCategory?.subcategories?.map(sub => (
                <option key={sub.id} value={sub.name}>{sub.name}</option>
              ))}
            </select>
          </div>
        )}

        {category && (!hasSubcategories || subcategory) && (
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Service *</label>
            <select
              value={service}
              onChange={e => setService(e.target.value)}
              required
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="">Select service</option>
              {availableServices.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
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
          <label className="text-sm font-medium text-foreground">Photos (optional)</label>
          <div className="flex flex-wrap gap-2">
            {photos.map((photo, i) => (
              <div key={i} className="relative w-16 h-16">
                <img src={photo} alt={`Upload ${i + 1}`} className="w-16 h-16 object-cover rounded-lg border border-border" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full p-0.5"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {photos.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-16 h-16 flex items-center justify-center border border-dashed border-border rounded-lg text-muted-foreground hover:border-primary/50 hover:text-primary"
              >
                <ImagePlus size={20} />
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoSelect}
            className="hidden"
          />
          <p className="text-xs text-muted-foreground">Add up to 5 photos to help professionals understand the job.</p>
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
