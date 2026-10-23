import { randomBytes } from "crypto";
import { Readable } from "stream";
import { Router, type IRouter, type Response } from "express";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  AdminAssignVerificationBody,
  AdminAssignVerificationParams,
  AdminDecideVerificationBody,
  AdminDecideVerificationParams,
  AdminDecideVerificationPartnerBody,
  AdminDecideVerificationPartnerParams,
  AdminGetVerificationPartnersResponse,
  AddVerificationEvidenceBody,
  AddVerificationEvidenceParams,
  DownloadVerificationEvidenceParams,
  GetPartnerVerificationRecordsResponse,
  GetPublicVerificationParams,
  GetPublicVerificationResponse,
  SubmitPartnerVerificationResultBody,
  SubmitPartnerVerificationResultParams,
} from "@workspace/api-zod";
import {
  entitiesTable,
  entityMembershipsTable,
  verificationAuditTable,
  verificationEvidenceTable,
  verificationPartnersTable,
  verificationRecordsTable,
  usersTable,
} from "@workspace/db/schema";
import { requireAuth, requireRole, type AuthRequest } from "../middlewares/auth";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";
import {
  appendVerificationAudit,
  expireDueVerifications,
  formatAdminVerificationRecord,
  formatVerificationRecord,
  getActiveMembership,
  getEvidenceMetadata,
  hasConflictOfInterest,
  hasEntityPermission,
  partnerCanProcess,
} from "../lib/verification-system";

const router: IRouter = Router();
const adminRouter: IRouter = Router();
const storage = new ObjectStorageService();

function parsedId(raw: string | string[] | undefined): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function randomVerificationCode(year: number) {
  return `QQZ-VER-${year}-${randomBytes(16).toString("hex").toUpperCase()}`;
}

async function getRecord(id: number) {
  const [record] = await db.select().from(verificationRecordsTable)
    .where(eq(verificationRecordsTable.id, id)).limit(1);
  return record;
}

async function userCanReadEvidence(userId: number, role: string, record: typeof verificationRecordsTable.$inferSelect) {
  if (role === "admin") return true;
  if (await hasEntityPermission(userId, record.entityId, ["owner", "director", "representative"])) return true;
  if (record.assignedPartnerEntityId && await partnerCanProcess(userId, record.assignedPartnerEntityId)) {
    return true;
  }
  return false;
}

async function sendPrivateEvidence(
  objectPath: string,
  fileName: string,
  res: Response,
) {
  const file = await storage.getObjectEntityFile(objectPath);
  const response = await storage.downloadObject(file, 0);
  res.status(response.status);
  response.headers.forEach((value, key) => res.setHeader(key, value));
  res.setHeader(
    "Content-Disposition",
    `attachment; filename*=UTF-8''${encodeURIComponent(fileName.replace(/[\r\n]/g, ""))}`,
  );
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (response.body) {
    Readable.fromWeb(response.body as ReadableStream<Uint8Array>).pipe(res);
  } else {
    res.end();
  }
}

