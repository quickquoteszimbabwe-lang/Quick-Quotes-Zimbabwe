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
import { MapPin, Clock, ChevronLeft, Star, CheckCircle, AlertCircle, DollarSign } from "lucide-react";
import { formatDate, formatCurrency, getStatusColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function JobDetail() {
  const params = useParams<{ id: string }>();
  const jobId = parseInt(params.id || "0");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: job, isLoading, error } = useGetJob(jobId);

  const [quotePrice, setQuotePrice] = useState("");
  const [quoteTimeline, setQuoteTimeline] = useState("");
  const [quoteMessage, setQuoteMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"ecocash" | "bank_transfer" | "paynow">("ecocash");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [formError, setFormError] = useState("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(jobId) });

  const selectQuote = useSelectQuote({ mutation: { onSuccess: invalidate } });
  const completeJob = useCompleteJob({ mutation: { onSuccess: invalidate } });
  const createQuote = useCreateQuote({ mutation: { onSuccess: () => { setShowQuoteForm(false); invalidate(); }, onError: (e: any) => setFormError(e?.data?.error || "Failed") } });
  const createPayment = useCreatePayment({ mutation: { onSuccess: () => { setShowPaymentForm(false); invalidate(); } } });
  const createReview = useCreateReview({ mutation: { onSuccess: () => { setShowReviewForm(false); invalidate(); } } });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Job not found</p>
        <button onClick={() => navigate("/jobs")} className="text-primary mt-2 hover:underline text-sm">Back to jobs</button>
      </div>
    );
  }

  const isCustomer = user?.role === "customer" && job.customerId === user?.id;
  const isProfessional = user?.role === "professional";
  const hasSubmittedQuote = job.quotes?.some((q: any) => q.professionalId === user?.id);

  function handleSelectQuote(quoteId: number) {
    selectQuote.mutate({ id: jobId, data: { quoteId } });
  }

  function handleCompleteJob() {
    completeJob.mutate({ id: jobId });
  }

  function handleSubmitQuote(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    createQuote.mutate({
      data: { jobId, price: parseFloat(quotePrice), timeline: quoteTimeline, message: quoteMessage || undefined }
    });
  }

  function handleCreatePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!job.quotes) return;
    const selectedQ = job.quotes.find((q: any) => q.professionalId === job.selectedProfessionalId);
    const amount = selectedQ ? selectedQ.price : 0;
    createPayment.mutate({ data: { jobId, amount, method: paymentMethod } });
  }

  function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!job.selectedProfessionalId) return;
    createReview.mutate({ data: { jobId, professionalId: job.selectedProfessionalId, rating: reviewRating, comment: reviewComment || undefined } });
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/jobs")} className="text-muted-foreground hover:text-foreground">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-foreground line-clamp-1">{job.service}</h1>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{job.category}</span>
          <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", getStatusColor(job.status))}>
            {job.status.replace("_", " ")}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{job.description}</p>
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin size={12} /> {job.location}</span>
          <span className="flex items-center gap-1"><Clock size={12} /> {formatDate(job.createdAt)}</span>
          {job.timeline && <span>Timeline: {job.timeline}</span>}
        </div>
        {job.customerName && <p className="text-xs text-muted-foreground">Posted by: {job.customerName}</p>}
      </div>

      {job.quotes && job.quotes.length > 0 && (
        <div>
          <h2 className="font-bold text-foreground mb-3">Quotes ({job.quotes.length})</h2>
          <div className="space-y-3">
            {job.quotes.map((q: any) => {
              const isSelected = q.professionalId === job.selectedProfessionalId;
              return (
                <div key={q.id} className={cn("bg-card rounded-xl border p-4", isSelected ? "border-secondary" : "border-border")}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-sm">{q.professionalName || "Professional"}</span>
                        {q.professionalVerified && (
                          <span className="text-xs bg-secondary/10 text-secondary px-1.5 py-0.5 rounded-full">Verified</span>
                        )}
                        {isSelected && (
                          <span className="text-xs bg-secondary text-white px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle size={10} /> Selected
                          </span>
                        )}
                      </div>
                      {q.professionalRating && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star size={12} className="text-accent fill-accent" />
                          <span className="text-xs text-muted-foreground">{Number(q.professionalRating).toFixed(1)} · {q.professionalCompletedJobs} jobs</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-foreground">{formatCurrency(Number(q.price))}</div>
                      <div className="text-xs text-muted-foreground">{q.timeline}</div>
                    </div>
                  </div>
                  {q.message && <p className="text-sm text-muted-foreground mt-2 bg-muted/50 p-2 rounded-lg">{q.message}</p>}
                  {isCustomer && job.status === "open" && (
                    <button
                      onClick={() => handleSelectQuote(q.id)}
                      disabled={selectQuote.isPending}
                      className="mt-3 w-full bg-secondary text-white py-2 rounded-lg text-sm font-semibold hover:bg-secondary/90 transition-colors disabled:opacity-50"
                    >
                      {selectQuote.isPending ? "Selecting..." : "Accept This Quote"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isCustomer && job.status === "in_progress" && !job.payment && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={18} className="text-accent" />
            <h2 className="font-bold text-foreground">Make Payment</h2>
          </div>
          {!showPaymentForm ? (
            <button onClick={() => setShowPaymentForm(true)} className="w-full bg-accent text-primary py-2.5 rounded-xl text-sm font-semibold hover:bg-accent/90">
              Create Payment Record
            </button>
          ) : (
            <form onSubmit={handleCreatePayment} className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as any)}
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="ecocash">EcoCash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="paynow">Paynow</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowPaymentForm(false)} className="flex-1 border border-border py-2 rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={createPayment.isPending} className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
                  {createPayment.isPending ? "..." : "Create"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {job.payment && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="font-bold text-foreground mb-3">Payment</h2>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground capitalize">{job.payment.method?.replace("_", " ")}</p>
              <p className="font-bold text-foreground">{formatCurrency(Number(job.payment.amount))}</p>
            </div>
            <span className={cn("text-xs font-medium px-2 py-1 rounded-full", getStatusColor(job.payment.status))}>
              {job.payment.status}
            </span>
          </div>
        </div>
      )}

      {isCustomer && job.status === "in_progress" && (
        <button
          onClick={handleCompleteJob}
          disabled={completeJob.isPending}
          className="w-full bg-secondary text-white py-3 rounded-xl font-semibold hover:bg-secondary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <CheckCircle size={18} />
          {completeJob.isPending ? "Completing..." : "Approve Completion"}
        </button>
      )}

      {isCustomer && job.status === "completed" && !job.review && job.selectedProfessionalId && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="font-bold text-foreground mb-3">Leave a Review</h2>
          {!showReviewForm ? (
            <button onClick={() => setShowReviewForm(true)} className="w-full bg-primary text-white py-2.5 rounded-xl text-sm font-semibold">
              Rate this Professional
            </button>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} type="button" onClick={() => setReviewRating(n)}>
                      <Star size={28} className={n <= reviewRating ? "text-accent fill-accent" : "text-muted-foreground"} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Comment (optional)</label>
                <textarea
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="Share your experience..."
                  rows={3}
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowReviewForm(false)} className="flex-1 border border-border py-2 rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={createReview.isPending} className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-semibold">
                  {createReview.isPending ? "..." : "Submit Review"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {job.review && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="font-bold text-foreground mb-2">Review</h2>
          <div className="flex items-center gap-2 mb-1">
            {[1,2,3,4,5].map(n => (
              <Star key={n} size={16} className={n <= job.review.rating ? "text-accent fill-accent" : "text-muted-foreground"} />
            ))}
            <span className="text-sm text-muted-foreground">by {job.review.customerName || "Customer"}</span>
          </div>
          {job.review.comment && <p className="text-sm text-muted-foreground">{job.review.comment}</p>}
        </div>
      )}

      {isProfessional && job.status === "open" && !hasSubmittedQuote && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="font-bold text-foreground mb-3">Submit a Quote</h2>
          {!showQuoteForm ? (
            <button onClick={() => setShowQuoteForm(true)} className="w-full bg-primary text-white py-2.5 rounded-xl text-sm font-semibold">
              Submit Quote
            </button>
          ) : (
            <form onSubmit={handleSubmitQuote} className="space-y-3">
              {formError && (
                <div className="flex items-center gap-2 bg-destructive/10 text-destructive px-3 py-2 rounded-lg text-sm">
                  <AlertCircle size={14} /> {formError}
                </div>
              )}
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Price (USD) *</label>
                <input
                  type="number"
                  value={quotePrice}
                  onChange={e => setQuotePrice(e.target.value)}
                  placeholder="500"
                  required
                  min="0"
                  step="0.01"
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Timeline *</label>
                <input
                  type="text"
                  value={quoteTimeline}
                  onChange={e => setQuoteTimeline(e.target.value)}
                  placeholder="e.g. 3 days, 1 week"
                  required
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Message (optional)</label>
                <textarea
                  value={quoteMessage}
                  onChange={e => setQuoteMessage(e.target.value)}
                  placeholder="Describe your approach, experience, etc."
                  rows={3}
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowQuoteForm(false)} className="flex-1 border border-border py-2 rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={createQuote.isPending} className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-semibold">
                  {createQuote.isPending ? "Submitting..." : "Submit Quote"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {isProfessional && hasSubmittedQuote && (
        <div className="bg-secondary/10 border border-secondary/30 text-secondary rounded-xl p-3 text-sm text-center font-medium flex items-center justify-center gap-2">
          <CheckCircle size={16} />
          You've submitted a quote for this job
        </div>
      )}
    </div>
  );
}
