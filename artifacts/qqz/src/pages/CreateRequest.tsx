import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useCreateJob, useGetCategoryTree } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetJobsQueryKey } from "@workspace/api-client-react";
import { AlertCircle, ChevronLeft, ImagePlus, X, Briefcase, Building2, CalendarCheck, ChevronRight } from "lucide-react";
import { REQUEST_TYPES, type RequestTypeValue } from "@/lib/pricingModels";
import { cn } from "@/lib/utils";

const TYPE_ICONS = {
  professional_service: Briefcase,
  listing_rental: Building2,
  bookable_service: CalendarCheck,
};

const TYPE_COLORS = {
  professional_service: "border-blue-200 bg-blue-50 hover:border-blue-400",
  listing_rental: "border-emerald-200 bg-emerald-50 hover:border-emerald-400",
  bookable_service: "border-violet-200 bg-violet-50 hover:border-violet-400",
};

const TYPE_SELECTED = {
  professional_service: "border-blue-500 bg-blue-50 ring-1 ring-blue-500/40",
  listing_rental: "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500/40",
  bookable_service: "border-violet-500 bg-violet-50 ring-1 ring-violet-500/40",
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function CreateRequest() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const params = new URLSearchParams(window.location.search);
  const initialCategory = params.get("category") || "";

  const { data: categoryTree } = useGetCategoryTree();

  const [step, setStep] = useState<"type" | "details">(initialCategory ? "details" : "type");
  const [requestType, setRequestType] = useState<RequestTypeValue>("professional_service");
  const [category, setCategory] = useState(initialCategory);
  const [subcategory, setSubcategory] = useState("");
  const [service, setService] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [timeline, setTimeline] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedCategory = categoryTree?.find((c) => c.name === category);
  const hasSubcategories = (selectedCategory?.subcategories?.length ?? 0) > 0;
  const selectedSubcategory = selectedCategory?.subcategories?.find((s) => s.name === subcategory);
  const availableServices = hasSubcategories
    ? (selectedSubcategory?.services ?? [])
    : (selectedCategory?.services ?? []);

  const createRequest = useCreateJob({
    mutation: {
      onSuccess: (job) => {
        queryClient.invalidateQueries({ queryKey: getGetJobsQueryKey() });
        navigate(`/requests/${job.id}`);
      },
      onError: (err: any) => {
        setError(err?.data?.error || "Failed to create request");
      },
    },
  });

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const remaining = Math.max(0, 8 - photos.length);
    const toAdd = files.slice(0, remaining);
    const dataUrls = await Promise.all(toAdd.map(fileToDataUrl));
    setPhotos((prev) => [...prev, ...dataUrls]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!category || !service) {
      setError("Please select a category and service");
      return;
    }
    createRequest.mutate({
      data: {
        category,
        service,
        description,
        location,
        timeline: timeline || undefined,
        photos: photos.length > 0 ? photos : undefined,
        requestType,
      } as any,
    });
  }

  const selectedTypeInfo = REQUEST_TYPES.find((t) => t.value === requestType)!;

  // ── Step 1: Choose Transaction Type ──────────────────────────────────────
  if (step === "type") {
    return (
      <div className="space-y-4 max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/requests")} className="text-muted-foreground hover:text-foreground">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Create a Request</h1>
            <p className="text-sm text-muted-foreground">What type of request are you posting?</p>
          </div>
        </div>

        <div className="space-y-3">
          {REQUEST_TYPES.map((type) => {
            const Icon = TYPE_ICONS[type.value];
            const isSelected = requestType === type.value;
            return (
              <button
                key={type.value}
                onClick={() => setRequestType(type.value)}
                className={cn(
                  "w-full text-left border-2 rounded-2xl p-4 transition-all",
                  isSelected ? TYPE_SELECTED[type.value] : TYPE_COLORS[type.value]
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("p-2.5 rounded-xl", isSelected ? "bg-white/80" : "bg-white/60")}>
                    <Icon size={22} className="text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-foreground">{type.label}</p>
                      {isSelected && (
                        <span className="text-xs font-bold text-primary bg-white px-2 py-0.5 rounded-full border border-primary/20">
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{type.description}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">{type.examples}</p>
                    <div className="mt-2 text-xs text-muted-foreground bg-white/60 rounded-lg px-2 py-1.5">
                      {type.workflow}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setStep("details")}
          className="w-full bg-primary text-white py-3.5 rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
        >
          Continue with {selectedTypeInfo.label}
          <ChevronRight size={18} />
        </button>
      </div>
    );
  }

  // ── Step 2: Request Details ───────────────────────────────────────────────
  const TypeIcon = TYPE_ICONS[requestType];

  const descriptionPlaceholders: Record<RequestTypeValue, string> = {
    professional_service:
      "Describe the work needed. Include measurements, materials, access info, timeline preferences, any specific requirements…",
    listing_rental:
      "Describe what you're looking for. Include size, location preferences, duration, budget, must-have features…",
    bookable_service:
      "Describe what you need. Include date, time preferences, number of people, location, any special requirements…",
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => setStep("type")} className="text-muted-foreground hover:text-foreground">
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Request Details</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <TypeIcon size={13} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{selectedTypeInfo.label}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-5 space-y-4">
        {error && (
          <div className="flex items-center gap-2 bg-destructive/10 text-destructive px-3 py-2 rounded-lg text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Category */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground">Category *</label>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setSubcategory(""); setService(""); }}
            required
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          >
            <option value="">Select category</option>
            {categoryTree?.map((cat) => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>

        {category && hasSubcategories && (
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Subcategory *</label>
            <select
              value={subcategory}
              onChange={(e) => { setSubcategory(e.target.value); setService(""); }}
              required
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="">Select subcategory</option>
              {selectedCategory?.subcategories?.map((sub) => (
                <option key={sub.id} value={sub.name}>{sub.name}</option>
              ))}
            </select>
          </div>
        )}

        {category && (!hasSubcategories || subcategory) && (
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Service / Type *</label>
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              required
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="">Select service</option>
              {availableServices.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground">Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={descriptionPlaceholders[requestType]}
            required
            rows={4}
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
          />
        </div>

        {/* Photos */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground">
            Photos
            <span className="font-normal text-muted-foreground ml-1">(optional, up to 8)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {photos.map((photo, i) => (
              <div key={i} className="relative w-16 h-16">
                <img
                  src={photo}
                  alt={`Upload ${i + 1}`}
                  className="w-16 h-16 object-cover rounded-lg border border-border"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full p-0.5"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {photos.length < 8 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-16 h-16 flex flex-col items-center justify-center border border-dashed border-border rounded-lg text-muted-foreground hover:border-primary/50 hover:text-primary text-xs gap-0.5"
              >
                <ImagePlus size={18} />
                <span style={{ fontSize: 9 }}>Add</span>
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
        </div>

        {/* Location */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground">Location *</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Borrowdale, Harare"
            required
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        {/* Timeline */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground">
            Timeline
            <span className="font-normal text-muted-foreground ml-1">(optional)</span>
          </label>
          <input
            type="text"
            value={timeline}
            onChange={(e) => setTimeline(e.target.value)}
            placeholder="e.g. Within 2 weeks, ASAP, By end of month"
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        <button
          type="submit"
          disabled={createRequest.isPending}
          className="w-full bg-primary text-white py-3.5 rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {createRequest.isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Posting Request…
            </>
          ) : (
            "Post Request"
          )}
        </button>
      </form>
    </div>
  );
}
