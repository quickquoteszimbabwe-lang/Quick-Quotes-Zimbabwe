import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  companyAffiliationsTable,
  companyProfilesTable,
  entitiesTable,
  entityMembershipsTable,
  professionalsTable,
  usersTable,
  verificationAuditTable,
  verificationPartnersTable,
  verificationRecordsTable,
} from "@workspace/db/schema";
import {
  AcceptEntityInvitationParams,
  AppealVerificationDecisionBody,
  AppealVerificationDecisionParams,
  CreateCompanyAffiliationBody,
  CreateCompanyAffiliationParams,
  CreateEntityBody,
  CreateEntityVerificationBody,
  CreateEntityVerificationParams,
  GetEntityMembersParams,
  GetEntityVerificationRecordsParams,
  InviteEntityMemberBody,
  InviteEntityMemberParams,
  RevokeEntityMemberParams,
} from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import {
  appendVerificationAudit,
  formatVerificationRecord,
  getActiveMembership,
  hasEntityPermission,
} from "../lib/verification-system";

const router: IRouter = Router();
const entityTypes = ["individual_professional", "company_business", "asset_owner", "verification_partner"];
const verifierScopes = [
  "identity",
  "company_registration",
  "business_document",
  "professional_qualification",
  "professional_certification",
  "document_attestation",
  "director_representative",
  "ownership_document",
];

function parsedId(raw: string | string[] | undefined): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function formatMembership(membership: typeof entityMembershipsTable.$inferSelect, entityName: string | null) {
  return {
    id: membership.id,
    entityId: membership.entityId,
    entityName,
    userId: membership.userId,
    email: membership.email,
    membershipRole: membership.membershipRole,
    status: membership.status as "invited" | "active" | "revoked",
    invitedBy: membership.invitedBy,
    acceptedAt: membership.acceptedAt?.toISOString() ?? null,
    createdAt: membership.createdAt.toISOString(),
  };
}

async function formatAffiliation(row: typeof companyAffiliationsTable.$inferSelect) {
  const [individual, user] = await Promise.all([
    db.select({ displayName: entitiesTable.displayName }).from(entitiesTable)
      .where(eq(entitiesTable.id, row.individualEntityId)).limit(1),
    db.select({ id: usersTable.id }).from(usersTable)
      .where(eq(usersTable.id, row.userId)).limit(1),
  ]);
  return {
    id: row.id,
    companyEntityId: row.companyEntityId,
    individualEntityId: row.individualEntityId,
    individualName: individual[0]?.displayName ?? "Individual professional",
    userId: user[0]?.id ?? row.userId,
    relationshipType: row.relationshipType,
    status: row.status,
  };
}

async function formatWorkspace(
  entity: typeof entitiesTable.$inferSelect,
  membershipRole: string,
) {
  const [company] = entity.entityType === "company_business"
    ? await db.select().from(companyProfilesTable).where(eq(companyProfilesTable.entityId, entity.id)).limit(1)
    : [];
  const [partner] = entity.entityType === "verification_partner"
    ? await db.select().from(verificationPartnersTable).where(eq(verificationPartnersTable.entityId, entity.id)).limit(1)
    : [];
  const affiliations = entity.entityType === "company_business"
    ? await db.select().from(companyAffiliationsTable).where(eq(companyAffiliationsTable.companyEntityId, entity.id))
    : [];
  return {
    id: entity.id,
    entityType: entity.entityType as "individual_professional" | "company_business" | "asset_owner" | "verification_partner",
    displayName: entity.displayName,
    description: entity.description,
    countryCode: entity.countryCode,
    status: entity.status,
    membershipRole,
    createdAt: entity.createdAt.toISOString(),
    registrationNumber: company?.registrationNumber ?? null,
    industry: company?.industry ?? null,
    address: company?.address ?? null,
    partnerStatus: partner?.status ?? null,
    agreementStatus: partner?.agreementStatus ?? null,
    authorizingBody: partner?.authorizingBody ?? null,
    authorizationBasis: partner?.authorizationBasis ?? null,
    scopeTypes: partner?.scopeTypes ?? [],
    affiliations: await Promise.all(affiliations.map(formatAffiliation)),
  };
}

