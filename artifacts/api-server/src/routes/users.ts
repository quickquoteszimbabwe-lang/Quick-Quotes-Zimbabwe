import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, professionalsTable, companiesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import {
  UpdateProfileBody,
  CreateProfessionalProfileBody,
  UpdateProfessionalProfileBody,
  CreateCompanyProfileBody,
  UpdateCompanyProfileBody,
} from "@workspace/api-zod";
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
      accountType: prof.accountType,
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
      accountType: prof.accountType,
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
    accountType: prof.accountType,
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
    accountType: parsed.data.accountType ?? "individual",
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
    accountType: prof.accountType,
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
    accountType: prof.accountType,
    photoUrl,
  });
});

router.get("/company", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const [prof] = await db.select().from(professionalsTable).where(eq(professionalsTable.userId, userId));
  if (!prof) {
    res.status(404).json({ error: "Professional profile not found" });
    return;
  }
  const [company] = await db.select().from(companiesTable).where(eq(companiesTable.professionalId, prof.id));
  if (!company) {
    res.status(404).json({ error: "Company profile not found" });
    return;
  }
  res.json({
    id: company.id,
    professionalId: company.professionalId,
    name: company.name,
    registrationNumber: company.registrationNumber,
    industry: company.industry,
    address: company.address,
    taxClearanceVerified: company.taxClearanceVerified,
    createdAt: company.createdAt.toISOString(),
  });
});

router.post("/company", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const parsed = CreateCompanyProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const [prof] = await db.select().from(professionalsTable).where(eq(professionalsTable.userId, userId));
  if (!prof) {
    res.status(404).json({ error: "Professional profile not found" });
    return;
  }
  if (prof.accountType !== "company") {
    await db.update(professionalsTable).set({ accountType: "company" }).where(eq(professionalsTable.id, prof.id));
  }
  const [company] = await db.insert(companiesTable).values({
    professionalId: prof.id,
    name: parsed.data.name,
    registrationNumber: parsed.data.registrationNumber,
    industry: parsed.data.industry ?? null,
    address: parsed.data.address ?? null,
  }).returning();
  res.status(201).json({
    id: company.id,
    professionalId: company.professionalId,
    name: company.name,
    registrationNumber: company.registrationNumber,
    industry: company.industry,
    address: company.address,
    taxClearanceVerified: company.taxClearanceVerified,
    createdAt: company.createdAt.toISOString(),
  });
});

router.patch("/company", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const parsed = UpdateCompanyProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const [prof] = await db.select().from(professionalsTable).where(eq(professionalsTable.userId, userId));
  if (!prof) {
    res.status(404).json({ error: "Professional profile not found" });
    return;
  }
  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.registrationNumber !== undefined) updates.registrationNumber = parsed.data.registrationNumber;
  if (parsed.data.industry !== undefined) updates.industry = parsed.data.industry;
  if (parsed.data.address !== undefined) updates.address = parsed.data.address;

  const [company] = await db.update(companiesTable).set(updates).where(eq(companiesTable.professionalId, prof.id)).returning();
  if (!company) {
    res.status(404).json({ error: "Company profile not found" });
    return;
  }
  res.json({
    id: company.id,
    professionalId: company.professionalId,
    name: company.name,
    registrationNumber: company.registrationNumber,
    industry: company.industry,
    address: company.address,
    taxClearanceVerified: company.taxClearanceVerified,
    createdAt: company.createdAt.toISOString(),
  });
});

export default router;