router.post("/verification/records/:id/evidence", requireAuth, async (req: AuthRequest, res) => {
  const params = AddVerificationEvidenceParams.safeParse(req.params);
  const parsed = AddVerificationEvidenceBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Invalid evidence information" });
    return;
  }
  const record = await getRecord(params.data.id);
  if (!record) {
    res.status(404).json({ error: "Verification request not found" });
    return;
  }
  if (!(await hasEntityPermission(req.user!.userId, record.entityId, ["owner", "director", "representative"]))) {
    res.status(403).json({ error: "Only an entity owner or authorized representative may attach evidence" });
    return;
  }
  const { objectPath, fileName, mimeType, byteSize } = parsed.data;
  if (
    !/^\/objects\/uploads\/[a-f0-9-]{36}$/i.test(objectPath) ||
    !["application/pdf", "image/jpeg", "image/png"].includes(mimeType) ||
    /[/\\\r\n]/.test(fileName)
  ) {
    res.status(400).json({ error: "Evidence must be a PDF, JPEG, or PNG stored through QQZ private uploads" });
    return;
  }
  if (record.status !== "PENDING" && record.status !== "UNDER_REVIEW") {
    res.status(409).json({ error: "Evidence cannot be added to a closed verification request" });
    return;
  }
  try {
    const file = await storage.getObjectEntityFile(objectPath);
    const [metadata] = await file.getMetadata();
    const actualSize = Number(metadata.size ?? 0);
    const actualType = String(metadata.contentType ?? "");
    if (!actualSize || actualSize > 15_000_000 || actualSize !== byteSize ||
        !["application/pdf", "image/jpeg", "image/png"].includes(actualType)) {
      res.status(400).json({ error: "Uploaded file metadata does not match the evidence information" });
      return;
    }
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      res.status(400).json({ error: "Uploaded file was not found in private storage" });
      return;
    }
    req.log.error({ err: error }, "Could not validate verification evidence");
    res.status(500).json({ error: "Could not validate uploaded evidence" });
    return;
  }
  const [evidence] = await db.insert(verificationEvidenceTable).values({
    verificationRecordId: record.id,
    objectPath,
    fileName: fileName.trim(),
    mimeType,
    byteSize,
    uploadedBy: req.user!.userId,
  }).returning({
    id: verificationEvidenceTable.id,
    fileName: verificationEvidenceTable.fileName,
    mimeType: verificationEvidenceTable.mimeType,
    byteSize: verificationEvidenceTable.byteSize,
    createdAt: verificationEvidenceTable.createdAt,
  });
  await appendVerificationAudit({
    recordId: record.id,
    actorId: req.user!.userId,
    action: "evidence_attached",
    details: { evidenceId: evidence.id, fileName: evidence.fileName, mimeType: evidence.mimeType },
  });
  res.status(201).json({ ...evidence, createdAt: evidence.createdAt.toISOString() });
});

router.get(
  "/verification/records/:id/evidence/:evidenceId",
  requireAuth,
  async (req: AuthRequest, res) => {
    const params = DownloadVerificationEvidenceParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "Invalid evidence id" });
      return;
    }
    const record = await getRecord(params.data.id);
    if (!record) {
      res.status(404).json({ error: "Verification request not found" });
      return;
    }
    if (!(await userCanReadEvidence(req.user!.userId, req.user!.role, record))) {
      res.status(403).json({ error: "You are not allowed to view this evidence" });
      return;
    }
    const [evidence] = await db.select().from(verificationEvidenceTable)
      .where(and(
        eq(verificationEvidenceTable.id, params.data.evidenceId),
        eq(verificationEvidenceTable.verificationRecordId, record.id),
      )).limit(1);
    if (!evidence) {
      res.status(404).json({ error: "Evidence file not found" });
      return;
    }
    try {
      await sendPrivateEvidence(evidence.objectPath, evidence.fileName, res);
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        res.status(404).json({ error: "Evidence file not found" });
        return;
      }
      req.log.error({ err: error }, "Could not download verification evidence");
      res.status(500).json({ error: "Could not download evidence" });
    }
  },
);

router.get("/verification/partner/records", requireAuth, async (req: AuthRequest, res) => {
  const memberships = await db.select({ entityId: entityMembershipsTable.entityId })
    .from(entityMembershipsTable)
    .innerJoin(verificationPartnersTable, eq(verificationPartnersTable.entityId, entityMembershipsTable.entityId))
    .where(and(
      eq(entityMembershipsTable.userId, req.user!.userId),
      eq(entityMembershipsTable.status, "active"),
      inArray(entityMembershipsTable.membershipRole, ["owner", "verifier"]),
      eq(verificationPartnersTable.status, "approved"),
      eq(verificationPartnersTable.agreementStatus, "signed"),
    ));
  const partnerIds = memberships.map((item) => item.entityId);
  if (!partnerIds.length) {
    res.json([]);
    return;
  }
  const records = await db.select().from(verificationRecordsTable)
    .where(and(
      inArray(verificationRecordsTable.assignedPartnerEntityId, partnerIds),
      inArray(verificationRecordsTable.status, ["UNDER_REVIEW", "PENDING"]),
    ))
    .orderBy(desc(verificationRecordsTable.createdAt));
  const formatted = await Promise.all(records.map(async (record) => {
    const [entity] = await db.select().from(entitiesTable).where(eq(entitiesTable.id, record.entityId)).limit(1);
    return {
      id: record.id,
      entityId: record.entityId,
      entityName: entity?.displayName ?? "Unknown entity",
      entityType: entity?.entityType ?? "unknown",
      verificationType: record.verificationType,
      countryCode: record.countryCode,
      status: record.status as "PENDING" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED" | "EXPIRED" | "REVOKED",
      notes: record.notes,
      evidence: await getEvidenceMetadata(record.id),
      createdAt: record.createdAt.toISOString(),
    };
  }));
  res.json(GetPartnerVerificationRecordsResponse.parse(formatted));
});

