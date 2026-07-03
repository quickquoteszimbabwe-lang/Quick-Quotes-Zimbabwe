import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, professionalsTable, jobsTable, paymentsTable, categoriesTable, subcategoriesTable, servicesTable } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";
import { requireAuth, requireRole, AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.use(requireAuth, requireRole("admin"));

function formatCategory(c: typeof categoriesTable.$inferSelect) {
  return { id: c.id, name: c.name, icon: c.icon, active: c.active, featured: c.featured, sortOrder: c.sortOrder };
}

function formatSubcategory(s: typeof subcategoriesTable.$inferSelect) {
  return { id: s.id, categoryId: s.categoryId, name: s.name, active: s.active, sortOrder: s.sortOrder };
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

router.get("/users", async (_req, res) => {
  const users = await db.select().from(usersTable);
  const professionals = await db.select().from(professionalsTable);
  const profMap = new Map(professionals.map(p => [p.userId, p]));
  res.json(users.map(u => {
    const prof = profMap.get(u.id);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      suspended: u.suspended,
      createdAt: u.createdAt.toISOString(),
      professionalId: prof?.id ?? null,
      professionalVerified: prof?.verified ?? null,
    };
  }));
});

router.post("/users/:id/suspend", async (req, res) => {
  const userId = parseInt(req.params.id);
  await db.update(usersTable).set({ suspended: true }).where(eq(usersTable.id, userId));
  res.json({ message: "User suspended" });
});

router.post("/users/:id/unsuspend", async (req, res) => {
  const userId = parseInt(req.params.id);
  await db.update(usersTable).set({ suspended: false }).where(eq(usersTable.id, userId));
  res.json({ message: "User unsuspended" });
});

router.post("/professionals/:id/approve", async (req, res) => {
  const profId = parseInt(req.params.id);
  const [prof] = await db.update(professionalsTable).set({ verified: true }).where(eq(professionalsTable.id, profId)).returning();
  res.json({
    id: prof.id,
    userId: prof.userId,
    services: prof.services,
    rating: prof.rating ? Number(prof.rating) : null,
    verified: prof.verified,
    completedJobs: prof.completedJobs,
    bio: prof.bio,
    location: prof.location,
  });
});

router.get("/jobs", async (_req, res) => {
  const jobs = await db.select().from(jobsTable);
  const users = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable);
  const userMap = new Map(users.map(u => [u.id, u.name]));
  res.json(jobs.map(j => ({
    id: j.id,
    customerId: j.customerId,
    category: j.category,
    service: j.service,
    description: j.description,
    location: j.location,
    timeline: j.timeline,
    status: j.status,
    selectedProfessionalId: j.selectedProfessionalId,
    createdAt: j.createdAt.toISOString(),
    customerName: userMap.get(j.customerId) ?? null,
  })));
});

router.get("/categories", async (_req, res) => {
  const categories = await db.select().from(categoriesTable).orderBy(asc(categoriesTable.sortOrder));
  res.json(categories.map(formatCategory));
});

router.post("/categories", async (req, res) => {
  const { name, icon, active, featured, sortOrder } = req.body ?? {};
  if (!name || typeof name !== "string") {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const [category] = await db.insert(categoriesTable).values({
    name,
    icon: icon || "Package",
    active: active ?? true,
    featured: featured ?? false,
    sortOrder: sortOrder ?? 0,
  }).returning();
  res.status(201).json(formatCategory(category));
});

router.patch("/categories/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, icon, active, featured, sortOrder } = req.body ?? {};
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (icon !== undefined) updates.icon = icon;
  if (active !== undefined) updates.active = active;
  if (featured !== undefined) updates.featured = featured;
  if (sortOrder !== undefined) updates.sortOrder = sortOrder;
  const [category] = await db.update(categoriesTable).set(updates).where(eq(categoriesTable.id, id)).returning();
  if (!category) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  res.json(formatCategory(category));
});

