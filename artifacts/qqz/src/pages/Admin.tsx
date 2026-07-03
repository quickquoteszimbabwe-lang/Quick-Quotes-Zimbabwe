import { useState } from "react";
import {
  useAdminGetUsers, useAdminGetJobs, useAdminGetPayments, useAdminSuspendUser, useAdminApproveProfessional,
  useAdminGetCategories, useAdminGetSubcategories, useAdminGetServices,
  useAdminCreateCategory, useAdminUpdateCategory, useAdminDeleteCategory,
  useAdminCreateSubcategory, useAdminUpdateSubcategory, useAdminDeleteSubcategory,
  useAdminCreateService, useAdminUpdateService, useAdminDeleteService,
} from "@workspace/api-client-react";
import type { Category, Subcategory, Service } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getAdminGetUsersQueryKey, getAdminGetJobsQueryKey,
  getAdminGetCategoriesQueryKey, getAdminGetSubcategoriesQueryKey, getAdminGetServicesQueryKey,
} from "@workspace/api-client-react";
import { Users, Briefcase, CreditCard, CheckCircle, Ban, ShieldCheck, RotateCcw, Tags, Plus, Pencil, Trash2, X, Star } from "lucide-react";
import { formatDate, formatCurrency, getStatusColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Tab = "users" | "jobs" | "payments" | "services";

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
        <p className="text-sm text-white/70">Manage users, jobs, payments, and services</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Users} label="Users" value={users?.length || 0} color="text-blue-600" />
        <StatCard icon={Briefcase} label="Jobs" value={jobs?.length || 0} color="text-green-600" />
        <StatCard icon={CreditCard} label="Payments" value={payments?.length || 0} color="text-purple-600" />
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["users", "jobs", "payments", "services"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-colors min-w-[80px]",
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

      {tab === "services" && <ServicesTab />}
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

type CategoryFormState = { id?: number; name: string; icon: string; active: boolean; featured: boolean; sortOrder: number };
type SubcategoryFormState = { id?: number; categoryId: number; name: string; active: boolean; sortOrder: number };
type ServiceFormState = { id?: number; name: string; description: string; icon: string; categoryId: number; subcategoryId: number | null; active: boolean; featured: boolean; sortOrder: number };

function ServicesTab() {
  const queryClient = useQueryClient();
  const { data: categories } = useAdminGetCategories();
  const { data: subcategories } = useAdminGetSubcategories();
  const { data: services } = useAdminGetServices();

  const [subTab, setSubTab] = useState<"categories" | "subcategories" | "services">("categories");
  const [categoryFilter, setCategoryFilter] = useState<number | "">("");

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getAdminGetCategoriesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getAdminGetSubcategoriesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getAdminGetServicesQueryKey() });
  };

  const createCategory = useAdminCreateCategory({ mutation: { onSuccess: invalidateAll } });
  const updateCategory = useAdminUpdateCategory({ mutation: { onSuccess: invalidateAll } });
  const deleteCategory = useAdminDeleteCategory({ mutation: { onSuccess: invalidateAll } });

  const createSubcategory = useAdminCreateSubcategory({ mutation: { onSuccess: invalidateAll } });
  const updateSubcategory = useAdminUpdateSubcategory({ mutation: { onSuccess: invalidateAll } });
  const deleteSubcategory = useAdminDeleteSubcategory({ mutation: { onSuccess: invalidateAll } });

  const createService = useAdminCreateService({ mutation: { onSuccess: invalidateAll } });
  const updateService = useAdminUpdateService({ mutation: { onSuccess: invalidateAll } });
  const deleteService = useAdminDeleteService({ mutation: { onSuccess: invalidateAll } });

  const [categoryForm, setCategoryForm] = useState<CategoryFormState | null>(null);
  const [subcategoryForm, setSubcategoryForm] = useState<SubcategoryFormState | null>(null);
  const [serviceForm, setServiceForm] = useState<ServiceFormState | null>(null);

  const categoryMap = new Map((categories ?? []).map(c => [c.id, c.name]));
  const subcategoryMap = new Map((subcategories ?? []).map(s => [s.id, s.name]));

  const filteredSubcategories = categoryFilter ? (subcategories ?? []).filter(s => s.categoryId === categoryFilter) : subcategories;
  const filteredServices = categoryFilter ? (services ?? []).filter(s => s.categoryId === categoryFilter) : services;

  function saveCategory(form: CategoryFormState) {
    if (form.id) {
      updateCategory.mutate({ id: form.id, data: { name: form.name, icon: form.icon, active: form.active, featured: form.featured, sortOrder: form.sortOrder } });
    } else {
      createCategory.mutate({ data: { name: form.name, icon: form.icon, active: form.active, featured: form.featured, sortOrder: form.sortOrder } });
    }
    setCategoryForm(null);
  }

  function saveSubcategory(form: SubcategoryFormState) {
    if (form.id) {
      updateSubcategory.mutate({ id: form.id, data: { categoryId: form.categoryId, name: form.name, active: form.active, sortOrder: form.sortOrder } });
    } else {
      createSubcategory.mutate({ data: { categoryId: form.categoryId, name: form.name, active: form.active, sortOrder: form.sortOrder } });
    }
    setSubcategoryForm(null);
  }

  function saveService(form: ServiceFormState) {
    const data = {
      name: form.name,
      description: form.description || null,
      icon: form.icon,
      categoryId: form.categoryId,
      subcategoryId: form.subcategoryId,
      active: form.active,
      featured: form.featured,
      sortOrder: form.sortOrder,
    };
    if (form.id) {
      updateService.mutate({ id: form.id, data });
    } else {
      createService.mutate({ data });
    }
    setServiceForm(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(["categories", "subcategories", "services"] as const).map(t => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors",
              subTab === t ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {t}
          </button>
        ))}
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value ? parseInt(e.target.value) : "")}
          className="ml-auto text-xs border border-border rounded-lg px-2 py-1.5 bg-background"
        >
          <option value="">All categories</option>
          {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {subTab === "categories" && (
        <div className="space-y-2">
          <button
            onClick={() => setCategoryForm({ name: "", icon: "Package", active: true, featured: false, sortOrder: (categories?.length ?? 0) })}
            className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-semibold"
          >
            <Plus size={14} /> New Category
          </button>
          {categories?.map(cat => (
            <div key={cat.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground text-sm">{cat.name}</span>
                  {cat.featured && <Star size={12} className="text-accent fill-accent" />}
                  {!cat.active && <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">Inactive</span>}
                </div>
                <p className="text-xs text-muted-foreground">Icon: {cat.icon} · Order: {cat.sortOrder}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setCategoryForm({ ...cat })} className="text-muted-foreground hover:text-primary"><Pencil size={16} /></button>
                <button onClick={() => { if (confirm(`Delete category "${cat.name}" and all its subcategories/services?`)) deleteCategory.mutate({ id: cat.id }); }} className="text-muted-foreground hover:text-destructive"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {subTab === "subcategories" && (
        <div className="space-y-2">
          <button
            onClick={() => setSubcategoryForm({ categoryId: categories?.[0]?.id ?? 0, name: "", active: true, sortOrder: (subcategories?.length ?? 0) })}
            disabled={!categories?.length}
            className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50"
          >
            <Plus size={14} /> New Subcategory
          </button>
          {filteredSubcategories?.map(sub => (
            <div key={sub.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between">
              <div>
                <span className="font-semibold text-foreground text-sm">{sub.name}</span>
                {!sub.active && <span className="ml-2 text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">Inactive</span>}
                <p className="text-xs text-muted-foreground">Category: {categoryMap.get(sub.categoryId) ?? "—"}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setSubcategoryForm({ ...sub })} className="text-muted-foreground hover:text-primary"><Pencil size={16} /></button>
                <button onClick={() => { if (confirm(`Delete subcategory "${sub.name}"?`)) deleteSubcategory.mutate({ id: sub.id }); }} className="text-muted-foreground hover:text-destructive"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {subTab === "services" && (
        <div className="space-y-2">
          <button
            onClick={() => setServiceForm({ name: "", description: "", icon: "Wrench", categoryId: categories?.[0]?.id ?? 0, subcategoryId: null, active: true, featured: false, sortOrder: (services?.length ?? 0) })}
            disabled={!categories?.length}
            className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50"
          >
            <Plus size={14} /> New Service
          </button>
          {filteredServices?.map(svc => (
            <div key={svc.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground text-sm">{svc.name}</span>
                  {svc.featured && <Star size={12} className="text-accent fill-accent" />}
                  {!svc.active && <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">Inactive</span>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {categoryMap.get(svc.categoryId) ?? "—"}
                  {svc.subcategoryId ? ` › ${subcategoryMap.get(svc.subcategoryId) ?? "—"}` : ""}
                </p>
                {svc.description && <p className="text-xs text-muted-foreground mt-0.5">{svc.description}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => setServiceForm({ ...svc, description: svc.description ?? "", subcategoryId: svc.subcategoryId ?? null })} className="text-muted-foreground hover:text-primary"><Pencil size={16} /></button>
                <button onClick={() => { if (confirm(`Delete service "${svc.name}"?`)) deleteService.mutate({ id: svc.id }); }} className="text-muted-foreground hover:text-destructive"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {categoryForm && (
        <CategoryModal form={categoryForm} onClose={() => setCategoryForm(null)} onSave={saveCategory} />
      )}
      {subcategoryForm && (
        <SubcategoryModal form={subcategoryForm} categories={categories ?? []} onClose={() => setSubcategoryForm(null)} onSave={saveSubcategory} />
      )}
      {serviceForm && (
        <ServiceModal form={serviceForm} categories={categories ?? []} subcategories={subcategories ?? []} onClose={() => setServiceForm(null)} onSave={saveService} />
      )}
    </div>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl border border-border p-5 w-full max-w-md space-y-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function CategoryModal({ form, onClose, onSave }: { form: CategoryFormState; onClose: () => void; onSave: (f: CategoryFormState) => void }) {
  const [state, setState] = useState(form);
  return (
    <ModalShell title={form.id ? "Edit Category" : "New Category"} onClose={onClose}>
      <div className="space-y-2">
        <input value={state.name} onChange={e => setState({ ...state, name: e.target.value })} placeholder="Name" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
        <input value={state.icon} onChange={e => setState({ ...state, icon: e.target.value })} placeholder="Icon (lucide-react name)" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
        <input type="number" value={state.sortOrder} onChange={e => setState({ ...state, sortOrder: parseInt(e.target.value) || 0 })} placeholder="Sort order" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
        <div className="flex gap-4">
          <label className="flex items-center gap-1.5 text-sm text-foreground"><input type="checkbox" checked={state.active} onChange={e => setState({ ...state, active: e.target.checked })} /> Active</label>
          <label className="flex items-center gap-1.5 text-sm text-foreground"><input type="checkbox" checked={state.featured} onChange={e => setState({ ...state, featured: e.target.checked })} /> Featured</label>
        </div>
        <button onClick={() => onSave(state)} disabled={!state.name} className="w-full bg-primary text-white py-2.5 rounded-xl font-semibold disabled:opacity-50">Save</button>
      </div>
    </ModalShell>
  );
}

function SubcategoryModal({ form, categories, onClose, onSave }: { form: SubcategoryFormState; categories: Category[]; onClose: () => void; onSave: (f: SubcategoryFormState) => void }) {
  const [state, setState] = useState(form);
  return (
    <ModalShell title={form.id ? "Edit Subcategory" : "New Subcategory"} onClose={onClose}>
      <div className="space-y-2">
        <select value={state.categoryId} onChange={e => setState({ ...state, categoryId: parseInt(e.target.value) })} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background">
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input value={state.name} onChange={e => setState({ ...state, name: e.target.value })} placeholder="Name" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
        <input type="number" value={state.sortOrder} onChange={e => setState({ ...state, sortOrder: parseInt(e.target.value) || 0 })} placeholder="Sort order" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
        <label className="flex items-center gap-1.5 text-sm text-foreground"><input type="checkbox" checked={state.active} onChange={e => setState({ ...state, active: e.target.checked })} /> Active</label>
        <button onClick={() => onSave(state)} disabled={!state.name} className="w-full bg-primary text-white py-2.5 rounded-xl font-semibold disabled:opacity-50">Save</button>
      </div>
    </ModalShell>
  );
}

function ServiceModal({ form, categories, subcategories, onClose, onSave }: { form: ServiceFormState; categories: Category[]; subcategories: Subcategory[]; onClose: () => void; onSave: (f: ServiceFormState) => void }) {
  const [state, setState] = useState(form);
  const availableSubcategories = subcategories.filter(s => s.categoryId === state.categoryId);
  return (
    <ModalShell title={form.id ? "Edit Service" : "New Service"} onClose={onClose}>
      <div className="space-y-2">
        <input value={state.name} onChange={e => setState({ ...state, name: e.target.value })} placeholder="Name" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
        <textarea value={state.description} onChange={e => setState({ ...state, description: e.target.value })} placeholder="Description" rows={2} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background resize-none" />
        <input value={state.icon} onChange={e => setState({ ...state, icon: e.target.value })} placeholder="Icon (lucide-react name)" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
        <select value={state.categoryId} onChange={e => setState({ ...state, categoryId: parseInt(e.target.value), subcategoryId: null })} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background">
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {availableSubcategories.length > 0 && (
          <select value={state.subcategoryId ?? ""} onChange={e => setState({ ...state, subcategoryId: e.target.value ? parseInt(e.target.value) : null })} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background">
            <option value="">No subcategory</option>
            {availableSubcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        <input type="number" value={state.sortOrder} onChange={e => setState({ ...state, sortOrder: parseInt(e.target.value) || 0 })} placeholder="Sort order" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
        <div className="flex gap-4">
          <label className="flex items-center gap-1.5 text-sm text-foreground"><input type="checkbox" checked={state.active} onChange={e => setState({ ...state, active: e.target.checked })} /> Active</label>
          <label className="flex items-center gap-1.5 text-sm text-foreground"><input type="checkbox" checked={state.featured} onChange={e => setState({ ...state, featured: e.target.checked })} /> Featured</label>
        </div>
        <button onClick={() => onSave(state)} disabled={!state.name} className="w-full bg-primary text-white py-2.5 rounded-xl font-semibold disabled:opacity-50">Save</button>
      </div>
    </ModalShell>
  );
}