router.get("/entities/mine", requireAuth, async (req: AuthRequest, res) => {
  const memberships = await db.select({
    membership: entityMembershipsTable,
    entity: entitiesTable,
  })
    .from(entityMembershipsTable)
    .innerJoin(entitiesTable, eq(entitiesTable.id, entityMembershipsTable.entityId))
    .where(and(
      eq(entityMembershipsTable.userId, req.user!.userId),
      eq(entityMembershipsTable.status, "active"),
      eq(entitiesTable.status, "active"),
    ))
    .orderBy(desc(entitiesTable.createdAt));
  const results = await Promise.all(memberships.map(({ membership, entity }) =>
    formatWorkspace(entity, membership.membershipRole)));
  res.json(results);
});

router.post("/entities", requireAuth, async (req: AuthRequest, res) => {
  const parsed = CreateEntityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid entity profile" });
    return;
  }
  const input = parsed.data;
  const countryCode = (input.countryCode ?? "ZW").toUpperCase();
  if (!/^[A-Z]{2}$/.test(countryCode)) {
    res.status(400).json({ error: "Country must be a two-letter country code" });
    return;
  }
  if (!entityTypes.includes(input.entityType)) {
    res.status(400).json({ error: "Unsupported entity type" });
    return;
  }

  let legacyProfessionalId: number | null = null;
  if (input.entityType === "individual_professional") {
    if (req.user!.role !== "professional") {
      res.status(403).json({ error: "Only a professional account can create an individual professional entity" });
      return;
    }
    const [professional] = await db.select().from(professionalsTable)
      .where(eq(professionalsTable.userId, req.user!.userId)).limit(1);
    if (!professional) {
      res.status(409).json({ error: "Create your individual professional profile before linking this entity" });
      return;
    }
    legacyProfessionalId = professional.id;
    const [existing] = await db.select({ id: entitiesTable.id }).from(entitiesTable)
      .where(eq(entitiesTable.legacyProfessionalId, professional.id)).limit(1);
    if (existing) {
      res.status(409).json({ error: "An individual professional entity is already linked to this account" });
      return;
    }
  }
  if (input.entityType === "verification_partner") {
    if (!input.authorizingBody?.trim() || !input.authorizationBasis?.trim() ||
        !input.scopeTypes?.length || input.scopeTypes.some((scope) => !verifierScopes.includes(scope))) {
      res.status(400).json({ error: "Partner applications require the authorizing body, stated basis, and at least one verification scope" });
      return;
    }
  }

  const result = await db.transaction(async (tx) => {
    const [entity] = await tx.insert(entitiesTable).values({
      entityType: input.entityType,
      displayName: input.displayName.trim(),
      description: input.description?.trim() || null,
      countryCode,
      createdBy: req.user!.userId,
      legacyProfessionalId,
    }).returning();
    const [user] = await tx.select({ email: usersTable.email }).from(usersTable)
      .where(eq(usersTable.id, req.user!.userId)).limit(1);
    const [membership] = await tx.insert(entityMembershipsTable).values({
      entityId: entity.id,
      userId: req.user!.userId,
      email: user.email.toLowerCase(),
      membershipRole: "owner",
      status: "active",
      invitedBy: req.user!.userId,
      acceptedAt: new Date(),
    }).returning();

    if (input.entityType === "company_business") {
      await tx.insert(companyProfilesTable).values({
        entityId: entity.id,
        registrationNumber: input.registrationNumber?.trim() || null,
        industry: input.industry?.trim() || null,
        address: input.address?.trim() || null,
      });
    }
    if (input.entityType === "verification_partner") {
      await tx.insert(verificationPartnersTable).values({
        entityId: entity.id,
        countryCode,
        authorizingBody: input.authorizingBody!.trim(),
        authorizationBasis: input.authorizationBasis!.trim(),
        scopeTypes: input.scopeTypes!,
        agreementStatus: "pending",
        status: "pending",
        submittedBy: req.user!.userId,
      });
    }
    return { entity, membership };
  });
  res.status(201).json(await formatWorkspace(result.entity, result.membership.membershipRole));
});

