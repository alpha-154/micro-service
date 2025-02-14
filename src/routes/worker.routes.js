import express from "express";
import {
  getWorkerSubmissionStatsWithApprovedSubmissions,
  getValidTasks,
  getTaskById,
  submitTask,
  getWorkerSubmissions,
  handleWithdrawalRequest
} from "../controllers/worker.controller.js";

const router = express.Router();

router.get(
  "/get-worker-submission-stats/:uid",
  getWorkerSubmissionStatsWithApprovedSubmissions
);
router.get("/get-valid-tasks", getValidTasks);
router.get("/get-task-details/:taskId", getTaskById);
router.post("/submit-task", submitTask);
router.get("/get-worker-submissions/:uid", getWorkerSubmissions);
router.post("/withdrawal-request",handleWithdrawalRequest);

export default router;
