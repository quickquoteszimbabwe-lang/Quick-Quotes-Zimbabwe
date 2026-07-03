import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { categoriesTable, subcategoriesTable, servicesTable } from "@workspace/db/schema";
import { eq, and, or, ilike, asc } from "drizzle-orm";

const router: IRouter = Router();

function formatCategory(c: typeof categoriesTable.$inferSelect) {
  return {
    id: c.id,
    name: c.name,
    icon: c.icon,
    active: c.active,
    featured: c.featured,
    sortOrder: c.sortOrder,
  };
}

function formatSubcategory(s: typeof subcategoriesTable.$inferSelect) {
  return {
    id: s.id,
    categoryId: s.categoryId,
    name: s.name,
    active: s.active,
    sortOrder: s.sortOrder,
  };
}

function formatService(s: typeof servicesTable.$inferSelect) {
  return {
    id: s.id,
    name: s.name,
    description: s.description,
    icon: s.icon,
    categoryId: s.categoryId,
    subcategoryId: s.subcategoryId,
    active: s.active,
    featured: s.featured,
    sortOrder: s.sortOrder,
  };
}

router.get("/categories", async (req, res) => {
  const includeInactive = req.query.includeInactive === "true";
  const conditions = includeInactive ? [] : [eq(categoriesTable.active, true)];
  const categories = await db
    .select()
    .from(categoriesTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(categoriesTable.sortOrder));
  res.json(categories.map(formatCategory));
});

router.get("/categories/tree", async (req, res) => {
  const includeInactive = req.query.includeInactive === "true";

  const categoryConditions = includeInactive ? [] : [eq(categoriesTable.active, true)];
  const categories = await db
    .select()
    .from(categoriesTable)
    .where(categoryConditions.length ? and(...categoryConditions) : undefined)
    .orderBy(asc(categoriesTable.sortOrder));

  const subConditions = includeInactive ? [] : [eq(subcategoriesTable.active, true)];
  const subcategories = await db
    .select()
    .from(subcategoriesTable)
    .where(subConditions.length ? and(...subConditions) : undefined)
    .orderBy(asc(subcategoriesTable.sortOrder));

  const serviceConditions = includeInactive ? [] : [eq(servicesTable.active, true)];
  const services = await db
    .select()
    .from(servicesTable)
    .where(serviceConditions.length ? and(...serviceConditions) : undefined)
    .orderBy(asc(servicesTable.sortOrder));

  const tree = categories.map(cat => {
    const catSubs = subcategories.filter(s => s.categoryId === cat.id);
    const catServices = services.filter(s => s.categoryId === cat.id);
    return {
      ...formatCategory(cat),
      subcategories: catSubs.map(sub => ({
        ...formatSubcategory(sub),
        services: catServices.filter(sv => sv.subcategoryId === sub.id).map(formatService),
      })),
      services: catServices.filter(sv => sv.subcategoryId === null).map(formatService),
    };
  });

  res.json(tree);
});

router.get("/services", async (req, res) => {
  const { search, categoryId, subcategoryId, featured } = req.query;
  const conditions = [eq(servicesTable.active, true)];

  if (search && typeof search === "string") {
    conditions.push(ilike(servicesTable.name, `%${search}%`) as any);
  }
  if (categoryId) {
    conditions.push(eq(servicesTable.categoryId, parseInt(categoryId as string)));
  }
  if (subcategoryId) {
    conditions.push(eq(servicesTable.subcategoryId, parseInt(subcategoryId as string)));
  }
  if (featured === "true") {
    conditions.push(eq(servicesTable.featured, true));
  }

  const services = await db
    .select()
    .from(servicesTable)
    .where(and(...conditions))
    .orderBy(asc(servicesTable.sortOrder));

  res.json(services.map(formatService));
});

export default router;
