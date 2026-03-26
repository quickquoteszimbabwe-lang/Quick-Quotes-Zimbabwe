import { useGetPayments } from "@workspace/api-client-react";
import { CreditCard } from "lucide-react";
import { formatDate, formatCurrency, getStatusColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

const METHOD_LABELS: Record<string, string> = {
  ecocash: "EcoCash",
  bank_transfer: "Bank Transfer",
  paynow: "Paynow",
};

export default function Payments() {
  const { data: payments, isLoading } = useGetPayments();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-foreground">Payments</h1>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && payments?.length === 0 && (
        <div className="text-center py-12">
          <CreditCard size={48} className="mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">No payment records yet</p>
          <p className="text-sm text-muted-foreground mt-1">Payments appear here when jobs are funded</p>
        </div>
      )}

      <div className="space-y-3">
        {payments?.map(payment => (
          <div key={payment.id} className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-foreground">{formatCurrency(Number(payment.amount))}</p>
                <p className="text-sm text-muted-foreground">{METHOD_LABELS[payment.method] || payment.method}</p>
              </div>
              <span className={cn("text-xs font-medium px-2 py-1 rounded-full", getStatusColor(payment.status))}>
                {payment.status}
              </span>
            </div>
            {payment.jobDescription && (
              <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{payment.jobDescription}</p>
            )}
            <p className="text-xs text-muted-foreground">{formatDate(payment.createdAt)}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border p-4 mt-4">
        <h3 className="font-semibold text-foreground mb-2">Payment Methods</h3>
        <div className="space-y-2">
          {[
            { name: "EcoCash", desc: "Mobile money payments via Econet", color: "bg-green-100 text-green-800" },
            { name: "Bank Transfer", desc: "Direct bank to bank transfer", color: "bg-blue-100 text-blue-800" },
            { name: "Paynow", desc: "Zimbabwe's online payment gateway", color: "bg-purple-100 text-purple-800" },
          ].map(m => (
            <div key={m.name} className="flex items-center gap-3">
              <span className={cn("text-xs font-medium px-2 py-1 rounded-full", m.color)}>{m.name}</span>
              <span className="text-sm text-muted-foreground">{m.desc}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          * Payments are simulated for MVP. Integration with real payment gateways coming soon.
        </p>
      </div>
    </div>
  );
}
