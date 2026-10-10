import { and, eq, inArray, or } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  companyAffiliationsTable,
  entitiesTable,
  entityMembershipsTable,
  verificationAuditTable,
  verificationEvidenceTable,
  verificationPartnersTable,
  verificationRecordsTable,
  usersTable,
} from "@workspace/db/schema";

export const verificationTypeLabels: Record<string, string> = {
  identity: "Identity Verified",
  company_registration: "Company Registration Verified",
  business_document: "Business Document Verified",
  professional_qualification: "Qualification Verified",
  professional_certification: "Certification Verified",
  document_attestation: "Document Attestation Verified",
  director_representative: "Director / Representative Verified",
  ownership_document: "Ownership Document Verified",
};

export async function getActiveMembership(userId: number, entityId: number) {
  const [membership] = await db
    .select()
    .from(entityMembershipsTable)
    .where(
      and(
        eq(entityMembershipsTable.userId, userId),
        eq(entityMembershipsTable.entityId, entityId),
        eq(entityMembershipsTable.status, "active"),
      ),
    )
    .limit(1);
  return membership;
}

export async function hasEntityPermission(
  userId: number,
  entityId: number,
  allowedRoles: string[],
) {
  const membership = await getActiveMembership(userId, entityId);
  return Boolean(membership && allowedRoles.includes(membership.membershipRole));
}

export async function getEvidenceMetadata(verificationRecordId: number) {
  const evidence = await db
    .select({
      id: verificationEvidenceTable.id,
      fileName: verificationEvidenceTable.fileName,
      mimeType: verificationEvidenceTable.mimeType,
      byteSize: verificationEvidenceTable.byteSize,
      createdAt: verificationEvidenceTable.createdAt,
    })
    .from(verificationEvidenceTable)
    .where(eq(verificationEvidenceTable.verificationRecordId, verificationRecordId))
    .orderBy(verificationEvidenceTable.createdAt);
  return evidence.map((item) => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
  }));
}

export async function formatVerificationRecord(
  record: typeof verificationRecordsTable.$inferSelect,
) {
  const [entity] = await db
    .select({ displayName: entitiesTable.displayName })
    .from(entitiesTable)
    .where(eq(entitiesTable.id, record.entityId))
    .limit(1);
  let assignedPartnerOrganization: string | null = null;
  if (record.assignedPartnerEntityId) {
    const [partnerEntity] = await db
      .select({ displayName: entitiesTable.displayName })
      .from(entitiesTable)
      .where(eq(entitiesTable.id, record.assignedPartnerEntityId))
      .limit(1);
    assignedPartnerOrganization = partnerEntity?.displayName ?? null;
  }
  return {
    id: record.id,
    entityId: record.entityId,
    entityName: entity?.displayName ?? null,
    verificationType: record.verificationType,
    countryCode: record.countryCode,
    status: record.status as "PENDING" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED" | "EXPIRED" | "REVOKED",
    verificationCode: record.verificationCode,
    assignedPartnerOrganization,
    verifiedAt: record.verifiedAt?.toISOString() ?? null,
    reviewAt: record.reviewAt?.toISOString() ?? null,
    expiresAt: record.expiresAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    evidence: await getEvidenceMetadata(record.id),
  };
}

export async function appendVerificationAudit(args: {
  recordId: number;
  actorId: number | null;
  action: string;
  previousStatus?: string | null;
  newStatus?: string | null;
  details?: Record<string, unknown>;
}) {
  await db.insert(verificationAuditTable).values({
    verificationRecordId: args.recordId,
    actorId: args.actorId,
    action: args.action,
    previousStatus: args.previousStatus ?? null,
    newStatus: args.newStatus ?? null,
    details: args.details ?? {},
  });
}

export async function expireDueVerifications() {
  const now = new Date();
  // Avoid timestamp equality for expiry/review. Expire rows in bounded reads so the
  // public check reflects current status even before a background worker is added.
  const candidates = await db
    .select()
    .from(verificationRecordsTable)
    .where(eq(verificationRecordsTable.status, "VERIFIED"));
  for (const record of candidates) {
    const dueAt = [record.expiresAt, record.reviewAt]
      .filter((value): value is Date => value instanceof Date)
      .sort((a, b) => a.getTime() - b.getTime())[0];
    if (dueAt && dueAt <= now) {
      const [expired] = await db
        .update(verificationRecordsTable)
        .set({ status: "EXPIRED", updatedAt: now })
        .where(
          and(
            eq(verificationRecordsTable.id, record.id),
            eq(verificationRecordsTable.status, "VERIFIED"),
          ),
        )
        .returning({ id: verificationRecordsTable.id });
      if (expired) {
        await appendVerificationAudit({
          recordId: record.id,
          actorId: null,
          action: "automatically_expired",
          previousStatus: "VERIFIED",
          newStatus: "EXPIRED",
          details: { reason: record.expiresAt && record.expiresAt <= now ? "expiry_date" : "review_date" },
        });
      }
    }
  }
}

