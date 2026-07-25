/**
 * QuotationEngine — Universal pricing & quotation component for QQZ.
 * Supports every category, transaction type, and pricing model without
 * modification. Providers choose the pricing model; the engine adapts.
 */

import { useState } from "react";
import {
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  Star,
  User as UserIcon,
  ChevronDown,
  ChevronUp,
  Milestone,
  Tag,
  StickyNote,
  Percent,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { PRICING_MODELS, getPricingModel } from "@/lib/pricingModels";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface LineItem {
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
}

export interface Extra {
  description: string;
  amount: string;
}

export interface Milestone {
  title: string;
  description: string;
  amount: string;
}

export interface QuoteFormData {
  pricingModel: string;
  items: LineItem[];
  extras: Extra[];
  discount: string;
  depositRequired: boolean;
  depositAmount: string;
  milestones: Milestone[];
  notes: string;
  timeline: string;
  message: string;
}

const emptyItem = (): LineItem => ({ description: "", quantity: "1", unit: "", unitPrice: "" });
const emptyExtra = (): Extra => ({ description: "", amount: "" });
const emptyMilestone = (): Milestone => ({ title: "", description: "", amount: "" });

// ─────────────────────────────────────────────────────────────────────────────
// Create Mode
// ─────────────────────────────────────────────────────────────────────────────

interface CreateModeProps {
  mode: "create";
  onSubmit: (data: QuoteFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  error?: string;
}

function CreateMode({ onSubmit, onCancel, isSubmitting, error }: CreateModeProps) {
  const [pricingModel, setPricingModel] = useState("fixed_price");
  const [items, setItems] = useState<LineItem[]>([emptyItem()]);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [discount, setDiscount] = useState("");
  const [depositRequired, setDepositRequired] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [notes, setNotes] = useState("");
  const [timeline, setTimeline] = useState("");
  const [message, setMessage] = useState("");
  const [showMilestones, setShowMilestones] = useState(false);
  const [showExtras, setShowExtras] = useState(false);
  const [formError, setFormError] = useState("");

  const model = getPricingModel(pricingModel);

  const itemsTotal = items.reduce((sum, item) => {
    return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
  }, 0);

  const extrasTotal = extras.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const subtotal = itemsTotal + extrasTotal;
  const discountAmt = Math.min(subtotal, parseFloat(discount) || 0);
  const total = Math.max(0, subtotal - discountAmt);

  function updateItem(idx: number, field: keyof LineItem, value: string) {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  }

  function updateExtra(idx: number, field: keyof Extra, value: string) {
    setExtras((prev) => prev.map((e, i) => (i === idx ? { ...e, [field]: value } : e)));
  }

  function updateMilestone(idx: number, field: keyof Milestone, value: string) {
    setMilestones((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const validItems = items.filter((item) => item.description.trim() !== "");
    if (validItems.length === 0) {
      setFormError("Add at least one line item with a description.");
      return;
    }
    if (!timeline.trim()) {
      setFormError("Timeline is required.");
      return;
    }
    onSubmit({
      pricingModel,
      items,
      extras,
      discount,
      depositRequired,
      depositAmount,
      milestones,
      notes,
      timeline,
      message,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {(error || formError) && (
        <div className="flex items-center gap-2 bg-destructive/10 text-destructive px-3 py-2 rounded-lg text-sm">
          <AlertCircle size={14} /> {error || formError}
        </div>
      )}

      {/* Pricing Model */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-foreground">Pricing Model *</label>
        <select
          value={pricingModel}
          onChange={(e) => {
            const m = getPricingModel(e.target.value);
            setPricingModel(e.target.value);
            // Auto-fill unit in all items
            setItems((prev) => prev.map((item) => ({ ...item, unit: m.unit })));
          }}
          className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {PRICING_MODELS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">{model.description}</p>
      </div>

      {/* Line Items */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">
          Line Items *
          <span className="text-muted-foreground font-normal ml-1">(unlimited)</span>
        </label>
        <div className="border border-border rounded-xl overflow-hidden">
          {/* Header */}
          <div
            className="grid gap-1 bg-muted/70 px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide"
            style={{ gridTemplateColumns: "1fr 60px 60px 90px 28px" }}
          >
            <span>Description</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Unit</span>
            <span className="text-right">Rate (USD)</span>
            <span />
          </div>
          <div className="divide-y divide-border">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="grid gap-1 px-2 py-2 items-center"
                style={{ gridTemplateColumns: "1fr 60px 60px 90px 28px" }}
              >
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateItem(idx, "description", e.target.value)}
                  placeholder="e.g. Labour, Materials, Transport"
                  className="border-none bg-transparent text-sm focus:outline-none px-1 py-1 placeholder:text-muted-foreground/50"
                />
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                  min="0"
                  step="any"
                  className="w-full border border-border/60 rounded px-1.5 py-1 text-sm text-right bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <input
                  type="text"
                  value={item.unit}
                  onChange={(e) => updateItem(idx, "unit", e.target.value)}
                  placeholder={model.unit || "unit"}
                  className="w-full border border-border/60 rounded px-1.5 py-1 text-sm text-right bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <input
                  type="number"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full border border-border/60 rounded px-1.5 py-1 text-sm text-right bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={() =>
                    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev))
                  }
                  disabled={items.length === 1}
                  className="text-muted-foreground hover:text-destructive disabled:opacity-30 flex justify-center"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
          {/* Row totals footer */}
          <div className="bg-muted/30 border-t border-border px-3 py-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setItems((prev) => [...prev, { ...emptyItem(), unit: model.unit }])}
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <Plus size={13} /> Add line item
            </button>
            <span className="text-xs font-semibold text-foreground">
              Items subtotal: {formatCurrency(itemsTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Extras toggle */}
      <button
        type="button"
        onClick={() => setShowExtras((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
      >
        <span className="flex items-center gap-2">
          <Tag size={14} /> Optional Extras
          {extras.length > 0 && (
            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
              {extras.length}
            </span>
          )}
        </span>
        {showExtras ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>

      {showExtras && (
        <div className="border border-border rounded-xl overflow-hidden -mt-2">
          <div className="grid grid-cols-[1fr_100px_28px] gap-1 bg-muted/70 px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            <span>Description</span>
            <span className="text-right">Amount (USD)</span>
            <span />
          </div>
          <div className="divide-y divide-border">
            {extras.map((e, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_100px_28px] gap-1 px-2 py-2 items-center">
                <input
                  type="text"
                  value={e.description}
                  onChange={(ev) => updateExtra(idx, "description", ev.target.value)}
                  placeholder="e.g. Permit fees, Delivery"
                  className="border-none bg-transparent text-sm focus:outline-none px-1 py-1"
                />
                <input
                  type="number"
                  value={e.amount}
                  onChange={(ev) => updateExtra(idx, "amount", ev.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full border border-border/60 rounded px-1.5 py-1 text-sm text-right bg-background focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setExtras((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-muted-foreground hover:text-destructive flex justify-center"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
          <div className="bg-muted/30 border-t border-border px-3 py-2">
            <button
              type="button"
              onClick={() => setExtras((prev) => [...prev, emptyExtra()])}
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <Plus size={13} /> Add extra
            </button>
          </div>
        </div>
      )}

      {/* Discount */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Percent size={13} /> Discount (USD)
          </label>
          <input
            type="number"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            min="0"
            step="0.01"
            placeholder="0.00"
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Wallet size={13} /> Deposit Required
          </label>
          <div className="flex items-center gap-3 pt-2.5">
            <button
              type="button"
              onClick={() => setDepositRequired((v) => !v)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                depositRequired ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                  depositRequired ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
            {depositRequired && (
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                min="0"
                step="0.01"
                placeholder="Deposit USD"
                className="flex-1 border border-border rounded-lg px-3 py-1.5 text-sm bg-background focus:outline-none"
              />
            )}
          </div>
        </div>
      </div>

      {/* Milestones toggle */}
      <button
        type="button"
        onClick={() => setShowMilestones((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
      >
        <span className="flex items-center gap-2">
          <Milestone size={14} /> Milestone Payments
          {milestones.length > 0 && (
            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
              {milestones.length}
            </span>
          )}
        </span>
        {showMilestones ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>

      {showMilestones && (
        <div className="space-y-2 -mt-2">
          {milestones.map((m, idx) => (
            <div key={idx} className="border border-border rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary uppercase tracking-wide">
                  Milestone {idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => setMilestones((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <input
                type="text"
                value={m.title}
                onChange={(e) => updateMilestone(idx, "title", e.target.value)}
                placeholder="e.g. Deposit, Foundation, Completion"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={m.description}
                  onChange={(e) => updateMilestone(idx, "description", e.target.value)}
                  placeholder="What work is done at this stage"
                  className="border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none"
                />
                <input
                  type="number"
                  value={m.amount}
                  onChange={(e) => updateMilestone(idx, "amount", e.target.value)}
                  placeholder="Amount USD"
                  min="0"
                  step="0.01"
                  className="border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none"
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setMilestones((prev) => [...prev, emptyMilestone()])}
            className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            <Plus size={14} /> Add milestone
          </button>
        </div>
      )}

      {/* Notes */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <StickyNote size={13} /> Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Terms, assumptions, materials included/excluded, warranty, validity period…"
          rows={2}
          className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
      </div>

      {/* Estimated Total Summary */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-1.5">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Items Subtotal</span>
          <span>{formatCurrency(itemsTotal)}</span>
        </div>
        {extrasTotal > 0 && (
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Extras</span>
            <span>{formatCurrency(extrasTotal)}</span>
          </div>
        )}
        {discountAmt > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount</span>
            <span>− {formatCurrency(discountAmt)}</span>
          </div>
        )}
        <div className="flex justify-between items-center pt-1.5 border-t border-primary/20">
          <span className="font-bold text-foreground">Estimated Total</span>
          <span className="text-xl font-bold text-primary">{formatCurrency(total)}</span>
        </div>
        {depositRequired && parseFloat(depositAmount) > 0 && (
          <div className="flex justify-between text-sm text-amber-600">
            <span>Deposit Required</span>
            <span>{formatCurrency(parseFloat(depositAmount) || 0)}</span>
          </div>
        )}
        {milestones.length > 0 && (
          <div className="text-xs text-muted-foreground pt-1">
            {milestones.length} milestone{milestones.length !== 1 ? "s" : ""} defined
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-foreground">Timeline *</label>
        <input
          type="text"
          value={timeline}
          onChange={(e) => setTimeline(e.target.value)}
          placeholder="e.g. 3 days, 1–2 weeks, 1 month"
          required
          className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Message */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-foreground">Cover Message (optional)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Introduce yourself, describe your approach and why you're the right fit…"
          rows={3}
          className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-border py-3 rounded-xl text-sm font-semibold hover:bg-muted/50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || total <= 0}
          className="flex-1 bg-primary text-white py-3 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? "Submitting…" : `Submit Offer — ${formatCurrency(total)}`}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// View Mode — Professional Invoice Layout
// ─────────────────────────────────────────────────────────────────────────────

interface ViewQuote {
  id: number;
  professionalId: number;
  price: number;
  timeline: string;
  message?: string | null;
  items: any[];
  pricingModel?: string | null;
  discount?: number | null;
  depositRequired?: boolean | null;
  depositAmount?: number | null;
  extras?: any[] | null;
  milestones?: any[] | null;
  notes?: string | null;
  createdAt: string;
  professionalName?: string | null;
  professionalRating?: number | null;
  professionalVerified?: boolean | null;
  professionalCompletedJobs?: number | null;
  professionalPhotoUrl?: string | null;
  professionalExperience?: string | null;
}

interface ViewModeProps {
  mode: "view";
  quote: ViewQuote;
  isSelected?: boolean;
  canAccept?: boolean;
  onAccept?: () => void;
  isAccepting?: boolean;
}

function ViewMode({ quote, isSelected, canAccept, onAccept, isAccepting }: ViewModeProps) {
  const model = getPricingModel(quote.pricingModel ?? "fixed_price");

  const itemsTotal = (quote.items ?? []).reduce(
    (sum: number, item: any) =>
      sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  );
  const extrasTotal = (quote.extras ?? []).reduce(
    (sum: number, e: any) => sum + (Number(e.amount) || 0),
    0
  );
  const subtotal = itemsTotal + extrasTotal;
  const discountAmt = Math.min(subtotal, Number(quote.discount) || 0);
  const total = Math.max(0, subtotal - discountAmt);

  return (
    <div
      className={cn(
        "bg-card rounded-2xl border p-5 space-y-4 shadow-sm",
        isSelected ? "border-secondary ring-1 ring-secondary/30" : "border-border"
      )}
    >
      {/* Provider header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {quote.professionalPhotoUrl ? (
            <img
              src={quote.professionalPhotoUrl}
              alt={quote.professionalName ?? "Provider"}
              className="w-12 h-12 rounded-full object-cover border border-border shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <UserIcon size={20} className="text-primary" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-foreground">
                {quote.professionalName ?? "Provider"}
              </span>
              {quote.professionalVerified && (
                <span className="text-xs bg-secondary/10 text-secondary border border-secondary/20 px-1.5 py-0.5 rounded-full font-medium">
                  Verified
                </span>
              )}
              {isSelected && (
                <span className="text-xs bg-secondary text-white px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <CheckCircle size={10} /> Selected
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap mt-0.5">
              {quote.professionalRating && (
                <div className="flex items-center gap-1">
                  <Star size={12} className="text-accent fill-accent" />
                  <span className="text-xs text-muted-foreground">
                    {Number(quote.professionalRating).toFixed(1)} ·{" "}
                    {quote.professionalCompletedJobs} completed
                  </span>
                </div>
              )}
              {quote.professionalExperience && (
                <span className="text-xs text-muted-foreground">
                  {quote.professionalExperience} exp.
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full mb-1 inline-block">
            {model.label}
          </div>
          <div className="text-xl font-bold text-foreground">{formatCurrency(Number(quote.price))}</div>
          <div className="text-xs text-muted-foreground">{quote.timeline}</div>
        </div>
      </div>

      {/* Invoice table */}
      {quote.items && quote.items.length > 0 && (
        <div className="rounded-xl overflow-hidden border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/60 text-muted-foreground border-b border-border">
                <th className="text-left font-semibold px-3 py-2">Description</th>
                <th className="text-right font-semibold px-2 py-2">Qty</th>
                <th className="text-right font-semibold px-2 py-2">Unit</th>
                <th className="text-right font-semibold px-2 py-2">Rate</th>
                <th className="text-right font-semibold px-3 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {quote.items.map((item: any, idx: number) => (
                <tr key={idx} className="border-b border-border/40 last:border-0">
                  <td className="px-3 py-2 text-foreground">{item.description}</td>
                  <td className="px-2 py-2 text-right text-muted-foreground">{item.quantity}</td>
                  <td className="px-2 py-2 text-right text-muted-foreground">{item.unit || "—"}</td>
                  <td className="px-2 py-2 text-right text-muted-foreground">
                    {formatCurrency(Number(item.unitPrice))}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-foreground">
                    {formatCurrency(Number(item.quantity) * Number(item.unitPrice))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals footer */}
          <div className="bg-muted/30 border-t border-border px-3 py-2 space-y-1">
            {extrasTotal > 0 && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Items subtotal</span>
                <span>{formatCurrency(itemsTotal)}</span>
              </div>
            )}
            {(quote.extras ?? []).map((e: any, idx: number) => (
              <div key={idx} className="flex justify-between text-xs text-muted-foreground">
                <span>{e.description}</span>
                <span>{formatCurrency(Number(e.amount))}</span>
              </div>
            ))}
            {discountAmt > 0 && (
              <div className="flex justify-between text-xs text-green-600">
                <span>Discount</span>
                <span>− {formatCurrency(discountAmt)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-1 border-t border-border/60">
              <span className="text-sm font-bold text-foreground">Total</span>
              <span className="text-base font-bold text-primary">{formatCurrency(total)}</span>
            </div>
            {quote.depositRequired && Number(quote.depositAmount) > 0 && (
              <div className="flex justify-between text-xs text-amber-600 font-medium">
                <span>Deposit Required</span>
                <span>{formatCurrency(Number(quote.depositAmount))}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Milestones */}
      {quote.milestones && quote.milestones.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
            Payment Milestones
          </p>
          <div className="space-y-1.5">
            {quote.milestones.map((m: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {idx + 1}. {m.title}
                  </p>
                  {m.description && (
                    <p className="text-xs text-muted-foreground">{m.description}</p>
                  )}
                </div>
                <span className="text-sm font-bold text-primary shrink-0 ml-2">
                  {formatCurrency(Number(m.amount))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message */}
      {quote.message && (
        <div className="bg-muted/40 rounded-xl p-3">
          <p className="text-xs font-semibold text-muted-foreground mb-1">Provider Message</p>
          <p className="text-sm text-foreground">{quote.message}</p>
        </div>
      )}

      {/* Notes */}
      {quote.notes && (
        <div className="text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg">
          <span className="font-semibold">Notes: </span>
          {quote.notes}
        </div>
      )}

      {/* Accept button */}
      {canAccept && (
        <button
          onClick={onAccept}
          disabled={isAccepting}
          className="w-full bg-secondary text-white py-3 rounded-xl text-sm font-bold hover:bg-secondary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <CheckCircle size={16} />
          {isAccepting ? "Accepting…" : "Accept This Offer"}
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Exported component
// ─────────────────────────────────────────────────────────────────────────────

type QuotationEngineProps = CreateModeProps | ViewModeProps;

export function QuotationEngine(props: QuotationEngineProps) {
  if (props.mode === "create") {
    return <CreateMode {...props} />;
  }
  return <ViewMode {...props} />;
}
