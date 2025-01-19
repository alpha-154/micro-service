import express from "express";
import {
  registerUser,
  generateToken,
  registerUserWithGoogle,
  fetchUserProfile
} from "../controllers/user.controller.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/generate-token", generateToken);
router.post("/register-with-google", registerUserWithGoogle);
router.get("/get-user-profile/:uid", fetchUserProfile)

export default router;