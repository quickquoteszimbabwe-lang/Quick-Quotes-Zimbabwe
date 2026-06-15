import { useState } from "react";
import { useAdminGetUsers, useAdminGetJobs, useAdminGetPayments, useAdminSuspendUser, useAdminApproveProfessional } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getAdminGetUsersQueryKey, getAdminGetJobsQueryKey } from "@workspace/api-client-react";
import { Users, Briefcase, CreditCard, CheckCircle, Ban, ShieldCheck, RotateCcw } from "lucide-react";
import { formatDate, formatCurrency, getStatusColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Tab = "users" | "jobs" | "payments";

export default function Admin() {
  const [tab, setTab] = useState<Tab>("users");
  const queryClient = useQueryClient();

  const { data: users } = useAdminGetUsers();
  const { data: jobs } = useAdminGetJobs();
  const { data: payments } = useAdminGetPayments();

  const invalidateUsers = () => queryClient.invalidateQueries({ queryKey: getAdminGetUsersQueryKey() });
  const suspendUser = useAdminSuspendUser({ mutation: { onSuccess: invalidateUsers } });
  const approveProf = useAdminApproveProfessional({ mutation: { onSuccess: invalidateUsers } });

  return (
    <div className="space-y-4">
      <div className="bg-primary text-white rounded-2xl p-4">
        <h1 className="text-xl font-bold">Admin Panel</h1>
        <p className="text-sm text-white/70">Manage users, jobs, and payments</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Users} label="Users" value={users?.length || 0} color="text-blue-600" />
        <StatCard icon={Briefcase} label="Jobs" value={jobs?.length || 0} color="text-green-600" />
        <StatCard icon={CreditCard} label="Payments" value={payments?.length || 0} color="text-purple-600" />
      </div>

      <div className="flex gap-2">
        {(["users", "jobs", "payments"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-colors",
              tab === t ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground hover:border-primary/40"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "users" && (
        <div className="space-y-2">
          {users?.map(user => (
            <div key={user.id} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground text-sm">{user.name}</span>
                    <span className={cn("text-xs px-1.5 py-0.5 rounded-full capitalize", {
                      "bg-blue-100 text-blue-700": user.role === "customer",
                      "bg-green-100 text-green-700": user.role === "professional",
                      "bg-purple-100 text-purple-700": user.role === "admin",
                    })}>
                      {user.role}
                    </span>
                    {user.suspended && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">Suspended</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(user.createdAt)}</p>
                </div>
                <div className="flex gap-2 flex-col sm:flex-row">
                  {user.role === "professional" && (user as any).professionalId && !(user as any).professionalVerified && (
                    <button
                      onClick={() => approveProf.mutate({ id: (user as any).professionalId })}
                      disabled={approveProf.isPending}
                      className="flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-lg hover:bg-green-100"
                    >
                      <ShieldCheck size={12} /> Approve
                    </button>
                  )}
                  {user.role === "professional" && (user as any).professionalVerified && (
                    <span className="flex items-center gap-1 text-xs text-green-700 px-2 py-1">
                      <CheckCircle size={12} /> Verified
                    </span>
                  )}
                  {!user.suspended && user.role !== "admin" && (
                    <button
                      onClick={() => suspendUser.mutate({ id: user.id })}
                      disabled={suspendUser.isPending}
                      className="flex items-center gap-1 text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-1 rounded-lg hover:bg-red-100"
                    >
                      <Ban size={12} /> Suspend
                    </button>
                  )}
                  {user.suspended && (
                    <button
                      onClick={async () => {
                        await fetch(`/api-server/api/admin/users/${user.id}/unsuspend`, {
                          method: "POST",
                          headers: { Authorization: `Bearer ${localStorage.getItem("qqz_token")}` }
                        });
                        invalidateUsers();
                      }}
                      className="flex items-center gap-1 text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2 py-1 rounded-lg hover:bg-orange-100"
                    >
                      <RotateCcw size={12} /> Unsuspend
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "jobs" && (
        <div className="space-y-2">
          {jobs?.map(job => (
            <div key={job.id} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-semibold text-foreground text-sm">{job.service}</h3>
                <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", getStatusColor(job.status))}>
                  {job.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{job.category} · {job.location}</p>
              <p className="text-xs text-muted-foreground">{formatDate(job.createdAt)}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "payments" && (
        <div className="space-y-2">
          {payments?.map(payment => (
            <div key={payment.id} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{formatCurrency(Number(payment.amount))}</p>
                  <p className="text-xs text-muted-foreground capitalize">{payment.method?.replace("_", " ")} · {formatDate(payment.createdAt)}</p>
                </div>
                <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", getStatusColor(payment.status))}>
                  {payment.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 text-center">
      <Icon size={24} className={cn("mx-auto mb-1", color)} />
      <div className="font-bold text-foreground text-xl">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
