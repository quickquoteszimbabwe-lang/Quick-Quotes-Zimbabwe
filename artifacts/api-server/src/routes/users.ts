import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, professionalsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { UpdateProfileBody, CreateProfessionalProfileBody, UpdateProfessionalProfileBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/profile", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const [prof] = await db.select().from(professionalsTable).where(eq(professionalsTable.userId, userId));
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    suspended: user.suspended,
    createdAt: user.createdAt.toISOString(),
    professional: prof ? {
      id: prof.id,
      userId: prof.userId,
      services: prof.services,
      rating: prof.rating ? Number(prof.rating) : null,
      verified: prof.verified,
      completedJobs: prof.completedJobs,
      bio: prof.bio,
      location: prof.location,
    } : undefined,
  });
});

router.patch("/profile", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone;

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, userId)).returning();
  const [prof] = await db.select().from(professionalsTable).where(eq(professionalsTable.userId, userId));
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    suspended: user.suspended,
    createdAt: user.createdAt.toISOString(),
    professional: prof ? {
      id: prof.id,
      userId: prof.userId,
      services: prof.services,
      rating: prof.rating ? Number(prof.rating) : null,
      verified: prof.verified,
      completedJobs: prof.completedJobs,
      bio: prof.bio,
      location: prof.location,
    } : undefined,
  });
});

router.get("/professional", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const [prof] = await db.select().from(professionalsTable).where(eq(professionalsTable.userId, userId));
  if (!prof) {
    res.status(404).json({ error: "Professional profile not found" });
    return;
  }
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

router.post("/professional", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const parsed = CreateProfessionalProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const [prof] = await db.insert(professionalsTable).values({
    userId,
    services: parsed.data.services,
    bio: parsed.data.bio ?? null,
    location: parsed.data.location ?? null,
  }).returning();
  res.status(201).json({
    id: prof.id,
    userId: prof.userId,
    services: prof.services,
    rating: null,
    verified: prof.verified,
    completedJobs: prof.completedJobs,
    bio: prof.bio,
    location: prof.location,
  });
});

router.patch("/professional", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const parsed = UpdateProfessionalProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const updates: Record<string, unknown> = {};
  if (parsed.data.services !== undefined) updates.services = parsed.data.services;
  if (parsed.data.bio !== undefined) updates.bio = parsed.data.bio;
  if (parsed.data.location !== undefined) updates.location = parsed.data.location;

  const [prof] = await db.update(professionalsTable).set(updates).where(eq(professionalsTable.userId, userId)).returning();
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

export default router;
