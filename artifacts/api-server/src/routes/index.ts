import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import jobsRouter from "./jobs";
import quotesRouter from "./quotes";
import paymentsRouter from "./payments";
import reviewsRouter from "./reviews";
import adminRouter from "./admin";
import verificationRouter from "./verification";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/jobs", jobsRouter);
router.use("/quotes", quotesRouter);
router.use("/payments", paymentsRouter);
router.use("/reviews", reviewsRouter);
router.use("/admin", adminRouter);
router.use("/verification", verificationRouter);

export default router;