router.post("/verification/partner/records/:id/result", requireAuth, async (req: AuthRequest, res) => {
  const rawId = parsedId(req.params.id);
  const parsed = SubmitPartnerVerificationResultParams.safeParse(req.params);
  const body = SubmitPartnerVerificationResultBody.safeParse(req.body);
  if (!rawId || !parsed.success || !body.success) {
    res.status(400).json({ error: "Invalid partner result" });
    return;
  }
  const record = await getRecord(parsed.data.id);
  if (!record || !record.assignedPartnerEntityId) {
    res.status(404).json({ error: "Assigned verification case not found" });
    return;
  }
  if (!(await partnerCanProcess(req.user!.userId, record.assignedPartnerEntityId))) {
    res.status(403).json({ error: "Your organization is not an approved partner for this case" });
    return;
  }
  if (record.status !== "UNDER_REVIEW") {
    res.status(409).json({ error: "This case is not open for a partner result" });
    return;
  }
  if (await hasConflictOfInterest(record.entityId, record.assignedPartnerEntityId)) {
    res.status(409).json({ error: "A conflict of interest prevents this organization from submitting a result" });
    return;
  }
  const [updated] = await db.update(verificationRecordsTable).set({
    partnerResult: body.data.result,
    partnerNotes: body.data.notes.trim(),
    verifierId: req.user!.userId,
    status: "UNDER_REVIEW",
    updatedAt: new Date(),
  }).where(and(
    eq(verificationRecordsTable.id, record.id),
    eq(verificationRecordsTable.status, "UNDER_REVIEW"),
  )).returning();
  if (!updated) {
    res.status(409).json({ error: "This case was updated by another reviewer" });
    return;
  }
  await appendVerificationAudit({
    recordId: updated.id,
    actorId: req.user!.userId,
    action: "partner_result_submitted",
    previousStatus: record.status,
    newStatus: updated.status,
    details: { result: body.data.result, partnerEntityId: record.assignedPartnerEntityId },
  });
  res.json(await formatVerificationRecord(updated));
});

router.get("/verification/public/:code", async (req, res) => {
  const params = GetPublicVerificationParams.safeParse(req.params);
  if (!params.success || !/^QQZ-VER-\d{4}-[A-F0-9]{32}$/.test(params.data.code)) {
    res.status(404).json({ error: "Verification ID not found" });
    return;
  }
  await expireDueVerifications();
  const [record] = await db.select().from(verificationRecordsTable)
    .where(eq(verificationRecordsTable.verificationCode, params.data.code)).limit(1);
  if (!record || !["VERIFIED", "EXPIRED", "REVOKED"].includes(record.status)) {
    res.status(404).json({ error: "Verification ID not found" });
    return;
  }
  const [entity] = await db.select().from(entitiesTable).where(eq(entitiesTable.id, record.entityId)).limit(1);
  const [result] = await db.select({
    verifierOrganization: verificationRecordsTable.verifierOrganization,
  }).from(verificationRecordsTable).where(eq(verificationRecordsTable.id, record.id)).limit(1);
  res.json(GetPublicVerificationResponse.parse({
    verificationCode: record.verificationCode,
    entityType: entity?.entityType ?? "unknown",
    entityName: entity?.displayName ?? "Unknown entity",
    countryCode: record.countryCode,
    verificationType: record.verificationType,
    status: record.status as "VERIFIED" | "EXPIRED" | "REVOKED",
    verifiedAt: record.verifiedAt?.toISOString() ?? null,
    expiresAt: record.expiresAt?.toISOString() ?? null,
    verifierOrganization: result?.verifierOrganization ?? null,
  }));
});

adminRouter.use(requireAuth, requireRole("admin"));

adminRouter.get("/records", async (_req, res) => {
  await expireDueVerifications();
  const records = await db.select().from(verificationRecordsTable).orderBy(desc(verificationRecordsTable.createdAt));
  const response = await Promise.all(records.map(formatAdminVerificationRecord));
  res.json(response);
});

