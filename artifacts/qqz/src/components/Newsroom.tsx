import { Link, useParams } from "wouter";
import { useEffect } from "react";
import { ArrowLeft, ArrowUpRight, CalendarDays, ChevronRight, FileText, Newspaper, RefreshCw } from "lucide-react";
import { useGetNews, useGetNewsArticle, getGetNewsArticleQueryKey } from "@workspace/api-client-react";
import { cn, formatDate } from "@/lib/utils";

function ArticleImage({ src, alt, className }: { src?: string | null; alt: string; className?: string }) {
  if (src) {
    return <img src={src} alt={alt} className={cn("h-full w-full object-cover", className)} />;
  }
  return (
    <div className={cn("flex h-full w-full items-center justify-center bg-primary", className)}>
      <Newspaper size={34} className="text-accent" strokeWidth={1.5} />
    </div>
  );
}

function NewsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-5 py-7 text-center" role="alert" data-testid="status-news-error">
      <p className="text-sm font-semibold text-destructive">The newsroom could not load right now.</p>
      <button type="button" onClick={onRetry} data-testid="button-retry-news" className="mt-3 inline-flex items-center gap-2 rounded-lg border border-destructive/20 bg-card px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive/5">
        <RefreshCw size={14} /> Try again
      </button>
    </div>
  );
}

