import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getAdminGetNewsQueryKey, getGetNewsQueryKey, useAdminCreateNews, useAdminDeleteNews,
  useAdminGetNews, useAdminUpdateNews, useRequestUploadUrl,
} from "@workspace/api-client-react";
import type { NewsArticle } from "@workspace/api-client-react";
import { CalendarDays, Check, FileImage, ImagePlus, LoaderCircle, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

type NewsForm = { id?: number; headline: string; body: string; imagePath: string; imageUrl?: string | null; publishedAt: string; active: boolean };

function toInputDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function errorText(error: unknown) {
  return error instanceof Error && error.message ? error.message : "Something went wrong. Please try again.";
}

export default function AdminNewsTab() {
  const queryClient = useQueryClient();
  const newsQuery = useAdminGetNews();
  const [form, setForm] = useState<NewsForm | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getAdminGetNewsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetNewsQueryKey() });
  };
  const createNews = useAdminCreateNews({ mutation: { onSuccess: () => { invalidate(); setForm(null); setSelectedFile(null); setError(null); } } });
  const updateNews = useAdminUpdateNews({ mutation: { onSuccess: () => { invalidate(); setForm(null); setSelectedFile(null); setError(null); } } });
  const deleteNews = useAdminDeleteNews({ mutation: { onSuccess: invalidate } });
  const requestUpload = useRequestUploadUrl();

  const openCreate = () => {
    setError(null);
    setSelectedFile(null);
    setForm({ headline: "", body: "", imagePath: "", publishedAt: toInputDate(new Date().toISOString()), active: false });
  };
  const openEdit = (article: NewsArticle) => {
    setError(null);
    setSelectedFile(null);
    setForm({ id: article.id, headline: article.headline, body: article.body, imagePath: article.imagePath ?? "", imageUrl: article.imageUrl, publishedAt: toInputDate(article.publishedAt), active: article.active });
  };

  const uploadBytes = (uploadURL: string, file: File) => new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", uploadURL);
    request.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => request.status >= 200 && request.status < 300 ? resolve() : reject(new Error("The image upload was not accepted."));
    request.onerror = () => reject(new Error("The image upload failed. Check your connection and try again."));
    request.send(file);
  });

  const save = async () => {
    if (!form || !form.headline.trim() || !form.body.trim()) {
      setError("Headline and story body are required.");
      return;
    }
    setError(null);
    setProgress(selectedFile ? 0 : null);
    try {
      let imagePath = form.imagePath || null;
      if (selectedFile) {
        const upload = await requestUpload.mutateAsync({ data: { name: selectedFile.name, size: selectedFile.size, contentType: selectedFile.type || "application/octet-stream" } });
        await uploadBytes(upload.uploadURL, selectedFile);
        imagePath = upload.objectPath;
      }
      const publishedAt = form.publishedAt ? new Date(form.publishedAt).toISOString() : new Date().toISOString();
      setProgress(null);
      if (form.id) {
        updateNews.mutate({ id: form.id, data: { headline: form.headline.trim(), body: form.body.trim(), imagePath, publishedAt, active: form.active } });
      } else {
        createNews.mutate({ data: { headline: form.headline.trim(), body: form.body.trim(), imagePath, publishedAt, active: form.active } });
      }
    } catch (uploadError) {
      setProgress(null);
      setError(errorText(uploadError));
    }
  };

  const saving = createNews.isPending || updateNews.isPending || requestUpload.isPending || progress !== null;
  const articles = newsQuery.data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-sm font-semibold text-foreground">Editorial feed</p><p className="text-xs text-muted-foreground">Publish practical updates, guidance and marketplace notes.</p></div>
        <button type="button" onClick={openCreate} data-testid="button-create-news" className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:opacity-90"><Plus size={14} /> New article</button>
      </div>
      {newsQuery.isLoading && <div className="space-y-2">{[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-xl bg-muted" />)}</div>}
      {newsQuery.isError && <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive" role="alert">News articles could not be loaded. Refresh the page and try again.</div>}
      {!newsQuery.isLoading && !newsQuery.isError && articles.length === 0 && <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">No articles have been created yet.</div>}
      <div className="space-y-2">
        {articles.map((article) => (
          <div key={article.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center" data-testid={`row-admin-news-${article.id}`}>
            <div className="h-20 w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:w-28"><img src={article.imageUrl ?? ""} alt="" className={cn("h-full w-full object-cover", !article.imageUrl && "hidden")} /><div className={cn("flex h-full items-center justify-center text-muted-foreground", article.imageUrl && "hidden")}><FileImage size={22} /></div></div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><h3 className="break-words text-sm font-bold text-foreground">{article.headline}</h3><span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", article.active ? "bg-green-50 text-green-700" : "bg-muted text-muted-foreground")}>{article.active ? "Published" : "Draft"}</span></div>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{article.body}</p>
              <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground"><CalendarDays size={12} /> {formatDate(article.publishedAt)}</p>
            </div>
            <div className="flex shrink-0 gap-1.5 self-end sm:self-center">
              <button type="button" onClick={() => updateNews.mutate({ id: article.id, data: { active: !article.active, publishedAt: article.publishedAt || new Date().toISOString() } })} disabled={updateNews.isPending} data-testid={`button-toggle-news-${article.id}`} className={cn("rounded-lg px-2.5 py-1.5 text-xs font-semibold disabled:opacity-50", article.active ? "border border-border text-muted-foreground hover:bg-muted" : "bg-secondary/10 text-secondary hover:bg-secondary/20")}>{article.active ? "Unpublish" : "Publish"}</button>
              <button type="button" onClick={() => openEdit(article)} data-testid={`button-edit-news-${article.id}`} className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-primary"><Pencil size={15} /></button>
              <button type="button" onClick={() => { if (window.confirm(`Delete "${article.headline}"?`)) deleteNews.mutate({ id: article.id }); }} disabled={deleteNews.isPending} data-testid={`button-delete-news-${article.id}`} className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-destructive"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
      </div>
      {form && <NewsEditor form={form} setForm={setForm} file={selectedFile} setFile={setSelectedFile} progress={progress} error={error} saving={saving} onClose={() => { setForm(null); setSelectedFile(null); setError(null); setProgress(null); }} onSave={save} />}
    </div>
  );
}

function NewsEditor({ form, setForm, file, setFile, progress, error, saving, onClose, onSave }: { form: NewsForm; setForm: (value: NewsForm) => void; file: File | null; setFile: (value: File | null) => void; progress: number | null; error: string | null; saving: boolean; onClose: () => void; onSave: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/45 p-4" onClick={onClose}>
      <div className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-accent">Newsroom</p><h2 className="mt-1 text-xl font-bold text-primary">{form.id ? "Edit article" : "New article"}</h2></div><button type="button" onClick={onClose} data-testid="button-close-news-editor" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X size={18} /></button></div>
        <div className="mt-5 space-y-4">
          <label className="block"><span className="mb-1.5 block text-xs font-semibold text-foreground">Headline</span><input value={form.headline} onChange={(event) => setForm({ ...form, headline: event.target.value })} data-testid="input-news-headline" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="A clear, useful headline" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold text-foreground">Story body</span><textarea value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} data-testid="input-news-body" rows={9} className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-ring" placeholder="Write the article content..." /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold text-foreground">Publish date</span><input type="datetime-local" value={form.publishedAt} onChange={(event) => setForm({ ...form, publishedAt: event.target.value })} data-testid="input-news-published-at" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" /></label>
            <div><span className="mb-1.5 block text-xs font-semibold text-foreground">Cover image</span><input ref={inputRef} type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] ?? null)} data-testid="input-news-image" className="sr-only" /><button type="button" onClick={() => inputRef.current?.click()} data-testid="button-select-news-image" className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2.5 text-left text-xs font-semibold text-secondary hover:border-secondary"><ImagePlus size={16} /> <span className="min-w-0 truncate">{file?.name ?? (form.imagePath ? "Replace existing image" : "Choose an image")}</span></button></div>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} data-testid="input-news-active" className="accent-primary" /> Publish this article</label>
          {progress !== null && <div className="rounded-lg bg-muted p-3"><div className="flex items-center justify-between text-xs font-semibold text-muted-foreground"><span className="inline-flex items-center gap-1.5"><Upload size={13} /> Uploading image</span><span>{progress}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border"><div className="h-full bg-accent transition-[width]" style={{ width: `${progress}%` }} /></div></div>}
          {error && <p role="alert" className="rounded-lg bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</p>}
          <button type="button" onClick={onSave} disabled={saving} data-testid="button-save-news" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-50">{saving ? <><LoaderCircle size={16} className="animate-spin" /> Saving article</> : <><Check size={16} /> Save article</>}</button>
        </div>
      </div>
    </div>
  );
}