router.get("/entities/:id/public", async (req, res) => {
  const id = parsedId(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid entity id" });
    return;
  }
  const [entity] = await db.select().from(entitiesTable)
    .where(and(eq(entitiesTable.id, id), eq(entitiesTable.status, "active"))).limit(1);
  if (!entity) {
    res.status(404).json({ error: "Entity not found" });
    return;
  }
  const now = new Date();
  const records = await db.select().from(verificationRecordsTable)
    .where(and(eq(verificationRecordsTable.entityId, id), eq(verificationRecordsTable.status, "VERIFIED")));
  const badges = records
    .filter((record) =>
      Boolean(record.verificationCode) &&
      (!record.expiresAt || record.expiresAt > now) &&
      (!record.reviewAt || record.reviewAt > now),
    )
    .map((record) => ({
      verificationType: record.verificationType,
      label: ({
        identity: "Identity Verified",
        company_registration: "Company Registration Verified",
        business_document: "Business Document Verified",
        professional_qualification: "Qualification Verified",
        professional_certification: "Certification Verified",
        document_attestation: "Document Attestation Verified",
        director_representative: "Director / Representative Verified",
        ownership_document: "Ownership Document Verified",
      } as Record<string, string>)[record.verificationType] ?? `${record.verificationType} Verified`,
      status: "VERIFIED" as const,
      verificationCode: record.verificationCode!,
      verifiedAt: record.verifiedAt?.toISOString() ?? "",
      expiresAt: record.expiresAt?.toISOString() ?? null,
    }));
  res.json({
    id: entity.id,
    entityType: entity.entityType as "individual_professional" | "company_business" | "asset_owner" | "verification_partner",
    displayName: entity.displayName,
    description: entity.description,
    countryCode: entity.countryCode,
    badges,
  });
});

router.get("/entities/:id/members", requireAuth, async (req: AuthRequest, res) => {
  const params = GetEntityMembersParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid entity id" });
    return;
  }
  const membership = await getActiveMembership(req.user!.userId, params.data.id);
  if (!membership) {
    res.status(403).json({ error: "You do not belong to this entity" });
    return;
  }
  const entityMemberships = await db.select().from(entityMembershipsTable)
    .where(eq(entityMembershipsTable.entityId, params.data.id))
    .orderBy(entityMembershipsTable.createdAt);
  const [entity] = await db.select({ displayName: entitiesTable.displayName })
    .from(entitiesTable).where(eq(entitiesTable.id, params.data.id)).limit(1);
  res.json(entityMemberships.map((item) => formatMembership(item, entity?.displayName ?? null)));
});

router.post("/entities/:id/members", requireAuth, async (req: AuthRequest, res) => {
  const params = InviteEntityMemberParams.safeParse(req.params);
  const parsed = InviteEntityMemberBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Invalid invitation" });
    return;
  }
  const actorMembership = await getActiveMembership(req.user!.userId, params.data.id);
  if (!actorMembership || actorMembership.membershipRole !== "owner") {
    res.status(403).json({ error: "Only an entity owner can invite members" });
    return;
  }
  const [entity] = await db.select().from(entitiesTable)
    .where(eq(entitiesTable.id, params.data.id)).limit(1);
  if (!entity) {
    res.status(404).json({ error: "Entity not found" });
    return;
  }
  if (
    (entity.entityType === "verification_partner" && parsed.data.membershipRole !== "verifier") ||
    (entity.entityType !== "verification_partner" && parsed.data.membershipRole === "verifier")
  ) {
    res.status(400).json({ error: "Membership type does not match this entity" });
    return;
  }
  const email = parsed.data.email.trim().toLowerCase();
  const [existing] = await db.select().from(entityMembershipsTable)
    .where(and(eq(entityMembershipsTable.entityId, entity.id), eq(entityMembershipsTable.email, email))).limit(1);
  let membership: typeof entityMembershipsTable.$inferSelect;
  if (existing) {
    if (existing.status !== "revoked") {
      res.status(409).json({ error: "This email already has an invitation or membership" });
      return;
    }
    const [updated] = await db.update(entityMembershipsTable).set({
      userId: null,
      membershipRole: parsed.data.membershipRole,
      status: "invited",
      invitedBy: req.user!.userId,
      acceptedAt: null,
      updatedAt: new Date(),
    }).where(eq(entityMembershipsTable.id, existing.id)).returning();
    membership = updated;
  } else {
    const [user] = await db.select({ id: usersTable.id }).from(usersTable)
      .where(eq(usersTable.email, email)).limit(1);
    const [created] = await db.insert(entityMembershipsTable).values({
      entityId: entity.id,
      userId: user?.id ?? null,
      email,
      membershipRole: parsed.data.membershipRole,
      status: "invited",
      invitedBy: req.user!.userId,
    }).returning();
    membership = created;
  }
  res.status(201).json(formatMembership(membership, entity.displayName));
});