export function NewsroomPanel() {
  const newsQuery = useGetNews();
  const articles = (newsQuery.data ?? []).filter((article) => article.active);
  const lead = articles[0];
  const secondary = articles.slice(1, 4);

  return (
    <section className="space-y-4" aria-labelledby="newsroom-heading" data-testid="section-newsroom">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-accent">The newsroom</p>
          <h2 id="newsroom-heading" className="mt-1 text-2xl text-primary">Useful reads from QQZ</h2>
        </div>
        <Link href="/news" data-testid="link-newsroom-view-all" className="flex shrink-0 items-center gap-1 text-xs font-bold text-secondary hover:text-primary">
          View all <ArrowUpRight size={14} />
        </Link>
      </div>
      {newsQuery.isLoading ? (
        <div className="grid gap-3 lg:grid-cols-[1.15fr_.85fr]">
          <div className="h-64 animate-pulse rounded-2xl bg-muted" />
          <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-[76px] animate-pulse rounded-2xl bg-muted" />)}</div>
        </div>
      ) : newsQuery.isError ? (
        <NewsError onRetry={() => newsQuery.refetch()} />
      ) : !lead ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-9 text-center" data-testid="empty-newsroom">
          <FileText size={24} className="mx-auto text-secondary" />
          <p className="mt-3 text-sm font-semibold text-primary">No newsroom stories yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Check back soon for practical updates from the QQZ team.</p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-[1.15fr_.85fr]">
          <Link href={`/news/${lead.id}`} data-testid={`card-news-lead-${lead.id}`} className="qqz-hover group grid min-h-[250px] overflow-hidden rounded-2xl border border-border bg-card sm:grid-cols-[.9fr_1.1fr]">
            <div className="min-h-44 overflow-hidden sm:min-h-full"><ArticleImage src={lead.imageUrl} alt="" className="transition-transform duration-300 group-hover:scale-[1.03]" /></div>
            <div className="flex flex-col justify-between p-5">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-accent"><Newspaper size={12} /> Featured briefing</span>
                <h3 className="mt-3 break-words text-xl font-bold leading-tight text-primary">{lead.headline}</h3>
                <p className="mt-3 line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{lead.body}</p>
              </div>
              <div className="mt-5 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><CalendarDays size={13} /> {formatDate(lead.publishedAt)}</span>
                <span className="flex items-center gap-1 font-bold text-secondary">Read story <ChevronRight size={14} /></span>
              </div>
            </div>
          </Link>
          <div className="space-y-3">
            {secondary.length === 0 ? (
              <div className="flex h-full min-h-[120px] items-center rounded-2xl border border-dashed border-border bg-muted/45 px-5 text-sm text-muted-foreground">More stories will appear here as they are published.</div>
            ) : secondary.map((article) => (
              <Link key={article.id} href={`/news/${article.id}`} data-testid={`row-news-${article.id}`} className="qqz-hover group flex min-h-[76px] gap-3 rounded-2xl border border-border bg-card p-3">
                <div className="h-[76px] w-24 shrink-0 overflow-hidden rounded-xl"><ArticleImage src={article.imageUrl} alt="" /></div>
                <div className="min-w-0 flex-1 py-1">
                  <h3 className="break-words text-sm font-bold leading-snug text-primary group-hover:text-secondary">{article.headline}</h3>
                  <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground"><CalendarDays size={12} /> {formatDate(article.publishedAt)}</p>
                </div>
                <ChevronRight size={15} className="mt-1 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export function NewsListingPage() {
  const newsQuery = useGetNews();
  const articles = (newsQuery.data ?? []).filter((article) => article.active);

  return (
    <div className="space-y-6 py-4 sm:py-8 qqz-enter" data-testid="page-newsroom">
      <div className="rounded-2xl bg-primary px-5 py-7 text-primary-foreground sm:px-8">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-accent"><Newspaper size={14} /> QQZ newsroom</p>
        <h1 className="mt-3 max-w-xl text-3xl font-bold leading-tight sm:text-4xl">Useful context for doing business in Zimbabwe.</h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-primary-foreground/70">Practical updates, marketplace guidance and stories from the people building trust through QQZ.</p>
      </div>
      {newsQuery.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">{[1, 2, 3, 4].map((item) => <div key={item} className="h-48 animate-pulse rounded-2xl bg-muted" />)}</div>
      ) : newsQuery.isError ? (
        <NewsError onRetry={() => newsQuery.refetch()} />
      ) : articles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-12 text-center" data-testid="empty-news-list">
          <FileText size={26} className="mx-auto text-secondary" />
          <p className="mt-3 text-sm font-semibold text-primary">The newsroom is quiet for now</p>
          <p className="mt-1 text-xs text-muted-foreground">Published stories will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {articles.map((article) => (
            <Link key={article.id} href={`/news/${article.id}`} data-testid={`card-news-article-${article.id}`} className="qqz-hover group overflow-hidden rounded-2xl border border-border bg-card">
              <div className="h-44 overflow-hidden bg-muted"><ArticleImage src={article.imageUrl} alt="" className="transition-transform duration-300 group-hover:scale-[1.03]" /></div>
              <div className="p-5">
                <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><CalendarDays size={13} /> {formatDate(article.publishedAt)}</p>
                <h2 className="mt-2 break-words text-lg font-bold leading-snug text-primary group-hover:text-secondary">{article.headline}</h2>
                <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{article.body}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-secondary">Read story <ArrowUpRight size={14} /></span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NewsArticlePage() {
  const params = useParams<{ id: string }>();
  const articleId = Number(params.id);
  const articleQuery = useGetNewsArticle(articleId, {
    query: { enabled: Number.isFinite(articleId), queryKey: getGetNewsArticleQueryKey(articleId) },
  });
  const article = articleQuery.data;

  useEffect(() => {
    if (!article) return;
    document.title = `${article.headline} | QQZ newsroom`;
    let description = document.querySelector('meta[name="description"]');
    if (!description) {
      description = document.createElement("meta");
      description.setAttribute("name", "description");
      document.head.appendChild(description);
    }
    description.setAttribute("content", article.body.slice(0, 155));
  }, [article?.body, article?.headline]);

  if (!Number.isFinite(articleId) || articleQuery.isError) {
    return (
      <div className="mx-auto max-w-3xl py-8">
        <Link href="/news" data-testid="link-news-back-error" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-secondary"><ArrowLeft size={16} /> Back to newsroom</Link>
        <NewsError onRetry={() => articleQuery.refetch()} />
      </div>
    );
  }

  if (articleQuery.isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-8" data-testid="loading-news-article">
        <div className="h-4 w-28 animate-pulse rounded bg-muted" />
        <div className="h-12 w-4/5 animate-pulse rounded bg-muted" />
        <div className="h-72 animate-pulse rounded-2xl bg-muted" />
        <div className="space-y-2"><div className="h-4 animate-pulse rounded bg-muted" /><div className="h-4 animate-pulse rounded bg-muted" /><div className="h-4 w-2/3 animate-pulse rounded bg-muted" /></div>
      </div>
    );
  }

  if (!article) return null;

  return (
    <article className="mx-auto max-w-3xl py-4 sm:py-8 qqz-enter" data-testid={`article-news-${article.id}`}>
      <Link href="/news" data-testid="link-news-back" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:text-primary"><ArrowLeft size={16} /> Back to newsroom</Link>
      <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-semibold text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 text-accent"><Newspaper size={14} /> QQZ newsroom</span>
        <span aria-hidden="true">/</span>
        <span>{formatDate(article.publishedAt)}</span>
      </div>
      <h1 data-testid={`text-news-headline-${article.id}`} className="max-w-2xl break-words text-3xl font-bold leading-tight text-primary sm:text-5xl">{article.headline}</h1>
      <div className="mt-7 aspect-[16/8] overflow-hidden rounded-2xl border border-border bg-muted sm:rounded-3xl">
        <ArticleImage src={article.imageUrl} alt={article.headline} />
      </div>
      <div data-testid={`text-news-body-${article.id}`} className="mt-8 whitespace-pre-wrap break-words text-[16px] leading-8 text-foreground/80">{article.body}</div>
    </article>
  );
}