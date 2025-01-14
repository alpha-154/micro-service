import express from "express";
import { getWorkerSubmissionStatsWithApprovedSubmissions } from "../controllers/worker.controller.js";

const router = express.Router();

router.get("/get-worker-submission-stats/:uid", getWorkerSubmissionStatsWithApprovedSubmissions);

export default router;