router.delete("/entities/:id/members/:membershipId", requireAuth, async (req: AuthRequest, res) => {
  const params = RevokeEntityMemberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid member id" });
    return;
  }
  const actorMembership = await getActiveMembership(req.user!.userId, params.data.id);
  if (!actorMembership || actorMembership.membershipRole !== "owner") {
    res.status(403).json({ error: "Only an entity owner can revoke members" });
    return;
  }
  const [target] = await db.select().from(entityMembershipsTable)
    .where(and(
      eq(entityMembershipsTable.id, params.data.membershipId),
      eq(entityMembershipsTable.entityId, params.data.id),
    )).limit(1);
  if (!target) {
    res.status(404).json({ error: "Membership not found" });
    return;
  }
  if (target.membershipRole === "owner") {
    res.status(400).json({ error: "The owner cannot be removed from the entity" });
    return;
  }
  await db.update(entityMembershipsTable).set({ status: "revoked", updatedAt: new Date() })
    .where(eq(entityMembershipsTable.id, target.id));
  res.json({ message: "Membership revoked" });
});

router.get("/entities/invitations", requireAuth, async (req: AuthRequest, res) => {
  const [user] = await db.select({ email: usersTable.email }).from(usersTable)
    .where(eq(usersTable.id, req.user!.userId)).limit(1);
  const invitations = await db.select({
    membership: entityMembershipsTable,
    entity: entitiesTable,
  })
    .from(entityMembershipsTable)
    .innerJoin(entitiesTable, eq(entitiesTable.id, entityMembershipsTable.entityId))
    .where(and(
      eq(entityMembershipsTable.email, user.email.toLowerCase()),
      eq(entityMembershipsTable.status, "invited"),
    ))
    .orderBy(desc(entityMembershipsTable.createdAt));
  res.json(invitations.map(({ membership, entity }) => formatMembership(membership, entity.displayName)));
});

router.post("/entities/invitations/:id/accept", requireAuth, async (req: AuthRequest, res) => {
  const params = AcceptEntityInvitationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid invitation id" });
    return;
  }
  const [user] = await db.select({ email: usersTable.email }).from(usersTable)
    .where(eq(usersTable.id, req.user!.userId)).limit(1);
  const [membership] = await db.update(entityMembershipsTable).set({
    userId: req.user!.userId,
    status: "active",
    acceptedAt: new Date(),
    updatedAt: new Date(),
  }).where(and(
    eq(entityMembershipsTable.id, params.data.id),
    eq(entityMembershipsTable.email, user.email.toLowerCase()),
    eq(entityMembershipsTable.status, "invited"),
  )).returning();
  if (!membership) {
    res.status(404).json({ error: "Invitation not found for this account" });
    return;
  }
  const [entity] = await db.select({ displayName: entitiesTable.displayName })
    .from(entitiesTable).where(eq(entitiesTable.id, membership.entityId)).limit(1);
  res.json(formatMembership(membership, entity?.displayName ?? null));
});

