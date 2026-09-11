import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { newsTable } from "@workspace/db/schema";

const router: IRouter = Router();

function imageUrl(imagePath: string | null) {
  if (!imagePath) return null;
  if (imagePath.startsWith("/objects/")) {
    return `/api/storage/objects${imagePath.slice("/objects".length)}`;
  }
  return imagePath;
}

export function formatNewsArticle(article: typeof newsTable.$inferSelect) {
  return {
    id: article.id,
    headline: article.headline,
    body: article.body,
    imagePath: article.imagePath,
    imageUrl: imageUrl(article.imagePath),
    publishedAt: article.publishedAt.toISOString(),
    active: article.active,
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
  };
}

router.get("/news", async (_req, res) => {
  const articles = await db
    .select()
    .from(newsTable)
    .where(eq(newsTable.active, true))
    .orderBy(desc(newsTable.publishedAt), desc(newsTable.createdAt));
  res.json(articles.map(formatNewsArticle));
});

router.get("/news/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid news article id" });
    return;
  }

  const [article] = await db.select().from(newsTable).where(eq(newsTable.id, id));
  if (!article || !article.active) {
    res.status(404).json({ error: "News article not found" });
    return;
  }
  res.json(formatNewsArticle(article));
});

export default router;