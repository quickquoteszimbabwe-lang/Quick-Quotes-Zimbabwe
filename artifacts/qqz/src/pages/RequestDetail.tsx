import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  useGetJob,
  useSelectQuote,
  useCompleteJob,
  useCreateQuote,
  useCreatePayment,
  useCreateReview,
  getGetJobQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  MapPin,
  Clock,
  ChevronLeft,
  Star,
  CheckCircle,
  DollarSign,
  Briefcase,
  Building2,
  CalendarCheck,
} from "lucide-react";
import { formatDate, formatCurrency, getStatusColor } from "@/lib/utils";
import { QuotationEngine, type QuoteFormData } from "@/components/QuotationEngine";
import { formatRequestType } from "@/lib/pricingModels";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<string, React.ElementType> = {
  professional_service: Briefcase,
  listing_rental: Building2,
  bookable_service: CalendarCheck,
};

export default function RequestDetail() {
  const params = useParams<{ id: string }>();
  const jobId = parseInt(params.id || "0");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: request, isLoading, error } = useGetJob(jobId);

  const [showOfferForm, setShowOfferForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"ecocash" | "bank_transfer" | "paynow">("ecocash");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [offerError, setOfferError] = useState("");

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(jobId) });

  const selectQuote = useSelectQuote({ mutation: { onSuccess: invalidate } });
  const completeJob = useCompleteJob({ mutation: { onSuccess: invalidate } });
  const createQuote = useCreateQuote({
    mutation: {
      onSuccess: () => { setShowOfferForm(false); invalidate(); },
      onError: (e: any) => setOfferError(e?.data?.error || "Failed to submit offer"),
    },
  });
  const createPayment = useCreatePayment({
    mutation: { onSuccess: () => { setShowPaymentForm(false); invalidate(); } },
  });
  const createReview = useCreateReview({
    mutation: { onSuccess: () => { setShowReviewForm(false); invalidate(); } },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Request not found</p>
        <button
          onClick={() => navigate("/requests")}
          className="text-primary mt-2 hover:underline text-sm"
        >
          Back to Requests
        </button>
      </div>
    );
  }

  const isClient = user?.role === "customer" && request.customerId === user?.id;
  const isProvider = user?.role === "professional";
  const hasSubmittedOffer = request.quotes?.some((q: any) => q.professionalId === user?.id);
  const reqType = (request as any).requestType ?? "professional_service";
  const TypeIcon = TYPE_ICONS[reqType] ?? Briefcase;

  function handleSelectOffer(quoteId: number) {
    selectQuote.mutate({ id: jobId, data: { quoteId } });
  }

  function handleCompleteRequest() {
    completeJob.mutate({ id: jobId });
  }

  function handleCreatePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!request) return;
    const selectedQ = request.quotes?.find(
      (q: any) => q.professionalId === request.selectedProfessionalId
    );
    const amount = selectedQ ? selectedQ.price : 0;
    createPayment.mutate({ data: { jobId, amount: Number(amount), method: paymentMethod } });
  }

  function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!request || !request.selectedProfessionalId) return;
    createReview.mutate({
      data: {
        jobId,
        professionalId: request.selectedProfessionalId,
        rating: reviewRating,
        comment: reviewComment || undefined,
      },
    });
  }

  function handleSubmitOffer(data: QuoteFormData) {
    setOfferError("");
    const items = data.items
      .filter((item) => item.description.trim() !== "")
      .map((item) => ({
        description: item.description,
        quantity: parseFloat(item.quantity) || 0,
        unit: item.unit,
        unitPrice: parseFloat(item.unitPrice) || 0,
      }));

    const itemsTotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const extrasTotal = data.extras.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
    const discount = parseFloat(data.discount) || 0;
    const total = Math.max(0, itemsTotal + extrasTotal - discount);

    createQuote.mutate({
      data: {
        jobId,
        price: total,
        timeline: data.timeline,
        message: data.message || undefined,
        items,
        pricingModel: data.pricingModel,
        discount: discount || undefined,
        depositRequired: data.depositRequired || undefined,
        depositAmount: parseFloat(data.depositAmount) || undefined,
        extras: data.extras
          .filter((e) => e.description.trim())
          .map((e) => ({ description: e.description, amount: parseFloat(e.amount) || 0 })),
        milestones: data.milestones
          .filter((m) => m.title.trim())
          .map((m) => ({
            title: m.title,
            description: m.description,
            amount: parseFloat(m.amount) || 0,
          })),
        notes: data.notes || undefined,
      } as any,
    });
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/requests")}
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground line-clamp-1">{request.service}</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <TypeIcon size={13} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {formatRequestType(reqType)}
            </span>
          </div>
        </div>
      </div>

      {/* Request card */}
      <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {request.category}
          </span>
          <span
            className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-full",
              getStatusColor(request.status)
            )}
          >
            {request.status.replace(/_/g, " ")}
          </span>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">{request.description}</p>

        {request.photos && request.photos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {request.photos.map((photo, i) => (
              <a key={i} href={photo} target="_blank" rel="noreferrer">
                <img
                  src={photo}
                  alt={`Photo ${i + 1}`}
                  className="w-16 h-16 object-cover rounded-xl border border-border hover:opacity-90 transition-opacity"
                />
              </a>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin size={12} /> {request.location}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} /> {formatDate(request.createdAt)}
          </span>
          {request.timeline && <span>Needed by: {request.timeline}</span>}
        </div>

        {request.customerName && (
          <p className="text-xs text-muted-foreground">Posted by: {request.customerName}</p>
        )}
      </div>

      {/* Offers section */}
      {request.quotes && request.quotes.length > 0 && (
        <div>
          <h2 className="font-bold text-foreground text-lg mb-3">
            Offers ({request.quotes.length})
          </h2>
          <div className="space-y-4">
            {request.quotes.map((q: any) => {
              const isSelected = q.professionalId === request.selectedProfessionalId;
              return (
                <QuotationEngine
                  key={q.id}
                  mode="view"
                  quote={q}
                  isSelected={isSelected}
                  canAccept={isClient && request.status === "open"}
                  onAccept={() => handleSelectOffer(q.id)}
                  isAccepting={selectQuote.isPending}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Payment */}
      {isClient && request.status === "in_progress" && !request.payment && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={18} className="text-accent" />
            <h2 className="font-bold text-foreground">Make Payment</h2>
          </div>
          {!showPaymentForm ? (
            <button
              onClick={() => setShowPaymentForm(true)}
              className="w-full bg-accent text-primary py-2.5 rounded-xl text-sm font-bold hover:bg-accent/90"
            >
              Create Payment Record
            </button>
          ) : (
            <form onSubmit={handleCreatePayment} className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-foreground">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="ecocash">EcoCash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="paynow">Paynow</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentForm(false)}
                  className="flex-1 border border-border py-2.5 rounded-xl text-sm font-semibold hover:bg-muted/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createPayment.isPending}
                  className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                >
                  {createPayment.isPending ? "…" : "Confirm"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {request.payment && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="font-bold text-foreground mb-3">Payment</h2>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground capitalize">
                {request.payment.method?.replace("_", " ")}
              </p>
              <p className="font-bold text-foreground text-lg">
                {formatCurrency(Number(request.payment.amount))}
              </p>
            </div>
            <span
              className={cn(
                "text-xs font-semibold px-3 py-1 rounded-full",
                getStatusColor(request.payment.status)
              )}
            >
              {request.payment.status}
            </span>
          </div>
        </div>
      )}

      {/* Approve completion */}
      {isClient && request.status === "in_progress" && (
        <button
          onClick={handleCompleteRequest}
          disabled={completeJob.isPending}
          className="w-full bg-secondary text-white py-3.5 rounded-xl font-bold hover:bg-secondary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <CheckCircle size={18} />
          {completeJob.isPending ? "Completing…" : "Approve Completion"}
        </button>
      )}

      {/* Review */}
      {isClient &&
        request.status === "completed" &&
        !request.review &&
        request.selectedProfessionalId && (
          <div className="bg-card rounded-2xl border border-border p-5">
            <h2 className="font-bold text-foreground mb-3">Leave a Review</h2>
            {!showReviewForm ? (
              <button
                onClick={() => setShowReviewForm(true)}
                className="w-full bg-primary text-white py-2.5 rounded-xl text-sm font-bold"
              >
                Rate this Provider
              </button>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" onClick={() => setReviewRating(n)}>
                        <Star
                          size={28}
                          className={
                            n <= reviewRating ? "text-accent fill-accent" : "text-muted-foreground"
                          }
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">
                    Comment
                    <span className="font-normal text-muted-foreground ml-1">(optional)</span>
                  </label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience with this provider…"
                    rows={3}
                    className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="flex-1 border border-border py-2.5 rounded-xl text-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createReview.isPending}
                    className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                  >
                    {createReview.isPending ? "…" : "Submit Review"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

      {request.review && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="font-bold text-foreground mb-2">Review</h2>
          <div className="flex items-center gap-2 mb-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                size={16}
                className={
                  n <= (request.review?.rating ?? 0)
                    ? "text-accent fill-accent"
                    : "text-muted-foreground"
                }
              />
            ))}
            <span className="text-sm text-muted-foreground">
              by {(request.review as any).customerName || "Client"}
            </span>
          </div>
          {request.review.comment && (
            <p className="text-sm text-muted-foreground">{request.review.comment}</p>
          )}
        </div>
      )}

      {/* Provider: submit offer */}
      {isProvider && request.status === "open" && !hasSubmittedOffer && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="font-bold text-foreground mb-3">Submit an Offer</h2>
          {!showOfferForm ? (
            <button
              onClick={() => setShowOfferForm(true)}
              className="w-full bg-primary text-white py-3 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
            >
              Build & Submit Offer
            </button>
          ) : (
            <QuotationEngine
              mode="create"
              onSubmit={handleSubmitOffer}
              onCancel={() => { setShowOfferForm(false); setOfferError(""); }}
              isSubmitting={createQuote.isPending}
              error={offerError}
            />
          )}
        </div>
      )}

      {isProvider && hasSubmittedOffer && (
        <div className="bg-secondary/10 border border-secondary/30 text-secondary rounded-xl p-3 text-sm text-center font-semibold flex items-center justify-center gap-2">
          <CheckCircle size={16} />
          You've submitted an offer for this request
        </div>
      )}
    </div>
  );
}
