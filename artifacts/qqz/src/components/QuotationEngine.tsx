/**
 * QuotationEngine — Universal pricing & quotation component for QQZ.
 *
 * mode="create" → Provider builds a new offer (full interactive form)
 * mode="view"   → Invoice-style display of a submitted offer
 */

import { useState } from "react";
import {
  Plus, Trash2, AlertCircle, CheckCircle,
  Star, User as UserIcon, ChevronDown, ChevronUp,
  Milestone, Tag, StickyNote, Percent, Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { PRICING_MODELS, getPricingModel } from "@/lib/pricingModels";

// ─────────────────────────────────────────────────────────────────────────────
// Shared types
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

export interface MilestoneItem {
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
  milestones: MilestoneItem[];
  notes: string;
  timeline: string;
  message: string;
}

// Helpers
const emptyItem = (unit = ""): LineItem => ({ description: "", quantity: "1", unit, unitPrice: "" });
const emptyExtra = (): Extra => ({ description: "", amount: "" });
const emptyMilestone = (): MilestoneItem => ({ title: "", description: "", amount: "" });

function safeNum(s: string) {
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

// Small labelled text input
function Field({
  label, value, onChange, placeholder, type = "text", inputMode, required,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground/50"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE mode
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
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [notes, setNotes] = useState("");
  const [timeline, setTimeline] = useState("");
  const [message, setMessage] = useState("");
  const [showMilestones, setShowMilestones] = useState(false);
  const [showExtras, setShowExtras] = useState(false);
  const [formError, setFormError] = useState("");

  const model = getPricingModel(pricingModel);

  // Live totals
  const itemsTotal = items.reduce((s, it) => s + safeNum(it.quantity) * safeNum(it.unitPrice), 0);
  const extrasTotal = extras.reduce((s, e) => s + safeNum(e.amount), 0);
  const subtotal = itemsTotal + extrasTotal;
  const discountAmt = Math.min(subtotal, safeNum(discount));
  const total = Math.max(0, subtotal - discountAmt);

  function updateItem(idx: number, field: keyof LineItem, value: string) {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  }
  function addItem() {
    setItems((prev) => [...prev, emptyItem(model.unit)]);
  }
  function removeItem(idx: number) {
    setItems((prev) => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);
  }

  function updateExtra(idx: number, field: keyof Extra, value: string) {
    setExtras((prev) => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e));
  }

  function updateMilestone(idx: number, field: keyof MilestoneItem, value: string) {
    setMilestones((prev) => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const validItems = items.filter((it) => it.description.trim() && safeNum(it.unitPrice) > 0);
    if (validItems.length === 0) {
      setFormError("Add at least one line item with a description and rate.");
      return;
    }
    if (!timeline.trim()) {
      setFormError("Timeline is required.");
      return;
    }
    if (total <= 0) {
      setFormError("Total must be greater than zero.");
      return;
    }
    onSubmit({ pricingModel, items, extras, discount, depositRequired, depositAmount, milestones, notes, timeline, message });
  }

  const displayErr = error || formError;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {displayErr && (
        <div className="flex items-start gap-2 bg-destructive/10 text-destructive px-3 py-2.5 rounded-xl text-sm">
          <AlertCircle size={15} className="shrink-0 mt-0.5" /> {displayErr}
        </div>
      )}

      {/* ── Pricing Model ── */}
      <div className="space-y-1.5">
        <label className="text-sm font-bold text-foreground">Pricing Model</label>
        <select
          value={pricingModel}
          onChange={(e) => {
            const m = getPricingModel(e.target.value);
            setPricingModel(e.target.value);
            setItems((prev) => prev.map((it) => ({ ...it, unit: m.unit })));
          }}
          className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          {PRICING_MODELS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground pl-1">{model.description}</p>
      </div>

      {/* ── Line Items ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-foreground">
            Line Items <span className="text-muted-foreground font-normal">(unlimited)</span>
          </label>
          <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            Subtotal: {formatCurrency(itemsTotal)}
          </span>
        </div>

        <div className="space-y-2">
          {items.map((item, idx) => {
            const rowTotal = safeNum(item.quantity) * safeNum(item.unitPrice);
            return (
              <div key={idx} className="bg-muted/40 rounded-xl p-3 space-y-2 border border-border/50">
                {/* Description row */}
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(idx, "description", e.target.value)}
                      placeholder={`Line item ${idx + 1} — e.g. Labour, Materials, Transport`}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground/50"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    disabled={items.length === 1}
                    className="mt-0.5 p-1.5 text-muted-foreground hover:text-destructive disabled:opacity-25 rounded-lg hover:bg-destructive/10 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Qty / Unit / Rate / Total */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide block">Qty</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                      placeholder="1"
                      className="w-full border border-border rounded-lg px-2 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide block">Unit</span>
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) => updateItem(idx, "unit", e.target.value)}
                      placeholder={model.unit || "unit"}
                      className="w-full border border-border rounded-lg px-2 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide block">Rate (USD)</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
                      placeholder="0.00"
                      className="w-full border border-border rounded-lg px-2 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-right"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide block">Total</span>
                    <div className="border border-border/40 rounded-lg px-2 py-2 text-sm bg-background/50 text-right font-semibold text-foreground">
                      {rowTotal > 0 ? formatCurrency(rowTotal) : "—"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={addItem}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl py-2.5 text-sm font-semibold text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all"
        >
          <Plus size={16} /> Add line item
        </button>
      </div>

      {/* ── Optional Extras ── */}
      <button
        type="button"
        onClick={() => setShowExtras((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
      >
        <span className="flex items-center gap-2">
          <Tag size={14} />
          Optional Extras
          {extras.length > 0 && (
            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">
              {extras.length} · {formatCurrency(extrasTotal)}
            </span>
          )}
        </span>
        {showExtras ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {showExtras && (
        <div className="space-y-2 -mt-2">
          {extras.map((e, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-muted/40 rounded-xl p-3 border border-border/50">
              <input
                type="text"
                value={e.description}
                onChange={(ev) => updateExtra(idx, "description", ev.target.value)}
                placeholder="Extra — e.g. Permit fees, Delivery charge"
                className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={e.amount}
                onChange={(ev) => updateExtra(idx, "amount", ev.target.value)}
                placeholder="0.00"
                className="w-24 border border-border rounded-lg px-2 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-right"
              />
              <button
                type="button"
                onClick={() => setExtras((prev) => prev.filter((_, i) => i !== idx))}
                className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setExtras((prev) => [...prev, emptyExtra()])}
            className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline pl-1"
          >
            <Plus size={14} /> Add extra
          </button>
        </div>
      )}

      {/* ── Discount & Deposit ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Percent size={13} /> Discount (USD)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            placeholder="0.00"
            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Wallet size={13} /> Deposit
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDepositRequired((v) => !v)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none",
                depositRequired ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                  depositRequired ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
            {depositRequired && (
              <input
                type="number"
                min="0"
                step="0.01"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="Amount"
                className="flex-1 border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            )}
            {!depositRequired && (
              <span className="text-xs text-muted-foreground">off</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Milestones ── */}
      <button
        type="button"
        onClick={() => setShowMilestones((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
      >
        <span className="flex items-center gap-2">
          <Milestone size={14} />
          Milestone Payments
          {milestones.length > 0 && (
            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">
              {milestones.length}
            </span>
          )}
        </span>
        {showMilestones ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {showMilestones && (
        <div className="space-y-2 -mt-2">
          {milestones.map((m, idx) => (
            <div key={idx} className="bg-muted/40 rounded-xl p-3 border border-border/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary uppercase tracking-wide">
                  Milestone {idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => setMilestones((prev) => prev.filter((_, i) => i !== idx))}
                  className="p-1 text-muted-foreground hover:text-destructive rounded"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={m.title}
                  onChange={(e) => updateMilestone(idx, "title", e.target.value)}
                  placeholder="e.g. Deposit, Foundation, Completion"
                  className="col-span-2 border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <input
                  type="text"
                  value={m.description}
                  onChange={(e) => updateMilestone(idx, "description", e.target.value)}
                  placeholder="What work is done"
                  className="border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={m.amount}
                  onChange={(e) => updateMilestone(idx, "amount", e.target.value)}
                  placeholder="Amount USD"
                  className="border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-right"
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setMilestones((prev) => [...prev, emptyMilestone()])}
            className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline pl-1"
          >
            <Plus size={14} /> Add milestone
          </button>
        </div>
      )}

      {/* ── Notes ── */}
      <div className="space-y-1.5">
        <label className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <StickyNote size={13} /> Notes
          <span className="font-normal text-muted-foreground text-xs">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Terms, assumptions, materials included/excluded, warranty, validity…"
          rows={2}
          className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
        />
      </div>

      {/* ── Live Total Summary ── */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-2">
        {extrasTotal > 0 && (
          <>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Items</span><span>{formatCurrency(itemsTotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Extras</span><span>{formatCurrency(extrasTotal)}</span>
            </div>
          </>
        )}
        {discountAmt > 0 && (
          <div className="flex justify-between text-sm text-green-600 font-medium">
            <span>Discount</span><span>− {formatCurrency(discountAmt)}</span>
          </div>
        )}
        <div className="flex justify-between items-center border-t border-primary/20 pt-2">
          <span className="font-bold text-foreground text-base">Estimated Total</span>
          <span className={cn("text-2xl font-bold", total > 0 ? "text-primary" : "text-muted-foreground")}>
            {total > 0 ? formatCurrency(total) : "USD $0.00"}
          </span>
        </div>
        {depositRequired && safeNum(depositAmount) > 0 && (
          <div className="flex justify-between text-sm text-amber-700 font-medium bg-amber-50 rounded-lg px-3 py-1.5">
            <span>Deposit Required Upfront</span>
            <span>{formatCurrency(safeNum(depositAmount))}</span>
          </div>
        )}
      </div>

      {/* ── Timeline & Message ── */}
      <div className="space-y-3">
        <Field
          label="Timeline *"
          value={timeline}
          onChange={setTimeline}
          placeholder="e.g. 3 days, 1–2 weeks, 1 month"
          required
        />
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-foreground">
            Cover Message <span className="text-muted-foreground font-normal text-xs">(optional)</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Introduce yourself, describe your approach and why you're the right fit…"
            rows={3}
            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-border py-3 rounded-xl text-sm font-semibold hover:bg-muted/60 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || total <= 0}
          className="flex-1 bg-primary text-white py-3 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting
            ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</>
            : `Submit Offer · ${total > 0 ? formatCurrency(total) : "—"}`}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VIEW mode — invoice layout
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
    (s: number, it: any) => s + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0
  );
  const extrasTotal = (quote.extras ?? []).reduce(
    (s: number, e: any) => s + (Number(e.amount) || 0), 0
  );
  const subtotal = itemsTotal + extrasTotal;
  const discountAmt = Math.min(subtotal, Number(quote.discount) || 0);
  const total = Math.max(0, subtotal - discountAmt);

  return (
    <div className={cn(
      "bg-card rounded-2xl border p-5 space-y-4 shadow-sm",
      isSelected ? "border-secondary ring-1 ring-secondary/20" : "border-border"
    )}>
      {/* Provider header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {quote.professionalPhotoUrl ? (
            <img src={quote.professionalPhotoUrl} alt={quote.professionalName ?? "Provider"}
              className="w-11 h-11 rounded-full object-cover border border-border shrink-0" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <UserIcon size={18} className="text-primary" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-foreground">{quote.professionalName ?? "Provider"}</span>
              {quote.professionalVerified && (
                <span className="text-xs bg-secondary/10 text-secondary border border-secondary/20 px-1.5 py-0.5 rounded-full font-semibold">
                  Verified
                </span>
              )}
              {isSelected && (
                <span className="text-xs bg-secondary text-white px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <CheckCircle size={10} /> Selected
                </span>
              )}
            </div>
            {quote.professionalRating && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <Star size={11} className="text-accent fill-accent" />
                <span className="text-xs text-muted-foreground">
                  {Number(quote.professionalRating).toFixed(1)} · {quote.professionalCompletedJobs} completed
                </span>
                {quote.professionalExperience && (
                  <span className="text-xs text-muted-foreground">· {quote.professionalExperience}</span>
                )}
              </div>
            )}
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
      {(quote.items ?? []).length > 0 && (
        <div className="rounded-xl overflow-hidden border border-border">
          <div className="grid bg-muted/60 text-muted-foreground text-[11px] font-bold uppercase tracking-wide px-3 py-2"
            style={{ gridTemplateColumns: "1fr 48px 48px 80px 80px" }}>
            <span>Description</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Unit</span>
            <span className="text-right">Rate</span>
            <span className="text-right">Total</span>
          </div>
          {(quote.items ?? []).map((it: any, idx: number) => (
            <div key={idx} className="grid border-t border-border/40 px-3 py-2 text-sm"
              style={{ gridTemplateColumns: "1fr 48px 48px 80px 80px" }}>
              <span className="text-foreground">{it.description}</span>
              <span className="text-right text-muted-foreground">{it.quantity}</span>
              <span className="text-right text-muted-foreground">{it.unit || "—"}</span>
              <span className="text-right text-muted-foreground">{formatCurrency(Number(it.unitPrice))}</span>
              <span className="text-right font-semibold text-foreground">
                {formatCurrency(Number(it.quantity) * Number(it.unitPrice))}
              </span>
            </div>
          ))}
          {/* Totals */}
          <div className="border-t border-border bg-muted/30 px-3 py-2 space-y-1">
            {(quote.extras ?? []).length > 0 && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Items subtotal</span><span>{formatCurrency(itemsTotal)}</span>
              </div>
            )}
            {(quote.extras ?? []).map((e: any, idx: number) => (
              <div key={idx} className="flex justify-between text-xs text-muted-foreground">
                <span>{e.description}</span><span>{formatCurrency(Number(e.amount))}</span>
              </div>
            ))}
            {discountAmt > 0 && (
              <div className="flex justify-between text-xs text-green-700 font-medium">
                <span>Discount</span><span>− {formatCurrency(discountAmt)}</span>
              </div>
            )}
            <div className="flex justify-between items-center border-t border-border/60 pt-1.5">
              <span className="font-bold text-foreground text-sm">Total</span>
              <span className="font-bold text-primary text-base">{formatCurrency(total)}</span>
            </div>
            {quote.depositRequired && Number(quote.depositAmount) > 0 && (
              <div className="flex justify-between text-xs text-amber-700 font-semibold bg-amber-50 rounded-lg px-2 py-1">
                <span>Deposit Required</span>
                <span>{formatCurrency(Number(quote.depositAmount))}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Milestones */}
      {(quote.milestones ?? []).length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Payment Milestones</p>
          {(quote.milestones ?? []).map((m: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between bg-muted/40 rounded-xl px-3 py-2.5">
              <div>
                <p className="text-sm font-bold text-foreground">{idx + 1}. {m.title}</p>
                {m.description && <p className="text-xs text-muted-foreground">{m.description}</p>}
              </div>
              <span className="text-sm font-bold text-primary shrink-0 ml-3">{formatCurrency(Number(m.amount))}</span>
            </div>
          ))}
        </div>
      )}

      {/* Message */}
      {quote.message && (
        <div className="bg-muted/40 rounded-xl p-3">
          <p className="text-xs font-bold text-muted-foreground mb-1">Provider Message</p>
          <p className="text-sm text-foreground leading-relaxed">{quote.message}</p>
        </div>
      )}

      {/* Notes */}
      {quote.notes && (
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 leading-relaxed">
          <span className="font-bold">Notes: </span>{quote.notes}
        </div>
      )}

      {/* Accept button */}
      {canAccept && (
        <button
          onClick={onAccept}
          disabled={isAccepting}
          className="w-full bg-secondary text-white py-3 rounded-xl text-sm font-bold hover:bg-secondary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <CheckCircle size={15} />
          {isAccepting ? "Accepting…" : "Accept This Offer"}
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Exported wrapper
// ─────────────────────────────────────────────────────────────────────────────

type QuotationEngineProps = CreateModeProps | ViewModeProps;

export function QuotationEngine(props: QuotationEngineProps) {
  return props.mode === "create" ? <CreateMode {...props} /> : <ViewMode {...props} />;
}
