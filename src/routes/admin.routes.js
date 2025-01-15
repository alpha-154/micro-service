import express from "express";
import {
  getAdminStats,
  getAllUsers,
  removeUser,
  updateUserRole,
  getAllTasksForAdmin,
  removeTaskByAdmin,
} from "../controllers/admin.controller.js";

const router = express.Router();

router.get("/get-admin-stats/:uid", getAdminStats);
router.get("/get-all-users/:uid", getAllUsers);
router.delete("/remove-user/:adminUid/:userUid", removeUser);
router.patch("/update-user-role", updateUserRole);
router.get("/get-all-tasks/:uid", getAllTasksForAdmin);
router.delete("/remove-task/:uid/:taskId", removeTaskByAdmin);

export default router;