router.post("/entities/:id/affiliations", requireAuth, async (req: AuthRequest, res) => {
  const params = CreateCompanyAffiliationParams.safeParse(req.params);
  const parsed = CreateCompanyAffiliationBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Invalid company affiliation" });
    return;
  }
  const companyMembership = await getActiveMembership(req.user!.userId, params.data.id);
  if (!companyMembership || companyMembership.membershipRole !== "owner") {
    res.status(403).json({ error: "Only the company owner can link a professional profile" });
    return;
  }
  const [company] = await db.select().from(entitiesTable)
    .where(eq(entitiesTable.id, params.data.id)).limit(1);
  const [professionalEntity] = await db.select().from(entitiesTable)
    .where(eq(entitiesTable.id, parsed.data.individualEntityId)).limit(1);
  if (company?.entityType !== "company_business" || professionalEntity?.entityType !== "individual_professional") {
    res.status(400).json({ error: "Affiliations require a company and an individual professional entity" });
    return;
  }
  const individualMembership = await getActiveMembership(req.user!.userId, professionalEntity.id);
  if (!individualMembership || professionalEntity.createdBy !== req.user!.userId) {
    res.status(403).json({ error: "Only the individual profile owner can link that profile" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
  const [affiliation] = await db.insert(companyAffiliationsTable).values({
    companyEntityId: company.id,
    individualEntityId: professionalEntity.id,
    userId: user.id,
    relationshipType: parsed.data.relationshipType,
    status: "active",
    createdBy: req.user!.userId,
  }).onConflictDoUpdate({
    target: [companyAffiliationsTable.companyEntityId, companyAffiliationsTable.individualEntityId],
    set: { relationshipType: parsed.data.relationshipType, status: "active" },
  }).returning();
  res.status(201).json(await formatAffiliation(affiliation));
});

router.get("/entities/:id/verification-records", requireAuth, async (req: AuthRequest, res) => {
  const params = GetEntityVerificationRecordsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid entity id" });
    return;
  }
  if (!(await getActiveMembership(req.user!.userId, params.data.id))) {
    res.status(403).json({ error: "You do not belong to this entity" });
    return;
  }
  const records = await db.select().from(verificationRecordsTable)
    .where(eq(verificationRecordsTable.entityId, params.data.id))
    .orderBy(desc(verificationRecordsTable.createdAt));
  res.json(await Promise.all(records.map(formatVerificationRecord)));
});

router.post("/entities/:id/verification-records", requireAuth, async (req: AuthRequest, res) => {
  const params = CreateEntityVerificationParams.safeParse(req.params);
  const parsed = CreateEntityVerificationBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Invalid verification request" });
    return;
  }
  const canRequest = await hasEntityPermission(req.user!.userId, params.data.id, [
    "owner",
    "director",
    "representative",
  ]);
  if (!canRequest) {
    res.status(403).json({ error: "You do not have permission to request verification for this entity" });
    return;
  }
  const [entity] = await db.select().from(entitiesTable)
    .where(eq(entitiesTable.id, params.data.id)).limit(1);
  if (!entity || entity.status !== "active") {
    res.status(404).json({ error: "Entity not found" });
    return;
  }
  const date = parsed.data.reviewAt ?? null;
  if (date && date <= new Date()) {
    res.status(400).json({ error: "Review date must be in the future" });
    return;
  }
  const [record] = await db.insert(verificationRecordsTable).values({
    entityId: entity.id,
    verificationType: parsed.data.verificationType,
    countryCode: entity.countryCode,
    status: "PENDING",
    submittedBy: req.user!.userId,
    reviewAt: date,
  }).returning();
  await appendVerificationAudit({
    recordId: record.id,
    actorId: req.user!.userId,
    action: "request_created",
    newStatus: "PENDING",
    details: { verificationType: record.verificationType, countryCode: record.countryCode },
  });
  res.status(201).json(await formatVerificationRecord(record));
});

router.post("/entities/:id/verification-records/:recordId/appeal", requireAuth, async (req: AuthRequest, res) => {
  const entityParams = GetEntityVerificationRecordsParams.safeParse({ id: req.params.id });
  const recordParams = AppealVerificationDecisionParams.safeParse({
    id: req.params.id,
    recordId: req.params.recordId,
  });
  const body = AppealVerificationDecisionBody.safeParse(req.body);
  if (!entityParams.success || !recordParams.success || !body.success || body.data.message.trim().length < 20) {
    res.status(400).json({ error: "Appeal must include at least 20 characters explaining the disagreement" });
    return;
  }
  if (!(await hasEntityPermission(req.user!.userId, entityParams.data.id, ["owner", "director", "representative"]))) {
    res.status(403).json({ error: "Only an owner or authorized representative may appeal" });
    return;
  }
  const [record] = await db.select().from(verificationRecordsTable)
    .where(and(
      eq(verificationRecordsTable.id, recordParams.data.recordId),
      eq(verificationRecordsTable.entityId, entityParams.data.id),
    )).limit(1);
  if (!record || record.status !== "REJECTED") {
    res.status(409).json({ error: "Only a rejected verification decision can be appealed" });
    return;
  }
  const [existingAppeal] = await db.select({ id: verificationRecordsTable.id })
    .from(verificationRecordsTable)
    .innerJoin(verificationAuditTable, eq(verificationAuditTable.verificationRecordId, verificationRecordsTable.id))
    .where(and(
      eq(verificationRecordsTable.id, record.id),
      eq(verificationAuditTable.action, "appeal_submitted"),
    )).limit(1);
  if (existingAppeal) {
    res.status(409).json({ error: "An appeal has already been submitted for this decision" });
    return;
  }
  await appendVerificationAudit({
    recordId: record.id,
    actorId: req.user!.userId,
    action: "appeal_submitted",
    previousStatus: record.status,
    newStatus: record.status,
    details: { message: body.data.message.trim() },
  });
  res.status(201).json({ message: "Appeal submitted for QQZ review" });
});

export default router;
