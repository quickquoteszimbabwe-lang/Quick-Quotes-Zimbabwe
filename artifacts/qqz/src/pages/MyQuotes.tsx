import { Link } from "wouter";
import { useGetMyQuotes } from "@workspace/api-client-react";
import { FileText, DollarSign, Clock } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

export default function MyQuotes() {
  const { data: quotes, isLoading } = useGetMyQuotes();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-foreground">My Quotes</h1>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && quotes?.length === 0 && (
        <div className="text-center py-12">
          <FileText size={48} className="mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">No quotes submitted yet</p>
          <Link href="/jobs" className="text-primary text-sm hover:underline mt-1 block">
            Browse available jobs
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {quotes?.map(quote => (
          <Link key={quote.id} href={`/jobs/${quote.jobId}`}>
            <div className="bg-card rounded-xl border border-border p-4 hover:shadow-sm transition-all group">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-xs text-muted-foreground">Job #{quote.jobId}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-foreground flex items-center gap-1">
                    <DollarSign size={14} />
                    {formatCurrency(Number(quote.price))}
                  </div>
                </div>
              </div>
              {quote.message && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{quote.message}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock size={12} /> {quote.timeline}
                </span>
                <span>{formatDate(quote.createdAt)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