adminRouter.patch("/records/:id/assign", async (req: AuthRequest, res) => {
  const params = AdminAssignVerificationParams.safeParse(req.params);
  const body = AdminAssignVerificationBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid assignment" });
    return;
  }
  const record = await getRecord(params.data.id);
  if (!record) {
    res.status(404).json({ error: "Verification request not found" });
    return;
  }
  if (!["PENDING", "UNDER_REVIEW"].includes(record.status)) {
    res.status(409).json({ error: "Only open verification requests can be assigned" });
    return;
  }
  const [partner] = await db.select().from(verificationPartnersTable)
    .where(and(
      eq(verificationPartnersTable.entityId, body.data.partnerEntityId),
      eq(verificationPartnersTable.status, "approved"),
      eq(verificationPartnersTable.agreementStatus, "signed"),
    )).limit(1);
  if (!partner || (partner.validUntil && partner.validUntil < new Date())) {
    res.status(400).json({ error: "Partner is not currently approved with a signed QQZ agreement" });
    return;
  }
  if (partner.countryCode !== record.countryCode || !partner.scopeTypes.includes(record.verificationType)) {
    res.status(400).json({ error: "Partner approval does not cover this verification type and country" });
    return;
  }
  if (await hasConflictOfInterest(record.entityId, partner.entityId)) {
    res.status(409).json({ error: "This assignment has a conflict of interest" });
    return;
  }
  const [updated] = await db.update(verificationRecordsTable).set({
    assignedPartnerEntityId: partner.entityId,
    assignedBy: req.user!.userId,
    partnerResult: null,
    partnerNotes: null,
    status: "UNDER_REVIEW",
    updatedAt: new Date(),
  }).where(eq(verificationRecordsTable.id, record.id)).returning();
  await appendVerificationAudit({
    recordId: record.id,
    actorId: req.user!.userId,
    action: "partner_assigned",
    previousStatus: record.status,
    newStatus: "UNDER_REVIEW",
    details: { partnerEntityId: partner.entityId },
  });
  res.json(await formatVerificationRecord(updated));
});

adminRouter.patch("/records/:id/decision", async (req: AuthRequest, res) => {
  const params = AdminDecideVerificationParams.safeParse(req.params);
  const body = AdminDecideVerificationBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid verification decision" });
    return;
  }
  const record = await getRecord(params.data.id);
  if (!record) {
    res.status(404).json({ error: "Verification request not found" });
    return;
  }
  const { decision } = body.data;
  if (decision === "VERIFIED" && (!record.assignedPartnerEntityId || record.partnerResult !== "VERIFIED")) {
    res.status(409).json({ error: "A positive result from the assigned approved partner is required before QQZ approval" });
    return;
  }
  if (decision === "REVOKED" && record.status !== "VERIFIED") {
    res.status(409).json({ error: "Only an active verification can be revoked" });
    return;
  }
  if (decision === "VERIFIED" && body.data.expiresAt && body.data.expiresAt <= new Date()) {
    res.status(400).json({ error: "Expiry date must be in the future" });
    return;
  }
  if (decision === "VERIFIED" && body.data.reviewAt && body.data.reviewAt <= new Date()) {
    res.status(400).json({ error: "Review date must be in the future" });
    return;
  }
  const year = new Date().getFullYear();
  const [updated] = await db.update(verificationRecordsTable).set({
    status: decision,
    verificationCode: record.verificationCode ?? randomVerificationCode(year),
    reviewedBy: req.user!.userId,
    verifierOrganization: record.assignedPartnerEntityId
      ? (await db.select({ displayName: entitiesTable.displayName }).from(entitiesTable)
          .where(eq(entitiesTable.id, record.assignedPartnerEntityId)).limit(1))[0]?.displayName ?? null
      : null,
    verifiedAt: decision === "VERIFIED" ? new Date() : record.verifiedAt,
    expiresAt: decision === "VERIFIED" ? body.data.expiresAt ?? null : record.expiresAt,
    reviewAt: decision === "VERIFIED" ? body.data.reviewAt ?? null : record.reviewAt,
    notes: body.data.notes?.trim() ?? record.notes,
    updatedAt: new Date(),
  }).where(eq(verificationRecordsTable.id, record.id)).returning();
  await appendVerificationAudit({
    recordId: record.id,
    actorId: req.user!.userId,
    action: `admin_decision_${decision.toLowerCase()}`,
    previousStatus: record.status,
    newStatus: decision,
    details: {
      notes: body.data.notes?.trim() ?? null,
      verifierOrganization: updated.verifierOrganization,
      verificationCode: updated.verificationCode,
    },
  });
  res.json(await formatVerificationRecord(updated));
});

