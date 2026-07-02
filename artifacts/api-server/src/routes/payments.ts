import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { paymentsTable, jobsTable } from "@workspace/db/schema";
import { eq, or, inArray } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { CreatePaymentBody, UpdatePaymentStatusBody } from "@workspace/api-zod";

const router: IRouter = Router();

function formatPayment(payment: typeof paymentsTable.$inferSelect, jobDescription?: string | null) {
  return {
    id: payment.id,
    jobId: payment.jobId,
    amount: Number(payment.amount),
    status: payment.status as "pending" | "paid" | "released",
    method: payment.method as "ecocash" | "bank_transfer" | "paynow",
    createdAt: payment.createdAt.toISOString(),
    jobDescription: jobDescription ?? null,
  };
}

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const myJobs = await db.select({ id: jobsTable.id, description: jobsTable.description }).from(jobsTable)
    .where(or(eq(jobsTable.customerId, userId), eq(jobsTable.selectedProfessionalId, userId)));

  if (myJobs.length === 0) {
    res.json([]);
    return;
  }

  const jobIds = myJobs.map(j => j.id);
  const jobDescMap = new Map(myJobs.map(j => [j.id, j.description]));

  const payments = await db.select().from(paymentsTable)
    .where(inArray(paymentsTable.jobId, jobIds));

  res.json(payments.map(p => formatPayment(p, jobDescMap.get(p.jobId))));
});

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  const parsed = CreatePaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const [payment] = await db.insert(paymentsTable).values({
    jobId: parsed.data.jobId,
    amount: String(parsed.data.amount),
    method: parsed.data.method,
    status: "pending",
  }).returning();

  const [job] = await db.select({ description: jobsTable.description }).from(jobsTable).where(eq(jobsTable.id, parsed.data.jobId));
  res.status(201).json(formatPayment(payment, job?.description));
});

router.patch("/:id/status", requireAuth, async (req: AuthRequest, res) => {
  const paymentId = parseInt(req.params.id);
  const parsed = UpdatePaymentStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const [payment] = await db.update(paymentsTable).set({ status: parsed.data.status }).where(eq(paymentsTable.id, paymentId)).returning();
  const [job] = await db.select({ description: jobsTable.description }).from(jobsTable).where(eq(jobsTable.id, payment.jobId));
  res.json(formatPayment(payment, job?.description));
});

export default router;
