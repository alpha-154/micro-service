import express from "express";
import {
  registerUser,
  generateToken,
  registerUserWithGoogle,
} from "../controllers/user.controller.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/generate-token", generateToken);
router.post("/register-with-google", registerUserWithGoogle);

export default router;