adminRouter.get("/partners", async (_req, res) => {
  const partners = await db.select({
    partner: verificationPartnersTable,
    entity: entitiesTable,
  }).from(verificationPartnersTable)
    .innerJoin(entitiesTable, eq(entitiesTable.id, verificationPartnersTable.entityId))
    .orderBy(desc(verificationPartnersTable.createdAt));
  const result = partners.map(({ partner, entity }) => ({
    id: partner.id,
    entityId: partner.entityId,
    entityName: entity.displayName,
    countryCode: partner.countryCode,
    authorizingBody: partner.authorizingBody,
    authorizationBasis: partner.authorizationBasis,
    scopeTypes: partner.scopeTypes,
    agreementStatus: partner.agreementStatus as "pending" | "signed" | "expired",
    status: partner.status as "pending" | "approved" | "rejected" | "suspended",
    validUntil: partner.validUntil?.toISOString() ?? null,
    submittedBy: partner.submittedBy,
  }));
  res.json(AdminGetVerificationPartnersResponse.parse(result));
});

adminRouter.patch("/partners/:id/decision", async (req: AuthRequest, res) => {
  const params = AdminDecideVerificationPartnerParams.safeParse(req.params);
  const body = AdminDecideVerificationPartnerBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid partner decision" });
    return;
  }
  const [partner] = await db.select().from(verificationPartnersTable)
    .where(eq(verificationPartnersTable.id, params.data.id)).limit(1);
  if (!partner) {
    res.status(404).json({ error: "Verification partner application not found" });
    return;
  }
  if (body.data.status === "approved") {
    if (
      body.data.agreementStatus !== "signed" ||
      !partner.authorizingBody.trim() ||
      !partner.authorizationBasis.trim() ||
      partner.scopeTypes.length === 0
    ) {
      res.status(400).json({ error: "Approval requires a recorded authorization basis, verification scope, and signed QQZ agreement" });
      return;
    }
    if (body.data.validUntil && body.data.validUntil <= new Date()) {
      res.status(400).json({ error: "Partner approval validity must be in the future" });
      return;
    }
  }
  const [updatedPartner] = await db.update(verificationPartnersTable).set({
    status: body.data.status,
    agreementStatus: body.data.agreementStatus,
    agreementReference: body.data.agreementReference?.trim() ?? partner.agreementReference,
    validUntil: body.data.validUntil ?? partner.validUntil,
    reviewedBy: req.user!.userId,
    reviewedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(verificationPartnersTable.id, partner.id)).returning();
  const [entity] = await db.select({ displayName: entitiesTable.displayName })
    .from(entitiesTable).where(eq(entitiesTable.id, partner.entityId)).limit(1);
  await db.insert(verificationAuditTable).values({
    verificationRecordId: 0,
    actorId: req.user!.userId,
    action: "partner_application_decision",
    details: {
      partnerEntityId: partner.entityId,
      status: body.data.status,
      agreementStatus: body.data.agreementStatus,
      authorizationBasis: partner.authorizationBasis,
    },
  });
  res.json({
    id: updatedPartner.id,
    entityId: updatedPartner.entityId,
    entityName: entity?.displayName ?? "Unknown entity",
    countryCode: updatedPartner.countryCode,
    authorizingBody: updatedPartner.authorizingBody,
    authorizationBasis: updatedPartner.authorizationBasis,
    scopeTypes: updatedPartner.scopeTypes,
    agreementStatus: updatedPartner.agreementStatus as "pending" | "signed" | "expired",
    status: updatedPartner.status as "pending" | "approved" | "rejected" | "suspended",
    validUntil: updatedPartner.validUntil?.toISOString() ?? null,
    submittedBy: updatedPartner.submittedBy,
  });
});

router.use("/admin/verification", adminRouter);

export default router;
