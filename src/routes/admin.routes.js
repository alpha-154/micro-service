import express from "express";
import {
  getAdminDashboardData,
  approveWithdrawalRequest,
  getAllUsers,
  removeUser,
  updateUserRole,
  getAllTasksForAdmin,
  removeTaskByAdmin,
} from "../controllers/admin.controller.js";

const router = express.Router();

router.get("/get-admin-dashboard-data/:uid", getAdminDashboardData);
router.post("/approve-withdrawal-request", approveWithdrawalRequest);
router.get("/get-all-users/:uid", getAllUsers);
router.delete("/remove-user/:adminUid/:userUid", removeUser);
router.patch("/update-user-role", updateUserRole);
router.get("/get-all-tasks/:uid", getAllTasksForAdmin);
router.delete("/remove-task/:uid/:taskId", removeTaskByAdmin);

export default router;
