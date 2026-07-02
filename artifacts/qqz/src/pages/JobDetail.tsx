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
import { MapPin, Clock, ChevronLeft, Star, CheckCircle, AlertCircle, DollarSign, Plus, Trash2, User as UserIcon } from "lucide-react";
import { formatDate, formatCurrency, getStatusColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface QuoteLineItem {
  description: string;
  quantity: string;
  unitPrice: string;
}

const emptyItem = (): QuoteLineItem => ({ description: "", quantity: "1", unitPrice: "" });

export default function JobDetail() {
  const params = useParams<{ id: string }>();
  const jobId = parseInt(params.id || "0");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: job, isLoading, error } = useGetJob(jobId);

  const [quoteItems, setQuoteItems] = useState<QuoteLineItem[]>([emptyItem()]);
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

  const quoteTotal = quoteItems.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  function updateQuoteItem(index: number, field: keyof QuoteLineItem, value: string) {
    setQuoteItems(prev => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  function addQuoteItem() {
    setQuoteItems(prev => [...prev, emptyItem()]);
  }

  function removeQuoteItem(index: number) {
    setQuoteItems(prev => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  function handleSubmitQuote(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const items = quoteItems
      .filter(item => item.description.trim() !== "")
      .map(item => ({
        description: item.description,
        quantity: parseFloat(item.quantity) || 0,
        unitPrice: parseFloat(item.unitPrice) || 0,
      }));
    if (items.length === 0) {
      setFormError("Add at least one line item");
      return;
    }
    createQuote.mutate({
      data: { jobId, price: quoteTotal, timeline: quoteTimeline, message: quoteMessage || undefined, items }
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
                    <div className="flex items-center gap-2.5">
                      {q.professionalPhotoUrl ? (
                        <img src={q.professionalPhotoUrl} alt={q.professionalName || "Professional"} className="w-10 h-10 rounded-full object-cover border border-border shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <UserIcon size={18} className="text-primary" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
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
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          {q.professionalRating && (
                            <div className="flex items-center gap-1">
                              <Star size={12} className="text-accent fill-accent" />
                              <span className="text-xs text-muted-foreground">{Number(q.professionalRating).toFixed(1)} · {q.professionalCompletedJobs} jobs</span>
                            </div>
                          )}
                          {q.professionalExperience && (
                            <span className="text-xs text-muted-foreground">· {q.professionalExperience} exp.</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-foreground">{formatCurrency(Number(q.price))}</div>
                      <div className="text-xs text-muted-foreground">{q.timeline}</div>
                    </div>
                  </div>
                  {q.items && q.items.length > 0 && (
                    <div className="mt-2 bg-muted/50 rounded-lg overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-muted-foreground border-b border-border/60">
                            <th className="text-left font-medium px-2 py-1.5">Description</th>
                            <th className="text-right font-medium px-2 py-1.5">Qty</th>
                            <th className="text-right font-medium px-2 py-1.5">Unit Price</th>
                            <th className="text-right font-medium px-2 py-1.5">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {q.items.map((item: any, idx: number) => (
                            <tr key={idx} className="border-b border-border/40 last:border-0">
                              <td className="px-2 py-1.5 text-foreground">{item.description}</td>
                              <td className="px-2 py-1.5 text-right text-muted-foreground">{item.quantity}</td>
                              <td className="px-2 py-1.5 text-right text-muted-foreground">{formatCurrency(Number(item.unitPrice))}</td>
                              <td className="px-2 py-1.5 text-right text-foreground font-medium">{formatCurrency(Number(item.quantity) * Number(item.unitPrice))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
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
                <label className="text-sm font-medium text-foreground">Quotation Items *</label>
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-[1fr_56px_84px_28px] gap-1 bg-muted/60 px-2 py-1.5 text-[11px] font-medium text-muted-foreground">
                    <span>Description</span>
                    <span className="text-right">Qty</span>
                    <span className="text-right">Unit Price</span>
                    <span></span>
                  </div>
                  <div className="divide-y divide-border">
                    {quoteItems.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_56px_84px_28px] gap-1 px-2 py-1.5 items-center">
                        <input
                          type="text"
                          value={item.description}
                          onChange={e => updateQuoteItem(idx, "description", e.target.value)}
                          placeholder="e.g. Cement (5 bags)"
                          className="w-full border-none bg-transparent text-sm focus:outline-none px-1 py-1"
                        />
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={e => updateQuoteItem(idx, "quantity", e.target.value)}
                          min="0"
                          step="1"
                          className="w-full border border-border rounded px-1 py-1 text-sm text-right bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
                        />
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={e => updateQuoteItem(idx, "unitPrice", e.target.value)}
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          className="w-full border border-border rounded px-1 py-1 text-sm text-right bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
                        />
                        <button
                          type="button"
                          onClick={() => removeQuoteItem(idx)}
                          disabled={quoteItems.length === 1}
                          className="text-muted-foreground hover:text-destructive disabled:opacity-30 flex justify-center"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addQuoteItem}
                  className="flex items-center gap-1 text-xs font-medium text-primary mt-1"
                >
                  <Plus size={13} /> Add line item
                </button>
              </div>

              <div className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2.5">
                <span className="text-sm font-semibold text-foreground">Total</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(quoteTotal)}</span>
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
                <button type="submit" disabled={createQuote.isPending || quoteTotal <= 0} className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
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
