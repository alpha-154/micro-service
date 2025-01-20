import express from "express";
import {
  createTask,
  getAllTasksByUserUid,
  getAllTasksWithSubmissionData,
  approveSubmission,
  rejectSubmission,
  updateTask,
  deleteTask,
  purchaseCoins,
  getBuyerPayments
} from "../controllers/buyer.controller.js";

const router = express.Router();

router.get("/get-all-tasks/:uid", getAllTasksByUserUid);
router.get(
  "/get-all-tasks-with-submissionData/:uid",
  getAllTasksWithSubmissionData
);
router.post("/create-task", createTask);
router.post("/approve-submission", approveSubmission);
router.post("/reject-submission", rejectSubmission);
router.patch("/update-task", updateTask);
router.delete("/delete-task/:uid/:taskId", deleteTask);
router.post("/purchase-coins", purchaseCoins);
router.get("/get-payment-histories/:uid", getBuyerPayments);

export default router;
