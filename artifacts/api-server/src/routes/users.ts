import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, professionalsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { UpdateProfileBody, CreateProfessionalProfileBody, UpdateProfessionalProfileBody } from "@workspace/api-zod";
import { getFacePhotoForUser } from "../lib/photo";
import { ensurePublicHandle } from "../lib/public-identity";

const router: IRouter = Router();

router.get("/profile", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const [prof] = await db.select().from(professionalsTable).where(eq(professionalsTable.userId, userId));
  const photoUrl = await getFacePhotoForUser(userId);
  const publicHandle = await ensurePublicHandle(userId);
  res.json({
    id: user.id,
    name: user.name,
    publicHandle,
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
      experience: prof.experience,
      photoUrl,
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
  const photoUrl = await getFacePhotoForUser(userId);
  const publicHandle = await ensurePublicHandle(userId);
  res.json({
    id: user.id,
    name: user.name,
    publicHandle,
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
      experience: prof.experience,
      photoUrl,
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
  const photoUrl = await getFacePhotoForUser(userId);
  res.json({
    id: prof.id,
    userId: prof.userId,
    services: prof.services,
    rating: prof.rating ? Number(prof.rating) : null,
    verified: prof.verified,
    completedJobs: prof.completedJobs,
    bio: prof.bio,
    location: prof.location,
    experience: prof.experience,
    photoUrl,
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
    experience: parsed.data.experience ?? null,
  }).returning();
  const photoUrl = await getFacePhotoForUser(userId);
  res.status(201).json({
    id: prof.id,
    userId: prof.userId,
    services: prof.services,
    rating: null,
    verified: prof.verified,
    completedJobs: prof.completedJobs,
    bio: prof.bio,
    location: prof.location,
    experience: prof.experience,
    photoUrl,
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
  if (parsed.data.experience !== undefined) updates.experience = parsed.data.experience;

  const [prof] = await db.update(professionalsTable).set(updates).where(eq(professionalsTable.userId, userId)).returning();
  const photoUrl = await getFacePhotoForUser(userId);
  res.json({
    id: prof.id,
    userId: prof.userId,
    services: prof.services,
    rating: prof.rating ? Number(prof.rating) : null,
    verified: prof.verified,
    completedJobs: prof.completedJobs,
    bio: prof.bio,
    location: prof.location,
    experience: prof.experience,
    photoUrl,
  });
});

export default router;
