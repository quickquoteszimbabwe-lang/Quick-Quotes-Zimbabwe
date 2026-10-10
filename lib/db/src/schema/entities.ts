import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import {
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const entitiesTable = pgTable(
  "qqz_entities",
  {
    id: serial("id").primaryKey(),
    entityType: text("entity_type").notNull(),
    displayName: text("display_name").notNull(),
    description: text("description"),
    countryCode: text("country_code").notNull().default("ZW"),
    status: text("status").notNull().default("active"),
    legacyProfessionalId: integer("legacy_professional_id"),
    legacyCompanyId: integer("legacy_company_id"),
    createdBy: integer("created_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    legacyProfessionalUnique: uniqueIndex("qqz_entities_legacy_professional_uq").on(
      table.legacyProfessionalId,
    ),
    legacyCompanyUnique: uniqueIndex("qqz_entities_legacy_company_uq").on(
      table.legacyCompanyId,
    ),
  }),
);

export const entityMembershipsTable = pgTable(
  "qqz_entity_memberships",
  {
    id: serial("id").primaryKey(),
    entityId: integer("entity_id").notNull(),
    userId: integer("user_id"),
    email: text("email").notNull(),
    membershipRole: text("membership_role").notNull(),
    status: text("status").notNull().default("invited"),
    invitedBy: integer("invited_by").notNull(),
    acceptedAt: timestamp("accepted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    legacyProfessionalUnique: uniqueIndex("qqz_entities_legacy_professional_uq").on(
      table.legacyProfessionalId,
    ),
    legacyCompanyUnique: uniqueIndex("qqz_entities_legacy_company_uq").on(
      table.legacyCompanyId,
    ),
  }),
);

export const companyAffiliationsTable = pgTable(
  "qqz_company_affiliations",
  {
    id: serial("id").primaryKey(),
    companyEntityId: integer("company_entity_id").notNull(),
    individualEntityId: integer("individual_entity_id").notNull(),
    userId: integer("user_id").notNull(),
    relationshipType: text("relationship_type").notNull(),
    status: text("status").notNull().default("active"),
    createdBy: integer("created_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    entityRelationUnique: uniqueIndex("qqz_company_affiliations_pair_uq").on(
      table.companyEntityId,
      table.individualEntityId,
    ),
  }),
);

export const entityMembershipsTable = pgTable(
  "qqz_entity_memberships",
  {
    id: serial("id").primaryKey(),
    entityId: integer("entity_id").notNull(),
    userId: integer("user_id"),
    email: text("email").notNull(),
    membershipRole: text("membership_role").notNull(),
    status: text("status").notNull().default("invited"),
    invitedBy: integer("invited_by").notNull(),
    acceptedAt: timestamp("accepted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    entityEmailUnique: uniqueIndex("qqz_entity_memberships_entity_email_uq").on(
      table.entityId,
      table.email,
    ),
  }),
);

export const companyProfilesTable = pgTable(
  "qqz_company_profiles",
  {
    id: serial("id").primaryKey(),
    entityId: integer("entity_id").notNull(),
    registrationNumber: text("registration_number"),
    industry: text("industry"),
    address: text("address"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    entityUnique: uniqueIndex("qqz_company_profiles_entity_uq").on(table.entityId),
  }),
);

export const verificationPartnersTable = pgTable(
  "qqz_verification_partners",
  {
    id: serial("id").primaryKey(),
    entityId: integer("entity_id").notNull(),
    countryCode: text("country_code").notNull().default("ZW"),
    authorizingBody: text("authorizing_body").notNull(),
    authorizationBasis: text("authorization_basis").notNull(),
    scopeTypes: text("scope_types").array().notNull().default([]),
    agreementStatus: text("agreement_status").notNull().default("pending"),
    agreementReference: text("agreement_reference"),
    status: text("status").notNull().default("pending"),
    submittedBy: integer("submitted_by").notNull(),
    reviewedBy: integer("reviewed_by"),
    reviewedAt: timestamp("reviewed_at"),
    validUntil: timestamp("valid_until"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    entityUnique: uniqueIndex("qqz_verification_partners_entity_uq").on(table.entityId),
  }),
);

export const verificationRecordsTable = pgTable(
  "qqz_verification_records",
  {
    id: serial("id").primaryKey(),
    verificationCode: text("verification_code"),
    entityId: integer("entity_id").notNull(),
    verificationType: text("verification_type").notNull(),
    countryCode: text("country_code").notNull().default("ZW"),
    status: text("status").notNull().default("PENDING"),
    submittedBy: integer("submitted_by").notNull(),
    assignedPartnerEntityId: integer("assigned_partner_entity_id"),
    assignedBy: integer("assigned_by"),
    partnerResult: text("partner_result"),
    partnerNotes: text("partner_notes"),
    verifierId: integer("verifier_id"),
    verifierOrganization: text("verifier_organization"),
    reviewedBy: integer("reviewed_by"),
    verifiedAt: timestamp("verified_at"),
    reviewAt: timestamp("review_at"),
    expiresAt: timestamp("expires_at"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    verificationCodeUnique: uniqueIndex("qqz_verification_records_code_uq").on(
      table.verificationCode,
    ),
  }),
);

export const verificationEvidenceTable = pgTable("qqz_verification_evidence", {
  id: serial("id").primaryKey(),
  verificationRecordId: integer("verification_record_id").notNull(),
  objectPath: text("object_path").notNull(),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  byteSize: integer("byte_size").notNull(),
  uploadedBy: integer("uploaded_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const verificationAuditTable = pgTable("qqz_verification_audit", {
  id: serial("id").primaryKey(),
  verificationRecordId: integer("verification_record_id").notNull(),
  actorId: integer("actor_id"),
  action: text("action").notNull(),
  previousStatus: text("previous_status"),
  newStatus: text("new_status"),
  details: jsonb("details").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const verificationPartnerAuditTable = pgTable("qqz_verification_partner_audit", {
  id: serial("id").primaryKey(),
  partnerId: integer("partner_id").notNull(),
  actorId: integer("actor_id"),
  action: text("action").notNull(),
  details: jsonb("details").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertEntitySchema = createInsertSchema(entitiesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertEntity = z.infer<typeof insertEntitySchema>;
export type Entity = typeof entitiesTable.$inferSelect;
export type EntityMembership = typeof entityMembershipsTable.$inferSelect;
export type CompanyProfile = typeof companyProfilesTable.$inferSelect;
export type VerificationPartner = typeof verificationPartnersTable.$inferSelect;
export type VerificationRecord = typeof verificationRecordsTable.$inferSelect;
export type VerificationEvidence = typeof verificationEvidenceTable.$inferSelect;
export type VerificationAudit = typeof verificationAuditTable.$inferSelect;
export type VerificationPartnerAudit = typeof verificationPartnerAuditTable.$inferSelect;
