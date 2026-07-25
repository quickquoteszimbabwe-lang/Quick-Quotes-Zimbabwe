import { Link } from "wouter";
import { useGetMyQuotes } from "@workspace/api-client-react";
import { FileText, Clock, TrendingUp, CheckCircle } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { getPricingModel } from "@/lib/pricingModels";

export default function MyOffers() {
  const { data: offers, isLoading } = useGetMyQuotes();

  const totalValue = offers?.reduce((sum, o) => sum + Number(o.price), 0) ?? 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">My Offers</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Offers you've submitted on client requests
        </p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && (offers?.length ?? 0) === 0 && (
        <div className="text-center py-16">
          <FileText size={48} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground font-semibold">No offers submitted yet</p>
          <Link href="/requests" className="text-primary text-sm hover:underline mt-2 block">
            Browse open requests
          </Link>
        </div>
      )}

      {!isLoading && (offers?.length ?? 0) > 0 && (
        <>
          {/* Summary card */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={15} className="text-primary" />
                <span className="text-xs font-semibold text-muted-foreground">Total Offered</span>
              </div>
              <p className="text-xl font-bold text-primary">{formatCurrency(totalValue)}</p>
            </div>
            <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle size={15} className="text-secondary" />
                <span className="text-xs font-semibold text-muted-foreground">Offers Sent</span>
              </div>
              <p className="text-xl font-bold text-secondary">{offers?.length ?? 0}</p>
            </div>
          </div>

          <div className="space-y-3">
            {offers?.map((offer) => {
              const model = getPricingModel((offer as any).pricingModel ?? "fixed_price");
              const itemCount = offer.items?.length ?? 0;
              return (
                <Link key={offer.id} href={`/requests/${offer.jobId}`}>
                  <div className="bg-card rounded-2xl border border-border p-4 hover:shadow-md transition-all group hover:border-primary/30">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            Request #{offer.jobId}
                          </span>
                          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {model.label}
                          </span>
                          {itemCount > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {itemCount} line item{itemCount !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                        {offer.message && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {offer.message}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-lg font-bold text-foreground">
                          {formatCurrency(Number(offer.price))}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {offer.timeline}
                      </span>
                      <span>{formatDate(offer.createdAt)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
