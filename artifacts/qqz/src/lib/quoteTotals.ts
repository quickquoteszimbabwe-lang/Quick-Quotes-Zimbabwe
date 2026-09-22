export type QuoteItemLike = { quantity?: number | string | null; unitPrice?: number | string | null };
export type QuoteExtraLike = { amount?: number | string | null };
export type QuoteMilestoneLike = { amount?: number | string | null };

function amount(value: number | string | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function cents(value: number) {
  return Math.round(value * 100) / 100;
}

export function calculateQuoteTotals({
  items = [],
  extras = [],
  discount = 0,
  milestones = [],
}: {
  items?: QuoteItemLike[] | null;
  extras?: QuoteExtraLike[] | null;
  discount?: number | string | null;
  milestones?: QuoteMilestoneLike[] | null;
}) {
  const safeItems = items ?? [];
  const safeExtras = extras ?? [];
  const safeMilestones = milestones ?? [];
  const itemsTotal = cents(safeItems.reduce((sum, item) => sum + amount(item.quantity) * amount(item.unitPrice), 0));
  const extrasTotal = cents(safeExtras.reduce((sum, extra) => sum + amount(extra.amount), 0));
  const subtotal = cents(itemsTotal + extrasTotal);
  const discountAmount = cents(Math.min(subtotal, Math.max(0, amount(discount))));
  const total = cents(Math.max(0, subtotal - discountAmount));
  const milestoneTotal = cents(safeMilestones.reduce((sum, milestone) => sum + amount(milestone.amount), 0));

  return {
    itemsTotal,
    extrasTotal,
    subtotal,
    discountAmount,
    total,
    milestoneTotal,
    milestonesMatch: safeMilestones.length === 0 || Math.abs(milestoneTotal - total) < 0.01,
  };
}