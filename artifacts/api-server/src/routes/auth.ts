import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, phoneOtpsTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod/v4";
import { RegisterBody, LoginBody } from "@workspace/api-zod";

const router: IRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || "qqz-secret-key-change-in-production";

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
  res.json({
    id: user.id,
    name: user.name,
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
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { name, email, phone, password, role } = parsed.data;

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
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

  const token = createToken(user.id, user.role);
  res.status(201).json({
    token,
    user: {
      id: user.id,
      name: user.name,
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
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  if (user.suspended) {
    res.status(401).json({ error: "Account suspended" });
    return;
  }
  const token = createToken(user.id, user.role);
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
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

router.post("/logout", (_req, res) => {
  res.json({ message: "Logged out" });
});

export default router;