export async function partnerCanProcess(userId: number, partnerEntityId: number) {
  const [partner] = await db
    .select()
    .from(verificationPartnersTable)
    .where(eq(verificationPartnersTable.entityId, partnerEntityId))
    .limit(1);
  if (
    !partner ||
    partner.status !== "approved" ||
    partner.agreementStatus !== "signed" ||
    (partner.validUntil && partner.validUntil < new Date())
  ) {
    return false;
  }
  return hasEntityPermission(userId, partnerEntityId, ["owner", "verifier"]);
}

export async function hasConflictOfInterest(
  verificationEntityId: number,
  partnerEntityId: number,
) {
  const [targetMembers, partnerMembers] = await Promise.all([
    db
    .select({ userId: entityMembershipsTable.userId })
    .from(entityMembershipsTable)
    .where(
      and(
        eq(entityMembershipsTable.entityId, verificationEntityId),
        eq(entityMembershipsTable.status, "active"),
      ),
    );
    db
      .select({ userId: entityMembershipsTable.userId })
      .from(entityMembershipsTable)
      .where(
        and(
          eq(entityMembershipsTable.entityId, partnerEntityId),
          eq(entityMembershipsTable.status, "active"),
        ),
      ),
  ]);
  const targetIds = new Set(targetMembers.map((row) => row.userId).filter((id): id is number => id !== null));
  if (partnerMembers.some((row) => row.userId !== null && targetIds.has(row.userId))) return true;
  const [sameCompanyLink] = await db
    .select({ id: companyAffiliationsTable.id })
    .from(companyAffiliationsTable)
    .where(
      or(
        and(
          eq(companyAffiliationsTable.companyEntityId, verificationEntityId),
          eq(companyAffiliationsTable.individualEntityId, partnerEntityId),
        ),
        and(
          eq(companyAffiliationsTable.companyEntityId, partnerEntityId),
          eq(companyAffiliationsTable.individualEntityId, verificationEntityId),
        ),
      ),
    )
    .limit(1);
  return Boolean(sameCompanyLink);
}

export async function formatAdminVerificationRecord(
  record: typeof verificationRecordsTable.$inferSelect,
) {
  const [entity] = await db
    .select({
      displayName: entitiesTable.displayName,
      entityType: entitiesTable.entityType,
    })
    .from(entitiesTable)
    .where(eq(entitiesTable.id, record.entityId))
    .limit(1);
  let assignedPartnerOrganization: string | null = null;
  if (record.assignedPartnerEntityId) {
    const [partner] = await db
      .select({ displayName: entitiesTable.displayName })
      .from(entitiesTable)
      .where(eq(entitiesTable.id, record.assignedPartnerEntityId))
      .limit(1);
    assignedPartnerOrganization = partner?.displayName ?? null;
  }
  return {
    id: record.id,
    entityId: record.entityId,
    entityName: entity?.displayName ?? "Unknown entity",
    entityType: entity?.entityType ?? "unknown",
    verificationType: record.verificationType,
    countryCode: record.countryCode,
    status: record.status as "PENDING" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED" | "EXPIRED" | "REVOKED",
    verificationCode: record.verificationCode,
    assignedPartnerEntityId: record.assignedPartnerEntityId,
    assignedPartnerOrganization,
    partnerResult: record.partnerResult,
    partnerNotes: record.partnerNotes,
    verifierOrganization: record.verifierOrganization,
    notes: record.notes,
    verifiedAt: record.verifiedAt?.toISOString() ?? null,
    reviewAt: record.reviewAt?.toISOString() ?? null,
    expiresAt: record.expiresAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    evidence: await getEvidenceMetadata(record.id),
    audit: (await db.select().from(verificationAuditTable)
      .where(eq(verificationAuditTable.verificationRecordId, record.id))
      .orderBy(verificationAuditTable.createdAt))
      .map((entry) => ({
        id: entry.id,
        actorId: entry.actorId,
        action: entry.action,
        previousStatus: entry.previousStatus,
        newStatus: entry.newStatus,
        details: entry.details,
        createdAt: entry.createdAt.toISOString(),
      })),
  };
}

export async function entityMemberUser(entityId: number, userId: number) {
  const [user] = await db
    .select({ id: usersTable.id })
    .from(entityMembershipsTable)
    .innerJoin(usersTable, eq(usersTable.id, entityMembershipsTable.userId))
    .where(
      and(
        eq(entityMembershipsTable.entityId, entityId),
        eq(entityMembershipsTable.userId, userId),
        eq(entityMembershipsTable.status, "active"),
      ),
    )
    .limit(1);
  return Boolean(user);
}
