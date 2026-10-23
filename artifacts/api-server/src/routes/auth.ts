import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, phoneOtpsTable } from "@workspace/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { RegisterBody, LoginBody, LoginResponse } from "@workspace/api-zod";
import { ensurePublicHandle } from "../lib/public-identity";

const router: IRouter = Router();

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be configured before starting QQZ in production.");
}

const JWT_SECRET = process.env.JWT_SECRET ?? "qqz-secret-key-change-in-production";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function createToken(userId: number, role: string) {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: number; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
  } catch {
    return null;
  }
}

router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  const publicHandle = await ensurePublicHandle(user.id);
  res.json({
    id: user.id,
    name: user.name,
    publicHandle,
    email: user.email,
    phone: user.phone,
    role: user.role,
    suspended: user.suspended,
    phoneVerified: user.phoneVerified,
    idVerified: user.idVerified,
    faceVerified: user.faceVerified,
    createdAt: user.createdAt.toISOString(),
  });
});

router.post("/register", async (req, res) => {
  const body = req.body && typeof req.body === "object" && !Array.isArray(req.body)
    ? req.body as Record<string, unknown>
    : {};
  const parsed = RegisterBody.safeParse({
    ...body,
    email: typeof body.email === "string" ? normalizeEmail(body.email) : body.email,
  });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { name, phone, password, role } = parsed.data;
  const email = normalizeEmail(parsed.data.email);

  const [existing] = await db.select({ id: usersTable.id }).from(usersTable)
    .where(sql`lower(trim(${usersTable.email})) = ${email}`)
    .limit(1);
  if (existing) {
    res.status(400).json({ error: "Email already in use" });
    return;
  }

  let phoneVerified = false;
  if (phone) {
    const normalized = phone.replace(/\s+/g, "");
    const [otp] = await db
      .select()
      .from(phoneOtpsTable)
      .where(and(eq(phoneOtpsTable.phone, normalized), eq(phoneOtpsTable.used, true)))
      .orderBy(desc(phoneOtpsTable.createdAt))
      .limit(1);
    if (otp && otp.createdAt > new Date(Date.now() - 30 * 60 * 1000)) {
      phoneVerified = true;
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({
    name,
    email,
    phone: phone ?? null,
    passwordHash,
    role,
    phoneVerified,
  }).returning();

  const publicHandle = await ensurePublicHandle(user.id);
  const token = createToken(user.id, user.role);
  res.status(201).json({
    token,
    user: {
      id: user.id,
      name: user.name,
      publicHandle,
      email: user.email,
      phone: user.phone,
      role: user.role,
      suspended: user.suspended,
      phoneVerified: user.phoneVerified,
      idVerified: user.idVerified,
      faceVerified: user.faceVerified,
      createdAt: user.createdAt.toISOString(),
    },
  });
});

router.post("/login", async (req, res) => {
  const body = req.body && typeof req.body === "object" && !Array.isArray(req.body)
    ? req.body as Record<string, unknown>
    : {};
  const parsed = LoginBody.safeParse({
    ...body,
    email: typeof body.email === "string" ? normalizeEmail(body.email) : body.email,
  });
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a valid email address and password." });
    return;
  }
  const { password } = parsed.data;
  const email = normalizeEmail(parsed.data.email);

  try {
    // Match legacy mixed-case addresses and any surrounding whitespace without
    // rewriting existing account records during sign-in.
    const candidates = await db.select().from(usersTable)
      .where(sql`lower(trim(${usersTable.email})) = ${email}`);
    const matches = await Promise.all(candidates.map(async (candidate) => ({
      user: candidate,
      valid: await bcrypt.compare(password, candidate.passwordHash),
    })));
    const validMatches = matches.filter((match) => match.valid);
    if (validMatches.length !== 1) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const { user } = validMatches[0];
    if (user.suspended) {
      res.status(401).json({ error: "Account suspended" });
      return;
    }

    const publicHandle = await ensurePublicHandle(user.id);
    const token = createToken(user.id, user.role);
    const response = LoginResponse.parse({
      token,
      user: {
        id: user.id,
        name: user.name,
        publicHandle,
        email,
        phone: user.phone,
        role: user.role,
        suspended: user.suspended,
        phoneVerified: user.phoneVerified,
        idVerified: user.idVerified,
        faceVerified: user.faceVerified,
        createdAt: user.createdAt.toISOString(),
      },
    });
    res.json(response);
  } catch (error) {
    req.log.error({ err: error }, "Sign-in request failed");
    res.status(503).json({ error: "Sign-in is temporarily unavailable. Please try again shortly." });
  }
});

router.post("/logout", (_req, res) => {
  res.json({ message: "Logged out" });
});

export default router;
