import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { phoneOtpsTable, verificationDocumentsTable, usersTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.post("/send-otp", async (req, res) => {
  const { phone } = req.body;
  if (!phone || typeof phone !== "string") {
    res.status(400).json({ error: "Phone number is required" });
    return;
  }

  const normalized = phone.replace(/\s+/g, "");
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await db.delete(phoneOtpsTable).where(eq(phoneOtpsTable.phone, normalized));
  await db.insert(phoneOtpsTable).values({ phone: normalized, code, expiresAt });

  res.json({
    message: "Verification code sent",
    code,
    expiresIn: 600,
  });
});

router.post("/verify-otp", async (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) {
    res.status(400).json({ error: "Phone and code are required" });
    return;
  }

  const normalized = phone.replace(/\s+/g, "");

  const [otp] = await db
    .select()
    .from(phoneOtpsTable)
    .where(and(eq(phoneOtpsTable.phone, normalized), eq(phoneOtpsTable.used, false)))
    .orderBy(desc(phoneOtpsTable.createdAt))
    .limit(1);

  if (!otp) {
    res.status(400).json({ error: "Invalid or expired code" });
    return;
  }

  if (otp.expiresAt < new Date()) {
    res.status(400).json({ error: "Code has expired. Please request a new one." });
    return;
  }

  if (otp.code !== code) {
    res.status(400).json({ error: "Incorrect code. Please try again." });
    return;
  }

  await db.update(phoneOtpsTable).set({ used: true }).where(eq(phoneOtpsTable.id, otp.id));

  res.json({ success: true, phone: normalized });
});

router.post("/upload-document", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const { type, fileName, fileData, mimeType } = req.body;

  const validTypes = [
    "id_card",
    "face_photo",
    "secondary_cert",
    "tertiary_cert",
    "police_clearance",
    "fingerprint_form",
  ];

  if (!validTypes.includes(type)) {
    res.status(400).json({ error: "Invalid document type" });
    return;
  }

  if (!fileName || !fileData || !mimeType) {
    res.status(400).json({ error: "fileName, fileData, and mimeType are required" });
    return;
  }

  await db
    .delete(verificationDocumentsTable)
    .where(
      and(
        eq(verificationDocumentsTable.userId, userId),
        eq(verificationDocumentsTable.type, type)
      )
    );

  const [doc] = await db
    .insert(verificationDocumentsTable)
    .values({ userId, type, fileName, fileData, mimeType, status: "pending" })
    .returning();

  if (type === "id_card") {
    await db.update(usersTable).set({ idVerified: false }).where(eq(usersTable.id, userId));
  } else if (type === "face_photo") {
    await db.update(usersTable).set({ faceVerified: false }).where(eq(usersTable.id, userId));
  }

  res.status(201).json({
    id: doc.id,
    type: doc.type,
    fileName: doc.fileName,
    mimeType: doc.mimeType,
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
  });
});

router.get("/documents", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;

  const docs = await db
    .select({
      id: verificationDocumentsTable.id,
      type: verificationDocumentsTable.type,
      fileName: verificationDocumentsTable.fileName,
      mimeType: verificationDocumentsTable.mimeType,
      status: verificationDocumentsTable.status,
      createdAt: verificationDocumentsTable.createdAt,
    })
    .from(verificationDocumentsTable)
    .where(eq(verificationDocumentsTable.userId, userId));

  res.json(docs.map((d) => ({ ...d, createdAt: d.createdAt.toISOString() })));
});

export default router;