router.delete("/categories/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(servicesTable).where(eq(servicesTable.categoryId, id));
  await db.delete(subcategoriesTable).where(eq(subcategoriesTable.categoryId, id));
  await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
  res.json({ message: "Category deleted" });
});

router.get("/subcategories", async (_req, res) => {
  const subcategories = await db.select().from(subcategoriesTable).orderBy(asc(subcategoriesTable.sortOrder));
  res.json(subcategories.map(formatSubcategory));
});

router.post("/subcategories", async (req, res) => {
  const { categoryId, name, active, sortOrder } = req.body ?? {};
  if (!categoryId || !name) {
    res.status(400).json({ error: "categoryId and name are required" });
    return;
  }
  const [subcategory] = await db.insert(subcategoriesTable).values({
    categoryId,
    name,
    active: active ?? true,
    sortOrder: sortOrder ?? 0,
  }).returning();
  res.status(201).json(formatSubcategory(subcategory));
});

router.patch("/subcategories/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { categoryId, name, active, sortOrder } = req.body ?? {};
  const updates: Record<string, unknown> = {};
  if (categoryId !== undefined) updates.categoryId = categoryId;
  if (name !== undefined) updates.name = name;
  if (active !== undefined) updates.active = active;
  if (sortOrder !== undefined) updates.sortOrder = sortOrder;
  const [subcategory] = await db.update(subcategoriesTable).set(updates).where(eq(subcategoriesTable.id, id)).returning();
  if (!subcategory) {
    res.status(404).json({ error: "Subcategory not found" });
    return;
  }
  res.json(formatSubcategory(subcategory));
});

router.delete("/subcategories/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.update(servicesTable).set({ subcategoryId: null }).where(eq(servicesTable.subcategoryId, id));
  await db.delete(subcategoriesTable).where(eq(subcategoriesTable.id, id));
  res.json({ message: "Subcategory deleted" });
});

router.get("/services", async (_req, res) => {
  const services = await db.select().from(servicesTable).orderBy(asc(servicesTable.sortOrder));
  res.json(services.map(formatService));
});

router.post("/services", async (req, res) => {
  const { name, description, icon, categoryId, subcategoryId, active, featured, sortOrder } = req.body ?? {};
  if (!name || !categoryId) {
    res.status(400).json({ error: "name and categoryId are required" });
    return;
  }
  const [service] = await db.insert(servicesTable).values({
    name,
    description: description ?? null,
    icon: icon || "Wrench",
    categoryId,
    subcategoryId: subcategoryId ?? null,
    active: active ?? true,
    featured: featured ?? false,
    sortOrder: sortOrder ?? 0,
  }).returning();
  res.status(201).json(formatService(service));
});

router.patch("/services/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, description, icon, categoryId, subcategoryId, active, featured, sortOrder } = req.body ?? {};
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (icon !== undefined) updates.icon = icon;
  if (categoryId !== undefined) updates.categoryId = categoryId;
  if (subcategoryId !== undefined) updates.subcategoryId = subcategoryId;
  if (active !== undefined) updates.active = active;
  if (featured !== undefined) updates.featured = featured;
  if (sortOrder !== undefined) updates.sortOrder = sortOrder;
  const [service] = await db.update(servicesTable).set(updates).where(eq(servicesTable.id, id)).returning();
  if (!service) {
    res.status(404).json({ error: "Service not found" });
    return;
  }
  res.json(formatService(service));
});

router.delete("/services/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(servicesTable).where(eq(servicesTable.id, id));
  res.json({ message: "Service deleted" });
});

router.get("/payments", async (_req, res) => {
  const payments = await db.select().from(paymentsTable);
  res.json(payments.map(p => ({
    id: p.id,
    jobId: p.jobId,
    amount: Number(p.amount),
    status: p.status as "pending" | "paid" | "released",
    method: p.method as "ecocash" | "bank_transfer" | "paynow",
    createdAt: p.createdAt.toISOString(),
    jobDescription: null,
  })));
});

export default router;
